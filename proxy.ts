// Checagem otimista: sem o cookie de sessão, nem renderiza as áreas logadas.
// Só olha se o cookie existe (não consulta o banco, roda em toda navegação); a
// validação de verdade fica em server/sessao/sessao.service.ts, nas páginas e
// em cada Route Handler. A API fica de fora: responde 401 em JSON.
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request, { cookiePrefix: "busaum" })) {
    const login = new URL("/login", request.url);
    login.searchParams.set("proxima", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/aluno/:path*", "/conta/:path*"],
};
