import { create } from "zustand";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: (typeof window !== "undefined" && localStorage.getItem("theme") as Theme) || "system",
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      document.documentElement.classList.toggle("dark", systemTheme === "dark");
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    
    set({ theme });
  },
}));

// Initialize theme
if (typeof window !== "undefined") {
  const theme = localStorage.getItem("theme") as Theme || "system";
  useTheme.getState().setTheme(theme);
  
  // Listen for system theme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", ({ matches: isDark }) => {
      if (useTheme.getState().theme === "system") {
        document.documentElement.classList.toggle("dark", isDark);
      }
    });
}
