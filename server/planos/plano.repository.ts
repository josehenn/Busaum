// Plano = contratação de um aluno numa rota: dias da semana e pontos. Não é
// editado no lugar: trocar fecha a versão atual (vigenteAte) e abre outra, para
// o fechamento do mês saber qual plano valia em cada dia.
import type { StatusAluno } from "@/lib/generated/prisma/enums";

export type Plano = {
  id: string;
  alunoId: string;
  rotaId: string;
  pontoEmbarqueId: string;
  pontoDestinoId: string;
  pontoRetornoId: string | null;
  diasSemana: number[];
  vigenteDe: Date;
  vigenteAte: Date | null;
  aluno: { id: string; nome: string; status: StatusAluno; instituicaoId: string };
  rota: { id: string; nome: string };
  pontoEmbarque: { id: string; descricao: string };
  pontoDestino: { id: string; descricao: string };
  pontoRetorno: { id: string; descricao: string } | null;
};

export type DadosNovoPlano = {
  alunoId: string;
  rotaId: string;
  pontoEmbarqueId: string;
  pontoDestinoId: string;
  pontoRetornoId: string | null;
  diasSemana: number[];
  criadoPor: string;
};

export interface IPlanoRepository {
  buscarPorId(id: string): Promise<Plano | null>;
  /** Plano em vigor (vigenteAte nulo) do aluno nesta rota, se houver. */
  buscarAberto(alunoId: string, rotaId: string): Promise<Plano | null>;
  listarAbertosDaRota(rotaId: string): Promise<Plano[]>;
  listarAbertosDoAluno(alunoId: string): Promise<Plano[]>;
  /**
   * Cria o plano começando em `inicio`. Se `encerrarId` vier, encerra esse plano
   * no mesmo instante, na mesma transação (troca de plano).
   */
  criar(dados: DadosNovoPlano, inicio: Date, encerrarId?: string): Promise<Plano>;
  encerrar(id: string, fim: Date): Promise<Plano>;
}
