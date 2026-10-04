import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { manipulador } from "@/server/comum/http";
import { mensalidadeService } from "@/server/mensalidades";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** GET /api/mensalidades?competencia=2026-09&status=ABERTA */
export const GET = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const params = new URL(request.url).searchParams;
  return NextResponse.json(
    await mensalidadeService.listar({
      competencia: params.get("competencia") ?? undefined,
      status: params.get("status") ?? undefined,
    }),
  );
});
