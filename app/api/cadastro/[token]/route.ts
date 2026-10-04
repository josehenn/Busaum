// Rota pública: o próprio convite é a autorização (token de 256 bits, uso único,
// com validade). Depois do cadastro, a tela faz o login normal pelo /api/auth.
import { NextResponse } from "next/server";
import { lerJson, manipulador } from "@/server/comum/http";
import { conviteService } from "@/server/convites";

export const POST = manipulador(async (request, ctx: RouteContext<"/api/cadastro/[token]">) => {
  const { token } = await ctx.params;
  const aluno = await conviteService.cadastrar(token, await lerJson(request));
  return NextResponse.json({ email: aluno.email }, { status: 201 });
});
