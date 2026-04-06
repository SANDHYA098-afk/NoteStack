import { CONFIG, COGNITO_URL } from "../../shared/config";

async function cognitoRequest(action: string, params: Record<string, unknown>) {
  const response = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.__type || "Authentication failed");
  }
  return data;
}

export async function signUp(email: string, password: string) {
  return cognitoRequest("SignUp", {
    ClientId: CONFIG.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}

export async function confirmSignUp(email: string, code: string) {
  return cognitoRequest("ConfirmSignUp", {
    ClientId: CONFIG.COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function login(email: string, password: string) {
  const data = await cognitoRequest("InitiateAuth", {
    ClientId: CONFIG.COGNITO_CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });

  const { IdToken, RefreshToken } = data.AuthenticationResult;
  localStorage.setItem("idToken", IdToken);
  localStorage.setItem("refreshToken", RefreshToken);
  localStorage.setItem("userEmail", email);

  return data;
}

export function logout() {
  localStorage.removeItem("idToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userEmail");
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("idToken") : null;
}

export function getUserEmail(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
