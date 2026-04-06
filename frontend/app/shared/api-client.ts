import { CONFIG } from "./config";

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("idToken") : null;
}

export async function apiCall(method: string, path: string, body?: unknown) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(CONFIG.API_URL + path, options);

  if (response.status === 401) {
    throw new Error("Session expired");
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");

  return data;
}
