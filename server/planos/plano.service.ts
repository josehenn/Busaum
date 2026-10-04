// Contratação do transporte: o aluno escolhe os dias da semana e os pontos.
// É aqui — e só aqui — que a lotação é travada (docs/modelagem.md): depois que
// o plano existe, o aluno está garantido em toda viagem daqueles dias.
import { StatusAluno } from "@/lib/generated/prisma/enums";
import { nomeDiaLongo } from "@/lib/datas";
import { contratarPlanoSchema } from "@/lib/esquemas/rota";
import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IAlunoRepository } from "@/server/alunos/aluno.repository";
import type { IRotaRepository } from "@/server/rotas/rota.repository";
import { contarPorDia } from "./ocupacao";
import type { IPlanoRepository, Plano } from "./plano.repository";

export type PlanoDTO = {
  id: string;
  aluno: { id: string; nome: string };
  rota: { id: string; nome: string };
  pontoEmbarque: { id: string; descricao: string };
  pontoDestino: { id: string; descricao: string };
  /** Já resolvido: nulo no banco significa "volta para o embarque". */
  pontoRetorno: { id: string; descricao: string };
  retornoNoEmbarque: boolean;
  diasSemana: number[];
  vigenteDe: string;
};

/** Único lugar que resolve "retorno em branco = volta para onde subiu". */
export function paraPlanoDTO(plano: Plano): PlanoDTO {
  return {
    id: plano.id,
    aluno: { id: plano.aluno.id, nome: plano.aluno.nome },
    rota: plano.rota,
    pontoEmbarque: plano.pontoEmbarque,
    pontoDestino: plano.pontoDestino,
    pontoRetorno: plano.pontoRetorno ?? plano.pontoEmbarque,
    retornoNoEmbarque: plano.pontoRetorno === null,
    diasSemana: plano.diasSemana,
    vigenteDe: plano.vigenteDe.toISOString(),
  };
}

export class PlanoService {
  constructor(
    private readonly planos: IPlanoRepository,
    private readonly rotas: IRotaRepository,
    private readonly alunos: IAlunoRepository,
  ) {}

  async listarDaRota(rotaId: string): Promise<PlanoDTO[]> {
    return (await this.planos.listarAbertosDaRota(rotaId)).map(paraPlanoDTO);
  }

  async listarDoAluno(alunoId: string): Promise<PlanoDTO[]> {
    return (await this.planos.listarAbertosDoAluno(alunoId)).map(paraPlanoDTO);
  }

  async buscarAberto(alunoId: string, rotaId: string): Promise<PlanoDTO | null> {
    const plano = await this.planos.buscarAberto(alunoId, rotaId);
    return plano && paraPlanoDTO(plano);
  }

  /**
   * Contrata — ou troca, se o aluno já tem plano nesta rota. A troca nunca
   * edita o plano antigo: fecha a vigência dele agora e abre a do novo no mesmo
   * instante, para o fechamento do mês saber qual valia em cada dia.
   */
  async contratar(entrada: unknown, criadoPor: string): Promise<PlanoDTO> {
    const dados = validar(contratarPlanoSchema, entrada);

    const aluno = await this.alunos.buscarPorId(dados.alunoId);
    if (!aluno) throw new ErroDeValidacao("Aluno não encontrado.", { alunoId: ["Escolha um aluno da lista."] });
    if (aluno.status !== StatusAluno.ATIVO) {
      throw new ErroDeValidacao("Só aluno ativo pode contratar transporte.", {
        alunoId: ["Aluno inativo ou trancado."],
      });
    }

    const rota = await this.rotas.buscarPorId(dados.rotaId);
    if (!rota) throw new ErroNaoEncontrado("Rota não encontrada.");
    if (!rota.ativa) throw new ErroDeValidacao("A rota está inativa.");

    // Junta os erros de pontos e de dias para o formulário mostrar tudo de uma vez.
    const erros = this.errosDePontos(rota.pontos.map((p) => p.id), dados);
    const foraDaOperacao = dados.diasSemana.filter((d) => !rota.diasOperacao.includes(d));
    if (foraDaOperacao.length > 0) {
      erros.diasSemana = [`A rota não roda ${foraDaOperacao.map((d) => nomeDiaLongo[d]).join(", ")}.`];
    }
    if (Object.keys(erros).length > 0) {
      throw new ErroDeValidacao("Revise os pontos e os dias do plano.", erros);
    }

    const atual = await this.planos.buscarAberto(dados.alunoId, dados.rotaId);
    await this.garantirLotacao(dados.rotaId, dados.diasSemana, rota.veiculo.capacidade, atual?.id);

    const plano = await this.planos.criar(
      { ...dados, pontoRetornoId: dados.pontoRetornoId ?? null, criadoPor },
      new Date(),
      atual?.id,
    );
    return paraPlanoDTO(plano);
  }

