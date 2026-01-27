import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignJWT } from "jose";

const esquema_credenciais = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

function obter_chave_jwt() {
  const segredo = process.env.AUTH_JWT_SECRET;

  if (!segredo) {
    throw new Error(
      "Variável de ambiente AUTH_JWT_SECRET não definida. Configure-a no .env.local."
    );
  }

  return new TextEncoder().encode(segredo);
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = await requisicao.json();

    const resultado = esquema_credenciais.safeParse(corpo);

    if (!resultado.success) {
      return NextResponse.json(
        {
          mensagem: "Dados inválidos",
          erros: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, senha } = resultado.data;

    const email_correto = process.env.AUTH_EMAIL;
    const senha_correta = process.env.AUTH_PASSWORD;

    if (!email_correto || !senha_correta) {
      return NextResponse.json(
        {
          mensagem:
            "Configuração de autenticação ausente. Defina AUTH_EMAIL e AUTH_PASSWORD no .env.local.",
        },
        { status: 500 }
      );
    }

    if (email !== email_correto || senha !== senha_correta) {
      return NextResponse.json(
        { mensagem: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const chave = obter_chave_jwt();

    const token = await new SignJWT({ email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(chave);

    const resposta = NextResponse.json(
      { mensagem: "Autenticado com sucesso" },
      { status: 200 }
    );

    resposta.cookies.set("token_autenticacao", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return resposta;
  } catch (erro) {
    console.error("Erro na rota /api/autenticar:", erro);

    return NextResponse.json(
      { mensagem: "Erro interno ao autenticar" },
      { status: 500 }
    );
  }
}

