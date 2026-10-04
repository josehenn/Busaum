import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { conviteService } from "@/server/convites";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export const GET = manipulador(async () => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  return NextResponse.json(await conviteService.listar());
});

/** POST { email? } → { convite, token }. O token só aparece aqui (o banco guarda o hash). */
export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const criado = await conviteService.criar(await lerJson(request), usuario.id);
  return NextResponse.json(criado, { status: 201, headers: { "Cache-Control": "no-store" } });
});
