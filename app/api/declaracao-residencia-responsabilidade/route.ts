import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "node:path";
import { cwd } from "node:process";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";

type CamposResponsabilidade = {
  nome: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 60;
const TEXT_WIDTH = A4_WIDTH - MARGIN_X * 2;

function gerar_nome_arquivo(campos: CamposResponsabilidade, data: Date) {
  const nome_base = (campos.nome || "declaracao-residencia-responsabilidade")
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

function quebrar_linhas(
  texto: string,
  fonte: PDFFont,
  tamanho: number,
  largura_maxima: number
): string[] {
  const palavras = texto.trim().split(/\s+/);
  const linhas: string[] = [];
  let atual = "";

  for (const palavra of palavras) {
    const candidato = atual ? `${atual} ${palavra}` : palavra;
    const largura = fonte.widthOfTextAtSize(candidato, tamanho);

    if (largura <= largura_maxima) {
      atual = candidato;
    } else {
      if (atual) {
        linhas.push(atual);
      }
      atual = palavra;
    }
  }

  if (atual) {
    linhas.push(atual);
  }

  return linhas;
}

function desenhar_paragrafo(
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
    pagina.drawText(linha, { x, y, size: tamanho, font: fonte });
    y -= espacamento_linha;
  }

  return y;
}

async function gerar_pdf(campos: CamposResponsabilidade): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const pagina = pdf.addPage([A4_WIDTH, A4_HEIGHT]);

  const fonte_regular = await pdf.embedFont(StandardFonts.Helvetica);
  const fonte_bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const titulo = "DECLARAÇÃO DE RESIDÊNCIA E RESPONSABILIDADE FINANCEIRA";
  const tamanho_titulo = 14;
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

  const caminho_logo_jpg = path.join(cwd(), "public", "logo.jpg");
  const caminho_logo_png = path.join(cwd(), "public", "logo.png");
  try {
    let logo;
    try {
      const logo_bytes_jpg = await readFile(caminho_logo_jpg);
      logo = await pdf.embedJpg(logo_bytes_jpg);
    } catch {
      const logo_bytes_png = await readFile(caminho_logo_png);
      logo = await pdf.embedPng(logo_bytes_png);
    }

    const escala = 42 / logo.width;
    const largura_logo = 42;
    const altura_logo = logo.height * escala;
    const y_logo = y_titulo + (tamanho_titulo - altura_logo) / 2;

    pagina.drawImage(logo, {
      x: MARGIN_X,
      y: y_logo,
      width: largura_logo,
      height: altura_logo,
    });
  } catch {
    // Se a logo não existir, segue sem ela.
  }

  let y = y_titulo - 36;

  y = desenhar_paragrafo(
    pagina,
    `Eu, ${campos.nome}, na falta de documentos para comprovação de residência, em conformidade com o disposto na Lei nº 7.115, de 29 de agosto de 1983, declaro, para os devidos fins e sob as penas da lei, que resido e sou domiciliado no endereço informado à empresa contratante.`,
    MARGIN_X,
    y,
    TEXT_WIDTH,
    fonte_regular,
    12,
    16
  );

  y -= 10;

  y = desenhar_paragrafo(
    pagina,
    "Declaro ainda que estou contratando o serviço de internet para outra pessoa, assumindo total responsabilidade financeira pelo referido serviço, que será instalado no endereço informado no ato da contratação.",
    MARGIN_X,
    y,
    TEXT_WIDTH,
    fonte_regular,
    12,
    16
  );

  y -= 10;

  y = desenhar_paragrafo(
    pagina,
    "Por ser verdade, firmo a presente declaração para que produza seus efeitos legais, ciente de que a falsidade das informações prestadas pode implicar em sanções civis, administrativas e penais, nos termos do art. 299 do Código Penal.",
    MARGIN_X,
    y,
    TEXT_WIDTH,
    fonte_regular,
    12,
    16
  );

  y -= 28;

  const data_atual = new Date();
  const data_formatada = data_atual.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  pagina.drawText(`Volta Redonda, ${data_formatada}.`, {
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
  const largura_linha = fonte_regular.widthOfTextAtSize(linha_assinatura, 10);
  const x_linha = (A4_WIDTH - largura_linha) / 2;
  pagina.drawText(linha_assinatura, {
    x: x_linha,
    y,
    size: 10,
    font: fonte_regular,
  });

  y -= 14;
  const legenda = "Assinatura do responsável";
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
    const corpo = (await requisicao.json()) as CamposResponsabilidade;
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
        mensagem:
          "Erro ao gerar PDF de declaração de residência e responsabilidade: " + erro,
      },
      { status: 500 }
    );
  }
}
