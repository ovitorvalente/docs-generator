import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const caminhos_livres = ["/auth", "/api/autenticar"];

async function validar_token(token: string) {
  const segredo = process.env.AUTH_JWT_SECRET;

  if (!segredo) {
    throw new Error(
      "Variável de ambiente AUTH_JWT_SECRET não definida. Configure-a no .env.local."
    );
  }

  const chave = new TextEncoder().encode(segredo);

  return jwtVerify(token, chave, {
    algorithms: ["HS256"],
  });
}

export async function middleware(requisicao: NextRequest) {
  const caminho = requisicao.nextUrl.pathname;

  if (
    caminhos_livres.includes(caminho) ||
    caminho.startsWith("/_next/") ||
    caminho === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const cookie_token = requisicao.cookies.get("token_autenticacao")?.value;

  if (!cookie_token) {
    const url_login = new URL("/auth", requisicao.url);
    return NextResponse.redirect(url_login);
  }

  try {
    await validar_token(cookie_token);
    return NextResponse.next();
  } catch {
    const url_login = new URL("/auth", requisicao.url);
    return NextResponse.redirect(url_login);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

