import type { ColorScheme } from "@types";

let themesCache: any = null;

export const loadThemes = async () => {
  if (themesCache) {
    return themesCache;
  }

  try {
    const response = await fetch("/themes.json");
    if (!response.ok) {
      throw new Error("Failed to load themes");
    }
    const themes = await response.json();

    themesCache = themes;
    return themes;
  } catch (error) {
    console.error("Error loading themes:", error);
    return null;
  }
};

export const getThemeOptions = (themes: any) => {
  if (!themes?.light) return [];

  return Object.keys(themes.light).map((themeKey) => ({
    value: themeKey,
    label: themes.light[themeKey]?.name || themeKey,
  }));
};

export const applyCSSVariables = (variables: Record<string, string>) => {
  requestAnimationFrame(() => {
    const root = document.documentElement;
    Object.entries(variables).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  });
};

export const applyZoomLevel = (zoomLevel: number) => {
  const actualFontSize = zoomLevel - 40;
  document.documentElement.style.fontSize = `${actualFontSize}%`;
};

export const getSystemColorScheme = (): "light" | "dark" => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

export const applyTheme = (
  themes: any,
  themeName: string,
  colorScheme: ColorScheme
) => {
  if (!themes) return;

  let actualScheme = colorScheme;
  if (colorScheme === "system") {
    actualScheme = getSystemColorScheme();
  }

  const themeVariables = themes[actualScheme]?.[themeName]?.variables;
  if (themeVariables) {
    applyCSSVariables(themeVariables);
  }
};

export const watchSystemColorScheme = (
  callback: (scheme: "light" | "dark") => void
) => {
  if (!window.matchMedia) return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
};
