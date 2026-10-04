// Cadastro de administradores: só nome e e-mail; a senha é provisória, gerada
// pelo sistema.
import { z } from "zod";
import { LIMITES_ALUNO } from "./aluno";
import { textoObrigatorio } from "./comum";

export const criarAdministradorSchema = z.object({
  nome: textoObrigatorio("nome", LIMITES_ALUNO.nomeMin, LIMITES_ALUNO.nomeMax),
  email: z
    .string({ error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .min(1, { error: "Informe o e-mail.", abort: true })
    .max(LIMITES_ALUNO.emailMax, `O e-mail pode ter no máximo ${LIMITES_ALUNO.emailMax} caracteres.`)
    .pipe(z.email("E-mail inválido.")),
});

export const definirAtivoSchema = z.object({
  ativo: z.boolean({ error: "Informe se o administrador fica ativo." }),
});

export type CriarAdministradorDTO = z.output<typeof criarAdministradorSchema>;
