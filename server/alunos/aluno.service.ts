// Regras de negócio de alunos. Depende de dois repositórios (alunos e
// instituições), ambos injetados pelo construtor.
import { StatusAluno } from "@/lib/generated/prisma/enums";
import type { ErrosPorCampo } from "@/lib/esquemas/erros";
import { ErroDeConflito, ErroNaoEncontrado } from "@/server/comum/erros";
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
import type { Aluno, IAlunoRepository, ReferenciaInstituicao } from "./aluno.repository";

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

  async criar(entrada: unknown, criadoPor: string): Promise<AlunoDTO> {
    const dados = validar(criarAlunoSchema, entrada);
    const instituicao = await this.resolverInstituicao(dados.instituicao);

    await this.garantirUnicidade({
      email: dados.email,
      cpf: dados.cpf,
      // Instituição nova ainda não tem alunos: não há matrícula para colidir.
      instituicaoId: "id" in instituicao ? instituicao.id : undefined,
      matricula: dados.matricula ?? undefined,
    });

    return paraAlunoDTO(await this.alunos.criar({ ...dados, instituicao, criadoPor }));
  }

  async atualizar(id: string, entrada: unknown): Promise<AlunoDTO> {
    const atual = await this.obter(id);
    const dados = validar(atualizarAlunoSchema, entrada);

    const instituicao = dados.instituicao
      ? await this.resolverInstituicao(dados.instituicao)
      : { id: atual.instituicaoId };
    const instituicaoId = "id" in instituicao ? instituicao.id : undefined;
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

    const atualizado = await this.alunos.atualizar(
      id,
      { ...dados, instituicao: instituicaoId === atual.instituicaoId ? undefined : instituicao },
      { encerrarPlanosEm: saiuDeAtivo ? new Date() : undefined },
    );
    return paraAlunoDTO(atualizado);
  }

  // ---------------------------------------------------------------- Regras

  private async obter(id: string): Promise<Aluno> {
    const aluno = await this.alunos.buscarPorId(id);
    if (!aluno) throw new ErroNaoEncontrado("Aluno não encontrado.");
    return aluno;
  }

  /**
   * O campo instituição é texto livre. Se bate com o nome ou a sigla de uma já
   * cadastrada (sem diferenciar maiúsculas), vincula a ela — "urs" e
   * "Universidade Regional do Sul" são a mesma. Senão, é uma instituição nova,
   * criada pelo repositório na mesma transação do aluno.
   */
  private async resolverInstituicao(texto: string): Promise<ReferenciaInstituicao> {
    const existente = await this.instituicoes.buscarPorNomeOuSigla(texto);
    return existente ? { id: existente.id } : { nome: texto };
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
