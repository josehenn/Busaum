import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { pontoService } from "@/server/pontos";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** GET /api/pontos?busca=praça&status=ATIVO */
export const GET = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const params = new URL(request.url).searchParams;
  return NextResponse.json(
    await pontoService.listar({
      busca: params.get("busca") ?? undefined,
      status: params.get("status") ?? undefined,
    }),
  );
});

export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const ponto = await pontoService.criar(await lerJson(request), usuario.id);
  return NextResponse.json(ponto, { status: 201 });
});
