export type Administrador = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  /** Ainda com a senha provisória (não entrou e trocou). */
  trocarSenha: boolean;
  criadoEm: Date;
};

export interface IAdministradorRepository {
  listar(): Promise<Administrador[]>;
  buscarPorId(id: string): Promise<Administrador | null>;
  emailEmUso(email: string): Promise<boolean>;
  contarAtivos(): Promise<number>;
  /** Cria o usuário (perfil ADMIN) com a conta de senha, na mesma transação. */
  criar(dados: { nome: string; email: string; senhaHash: string }): Promise<Administrador>;
  redefinirSenha(id: string, senhaHash: string): Promise<void>;
  /** Desativar também encerra as sessões abertas. */
  definirAtivo(id: string, ativo: boolean): Promise<Administrador>;
}
