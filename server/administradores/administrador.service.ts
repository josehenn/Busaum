// Contas de administrador. Um admin cria outro com senha provisória (troca
// obrigatória no 1º acesso), redefine a senha e desativa quem saiu. Duas
// travas: ninguém desativa a si mesmo, e sempre sobra ao menos um admin ativo.
import { criarAdministradorSchema, definirAtivoSchema } from "@/lib/esquemas/administrador";
import { gerarSenhaProvisoria, hashSenha } from "@/server/auth/credenciais";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { Administrador, IAdministradorRepository } from "./administrador.repository";

export type AdministradorDTO = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  aguardandoPrimeiroAcesso: boolean;
  criadoEm: string;
};

function paraDTO(a: Administrador): AdministradorDTO {
  return {
    id: a.id,
    nome: a.nome,
    email: a.email,
    ativo: a.ativo,
    aguardandoPrimeiroAcesso: a.trocarSenha,
    criadoEm: a.criadoEm.toISOString(),
  };
}

export class AdministradorService {
  constructor(private readonly administradores: IAdministradorRepository) {}

  async listar(): Promise<AdministradorDTO[]> {
    return (await this.administradores.listar()).map(paraDTO);
  }

  /** A senha provisória volta só aqui (o banco guarda o hash). */
  async criar(entrada: unknown): Promise<{ administrador: AdministradorDTO; senhaProvisoria: string }> {
    const dados = validar(criarAdministradorSchema, entrada);
    if (await this.administradores.emailEmUso(dados.email)) {
      throw new ErroDeConflito("Este e-mail já está em uso.", { email: ["Este e-mail já está em uso."] });
    }
    const senhaProvisoria = gerarSenhaProvisoria();
    const administrador = await this.administradores.criar({
      ...dados,
      senhaHash: await hashSenha(senhaProvisoria),
    });
    return { administrador: paraDTO(administrador), senhaProvisoria };
  }

  async redefinirSenha(id: string, quemPede: string): Promise<{ senhaProvisoria: string }> {
    await this.obter(id);
    if (id === quemPede) {
      throw new ErroDeValidacao("Para trocar a sua própria senha, use Senha, no topo da tela.");
    }
    const senhaProvisoria = gerarSenhaProvisoria();
    await this.administradores.redefinirSenha(id, await hashSenha(senhaProvisoria));
    return { senhaProvisoria };
  }

  async definirAtivo(id: string, entrada: unknown, quemPede: string): Promise<AdministradorDTO> {
    const { ativo } = validar(definirAtivoSchema, entrada);
    const atual = await this.obter(id);
    if (!ativo && atual.ativo) {
      if (id === quemPede) throw new ErroDeValidacao("Você não pode desativar a sua própria conta.");
      if ((await this.administradores.contarAtivos()) <= 1) {
        throw new ErroDeValidacao("É preciso manter ao menos um administrador ativo.");
      }
    }
    return paraDTO(await this.administradores.definirAtivo(id, ativo));
  }

  private async obter(id: string) {
    const administrador = await this.administradores.buscarPorId(id);
    if (!administrador) throw new ErroNaoEncontrado("Administrador não encontrado.");
    return administrador;
  }
}
