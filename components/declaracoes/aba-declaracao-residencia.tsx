"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ArrowLeftIcon, CheckCircle2Icon, CopyIcon, TriangleAlertIcon } from "lucide-react";
import { Alert } from "../ui/alert";
import { CabecalhoEtapasDeclaracao } from "./shared/cabecalho-etapas";
import { BlocoSucessoPDF } from "./shared/sucesso-pdf";

const ESTRUTURA_PADRAO_MENSAGEM = [
  "Nome:",
  "Documento de Identidade:",
  "Órgão expedidor:",
  "CPF:",
  "Nacionalidade:",
  "Telefone:",
  "E-mail:",
  "Naturalidade:",
  "Endereço:",
  "Bairro:",
  "Cidade:",
  "CEP:",
  "UF:",
  "Complemento:",
].join("\n");

type CamposResidencia = {
  nome: string;
  documento_identidade: string;
  orgao_expedidor: string;
  cpf: string;
  nacionalidade: string;
  telefone: string;
  email: string;
  naturalidade: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  uf: string;
  complemento: string;
};

const estado_inicial_campos: CamposResidencia = {
  nome: "",
  documento_identidade: "",
  orgao_expedidor: "",
  cpf: "",
  nacionalidade: "",
  telefone: "",
  email: "",
  naturalidade: "",
  endereco: "",
  bairro: "",
  cidade: "",
  cep: "",
  uf: "",
  complemento: "",
};

const mapa_rotulos_para_campo: Record<string, keyof CamposResidencia> = {
  "nome": "nome",
  "documento de identidade": "documento_identidade",
  "órgão expedidor": "orgao_expedidor",
  "orgão expedidor": "orgao_expedidor",
  "cpf": "cpf",
  "nacionalidade": "nacionalidade",
  "telefone": "telefone",
  "e-mail": "email",
  "email": "email",
  "naturalidade": "naturalidade",
  "endereço": "endereco",
  "endereco": "endereco",
  "bairro": "bairro",
  "cidade": "cidade",
  "cep": "cep",
  "uf": "uf",
  "complemento": "complemento",
};

