import api, { setAuthFunctions } from "./api";
import type {
  SignupData,
  LoginData,
  AuthResponse,
  RefreshResponse,
  CurrentUserResponse,
} from "../types";

export type {
  SignupData,
  LoginData,
  AuthResponse,
  RefreshResponse,
  CurrentUserResponse,
};

class UserAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokensFromStorage();
    setAuthFunctions(
      () => this.refreshTokens(),
      () => this.clearTokensFromStorage()
    );
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");

    if (this.accessToken) {
      this.setAuthHeader(this.accessToken);
    }
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.setAuthHeader(accessToken);
  }

  private clearTokensFromStorage() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    this.accessToken = null;
    this.refreshToken = null;
    delete api.defaults.headers.common["Authorization"];
  }

  private setAuthHeader(token: string) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/signup", data);
      const { accessToken, refreshToken } = response.data;
      this.saveTokensToStorage(accessToken, refreshToken);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/login", data);
      const { accessToken, refreshToken } = response.data;
      this.saveTokensToStorage(accessToken, refreshToken);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await api.post("/auth/logout", { refreshToken: this.refreshToken });
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      this.clearTokensFromStorage();
    }
  }

  async refreshTokens(): Promise<RefreshResponse> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await api.post<RefreshResponse>("/auth/refresh", {
        refreshToken: this.refreshToken,
      });

      this.saveTokensToStorage(
        response.data.accessToken,
        response.data.refreshToken
      );
      return response.data;
    } catch (error) {
      this.clearTokensFromStorage();
      throw error;
    }
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    try {
      const response = await api.get<CurrentUserResponse>("/auth/me");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}

const userAPI = new UserAPI();

export default userAPI;