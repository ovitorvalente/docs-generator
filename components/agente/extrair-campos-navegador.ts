"use client";

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

/**
 * Mapa de rótulos alternativos para campos.
 * Muitas variações para cobrir diferentes templates.
 */
const MAPA_ROTULOS_PARA_CAMPO: Record<string, keyof CamposResidencia> = {
  nome: "nome",
  "nome completo": "nome",
  "nome completo:": "nome",
  "documento de identidade": "documento_identidade",
  "documento identidade": "documento_identidade",
  "doc. identidade": "documento_identidade",
  documento: "documento_identidade",
  rg: "documento_identidade",
  "órgão expedidor": "orgao_expedidor",
  "orgão expedidor": "orgao_expedidor",
  "órgão emissor": "orgao_expedidor",
  "orgão emissor": "orgao_expedidor",
  "orgao emissor": "orgao_expedidor",
  "orgao expedidor": "orgao_expedidor",
  "órgão expedidor:": "orgao_expedidor",
  "orgao emissor:": "orgao_expedidor",
  cpf: "cpf",
  nacionalidade: "nacionalidade",
  telefone: "telefone",
  tel: "telefone",
  celular: "telefone",
  cel: "telefone",
  whatsapp: "telefone",
  "e-mail": "email",
  email: "email",
  "e-mail:": "email",
  "e mail": "email",
  mail: "email",
  naturalidade: "naturalidade",
  endereço: "endereco",
  endereco: "endereco",
  logradouro: "endereco",
  rua: "endereco",
  "número": "endereco",
  numero: "endereco",
  num: "endereco",
  bairro: "bairro",
  cidade: "cidade",
  municipio: "cidade",
  município: "cidade",
  cep: "cep",
  uf: "uf",
  estado: "uf",
  est: "uf",
  complemento: "complemento",
  "ponto de referência": "complemento",
  "ponto de referencia": "complemento",
  referencia: "complemento",
  "referência": "complemento",
};

function normalizar_rotulo(rotulo: string): string {
  return rotulo
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function limpar_valor(valor: string): string {
  return valor
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .trim();
}

/**
 * Extrai campos usando parsing por rótulos.
 * Suporta várias variações: LABEL: VALUE, LABEL - VALUE, LABEL = VALUE, etc.
 */
function extrair_por_parser(mensagem: string): CamposResidencia {
  const resultado: CamposResidencia = {
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

  const linhas = mensagem.split(/\r?\n/);
  let rua = "";
  let numero = "";

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const match = linha.match(/^\s*([^:=\-–—]+?)\s*[:=\-–—]\s*(.*)$/);
    if (!match) continue;

    const rotulo = normalizar_rotulo(match[1]);
    let valor = limpar_valor(match[2] ?? "");

    if (!valor && i + 1 < linhas.length) {
      const prox = linhas[i + 1].trim();
      if (prox && !prox.match(/^\s*[^:=\-–—]+?\s*[:=\-–—]\s*/)) {
        valor = limpar_valor(prox);
        i++;
      }
    }

    if (!rotulo || rotulo.length < 2) continue;

    const chave = MAPA_ROTULOS_PARA_CAMPO[rotulo];
    if (chave) {
      if (chave === "endereco") {
        if (rotulo === "rua") {
          rua = valor;
        } else if (rotulo === "numero" || rotulo === "num") {
          numero = valor;
        } else {
          resultado.endereco = valor;
        }
      } else {
        resultado[chave] = valor;
      }
    }
  }

  if (rua && !resultado.endereco) {
    resultado.endereco = numero ? `${rua}, nº ${numero}` : rua;
  } else if (numero && resultado.endereco && !resultado.endereco.includes(numero)) {
    resultado.endereco = `${resultado.endereco}, nº ${numero}`;
  }

  return resultado;
}

const ESTADO_INICIAL_CAMPOS: CamposResidencia = {
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

const PERGUNTAS_POR_CAMPO: Record<keyof CamposResidencia, string> = {
  nome: "Qual é o nome completo?",
  documento_identidade: "Qual é o número do documento de identidade?",
  orgao_expedidor: "Qual é o órgão expedidor do documento?",
  cpf: "Qual é o CPF?",
  nacionalidade: "Qual é a nacionalidade?",
  telefone: "Qual é o telefone?",
  email: "Qual é o e-mail?",
  naturalidade: "Qual é a naturalidade?",
  endereco: "Qual é o endereço completo?",
  bairro: "Qual é o bairro?",
  cidade: "Qual é a cidade?",
  cep: "Qual é o CEP?",
  uf: "Qual é o UF ou estado?",
  complemento: "Qual é o complemento do endereço?",
};

type PipelineQA = (entrada: {
  question: string;
  context: string;
}) => Promise<{ answer?: string }>;

let pipeline_carregado: PipelineQA | null = null;
let carregando_pipeline: Promise<PipelineQA> | null = null;

async function obter_pipeline_qa(): Promise<PipelineQA> {
  if (pipeline_carregado) {
    return pipeline_carregado;
  }

  if (carregando_pipeline) {
    return carregando_pipeline;
  }

  carregando_pipeline = (async () => {
    const modulo = await import("@huggingface/transformers");
    const pipeline = (await modulo.pipeline(
      "question-answering",
      "Xenova/distilbert-base-uncased-distilled-squad",
      { dtype: "q4" }
    )) as unknown as PipelineQA;

    pipeline_carregado = pipeline;
    return pipeline;
  })();

  return carregando_pipeline;
}

export type FaseExtracao = "carregando_modelo" | "extraindo_campos";

export type CallbackProgressoExtracao = (fase: FaseExtracao) => void;

/**
 * Extração híbrida: parser primeiro (rápido e confiável para LABEL: VALUE),
 * IA apenas para campos que ficaram vazios.
 */
export async function extrair_campos_com_ia(
  mensagem: string,
  onProgresso?: CallbackProgressoExtracao
): Promise<CamposResidencia> {
  const contexto = mensagem.trim();

  if (!contexto) {
    return { ...ESTADO_INICIAL_CAMPOS };
  }

  const resultado = extrair_por_parser(contexto);

  const campos_vazios = (Object.keys(resultado) as (keyof CamposResidencia)[]).filter(
    (chave) => !resultado[chave].trim()
  );

  if (campos_vazios.length === 0) {
    onProgresso?.("carregando_modelo");
    onProgresso?.("extraindo_campos");
    return resultado;
  }

  onProgresso?.("carregando_modelo");
  const qa = await obter_pipeline_qa();

  onProgresso?.("extraindo_campos");

  for (const chave of campos_vazios) {
    const pergunta = PERGUNTAS_POR_CAMPO[chave];

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resposta = (await qa({
        question: pergunta,
        context: contexto,
      })) as any;

      const texto_resposta: string | undefined = resposta?.answer;

      resultado[chave] = texto_resposta?.toString().trim() ?? "";
    } catch (erro) {
      console.error(
        `Erro ao extrair campo "${String(chave)}" com IA no navegador:`,
        erro
      );
    }
  }

  return resultado;
}

