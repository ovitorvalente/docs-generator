import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

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

const corpo_requisicao_schema = z.object({
  mensagem: z.string().min(1, "Mensagem não pode ser vazia."),
});

const campos_parciais_schema = z.object({
  nome: z.string().optional(),
  documento_identidade: z.string().optional(),
  orgao_expedidor: z.string().optional(),
  cpf: z.string().optional(),
  nacionalidade: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  naturalidade: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  uf: z.string().optional(),
  complemento: z.string().optional(),
});

const CAMPOS_VAZIOS: CamposResidencia = {
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apenas_digitos(valor: string | undefined | null) {
  if (!valor) return "";
  return valor.replace(/\D/g, "");
}

function formatar_cpf(valor: string | undefined | null) {
  const digitos = apenas_digitos(valor);
  if (digitos.length !== 11) return (valor ?? "").trim();

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

function formatar_telefone(valor: string | undefined | null) {
  const digitos = apenas_digitos(valor);
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return (valor ?? "").trim();
}

function formatar_cep(valor: string | undefined | null) {
  const digitos = apenas_digitos(valor);
  if (digitos.length !== 8) return (valor ?? "").trim();
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function extrair_json_texto(texto: string) {
  const texto_limpo = texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const inicio = texto_limpo.indexOf("{");
  const fim = texto_limpo.lastIndexOf("}");

  if (inicio === -1 || fim === -1 || fim <= inicio) {
    throw new Error("Resposta da IA sem JSON válido.");
  }

  return texto_limpo.slice(inicio, fim + 1);
}

function normalizar_campos(parcial: z.infer<typeof campos_parciais_schema>) {
  return {
    ...CAMPOS_VAZIOS,
    ...Object.fromEntries(
      Object.entries(parcial).map(([chave, valor]) => [chave, (valor ?? "").trim()])
    ),
    cpf: formatar_cpf(parcial.cpf),
    telefone: formatar_telefone(parcial.telefone),
    cep: formatar_cep(parcial.cep),
    uf: (parcial.uf ?? "").trim().toUpperCase().slice(0, 2),
  } satisfies CamposResidencia;
}

async function extrair_com_gemini(mensagem: string) {
  const api_key = process.env.GEMINI_API_KEY;

  if (!api_key) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const modelo_configurado = (process.env.GEMINI_MODEL ?? "").trim().replace(
    /^models\//,
    ""
  );

  const modelos_candidatos = [
    modelo_configurado,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
  ].filter((valor, indice, lista) => Boolean(valor) && lista.indexOf(valor) === indice);

  const prompt = [
    "Extraia os dados de uma mensagem de declaração de residência em português do Brasil.",
    "Responda somente em JSON, sem explicações, no formato:",
    '{ "nome":"","documento_identidade":"","orgao_expedidor":"","cpf":"","nacionalidade":"","telefone":"","email":"","naturalidade":"","endereco":"","bairro":"","cidade":"","cep":"","uf":"","complemento":"" }',
    "Regras:",
    "- Se um campo não existir, retorne string vazia.",
    "- Não invente valores.",
    "- Preserve nomes próprios com acentuação.",
    "- Separe corretamente endereço, bairro, cidade, CEP e UF quando possível.",
    "",
    "Mensagem:",
    mensagem,
  ].join("\n");

  const erros_modelo: string[] = [];

  for (const modelo of modelos_candidatos) {
    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${api_key}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!resposta.ok) {
      const erro = await resposta.text();
      erros_modelo.push(`${modelo}: ${resposta.status}`);

      // 404 normalmente indica modelo indisponível para esse endpoint/versão.
      // Nesses casos tentamos o próximo modelo.
      if (resposta.status === 404) {
        continue;
      }

      throw new Error(`Gemini retornou erro ${resposta.status} (${modelo}): ${erro}`);
    }

    const json = (await resposta.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const texto_resposta =
      json.candidates?.[0]?.content?.parts
        ?.map((parte) => parte.text ?? "")
        .join("")
        .trim() ?? "";

    if (!texto_resposta) {
      erros_modelo.push(`${modelo}: sem conteúdo`);
      continue;
    }

    const objeto_json = JSON.parse(extrair_json_texto(texto_resposta));
    return campos_parciais_schema.parse(objeto_json);
  }

  throw new Error(
    `Nenhum modelo Gemini retornou resultado válido. Tentativas: ${erros_modelo.join(", ")}`
  );
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = corpo_requisicao_schema.parse(await requisicao.json());
    const campos_extraidos = await extrair_com_gemini(corpo.mensagem);
    const campos = normalizar_campos(campos_extraidos);

    return NextResponse.json({ campos }, { status: 200 });
  } catch (erro) {
    console.error("Erro ao extrair dados da declaração com Gemini:", erro);

    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Falha inesperada ao processar a mensagem com IA.";

    return NextResponse.json(
      {
        mensagem:
          "Não foi possível processar a mensagem com IA no momento. Verifique a configuração do Gemini e tente novamente.",
        detalhe: mensagem,
      },
      { status: 500 }
    );
  }
}
