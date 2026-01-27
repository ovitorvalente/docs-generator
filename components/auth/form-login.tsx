"use client";

import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Alert, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";

const esquema_formulario = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe a senha"),
});

type DadosFormulario = z.infer<typeof esquema_formulario>;

type ErrosFormulario = Partial<Record<keyof DadosFormulario, string>>;

export default function FormularioLogin() {
  const navegador = useRouter();

  const [email, definir_email] = useState("");
  const [senha, definir_senha] = useState("");
  const [carregando, definir_carregando] = useState(false);
  const [erro_geral, definir_erro_geral] = useState<string | null>(null);
  const [erros, definir_erros] = useState<ErrosFormulario>({});

  async function ao_enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    definir_erro_geral(null);
    definir_erros({});

    const resultado = esquema_formulario.safeParse({ email, senha });

    if (!resultado.success) {
      const erros_campo: ErrosFormulario = {};

      for (const [campo, mensagens] of Object.entries(
        resultado.error.flatten().fieldErrors
      )) {
        const chave = campo as keyof DadosFormulario;
        if (mensagens && mensagens.length > 0) {
          erros_campo[chave] = mensagens[0] ?? "";
        }
      }

      definir_erros(erros_campo);
      return;
    }

    try {
      definir_carregando(true);

      const resposta = await fetch("/api/autenticar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        definir_erro_geral(
          corpo?.mensagem ?? "Não foi possível autenticar. Tente novamente."
        );
        return;
      }

      toast.success("Autenticado com sucesso!", {
        description: "Você será redirecionado automaticamente...",
      });

      navegador.push("/");
    } catch (erro) {
      console.error("Erro ao enviar formulário de autenticação:", erro);
      definir_erro_geral(
        "Ocorreu um erro inesperado. Tente novamente em alguns instantes."
      );
    } finally {
      definir_carregando(false);
    }
  }

  return (
    <form onSubmit={ao_enviar}>
      <FieldSet>
        <FieldLegend>Entrar</FieldLegend>
        <FieldDescription>
          Informe seu e-mail e senha para acessar o painel.
        </FieldDescription>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="campo-email">E-mail</FieldLabel>
            <Input
              id="campo-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(evento) => definir_email(evento.target.value)}
              placeholder="seu@email.com"
              name="email"
              required
              aria-invalid={!!erros.email}
            />
            {erros.email ? <FieldError>{erros.email}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="campo-senha">Senha</FieldLabel>
            <Input
              id="campo-senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(evento) => definir_senha(evento.target.value)}
              placeholder="Digite sua senha"
              required
              aria-invalid={!!erros.senha}
            />
            {erros.senha ? <FieldError>{erros.senha}</FieldError> : null}
          </Field>

          {erro_geral ? (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 rounded-2xl">
              <AlertCircleIcon />
              <AlertTitle>{erro_geral}</AlertTitle>
            </Alert>
          ) : null}

          <Field orientation="horizontal">
            <Button
              type="submit"
              variant="default"
              size={"lg"}
              disabled={carregando}
              className="w-full"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
