import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { respond, log, getUserId, getQueryParam } from "./utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: "ap-south-1" });

const TABLE_NAME = process.env.NOTES_TABLE || "NoteStack-Notes";
const USER_POOL_ID = process.env.USER_POOL_ID || "ap-south-1_EM3m76UWV";

// Cache user emails to avoid repeated Cognito lookups
const userCache = {};

async function getUserEmail(userId) {
  if (userCache[userId]) return userCache[userId];
  try {
    const result = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `sub = "${userId}"`,
      Limit: 1
    }));
    if (result.Users && result.Users.length > 0) {
      const emailAttr = result.Users[0].Attributes?.find(a => a.Name === "email");
      const email = emailAttr?.Value || userId;
      userCache[userId] = email;
      return email;
    }
  } catch (err) {
    log("WARN", "Failed to lookup user email", { userId, error: err.message });
  }
  userCache[userId] = userId;
  return userId;
}

export async function handler(event) {
  try {
    const requestingUserId = getUserId(event);
    if (!requestingUserId) return respond(401, { error: "Unauthorized" });

    const category = getQueryParam(event, "category");
    const searchQuery = getQueryParam(event, "q");

    let params = { TableName: TABLE_NAME };

    // Build filter expressions
    const filterParts = [];
    const exprValues = {};
    const exprNames = {};

    if (category) {
      filterParts.push("#cat = :cat");
      exprValues[":cat"] = category;
      exprNames["#cat"] = "category";
    }

    // Don't filter search in DynamoDB â€” do it in-memory for case-insensitive matching
    if (filterParts.length > 0) {
      params.FilterExpression = filterParts.join(" AND ");
      params.ExpressionAttributeValues = exprValues;
      params.ExpressionAttributeNames = exprNames;
    }

    const result = await docClient.send(new ScanCommand(params));
    let notes = result.Items || [];

    // Case-insensitive search on title + content
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.category && n.category.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to 50 most recent
    notes = notes.slice(0, 50);

    // Enrich with author emails
    const uniqueUserIds = [...new Set(notes.map(n => n.userId))];
    const emailMap = {};
    for (const uid of uniqueUserIds) {
      emailMap[uid] = await getUserEmail(uid);
    }

    notes = notes.map(note => ({
      ...note,
      authorEmail: emailMap[note.userId] || note.userId,
      isOwner: note.userId === requestingUserId
    }));

    log("INFO", "All notes retrieved", { count: notes.length, category: category || "all", search: searchQuery || "none" });
    return respond(200, { notes });
  } catch (error) {
    log("ERROR", "GetAllNotes failed", { error: error.message });
    return respond(500, { error: "Failed to retrieve community notes" });
  }
}
