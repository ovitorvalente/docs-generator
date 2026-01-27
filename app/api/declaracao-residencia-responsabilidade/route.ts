import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "node:path";
import { cwd } from "node:process";

type CamposResponsabilidade = {
  nome: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function obter_caminho_logo() {
  return path.join(cwd(), "public", "logo.png");
}

function escrever_documento_pdf(documento: any, campos: CamposResponsabilidade) {
  const caminho_logo = obter_caminho_logo();

  try {
    documento.image(caminho_logo, 60, 20, { width: 60 });
  } catch {
    // Se a logo não for encontrada, apenas segue sem ela
  }

  const titulo =
    "DECLARAÇÃO DE RESIDÊNCIA E RESPONSABILIDADE FINANCEIRA";
  const tamanho_titulo = 14;

  documento.font("Helvetica-Bold").fontSize(tamanho_titulo);

  const largura_titulo = documento.widthOfString(titulo);
  const largura_pagina =
    documento.page.width -
    documento.page.margins.left -
    documento.page.margins.right;
  const x_titulo =
    documento.page.margins.left + (largura_pagina - largura_titulo) / 2;
  const y_titulo = 90;

  documento.text(titulo, x_titulo, y_titulo, { align: "left" });

  const altura_linha = documento.currentLineHeight();
  const y_linha = y_titulo + altura_linha;

  documento
    .moveTo(x_titulo, y_linha)
    .lineTo(x_titulo + largura_titulo, y_linha)
    .stroke();

  documento.moveDown(3);

  documento.font("Helvetica").fontSize(12);
  documento.text(
    `Eu, ${campos.nome}, na falta de documentos para comprovação de residência, em conformidade com o disposto na Lei nº 7.115, de 29 de agosto de 1983, declaro, para os devidos fins e sob as penas da lei, que resido e sou domiciliado no endereço informado à empresa contratante.`,
    {
      align: "justify",
    }
  );

  documento.moveDown(1.5);

  documento
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Declaro ainda que estou contratando o serviço de internet para outra pessoa, assumindo total responsabilidade financeira pelo referido serviço, que será instalado no endereço informado no ato da contratação.",
      {
        align: "justify",
      }
    );

  documento.moveDown(1.5);

  documento
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Por ser verdade, firmo a presente declaração para que produza seus efeitos legais, ciente de que a falsidade das informações prestadas pode implicar em sanções civis, administrativas e penais, nos termos do art. 299 do Código Penal.",
      {
        align: "justify",
      }
    );

  documento.moveDown(3);

  const data_atual = new Date();

  const data_formatada = data_atual.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  documento
    .font("Helvetica")
    .fontSize(11)
    .text(`Volta Redonda, ${data_formatada}.`, { align: "left" });

  documento.moveDown(3);

  documento
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(campos.nome, { align: "center" })
    .moveDown(-0.5);
  documento
    .font("Helvetica")
    .fontSize(10)
    .text("________________________________________", { align: "center" })
    .moveDown(0.5);
  documento.font("Helvetica").fontSize(10).text("Assinatura do responsável", {
    align: "center",
  });
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = (await requisicao.json()) as CamposResponsabilidade;

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const PDFKit = (eval("require") as any)("pdfkit");

    const documento = new PDFKit({
      size: "A4",
      margin: 60,
    });

    const partes: Buffer[] = [];

    return await new Promise<NextResponse>((resolver, rejeitar) => {
      documento.on("data", (parte: Buffer) => {
        partes.push(parte);
      });

      documento.on("end", () => {
        const buffer_pdf = Buffer.concat(partes);

        const nome_arquivo = gerar_nome_arquivo(corpo, new Date());

        const resposta = new NextResponse(buffer_pdf, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${nome_arquivo}"`,
          },
        });

        resolver(resposta);
      });

      documento.on("error", (erro: unknown) => {
        rejeitar(erro);
      });

      escrever_documento_pdf(documento, corpo);
      documento.end();
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

