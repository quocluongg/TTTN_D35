"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  isSidebarCollapsed: false,
  toggleSidebar: () => {},
});

export function TailAdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem("tailadmin-theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    const savedSidebar = localStorage.getItem("tailadmin-sidebar-collapsed");
    if (savedSidebar === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("tailadmin-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("tailadmin-theme", "light");
      }
      return next;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("tailadmin-sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        isSidebarCollapsed,
        toggleSidebar,
      }}
    >
      <div className={isDarkMode ? "dark" : ""}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTailAdminTheme() {
  return useContext(ThemeContext);
}
