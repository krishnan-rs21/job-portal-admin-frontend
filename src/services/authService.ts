import apiClient from "./apiClient";

export interface LoginUser {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const loginRequest = async (email: string, password: string) => {
  const response = await apiClient.post("/auth/login", { email, password });
  const payload = response.data?.data ?? response.data;
  return {
    accessToken: payload?.accessToken as string | undefined,
    refreshToken: payload?.refreshToken as string | undefined,
    user: payload?.user as LoginUser | undefined,
  };
};

export const logoutRequest = async () => {
  try {
    await apiClient.post("/auth/logout");
  } catch {
    return;
  }
};
