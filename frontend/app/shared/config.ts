export const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
  COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION || "ap-south-1",
  USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
  S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET || "",
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
