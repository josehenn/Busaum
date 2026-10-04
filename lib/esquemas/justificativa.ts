import { z } from "zod";
import { MotivoJustificativa, StatusJustificativa } from "@/lib/generated/prisma/enums";
import { idObrigatorio, textoObrigatorio, textoOpcional } from "./comum";

export const LIMITES_JUSTIFICATIVA = { descricaoMin: 5, descricaoMax: 500, observacaoMax: 500 } as const;

/** Campos de texto do envio. O anexo é validado à parte (erroDoAnexo). */
export const enviarJustificativaSchema = z.object({
  viagemId: idObrigatorio("Escolha a falta que quer justificar."),
  motivo: z.enum(MotivoJustificativa, { error: "Escolha o motivo." }),
  descricao: textoObrigatorio(
    "descrição",
    LIMITES_JUSTIFICATIVA.descricaoMin,
    LIMITES_JUSTIFICATIVA.descricaoMax,
    "a",
  ),
});

/** Recusar exige observação: o aluno precisa saber por quê. */
export const decidirJustificativaSchema = z
  .object({
    decisao: z.enum(["APROVAR", "RECUSAR"], { error: "Decisão inválida." }),
    observacao: textoOpcional("observação", LIMITES_JUSTIFICATIVA.observacaoMax, "a"),
  })
  .superRefine((dados, ctx) => {
    if (dados.decisao === "RECUSAR" && !dados.observacao) {
      ctx.addIssue({ code: "custom", path: ["observacao"], message: "Explique ao aluno o motivo da recusa." });
    }
  });

export const filtroJustificativasSchema = z.object({
  busca: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(StatusJustificativa).optional().catch(undefined),
});

export type FiltroJustificativas = z.output<typeof filtroJustificativasSchema>;
