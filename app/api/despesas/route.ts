import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerFormulario, manipulador } from "@/server/comum/http";
import { despesaService } from "@/server/despesas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** GET /api/despesas?mes=2026-09&categoria=COMBUSTIVEL */
export const GET = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const params = new URL(request.url).searchParams;
  return NextResponse.json(
    await despesaService.listar({
      mes: params.get("mes") ?? undefined,
      categoria: params.get("categoria") ?? undefined,
    }),
  );
});

/** POST multipart: categoria, descricao, valor, data, veiculoId e comprovante (opcional). */
export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { campos, arquivo } = await lerFormulario(request, "comprovante");
  const despesa = await despesaService.criar(campos, arquivo, usuario.id);
  return NextResponse.json(despesa, { status: 201 });
});
