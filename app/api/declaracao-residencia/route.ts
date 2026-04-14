import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "node:path";
import { createRequire } from "node:module";
import { cwd } from "node:process";

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

const require = createRequire(import.meta.url);

function obter_pdfkit() {
  // Usa a versão CommonJS para evitar incompatibilidade do bundle ESM do pdfkit com Turbopack.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("pdfkit/js/pdfkit.js");
}

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
    // Quando RG é o mesmo número do CPF, formatamos como CPF
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

function obter_caminho_logo() {
  return path.join(cwd(), "public", "logo.png");
}

function escrever_documento_pdf(documento: any, campos: CamposResidencia) {
  const caminho_logo = obter_caminho_logo();

  try {
    documento.image(caminho_logo, 60, 90, { width: 60 });
  } catch {
    // Se a logo não for encontrada, apenas segue sem ela
  }

  // Título "DECLARAÇÃO DE RESIDÊNCIA" centralizado com sublinhado, como no modelo
  const titulo = "DECLARAÇÃO DE RESIDÊNCIA";
  const tamanho_titulo = 18;

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

  const documento_identidade_formatado = formatar_documento_identidade(
    campos.documento_identidade,
    campos.cpf
  );
  const cpf_formatado = formatar_cpf(campos.cpf);
  const telefone_formatado = formatar_telefone(campos.telefone);
  const cep_formatado = formatar_cep(campos.cep);

  // Seção "Dados Pessoais" alinhada à esquerda
  documento
    .moveDown(2)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Dados Pessoais", 50, documento.y, { align: "left" });

  documento.moveDown(0.5);
  documento.font("Helvetica").fontSize(11);

  // Bloco de dados pessoais, uma linha para cada campo, como no exemplo
  documento.text(`Nome: ${campos.nome}`);
  documento.text(
    `Documento de Identidade: ${documento_identidade_formatado}`
  );
  documento.text(`Órgão expedidor: ${campos.orgao_expedidor}`);
  documento.text(`CPF: ${cpf_formatado}`);
  documento.text(`Nacionalidade: ${campos.nacionalidade}`);
  documento.text(`Telefone: ${telefone_formatado}`);
  documento.text(`E-mail: ${campos.email}`);
  documento.text(`Naturalidade: ${campos.naturalidade}`);

  documento.moveDown(1);
  documento
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      "Na falta de documentos para comprovação de residência, declaro para os devidos fins, sob as penas da Lei, ser residente e domiciliado no endereço abaixo.",
      {
        align: "justify",
      }
    );

  documento.moveDown(1);
  documento.font("Helvetica").fontSize(11);
  documento.text(`Endereço: ${campos.endereco}`);
  documento.text(`Bairro: ${campos.bairro}`);
  documento.text(`Cidade: ${campos.cidade}`);
  documento.text(`CEP: ${cep_formatado}`);
  documento.text(`UF: ${campos.uf}`);
  documento.text(`Complemento: ${campos.complemento}`);

  documento.moveDown(1);
  documento
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      'Declaro ainda, estar ciente de que a falsidade da presente declaração pode implicar na sanção penal prevista no Código Penal, "Art. 299 Omitir, em documento público ou particular, declaração que nele deveria constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante", pena de reclusão de 1 (um) a 5 (cinco) anos e multa, se o documento é público e reclusão de 1 (um) a 3 (três) anos, se o documento é particular.',
      {
        align: "justify",
      }
    );

  documento.moveDown(2);

  const data_atual = new Date();
  const nome_cidade = campos.cidade || "VOLTA REDONDA";

  const data_formatada = data_atual.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  documento
    .font("Helvetica")
    .fontSize(11)
    .text(
      `${nome_cidade.toUpperCase()}, ${data_formatada.toUpperCase()}.`,
      { align: "left" }
    );

  documento.moveDown(3);

  documento
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(campos.nome, { align: "center" })
    .moveDown(0);
  documento
    .font("Helvetica")
    .fontSize(10)
    .text("________________________________________", { align: "center" })
    .moveDown(0.2);
  documento.font("Helvetica").fontSize(10).text("Assinatura do cliente", {
    align: "center",
  });
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = (await requisicao.json()) as CamposResidencia;

    const PDFKit = obter_pdfkit();

    const documento = new PDFKit({
      size: "A4",
      margin: 50,
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
    console.error("Erro ao gerar PDF de declaração de residência:", erro);

    return NextResponse.json(
      { mensagem: "Erro ao gerar PDF de declaração de residência" },
      { status: 500 }
    );
  }
}
