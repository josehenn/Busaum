import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { alunoService } from "@/server/alunos";
import { manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** POST — redefine a senha do aluno: nova provisória (só nesta resposta) e sessões encerradas. */
export const POST = manipulador(async (_request, ctx: RouteContext<"/api/alunos/[id]/senha">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await alunoService.redefinirSenha(id), {
    headers: { "Cache-Control": "no-store" },
  });
});
