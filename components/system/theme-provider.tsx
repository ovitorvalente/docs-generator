"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type PropsThemeProvider = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: PropsThemeProvider) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

