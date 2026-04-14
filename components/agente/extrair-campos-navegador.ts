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
  if (!mensagem.trim()) {
    return { ...ESTADO_INICIAL_CAMPOS };
  }

  // Mantemos os callbacks de progresso para preservar o contrato com o modal,
  // mas a extração é feita apenas por parser para evitar dependência obsoleta.
  onProgresso?.("carregando_modelo");
  onProgresso?.("extraindo_campos");
  return extrair_por_parser(mensagem);
}
