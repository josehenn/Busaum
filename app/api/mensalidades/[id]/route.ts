import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { ErroDeAcesso } from "@/server/comum/erros";
import { manipulador } from "@/server/comum/http";
import { mensalidadeService } from "@/server/mensalidades";
import { obterUsuarioAtual } from "@/server/sessao/sessao.service";

/** Admin vê qualquer uma; aluno só as próprias (as dos outros respondem 404). */
export const GET = manipulador(async (_request, ctx: RouteContext<"/api/mensalidades/[id]">) => {
  const usuario = await obterUsuarioAtual();
  if (!usuario) throw new ErroDeAcesso("Entre no sistema.");
  const { id } = await ctx.params;
  const alunoId = usuario.perfil === PerfilUsuario.ADMIN ? undefined : usuario.alunoId!;
  return NextResponse.json(await mensalidadeService.detalhar(id, alunoId));
});
