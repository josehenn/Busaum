import { z } from "zod";
import { textoObrigatorio } from "./comum";

export const LIMITES_INSTITUICAO = { nomeMin: 2, nomeMax: 120 } as const;

/** Cadastro rápido pelo modal dos formulários: só o nome. */
export const criarInstituicaoSchema = z.object({
  nome: textoObrigatorio("nome", LIMITES_INSTITUICAO.nomeMin, LIMITES_INSTITUICAO.nomeMax),
});

export type CriarInstituicaoDTO = z.output<typeof criarInstituicaoSchema>;