export default function AbaDeclaracaoResidencia() {
  const [mensagem_bruta, definir_mensagem_bruta] = useState("");
  const [campos, definir_campos] = useState<CamposResidencia>(
    estado_inicial_campos
  );
  const [etapa, definir_etapa] = useState<"entrada" | "dados" | "sucesso">(
    "entrada"
  );
  const [gerando_pdf, definir_gerando_pdf] = useState(false);
  const [erro_mensagem, definir_erro_mensagem] = useState<string | null>(null);
  const [erro_pdf, definir_erro_pdf] = useState<string | null>(null);
  const [copiado, definir_copiado] = useState(false);
  function normalizar_rotulo(rotulo: string) {
    return rotulo.trim().toLowerCase();
  }

  function processar_mensagem() {
    if (!mensagem_bruta.trim()) {
      definir_erro_mensagem(
        "Informe a mensagem completa da declaração antes de processar os dados."
      );
      return;
    }

    const linhas = mensagem_bruta.split("\n");
    const novo_estado: CamposResidencia = { ...estado_inicial_campos };

    for (const linha of linhas) {
      const partes = linha.split(":");
      if (partes.length < 2) continue;

      const rotulo = normalizar_rotulo(partes[0]);
      const valor = partes.slice(1).join(":").trim();

      const chave = mapa_rotulos_para_campo[rotulo];
      if (chave) {
        novo_estado[chave] = valor;
      }
    }

    definir_campos(novo_estado);
    definir_etapa("dados");
    definir_erro_mensagem(null);
  }

  function atualizar_campo(campo: keyof CamposResidencia, valor: string) {
    definir_campos((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function gerar_pdf() {
    try {
      definir_gerando_pdf(true);
      definir_erro_pdf(null);

      const resposta = await fetch("/api/declaracao-residencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campos),
      });

      if (!resposta.ok) {
        definir_erro_pdf(
          "Não foi possível gerar o PDF da declaração. Tente novamente."
        );
        return;
      }

      const content_disposition = resposta.headers.get("Content-Disposition");

      let nome_arquivo = "declaracao-residencia.pdf";

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
      console.error("Erro ao gerar PDF de declaração de residência:", erro);
      definir_erro_pdf(
        "Ocorreu um erro inesperado ao gerar o PDF. Tente novamente em instantes."
      );
    } finally {
      definir_gerando_pdf(false);
    }
  }

  const etapa_atual = etapa === "entrada" ? 1 : etapa === "dados" ? 2 : 3;

  useEffect(() => {
    if (etapa !== "sucesso") return;

    const id = window.setTimeout(() => {
      definir_etapa("entrada");
    }, 500000);

    return () => window.clearTimeout(id);
  }, [etapa]);

  return (
    <section className="mt-4 space-y-4 rounded-4xl border border-dashed border-border bg-background/50 p-4">
      <CabecalhoEtapasDeclaracao
        etapas={["Mensagem da declaração", "Dados identificados", "PDF gerado"]}
        etapa_atual={etapa_atual}
      />

      {etapa === "entrada" && (
        <FieldSet>
          <FieldDescription>
            Cole a mensagem no formato esperado e clique em &quot;Processar dados&quot; para
            avançar para a próxima etapa.
          </FieldDescription>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="mensagem-residencia">
              Mensagem da declaração
            </FieldLabel>
            <Textarea
              id="mensagem-residencia"
              placeholder={ESTRUTURA_PADRAO_MENSAGEM}
              value={mensagem_bruta}
              onChange={(evento) => definir_mensagem_bruta(evento.target.value)}
              className="min-h-[220px]"
            />
          </Field>

          <Field>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      ESTRUTURA_PADRAO_MENSAGEM
                    );
                    definir_erro_mensagem(null);
                    definir_copiado(true);
                    setTimeout(() => {
                      definir_copiado(false);
                    }, 3000);
                  } catch {
                    definir_erro_mensagem(
                      "Não foi possível copiar a estrutura para a área de transferência."
                    );
                    definir_copiado(false);
                  }
                }}
                >
                {copiado ? <CheckCircle2Icon className="size-4 text-green-500" /> : <CopyIcon className="size-4" />}
                {copiado ? <span className="text-green-500">Estrutura copiada</span> : "Copiar estrutura esperada"}
              </Button>

              <Button size="lg" type="button" onClick={processar_mensagem}>
                Processar dados
              </Button>
            </div>

            {erro_mensagem ? (
              <Alert variant="destructive" className="mt-6 border-red-500/20 bg-red-500/5 font-bold">
                <TriangleAlertIcon className="size-4" />
                {erro_mensagem}
              </Alert>
            ) : null}
          </Field>
        </FieldGroup>
        </FieldSet>
      )}

      {etapa === "dados" && (
        <FieldSet>
          <FieldDescription>
            Revise e ajuste os dados extraídos da mensagem antes de gerar a
            declaração.
          </FieldDescription>

          <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field className="sm:col-span-2 lg:col-span-2">
              <FieldLabel htmlFor="campo-nome">Nome</FieldLabel>
              <Input
                id="campo-nome"
                value={campos.nome}
                onChange={(evento) =>
                  atualizar_campo("nome", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-documento-identidade">
                Documento de Identidade
              </FieldLabel>
              <Input
                id="campo-documento-identidade"
                value={campos.documento_identidade}
                onChange={(evento) =>
                  atualizar_campo("documento_identidade", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-orgao-expedidor">
                Órgão expedidor
              </FieldLabel>
              <Input
                id="campo-orgao-expedidor"
                value={campos.orgao_expedidor}
                onChange={(evento) =>
                  atualizar_campo("orgao_expedidor", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-cpf">CPF</FieldLabel>
              <Input
                id="campo-cpf"
                value={campos.cpf}
                onChange={(evento) =>
                  atualizar_campo("cpf", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-nacionalidade">
                Nacionalidade
              </FieldLabel>
              <Input
                id="campo-nacionalidade"
                value={campos.nacionalidade}
                onChange={(evento) =>
                  atualizar_campo("nacionalidade", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-telefone">Telefone</FieldLabel>
              <Input
                id="campo-telefone"
                value={campos.telefone}
                onChange={(evento) =>
                  atualizar_campo("telefone", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-email">E-mail</FieldLabel>
              <Input
                id="campo-email"
                value={campos.email}
                onChange={(evento) =>
                  atualizar_campo("email", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-naturalidade">
                Naturalidade
              </FieldLabel>
              <Input
                id="campo-naturalidade"
                value={campos.naturalidade}
                onChange={(evento) =>
                  atualizar_campo("naturalidade", evento.target.value)
                }
              />
            </Field>

            <Field className="sm:col-span-2 lg:col-span-3">
              <FieldLabel htmlFor="campo-endereco">Endereço</FieldLabel>
              <Input
                id="campo-endereco"
                value={campos.endereco}
                onChange={(evento) =>
                  atualizar_campo("endereco", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-bairro">Bairro</FieldLabel>
              <Input
                id="campo-bairro"
                value={campos.bairro}
                onChange={(evento) =>
                  atualizar_campo("bairro", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-cidade">Cidade</FieldLabel>
              <Input
                id="campo-cidade"
                value={campos.cidade}
                onChange={(evento) =>
                  atualizar_campo("cidade", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-cep">CEP</FieldLabel>
              <Input
                id="campo-cep"
                value={campos.cep}
                onChange={(evento) =>
                  atualizar_campo("cep", evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-uf">UF</FieldLabel>
              <Input
                id="campo-uf"
                value={campos.uf}
                onChange={(evento) =>
                  atualizar_campo("uf", evento.target.value)
                }
              />
            </Field>

            <Field className="sm:col-span-2 lg:col-span-2">
              <FieldLabel htmlFor="campo-complemento">Complemento</FieldLabel>
              <Input
                id="campo-complemento"
                value={campos.complemento}
                onChange={(evento) =>
                  atualizar_campo("complemento", evento.target.value)
                }
              />
            </Field>

            <Field
              orientation="horizontal"
              className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-2 pt-6"
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => definir_etapa("entrada")}
              >
                <ArrowLeftIcon className="size-4" />
                Voltar para a etapa anterior
              </Button>

              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={gerar_pdf}
                disabled={gerando_pdf}
              >
                {gerando_pdf ? "Gerando PDF..." : "Gerar PDF"}
              </Button>
            </Field>

            {erro_pdf ? (
              <Field className="sm:col-span-2 lg:col-span-3">
                <Alert
                  variant="destructive"
                  className="border-red-500/20 bg-red-500/5 font-bold"
                >
                  <TriangleAlertIcon className="size-4" />
                  {erro_pdf}
                </Alert>
              </Field>
            ) : null}
          </FieldGroup>
        </FieldSet>
      )}

      {etapa === "sucesso" && (
        <BlocoSucessoPDF
          on_concluir={() => definir_etapa("entrada")}
          descricao="O download da declaração foi iniciado. Você será levado de volta para a etapa 1 automaticamente em alguns segundos."
          rotulo_botao="Concluir"
        />
      )}
    </section>
  );
}
