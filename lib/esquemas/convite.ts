// Convite de autocadastro: o admin gera, o aluno usa o link para se cadastrar.
import { z } from "zod";
import { criarAlunoSchema, LIMITES_ALUNO } from "./aluno";
import { confirmacaoSenha, senhaNova } from "./senha";

export const VALIDADE_CONVITE_DIAS = 7;

/** E-mail opcional: preenchido, só esse e-mail consegue usar o convite. */
export const criarConviteSchema = z.object({
  email: z
    .string({ error: "E-mail inválido." })
    .trim()
    .toLowerCase()
    .max(LIMITES_ALUNO.emailMax, `O e-mail pode ter no máximo ${LIMITES_ALUNO.emailMax} caracteres.`)
    .pipe(z.union([z.literal(""), z.email("E-mail inválido.")]))
    .transform((valor) => (valor === "" ? null : valor))
    .nullish(),
});

/**
 * O aluno preenche os mesmos dados do cadastro pelo admin, menos o início no
 * transporte (é a data do cadastro), mais a senha.
 */
export const cadastroPorConviteSchema = criarAlunoSchema
  .omit({ inicioEm: true })
  .extend({
    senha: senhaNova,
    confirmacao: confirmacaoSenha,
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não conferem.",
    path: ["confirmacao"],
  });

export type CriarConviteDTO = z.output<typeof criarConviteSchema>;
export type CadastroPorConviteDTO = z.output<typeof cadastroPorConviteSchema>;
