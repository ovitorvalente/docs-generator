"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "../ui/button";

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
      <Button variant="destructive" size="sm" onClick={ao_clicar_sair}>
        <LogOutIcon className="mr-1 h-4 w-4" />
        Sair
      </Button>
    </header>
  );
}

