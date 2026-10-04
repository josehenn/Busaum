// Regras de negócio de alunos. Depende de dois repositórios (alunos e
// instituições), ambos injetados pelo construtor.
import { StatusAluno } from "@/lib/generated/prisma/enums";
import type { CriarAlunoDTO } from "@/lib/esquemas/aluno";
import type { ErrosPorCampo } from "@/lib/esquemas/erros";
import { gerarSenhaProvisoria, hashSenha } from "@/server/auth/credenciais";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IInstituicaoRepository } from "@/server/instituicoes/instituicao.repository";
import {
  atualizarAlunoSchema,
  criarAlunoSchema,
  filtroAlunosSchema,
  paraAlunoDTO,
  paraAlunoEdicaoDTO,
  type AlunoDTO,
  type AlunoEdicaoDTO,
} from "./aluno.dto";
import type { Aluno, IAlunoRepository } from "./aluno.repository";

export type AlunoCriadoDTO = { aluno: AlunoDTO; senhaProvisoria: string };

export class AlunoService {
  constructor(
    private readonly alunos: IAlunoRepository,
    private readonly instituicoes: IInstituicaoRepository,
  ) {}

  async listar(filtro: unknown = {}): Promise<AlunoDTO[]> {
    const lista = await this.alunos.listar(filtroAlunosSchema.parse(filtro));
    return lista.map(paraAlunoDTO);
  }

  async buscar(id: string): Promise<AlunoDTO> {
    return paraAlunoDTO(await this.obter(id));
  }

  /** Só para o formulário de edição do admin: inclui o telefone. */
  async buscarParaEdicao(id: string): Promise<AlunoEdicaoDTO> {
    return paraAlunoEdicaoDTO(await this.obter(id));
  }

  /**
   * Cadastro pelo admin: o aluno nasce com uma senha provisória, devolvida só
   * aqui (o banco guarda o hash). No primeiro acesso ele é obrigado a trocá-la.
   */
  async criar(entrada: unknown, criadoPor: string): Promise<AlunoCriadoDTO> {
    const dados = validar(criarAlunoSchema, entrada);
    await this.conferirNovoAluno(dados);

    const senhaProvisoria = gerarSenhaProvisoria();
    const aluno = await this.alunos.criar({
      ...dados,
      criadoPor,
      senhaHash: await hashSenha(senhaProvisoria),
      trocarSenha: true,
    });
    return { aluno: paraAlunoDTO(aluno), senhaProvisoria };
  }

  /** Aluno esqueceu a senha: gera outra provisória e derruba as sessões abertas. */
  async redefinirSenha(id: string): Promise<{ senhaProvisoria: string }> {
    const aluno = await this.obter(id);
    const senhaProvisoria = gerarSenhaProvisoria();
    await this.alunos.redefinirSenha(aluno.usuarioId, await hashSenha(senhaProvisoria));
    return { senhaProvisoria };
  }

  /**
   * Regras de um aluno novo (instituição existe; e-mail, CPF e matrícula livres).
   * Pública porque o autocadastro por convite cria aluno pelo mesmo caminho.
   */
  async conferirNovoAluno(dados: CriarAlunoDTO) {
    await this.garantirInstituicao(dados.instituicaoId);
    await this.garantirUnicidade({
      email: dados.email,
      cpf: dados.cpf,
      instituicaoId: dados.instituicaoId,
      matricula: dados.matricula ?? undefined,
    });
  }

  async atualizar(id: string, entrada: unknown): Promise<AlunoDTO> {
    const atual = await this.obter(id);
    const dados = validar(atualizarAlunoSchema, entrada);

    if (dados.instituicaoId && dados.instituicaoId !== atual.instituicaoId) {
      await this.garantirInstituicao(dados.instituicaoId);
    }
    const instituicaoId = dados.instituicaoId ?? atual.instituicaoId;
    // undefined = não veio no PATCH (mantém); null = apagou a matrícula.
    const matricula = dados.matricula !== undefined ? dados.matricula : atual.matricula;
    const mudouMatricula =
      matricula !== null &&
      (instituicaoId !== atual.instituicaoId || matricula !== atual.matricula);

    await this.garantirUnicidade(
      {
        email: dados.email !== atual.usuario.email ? dados.email : undefined,
        instituicaoId: mudouMatricula ? instituicaoId : undefined,
        matricula: mudouMatricula ? matricula : undefined,
      },
      atual,
    );

    // Saiu de ATIVO (inativou ou trancou): os planos em vigor são encerrados
    // agora, para o aluno deixar de ocupar lugar na lotação das rotas.
    const saiuDeAtivo =
      dados.status !== undefined &&
      dados.status !== StatusAluno.ATIVO &&
      atual.status === StatusAluno.ATIVO;

    const atualizado = await this.alunos.atualizar(id, dados, {
      encerrarPlanosEm: saiuDeAtivo ? new Date() : undefined,
    });
    return paraAlunoDTO(atualizado);
  }

  // ---------------------------------------------------------------- Regras

  private async obter(id: string): Promise<Aluno> {
    const aluno = await this.alunos.buscarPorId(id);
    if (!aluno) throw new ErroNaoEncontrado("Aluno não encontrado.");
    return aluno;
  }

  private async garantirInstituicao(id: string) {
    if (!(await this.instituicoes.buscarPorId(id))) {
      throw new ErroDeValidacao("Instituição não encontrada.", {
        instituicaoId: ["Escolha uma instituição da lista."],
      });
    }
  }

  /**
   * E-mail e CPF únicos no sistema; matrícula, quando informada, única dentro da
   * instituição.
   * Confere tudo antes de responder, para o formulário mostrar todos os
   * conflitos de uma vez. `atual` é o próprio aluno, que não conflita consigo.
   */
  private async garantirUnicidade(
    valores: { email?: string; cpf?: string; instituicaoId?: string; matricula?: string },
    atual?: Aluno,
  ) {
    const conflitos: ErrosPorCampo = {};

    if (valores.email) {
      const id = await this.alunos.idDoUsuarioComEmail(valores.email);
      if (id && id !== atual?.usuarioId) conflitos.email = ["Este e-mail já está em uso."];
    }
    if (valores.cpf) {
      const id = await this.alunos.idDoAlunoComCpf(valores.cpf);
      if (id && id !== atual?.id) conflitos.cpf = ["Este CPF já está cadastrado."];
    }
    if (valores.instituicaoId && valores.matricula) {
      const id = await this.alunos.idDoAlunoComMatricula(valores.instituicaoId, valores.matricula);
      if (id && id !== atual?.id) {
        conflitos.matricula = ["Esta matrícula já está cadastrada nesta instituição."];
      }
    }

    if (Object.keys(conflitos).length > 0) {
      throw new ErroDeConflito("Já existe um cadastro com estes dados.", conflitos);
    }
  }
}
