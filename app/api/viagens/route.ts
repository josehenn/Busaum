import { NextResponse } from "next/server";
import { z } from "zod";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { dataIso, hojeLocal } from "@/lib/datas";
import { manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";
import { viagemService } from "@/server/viagens";

/** GET /api/viagens?dia=2026-10-05 — viagens do dia com a contagem de esperados. */
export const GET = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const dia = z.iso
    .date()
    .catch(dataIso(hojeLocal()))
    .parse(new URL(request.url).searchParams.get("dia") ?? undefined);
  return NextResponse.json(await viagemService.listarDoDia(dia));
});
