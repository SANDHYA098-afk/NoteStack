export const CONFIG = {
  API_URL: "https://019vhyfrah.execute-api.ap-south-1.amazonaws.com/dev",
  COGNITO_CLIENT_ID: "29vol0pqf64s7o0he3lobd62ns",
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
