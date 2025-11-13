import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import authApi from "../api/auth.api";
import type {
  SignupData,
  LoginData,
  AuthState,
  AuthAction,
  AuthContextType,
} from "@types";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access the AuthContext
 * @throws Will throw an error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component to wrap the app and provide authentication context
 * @param children The child components that will have access to the AuthContext
 * @returns
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthStatus = async () => {
    if (!authApi.isAuthenticated()) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    try {
      dispatch({ type: "AUTH_START" });
      const response = await authApi.getCurrentUser();
      dispatch({ type: "AUTH_SUCCESS", payload: response.user });
    } catch (error) {
      console.error("Auth check failed:", error);
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (data: LoginData): Promise<void> => {
    try {
      dispatch({ type: "AUTH_START" });
      const response = await authApi.login(data);
      dispatch({ type: "AUTH_SUCCESS", payload: response.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
      dispatch({ type: "AUTH_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    try {
      dispatch({ type: "AUTH_START" });
      const response = await authApi.signup(data);
      dispatch({ type: "AUTH_SUCCESS", payload: response.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Signup failed";
      dispatch({ type: "AUTH_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUser = (user: AuthState["user"]): void => {
    dispatch({ type: "UPDATE_USER", payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
