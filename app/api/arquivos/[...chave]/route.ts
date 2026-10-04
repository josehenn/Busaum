// Serve os anexos com controle de acesso — nenhum anexo tem URL pública.
// Admin vê todos; aluno só os das próprias justificativas.
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { storageService, urlDoArquivo } from "@/server/arquivos";
import { ErroDeAcesso, ErroNaoEncontrado } from "@/server/comum/erros";
import { manipulador } from "@/server/comum/http";
import { justificativaService } from "@/server/justificativas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export const GET = manipulador(async (_request, ctx: RouteContext<"/api/arquivos/[...chave]">) => {
  // Sem perfil fixo: admin e aluno passam; a regra de quem vê o quê vem abaixo.
  const usuario = await exigirPerfilNaApi();

  const chave = (await ctx.params).chave.join("/");
  if (
    usuario.perfil !== PerfilUsuario.ADMIN &&
    !(await justificativaService.alunoPodeVerAnexo(urlDoArquivo(chave), usuario.alunoId!))
  ) {
    throw new ErroDeAcesso("Você não tem acesso a este arquivo.");
  }

  const arquivo = await storageService.abrir(chave);
  if (!arquivo) throw new ErroNaoEncontrado("Arquivo não encontrado.");
  return new Response(arquivo.corpo as BodyInit, {
    headers: {
      "Content-Type": arquivo.tipo,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
