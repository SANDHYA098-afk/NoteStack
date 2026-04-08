// NoteStack — Shared Lambda Helpers

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

export function respond(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
}

export function log(level, message, data = {}) {
  console.log(JSON.stringify({
    level,
    message,
    ...data,
    timestamp: new Date().toISOString()
  }));
}

export function getUserId(event) {
  return event.requestContext?.authorizer?.claims?.sub;
}

export function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return {};
  }
}

export function getQueryParam(event, key) {
  return event.queryStringParameters?.[key] || null;
}
