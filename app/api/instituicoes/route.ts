import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { instituicaoService } from "@/server/instituicoes";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export const GET = manipulador(async () => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  return NextResponse.json(await instituicaoService.listar());
});

/** POST { nome } — cadastro rápido, usado pelo modal dos formulários. */
export const POST = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const instituicao = await instituicaoService.criar(await lerJson(request));
  return NextResponse.json(instituicao, { status: 201 });
});
