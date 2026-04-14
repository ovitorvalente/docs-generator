import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "node:path";
import { cwd } from "node:process";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 50;
const TEXT_WIDTH = A4_WIDTH - MARGIN_X * 2;

function gerar_nome_arquivo(campos: CamposResidencia, data: Date) {
  const nome_base = (campos.nome || "declaracao-residencia")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${nome_base}-${ano}${mes}${dia}.pdf`;
}

function apenas_digitos(valor: string | undefined | null) {
  if (!valor) return "";
  return valor.replace(/\D/g, "");
}

function formatar_cpf(valor: string | undefined | null) {
  const digitos = apenas_digitos(valor);
  if (digitos.length !== 11) return valor ?? "";

  const parte1 = digitos.slice(0, 3);
  const parte2 = digitos.slice(3, 6);
  const parte3 = digitos.slice(6, 9);
  const parte4 = digitos.slice(9);

  return `${parte1}.${parte2}.${parte3}-${parte4}`;
}

function formatar_telefone(valor: string | undefined | null) {
  const digitos = apenas_digitos(valor);
  if (digitos.length === 11) {
    const ddd = digitos.slice(0, 2);
    const parte1 = digitos.slice(2, 7);
    const parte2 = digitos.slice(7);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  if (digitos.length === 10) {
    const ddd = digitos.slice(0, 2);
    const parte1 = digitos.slice(2, 6);
    const parte2 = digitos.slice(6);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  return valor ?? "";
}

function formatar_cep(valor: string | undefined | null) {
  const digitos = apenas_digitos(valor);
  if (digitos.length !== 8) return valor ?? "";

  const parte1 = digitos.slice(0, 5);
  const parte2 = digitos.slice(5);
  return `${parte1}-${parte2}`;
}

function formatar_documento_identidade(
  documento_identidade: string | undefined | null,
  cpf: string | undefined | null
) {
  const rg_digitos = apenas_digitos(documento_identidade);
  const cpf_digitos = apenas_digitos(cpf);

  if (rg_digitos && cpf_digitos && rg_digitos === cpf_digitos) {
    return formatar_cpf(cpf);
  }

  if (rg_digitos.length === 9) {
    const parte1 = rg_digitos.slice(0, 2);
    const parte2 = rg_digitos.slice(2, 5);
    const parte3 = rg_digitos.slice(5, 8);
    const digito = rg_digitos.slice(8);
    return `${parte1}.${parte2}.${parte3}-${digito}`;
  }

  return documento_identidade ?? "";
}

function quebrar_linhas(
  texto: string,
  fonte: PDFFont,
  tamanho: number,
  largura_maxima: number
): string[] {
  const paragrafos = texto.split(/\r?\n/);
  const linhas: string[] = [];

  for (const paragrafo of paragrafos) {
    const limpo = paragrafo.trim();
    if (!limpo) {
      linhas.push("");
      continue;
    }

    const palavras = limpo.split(/\s+/);
    let atual = "";

    for (const palavra of palavras) {
      const candidato = atual ? `${atual} ${palavra}` : palavra;
      const largura = fonte.widthOfTextAtSize(candidato, tamanho);
      if (largura <= largura_maxima) {
        atual = candidato;
      } else {
        if (atual) {
          linhas.push(atual);
          atual = palavra;
        } else {
          linhas.push(palavra);
          atual = "";
        }
      }
    }

    if (atual) {
      linhas.push(atual);
    }
  }

  return linhas;
}

function desenhar_texto(
  pagina: ReturnType<PDFDocument["addPage"]>,
  texto: string,
  x: number,
  y_inicial: number,
  largura_maxima: number,
  fonte: PDFFont,
  tamanho: number,
  espacamento_linha: number
) {
  let y = y_inicial;
  const linhas = quebrar_linhas(texto, fonte, tamanho, largura_maxima);

  for (const linha of linhas) {
    if (linha) {
      pagina.drawText(linha, { x, y, size: tamanho, font: fonte });
    }
    y -= espacamento_linha;
  }

  return y;
}

async function gerar_pdf(campos: CamposResidencia): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const pagina = pdf.addPage([A4_WIDTH, A4_HEIGHT]);

  const fonte_regular = await pdf.embedFont(StandardFonts.Helvetica);
  const fonte_bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const caminho_logo = path.join(cwd(), "public", "logo.png");
  try {
    const logo_bytes = await readFile(caminho_logo);
    const logo = await pdf.embedPng(logo_bytes);
    const escala = 60 / logo.width;
    pagina.drawImage(logo, {
      x: 60,
      y: A4_HEIGHT - 145,
      width: 60,
      height: logo.height * escala,
    });
  } catch {
    // Se a logo não existir, segue sem ela.
  }

  const titulo = "DECLARAÇÃO DE RESIDÊNCIA";
  const tamanho_titulo = 18;
  const largura_titulo = fonte_bold.widthOfTextAtSize(titulo, tamanho_titulo);
  const x_titulo = (A4_WIDTH - largura_titulo) / 2;
  const y_titulo = A4_HEIGHT - 110;

  pagina.drawText(titulo, {
    x: x_titulo,
    y: y_titulo,
    size: tamanho_titulo,
    font: fonte_bold,
  });

  pagina.drawLine({
    start: { x: x_titulo, y: y_titulo - 4 },
    end: { x: x_titulo + largura_titulo, y: y_titulo - 4 },
    thickness: 1,
  });

  const documento_identidade_formatado = formatar_documento_identidade(
    campos.documento_identidade,
    campos.cpf
  );
  const cpf_formatado = formatar_cpf(campos.cpf);
  const telefone_formatado = formatar_telefone(campos.telefone);
  const cep_formatado = formatar_cep(campos.cep);

  let y = y_titulo - 40;

  pagina.drawText("Dados Pessoais", {
    x: MARGIN_X,
    y,
    size: 12,
    font: fonte_bold,
  });
  y -= 18;

  const linhas_dados = [
    `Nome: ${campos.nome}`,
    `Documento de Identidade: ${documento_identidade_formatado}`,
    `Órgão expedidor: ${campos.orgao_expedidor}`,
    `CPF: ${cpf_formatado}`,
    `Nacionalidade: ${campos.nacionalidade}`,
    `Telefone: ${telefone_formatado}`,
    `E-mail: ${campos.email}`,
    `Naturalidade: ${campos.naturalidade}`,
  ];

  for (const linha of linhas_dados) {
    y = desenhar_texto(pagina, linha, MARGIN_X, y, TEXT_WIDTH, fonte_regular, 11, 14);
  }

  y -= 8;

  y = desenhar_texto(
    pagina,
    "Na falta de documentos para comprovação de residência, declaro para os devidos fins, sob as penas da Lei, ser residente e domiciliado no endereço abaixo.",
    MARGIN_X,
    y,
    TEXT_WIDTH,
    fonte_bold,
    11,
    14
  );

  y -= 8;

  const linhas_endereco = [
    `Endereço: ${campos.endereco}`,
    `Bairro: ${campos.bairro}`,
    `Cidade: ${campos.cidade}`,
    `CEP: ${cep_formatado}`,
    `UF: ${campos.uf}`,
    `Complemento: ${campos.complemento}`,
  ];

  for (const linha of linhas_endereco) {
    y = desenhar_texto(pagina, linha, MARGIN_X, y, TEXT_WIDTH, fonte_regular, 11, 14);
  }

  y -= 8;

  y = desenhar_texto(
    pagina,
    'Declaro ainda, estar ciente de que a falsidade da presente declaração pode implicar na sanção penal prevista no Código Penal, "Art. 299 Omitir, em documento público ou particular, declaração que nele deveria constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante", pena de reclusão de 1 (um) a 5 (cinco) anos e multa, se o documento é público e reclusão de 1 (um) a 3 (três) anos, se o documento é particular.',
    MARGIN_X,
    y,
    TEXT_WIDTH,
    fonte_bold,
    10,
    13
  );

  y -= 22;

  const data_atual = new Date();
  const nome_cidade = campos.cidade || "VOLTA REDONDA";
  const data_formatada = data_atual.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  pagina.drawText(`${nome_cidade.toUpperCase()}, ${data_formatada.toUpperCase()}.`, {
    x: MARGIN_X,
    y,
    size: 11,
    font: fonte_regular,
  });

  y -= 70;

  const nome_assinatura = campos.nome || "";
  const largura_nome = fonte_bold.widthOfTextAtSize(nome_assinatura, 11);
  const x_nome = (A4_WIDTH - largura_nome) / 2;
  pagina.drawText(nome_assinatura, {
    x: x_nome,
    y,
    size: 11,
    font: fonte_bold,
  });

  y -= 16;
  const linha_assinatura = "________________________________________";
  const largura_linha_assinatura = fonte_regular.widthOfTextAtSize(linha_assinatura, 10);
  const x_linha = (A4_WIDTH - largura_linha_assinatura) / 2;
  pagina.drawText(linha_assinatura, {
    x: x_linha,
    y,
    size: 10,
    font: fonte_regular,
  });

  y -= 14;
  const legenda = "Assinatura do cliente";
  const largura_legenda = fonte_regular.widthOfTextAtSize(legenda, 10);
  const x_legenda = (A4_WIDTH - largura_legenda) / 2;
  pagina.drawText(legenda, {
    x: x_legenda,
    y,
    size: 10,
    font: fonte_regular,
  });

  return pdf.save();
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = (await requisicao.json()) as CamposResidencia;
    const bytes_pdf = await gerar_pdf(corpo);
    const nome_arquivo = gerar_nome_arquivo(corpo, new Date());

    return new NextResponse(Buffer.from(bytes_pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nome_arquivo}"`,
      },
    });
  } catch (erro) {
    return NextResponse.json(
      {
        mensagem: "Erro ao gerar PDF de declaração de residência: " + erro,
      },
      { status: 500 }
    );
  }
}
