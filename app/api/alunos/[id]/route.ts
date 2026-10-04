import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { alunoService } from "@/server/alunos";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export const GET = manipulador(async (_request, ctx: RouteContext<"/api/alunos/[id]">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await alunoService.buscar(id));
});

// Sem DELETE: o aluno tem histórico de viagens e cobranças. Para tirar de
// circulação, PATCH { "status": "INATIVO" } — que também encerra os planos.
export const PATCH = manipulador(async (request, ctx: RouteContext<"/api/alunos/[id]">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await alunoService.atualizar(id, await lerJson(request)));
});
