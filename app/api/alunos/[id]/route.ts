import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { alunoService } from "@/server/alunos";
import { lerJson, responderErro } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export async function GET(_request: Request, ctx: RouteContext<"/api/alunos/[id]">) {
  try {
    await exigirPerfilNaApi(PerfilUsuario.ADMIN);
    const { id } = await ctx.params;
    return NextResponse.json(await alunoService.buscar(id));
  } catch (erro) {
    return responderErro(erro);
  }
}

// Sem DELETE: o aluno tem histórico de viagens e cobranças. Para tirar de
// circulação, PATCH { "status": "INATIVO" } — que também encerra os planos.
export async function PATCH(request: Request, ctx: RouteContext<"/api/alunos/[id]">) {
  try {
    await exigirPerfilNaApi(PerfilUsuario.ADMIN);
    const { id } = await ctx.params;
    return NextResponse.json(await alunoService.atualizar(id, await lerJson(request)));
  } catch (erro) {
    return responderErro(erro);
  }
}
