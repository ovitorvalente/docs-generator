"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  const navegador = useRouter();

  async function ao_clicar_sair() {
    try {
      await fetch("/api/sair", { method: "POST" });
    } catch {
    } finally {
      navegador.push("/auth");
    }
  }

  return (
    <header className="flex w-full items-center justify-between border-b border-dashed bg-background/50 p-2 backdrop-blur-sm">
      <span className="text-xl font-medium text-muted-foreground">QUICK - Gerador de Documentos</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="destructive" size="sm" onClick={ao_clicar_sair}>
          <LogOutIcon data-icon="inline-start" />
          Sair
        </Button>
      </div>
    </header>
  );
}