  async encerrar(id: string): Promise<PlanoDTO> {
    const plano = await this.planos.buscarPorId(id);
    if (!plano) throw new ErroNaoEncontrado("Plano não encontrado.");
    if (plano.vigenteAte) throw new ErroDeValidacao("Este plano já foi encerrado.");
    return paraPlanoDTO(await this.planos.encerrar(id, new Date()));
  }

  // ---------------------------------------------------------------- Regras

  /**
   * O banco garante que o ponto existe, não que a rota passa por ele. E o
   * trajeto tem sentido: desce depois de subir; na volta (lista ao contrário),
   * sobe no destino e desce no retorno, que precisa vir antes do destino.
   */
  private errosDePontos(
    trajeto: string[],
    dados: { pontoEmbarqueId: string; pontoDestinoId: string; pontoRetornoId?: string | null },
  ) {
    const ordem = new Map(trajeto.map((id, i) => [id, i]));
    const embarque = ordem.get(dados.pontoEmbarqueId);
    const destino = ordem.get(dados.pontoDestinoId);
    const foraDaRota = ["Este ponto não está no trajeto da rota."];

    const erros: Record<string, string[]> = {};
    if (embarque === undefined) erros.pontoEmbarqueId = foraDaRota;
    if (destino === undefined) erros.pontoDestinoId = foraDaRota;
    if (embarque !== undefined && destino !== undefined && destino <= embarque) {
      erros.pontoDestinoId = ["O destino precisa vir depois do embarque no trajeto de ida."];
    }
    // Retorno em branco é o embarque — já validado acima. Só confere o que foi escolhido.
    if (dados.pontoRetornoId) {
      const retorno = ordem.get(dados.pontoRetornoId);
      if (retorno === undefined) erros.pontoRetornoId = foraDaRota;
      else if (destino !== undefined && retorno >= destino) {
        erros.pontoRetornoId = ["Na volta, o aluno precisa descer antes do ponto onde sobe (o destino)."];
      }
    }
    return erros;
  }

  /**
   * Para cada dia pedido, conta os planos em vigor que já cobrem aquele dia —
   * sem contar o plano atual do próprio aluno, que vai ser substituído. A
   * recusa é por dia ("terça está lotada"), não da rota inteira.
   */
  private async garantirLotacao(rotaId: string, dias: number[], capacidade: number, ignorarPlanoId?: string) {
    const outros = (await this.planos.listarAbertosDaRota(rotaId)).filter((p) => p.id !== ignorarPlanoId);
    const porDia = contarPorDia(outros, dias);
    const lotados = dias.filter((d) => porDia[d] >= capacidade);
    if (lotados.length > 0) {
      const nomes = lotados.map((d) => nomeDiaLongo[d]).join(", ");
      throw new ErroDeValidacao(`Sem lugar: ${nomes} já está lotada (${capacidade} lugares).`, {
        diasSemana: [`Lotado: ${nomes}.`],
      });
    }
  }
}
