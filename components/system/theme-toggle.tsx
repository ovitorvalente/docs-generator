"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!montado) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <MoonIcon data-icon="inline-start" />
        Tema
      </Button>
    );
  }

  const tema_escuro = resolvedTheme !== "light";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(tema_escuro ? "light" : "dark")}
    >
      {tema_escuro ? (
        <SunIcon data-icon="inline-start" />
      ) : (
        <MoonIcon data-icon="inline-start" />
      )}
      {tema_escuro ? "Tema claro" : "Tema escuro"}
    </Button>
  );
}
