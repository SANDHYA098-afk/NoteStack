export const CONFIG = {
  // CDK-deployed resources
  API_URL: "https://5et5n9tzyk.execute-api.ap-south-1.amazonaws.com/dev",
  COGNITO_CLIENT_ID: "b92aai2p4akio5tsg3k383hhe",
  COGNITO_REGION: "ap-south-1",
};

export const COGNITO_URL = `https://cognito-idp.${CONFIG.COGNITO_REGION}.amazonaws.com/`;

export const CATEGORIES = [
  "general",
  "lecture",
  "assignment",
  "exam",
  "project",
  "personal",
] as const;

export type Category = (typeof CATEGORIES)[number];
