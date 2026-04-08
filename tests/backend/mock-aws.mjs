// Mock AWS SDK clients for testing Lambda functions
// Simulates DynamoDB, S3, Secrets Manager, and Cognito responses

export class MockDynamoDB {
  constructor() {
    this.tables = {};
    this.calls = [];
  }

  seedTable(tableName, items) {
    this.tables[tableName] = items;
  }

  async send(command) {
    const name = command.constructor.name;
    this.calls.push({ command: name, input: command.input });

    if (name === 'PutCommand') {
      const { TableName, Item } = command.input;
      if (!this.tables[TableName]) this.tables[TableName] = [];
      this.tables[TableName].push(Item);
      return {};
    }

    if (name === 'GetCommand') {
      const { TableName, Key } = command.input;
      const items = this.tables[TableName] || [];
      const item = items.find(i => {
        return Object.entries(Key).every(([k, v]) => i[k] === v);
      });
      return { Item: item || null };
    }

    if (name === 'QueryCommand') {
      const { TableName, ExpressionAttributeValues } = command.input;
      const items = this.tables[TableName] || [];
      const uid = ExpressionAttributeValues?.[':uid'];
      const filtered = uid ? items.filter(i => i.userId === uid || i.sharedWithUserId === uid) : items;
      return { Items: filtered };
    }

    if (name === 'ScanCommand') {
      const { TableName } = command.input;
      return { Items: this.tables[TableName] || [] };
    }

    if (name === 'DeleteCommand') {
      const { TableName, Key } = command.input;
      const items = this.tables[TableName] || [];
      const idx = items.findIndex(i => Object.entries(Key).every(([k, v]) => i[k] === v));
      let deleted = null;
      if (idx >= 0) {
        deleted = items.splice(idx, 1)[0];
      }
      return { Attributes: deleted };
    }

    if (name === 'UpdateCommand') {
      const { TableName, Key } = command.input;
      const items = this.tables[TableName] || [];
      const item = items.find(i => Object.entries(Key).every(([k, v]) => i[k] === v));
      return { Attributes: item || {} };
    }

    return {};
  }

  getCallCount(commandName) {
    return this.calls.filter(c => c.command === commandName).length;
  }

  getLastCall(commandName) {
    return this.calls.filter(c => c.command === commandName).pop();
  }

  reset() {
    this.tables = {};
    this.calls = [];
  }
}

export function createMockEvent({ userId = 'test-user-123', body = {}, queryParams = {}, email = 'test@example.com' } = {}) {
  return {
    requestContext: {
      authorizer: {
        claims: {
          sub: userId,
          email: email
        }
      }
    },
    body: JSON.stringify(body),
    queryStringParameters: queryParams
  };
}

export function parseResponse(result) {
  return {
    statusCode: result.statusCode,
    body: JSON.parse(result.body),
    headers: result.headers
  };
}
