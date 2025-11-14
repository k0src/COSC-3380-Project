import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import { userApi } from "@api";
import { useAuth } from "./AuthContext";
import type { UserSettings } from "@types";

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
}

type SettingsAction =
  | { type: "SET_SETTINGS"; payload: UserSettings }
  | { type: "UPDATE_SETTINGS"; payload: Partial<UserSettings> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

interface SettingsContextType extends SettingsState {
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  applyAppearanceSettings: () => void;
}

const initialState: SettingsState = {
  settings: null,
  isLoading: true,
  error: null,
};

const settingsReducer = (
  state: SettingsState,
  action: SettingsAction
): SettingsState => {
  switch (action.type) {
    case "SET_SETTINGS":
      return {
        ...state,
        settings: action.payload,
        isLoading: false,
        error: null,
      };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: state.settings
          ? { ...state.settings, ...action.payload }
          : null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  const getLocalStorageKey = (userId: string) =>
    `coogmusic_user_settings_${userId}`;

  const loadSettingsFromLocalStorage = (
    userId: string
  ): UserSettings | null => {
    try {
      const stored = localStorage.getItem(getLocalStorageKey(userId));
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error loading settings from localStorage:", error);
      return null;
    }
  };

  const saveSettingsToLocalStorage = (
    userId: string,
    settings: UserSettings
  ): void => {
    try {
      localStorage.setItem(
        getLocalStorageKey(userId),
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  };

  const applyAppearanceSettings = () => {
    if (!state.settings) return;

    const { color_scheme, color_theme, zoom_level } = state.settings;

    if (color_scheme) {
      document.documentElement.setAttribute("data-theme", color_scheme);
    }

    if (color_theme) {
      document.documentElement.setAttribute("data-color-theme", color_theme);
    }

    if (zoom_level) {
      document.documentElement.style.setProperty(
        "--app-zoom",
        `${zoom_level}%`
      );
    }
  };

  const refreshSettings = async () => {
    if (!user?.id) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const cachedSettings = loadSettingsFromLocalStorage(user.id);
      if (cachedSettings) {
        dispatch({ type: "SET_SETTINGS", payload: cachedSettings });
        applyAppearanceSettings();
      }

      const settings = await userApi.getSettings(user.id);
      dispatch({ type: "SET_SETTINGS", payload: settings });
      saveSettingsToLocalStorage(user.id, settings);
      applyAppearanceSettings();
    } catch (error) {
      console.error("Error fetching settings:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load settings",
      });
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.id || !state.settings) return;

    const previousSettings = state.settings;

    try {
      const updatedSettings = { ...state.settings, ...updates };
      dispatch({ type: "UPDATE_SETTINGS", payload: updates });
      saveSettingsToLocalStorage(user.id, updatedSettings);

      if (
        updates.color_scheme ||
        updates.color_theme ||
        updates.zoom_level !== undefined
      ) {
        applyAppearanceSettings();
      }

      const result = await userApi.updateSettings(user.id, updates);
      dispatch({ type: "SET_SETTINGS", payload: result });
      saveSettingsToLocalStorage(user.id, result);
    } catch (error) {
      console.error("Error updating settings:", error);
      dispatch({ type: "SET_SETTINGS", payload: previousSettings });
      saveSettingsToLocalStorage(user.id, previousSettings);
      applyAppearanceSettings();
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to update settings",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshSettings();
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    applyAppearanceSettings();
  }, [state.settings]);

  const value: SettingsContextType = {
    ...state,
    updateSettings,
    refreshSettings,
    applyAppearanceSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
