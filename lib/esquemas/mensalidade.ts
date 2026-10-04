import { z } from "zod";
import { StatusMensalidade } from "@/lib/generated/prisma/enums";
import { dinheiroComSinal, textoOpcional } from "./comum";

export const fecharCompetenciaSchema = z.object({
  competencia: z
    .string({ error: "Escolha o mês." })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido (use AAAA-MM)."),
});

/** Ajuste assinado: vazio remove o ajuste; com valor, o motivo é obrigatório. */
export const ajustarMensalidadeSchema = z
  .object({
    ajuste: dinheiroComSinal,
    motivo: textoOpcional("motivo", 300),
  })
  .superRefine((dados, ctx) => {
    if (dados.ajuste !== null && !dados.motivo) {
      ctx.addIssue({ code: "custom", path: ["motivo"], message: "Informe o motivo do ajuste." });
    }
  });

export const filtroMensalidadesSchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/).optional().catch(undefined),
  status: z.enum(StatusMensalidade).optional().catch(undefined),
});
