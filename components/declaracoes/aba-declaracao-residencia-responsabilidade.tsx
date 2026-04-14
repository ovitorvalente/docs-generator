"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { TriangleAlertIcon } from "lucide-react";
import { Alert } from "../ui/alert";
import { CabecalhoEtapasDeclaracao } from "./shared/cabecalho-etapas";
import { BlocoSucessoPDF } from "./shared/sucesso-pdf";

type CamposResponsabilidade = {
  nome: string;
};

export default function AbaDeclaracaoResidenciaResponsabilidade() {
  const [campos, definir_campos] = useState<CamposResponsabilidade>({
    nome: "",
  });
  const [etapa, definir_etapa] = useState<"dados" | "sucesso">("dados");
  const [gerando_pdf, definir_gerando_pdf] = useState(false);
  const [erro, definir_erro] = useState<string | null>(null);

  const etapa_atual = etapa === "dados" ? 1 : 2;

  useEffect(() => {
    if (etapa !== "sucesso") return;

    const id = window.setTimeout(() => {
      definir_etapa("dados");
    }, 5000);

    return () => window.clearTimeout(id);
  }, [etapa]);

  async function gerar_pdf() {
    if (!campos.nome.trim()) {
      definir_erro("Informe o nome completo do cliente antes de gerar o PDF.");
      return;
    }

    try {
      definir_gerando_pdf(true);
      definir_erro(null);

      const resposta = await fetch(
        "/api/declaracao-residencia-responsabilidade",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campos),
        }
      );

      if (!resposta.ok) {
        definir_erro(
          "Não foi possível gerar o PDF da declaração. Tente novamente."
        );
        return;
      }

      const content_disposition = resposta.headers.get("Content-Disposition");

      let nome_arquivo = "declaracao-residencia-responsabilidade.pdf";

      if (content_disposition) {
        const correspondencia = /filename="?([^"]+)"?/i.exec(
          content_disposition
        );
        if (correspondencia?.[1]) {
          nome_arquivo = correspondencia[1];
        }
      }

      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = nome_arquivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      definir_etapa("sucesso");
    } catch (erro) {
      console.error(
        "Erro ao gerar PDF de declaração de residência e responsabilidade:",
        erro
      );
      definir_erro(
        "Ocorreu um erro inesperado ao gerar o PDF. Tente novamente em instantes."
      );
    } finally {
      definir_gerando_pdf(false);
    }
  }

  return (
    <section className="mt-2 space-y-6 rounded-4xl border border-dashed border-border bg-background/50 p-4 md:p-6">
      <CabecalhoEtapasDeclaracao
        etapas={["Dados do responsável", "PDF gerado"]}
        etapa_atual={etapa_atual}
      />

      {etapa === "dados" && (
        <FieldSet className="gap-5">
          <FieldDescription>
            Informe o nome completo do responsável financeiro para gerar a
            declaração de residência e responsabilidade.
          </FieldDescription>

          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field className="sm:col-span-2 lg:col-span-2">
              <FieldLabel htmlFor="campo-nome-responsavel">
                Nome completo
              </FieldLabel>
              <Input
                id="campo-nome-responsavel"
                value={campos.nome}
                onChange={(evento) =>
                  definir_campos({ nome: evento.target.value })
                }
                placeholder="Nome completo do responsável financeiro"
              />
            </Field>

            <Field className="sm:col-span-2 lg:col-span-3 flex justify-end pt-4">
              <Button
                type="button"
                size="lg"
                onClick={gerar_pdf}
                disabled={gerando_pdf}
                className="w-full sm:w-auto"
              >
                {gerando_pdf ? "Gerando PDF..." : "Gerar PDF"}
              </Button>
            </Field>

            {erro ? (
              <Field className="sm:col-span-2 lg:col-span-3">
                <Alert
                  variant="destructive"
                  className="border-red-500/20 bg-red-500/5 font-bold"
                >
                  <TriangleAlertIcon className="size-4" />
                  {erro}
                </Alert>
              </Field>
            ) : null}
          </FieldGroup>
        </FieldSet>
      )}

      {etapa === "sucesso" && (
        <BlocoSucessoPDF
          on_concluir={() => definir_etapa("dados")}
          descricao="O download da declaração de residência e responsabilidade financeira foi iniciado. Você será levado de volta para o formulário automaticamente em alguns segundos."
          rotulo_botao="Concluir"
        />
      )}
    </section>
  );
}

