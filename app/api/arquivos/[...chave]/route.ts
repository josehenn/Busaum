// Serve os anexos com controle de acesso — nenhum anexo tem URL pública.
// Admin vê todos; aluno só os das próprias justificativas.
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { storageService, urlDoArquivo } from "@/server/arquivos";
import { ErroDeAcesso, ErroNaoEncontrado } from "@/server/comum/erros";
import { manipulador } from "@/server/comum/http";
import { justificativaService } from "@/server/justificativas";
import { obterUsuarioAtual } from "@/server/sessao/sessao.service";

export const GET = manipulador(async (_request, ctx: RouteContext<"/api/arquivos/[...chave]">) => {
  const usuario = await obterUsuarioAtual();
  if (!usuario) throw new ErroDeAcesso("Entre no sistema para ver este arquivo.");

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
