import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { formatarCompetencia } from "@/lib/datas";
import { lerJson, manipulador } from "@/server/comum/http";
import { mensalidadeService } from "@/server/mensalidades";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** POST { competencia: "2026-09" } — apura o mês e gera as mensalidades. */
export const POST = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const resultado = await mensalidadeService.fechar(await lerJson(request));
  return NextResponse.json(
    {
      ...resultado,
      mensagem: `${formatarCompetencia(resultado.competencia)} fechada: ${resultado.mensalidades} mensalidade(s) gerada(s).`,
    },
    { status: 201 },
  );
});
