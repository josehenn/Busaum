// Convites de autocadastro. O token só existe no link entregue ao admin; o banco
// guarda o SHA-256 dele, então nem quem lê o banco consegue usar um convite.
import { createHash, randomBytes } from "node:crypto";
import { cadastroPorConviteSchema, criarConviteSchema, VALIDADE_CONVITE_DIAS } from "@/lib/esquemas/convite";
import { hojeLocal, UM_DIA_MS } from "@/lib/datas";
import { hashSenha } from "@/server/auth/credenciais";
import type { AlunoService } from "@/server/alunos/aluno.service";
import { paraAlunoDTO, type AlunoDTO } from "@/server/alunos/aluno.dto";
import { ErroDeConflito, ErroDeValidacao, ErroExpirado, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { Convite, IConviteRepository } from "./convite.repository";

export type SituacaoConvite = "PENDENTE" | "USADO" | "EXPIRADO" | "REVOGADO";

export type ConviteDTO = {
  id: string;
  email: string | null;
  situacao: SituacaoConvite;
  expiraEm: string;
  criadoEm: string;
  usadoEm: string | null;
  aluno: { id: string; nome: string } | null;
};

/** Mesma mensagem para inválido, vencido, usado e revogado: não dá pista a quem tenta adivinhar. */
const CONVITE_INDISPONIVEL = "Este convite não é válido. Peça um novo link à administração.";

export function hashDoToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function situacao(convite: Convite, agora: Date): SituacaoConvite {
  if (convite.usadoEm) return "USADO";
  if (convite.revogadoEm) return "REVOGADO";
  if (convite.expiraEm <= agora) return "EXPIRADO";
  return "PENDENTE";
}

function paraDTO(convite: Convite, agora = new Date()): ConviteDTO {
  return {
    id: convite.id,
    email: convite.email,
    situacao: situacao(convite, agora),
    expiraEm: convite.expiraEm.toISOString(),
    criadoEm: convite.criadoEm.toISOString(),
    usadoEm: convite.usadoEm?.toISOString() ?? null,
    aluno: convite.aluno,
  };
}

export class ConviteService {
  constructor(
    private readonly convites: IConviteRepository,
    private readonly alunos: AlunoService,
  ) {}

  async listar(): Promise<ConviteDTO[]> {
    const agora = new Date();
    return (await this.convites.listar()).map((c) => paraDTO(c, agora));
  }

  /** Devolve o token em claro uma única vez — é ele que vai no link. */
  async criar(entrada: unknown, criadoPor: string): Promise<{ convite: ConviteDTO; token: string }> {
    const { email } = validar(criarConviteSchema, entrada);
    const token = randomBytes(32).toString("base64url"); // 256 bits
    const convite = await this.convites.criar({
      tokenHash: hashDoToken(token),
      email: email ?? null,
      expiraEm: new Date(Date.now() + VALIDADE_CONVITE_DIAS * UM_DIA_MS),
      criadoPor,
    });
    return { convite: paraDTO(convite), token };
  }

  async revogar(id: string): Promise<ConviteDTO> {
    const convite = await this.convites.buscarPorId(id);
    if (!convite) throw new ErroNaoEncontrado("Convite não encontrado.");
    if (convite.usadoEm) throw new ErroDeConflito("Este convite já foi usado.");
    await this.convites.revogar(id, new Date());
    return paraDTO((await this.convites.buscarPorId(id))!);
  }

  /** Para a página pública: o convite vale? Se tiver e-mail fixo, qual. */
  async verificar(token: string): Promise<{ email: string | null }> {
    const convite = await this.pendente(token);
    return { email: convite.email };
  }

  /** Autocadastro: cria usuário, senha (já definitiva) e aluno, e queima o convite. */
  async cadastrar(token: string, entrada: unknown): Promise<AlunoDTO> {
    const convite = await this.pendente(token);
    const { nome, email, cpf, telefone, instituicaoId, matricula, curso, turno, senha } = validar(
      cadastroPorConviteSchema,
      entrada,
    );
    const dados = { nome, email, cpf, telefone, instituicaoId, matricula, curso, turno };

    if (convite.email && dados.email !== convite.email) {
      throw new ErroDeValidacao("Use o e-mail para o qual o convite foi enviado.", {
        email: [`Este convite é para ${convite.email}.`],
      });
    }
    const aluno = { ...dados, inicioEm: hojeLocal() };
    await this.alunos.conferirNovoAluno(aluno);

    const criado = await this.convites.usarECriarAluno(convite.id, new Date(), {
      ...aluno,
      criadoPor: convite.criadoPor,
      senhaHash: await hashSenha(senha),
      trocarSenha: false,
    });
    if (!criado) throw new ErroExpirado(CONVITE_INDISPONIVEL);
    return paraAlunoDTO(criado);
  }

  private async pendente(token: string) {
    const convite = token ? await this.convites.buscarPorTokenHash(hashDoToken(token)) : null;
    if (!convite || situacao(convite, new Date()) !== "PENDENTE") {
      throw new ErroExpirado(CONVITE_INDISPONIVEL);
    }
    return convite;
  }
}
