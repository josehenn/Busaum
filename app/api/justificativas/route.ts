import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { manipulador } from "@/server/comum/http";
import { justificativaService } from "@/server/justificativas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** GET /api/justificativas?status=PENDENTE&busca=ana */
export const GET = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const params = new URL(request.url).searchParams;
  return NextResponse.json(
    await justificativaService.listar({
      busca: params.get("busca") ?? undefined,
      status: params.get("status") ?? undefined,
    }),
  );
});
