import { NextResponse } from "next/server";

export async function POST() {
  const resposta = NextResponse.json(
    { mensagem: "Sessão encerrada com sucesso" },
    { status: 200 }
  );

  // Remove o cookie de autenticação
  resposta.cookies.set("token_autenticacao", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return resposta;
}

