// O que o aluno informa sobre cada viagem. Declarar é opcional e, em dia
// contratado, nunca muda a conta (docs/modelagem.md): serve para a operação
// saber quantos vão e por onde passar.
//
// Uma única ação — "vou na ida? vou na volta?" — cobre os quatro casos:
//   dia contratado:      ida+volta = padrão (desfaz o aviso) | um trecho | nenhum (ausência)
//   dia não contratado:  nenhum = padrão (desfaz o avulso)   | um ou dois trechos (avulso, paga a diária)
import { z } from "zod";
import { OrigemDeclaracao, StatusViagem } from "@/lib/generated/prisma/enums";
import { dataIso, formatarDataHora, hojeLocal, horarioLocal, somarDias } from "@/lib/datas";
import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IPlanoRepository } from "@/server/planos/plano.repository";
import { calcularEsperados, diaContratado, planoVigenteNaViagem } from "@/server/viagens/esperados";
import { HORIZONTE_DIAS } from "@/server/viagens/viagem.service";
import type { IViagemRepository } from "@/server/viagens/viagem.repository";
import type { IDeclaracaoRepository } from "./declaracao.repository";

const declararSchema = z.object({
  usaIda: z.boolean({ error: "Informe se vai na ida." }),
  usaVolta: z.boolean({ error: "Informe se vai na volta." }),
});

export type SituacaoNaViagem =
  | "VAI"
  | "SO_IDA"
  | "SO_VOLTA"
  | "AUSENTE"
  | "NAO_CONTRATADO"
  | "AVULSO"
  | "CANCELADA";

export type ViagemDoAlunoDTO = {
  id: string;
  data: string;
  rota: { id: string; nome: string };
  horarioIda: string;
  horarioVolta: string;
  prazoDeclaracao: string;
  prazoAberto: boolean;
  contratado: boolean;
  situacao: SituacaoNaViagem;
  usaIda: boolean;
  usaVolta: boolean;
  /** Lugares livres no trecho mais cheio — importa para o pedido avulso. */
  vagas: number;
  motivoCancelamento: string | null;
};

export class DeclaracaoService {
  constructor(
    private readonly declaracoes: IDeclaracaoRepository,
    private readonly viagens: IViagemRepository,
    private readonly planos: IPlanoRepository,
  ) {}

  /** Próximas viagens das rotas em que o aluno tem plano, com a situação dele em cada uma. */
  async listarProximas(alunoId: string, agora = new Date()): Promise<ViagemDoAlunoDTO[]> {
    const rotaIds = [...new Set((await this.planos.listarAbertosDoAluno(alunoId)).map((p) => p.rotaId))];
    if (rotaIds.length === 0) return [];

    const hoje = hojeLocal(agora);
    const ate = somarDias(hoje, HORIZONTE_DIAS);
    await this.viagens.gerar(hoje, ate, agora);
    const viagens = (await this.viagens.listar({ de: hoje, ate, rotaIds })).filter(
      (v) => v.horarioVolta > agora,
    );
    const [planos, declaracoes] = await Promise.all([
      this.viagens.listarPlanos(rotaIds, hoje, ate),
      this.viagens.listarDeclaracoes(viagens.map((v) => v.id)),
    ]);

    return viagens.flatMap((v): ViagemDoAlunoDTO[] => {
      const plano = planoVigenteNaViagem(planos, v, alunoId);
      if (!plano) return [];
      const contratado = diaContratado(plano, v);
      const minha = declaracoes.find((d) => d.viagemId === v.id && d.alunoId === alunoId && !d.canceladoEm);
      const usaIda = minha ? minha.usaIda : contratado;
      const usaVolta = minha ? minha.usaVolta : contratado;
      const { ida, volta } = calcularEsperados(v, planos, declaracoes);

      return [
        {
          id: v.id,
          data: dataIso(v.data),
          rota: { id: v.rota.id, nome: v.rota.nome },
          horarioIda: horarioLocal(v.horarioIda),
          horarioVolta: horarioLocal(v.horarioVolta),
          prazoDeclaracao: v.prazoDeclaracao.toISOString(),
          prazoAberto: v.status === StatusViagem.AGENDADA && agora <= v.prazoDeclaracao,
          contratado,
          situacao: situacao(v.status, contratado, usaIda, usaVolta),
          usaIda,
          usaVolta,
          vagas: Math.max(0, v.capacidade - Math.max(ida, volta)),
          motivoCancelamento: v.motivoCancelamento,
        },
      ];
    });
  }

  async declarar(alunoId: string, viagemId: string, entrada: unknown, agora = new Date()) {
    const { usaIda, usaVolta } = validar(declararSchema, entrada);

    const viagem = await this.viagens.buscarPorId(viagemId);
    if (!viagem) throw new ErroNaoEncontrado("Viagem não encontrada.");
    if (viagem.status !== StatusViagem.AGENDADA) {
      throw new ErroDeValidacao("Esta viagem não está mais aberta para avisos.");
    }
    // Prazo vale para os dois sentidos: avisar ausência e pedir avulso.
    if (agora > viagem.prazoDeclaracao) {
      throw new ErroDeValidacao(`O prazo para avisar terminou em ${formatarDataHora(viagem.prazoDeclaracao)}.`);
    }

    const planos = await this.viagens.listarPlanos([viagem.rotaId], viagem.data, viagem.data);
    const plano = planoVigenteNaViagem(planos, viagem, alunoId);
    if (!plano) throw new ErroDeValidacao("Você não tem plano nesta rota.");

    const contratado = diaContratado(plano, viagem);
    const atual = await this.declaracoes.buscar(viagemId, alunoId);
    const ehPadrao = contratado ? usaIda && usaVolta : !usaIda && !usaVolta;

    if (ehPadrao) {
      // Voltar ao padrão é desfazer o aviso (ou o pedido avulso).
      if (atual && !atual.canceladoEm) await this.declaracoes.desfazer(atual.id, agora);
      return;
    }

    if (!contratado) await this.garantirVagaAvulsa(viagem, planos, alunoId, { usaIda, usaVolta });

    await this.declaracoes.salvar({
      viagemId,
      alunoId,
      usaIda,
      usaVolta,
      origem: OrigemDeclaracao.ALUNO,
      em: agora,
    });
  }

  /**
   * Avulso respeita a lotação da viagem concreta: esperados do dia (sem contar
   * o próprio aluno) contra a capacidade do veículo do dia, trecho a trecho.
   */
  private async garantirVagaAvulsa(
    viagem: Parameters<typeof calcularEsperados>[0] & { capacidade: number },
    planos: Parameters<typeof calcularEsperados>[1],
    alunoId: string,
    pedido: { usaIda: boolean; usaVolta: boolean },
  ) {
    const declaracoes = (await this.viagens.listarDeclaracoes([viagem.id])).filter((d) => d.alunoId !== alunoId);
    const { ida, volta } = calcularEsperados(viagem, planos, declaracoes);
    const semLugar = [pedido.usaIda && ida >= viagem.capacidade && "ida", pedido.usaVolta && volta >= viagem.capacidade && "volta"].filter(Boolean);
    if (semLugar.length > 0) {
      throw new ErroDeValidacao(`Não há lugar na ${semLugar.join(" nem na ")} desta viagem.`);
    }
  }
}

function situacao(status: StatusViagem, contratado: boolean, usaIda: boolean, usaVolta: boolean): SituacaoNaViagem {
  if (status === StatusViagem.CANCELADA) return "CANCELADA";
  if (!contratado) return usaIda || usaVolta ? "AVULSO" : "NAO_CONTRATADO";
  if (usaIda && usaVolta) return "VAI";
  if (usaIda) return "SO_IDA";
  if (usaVolta) return "SO_VOLTA";
  return "AUSENTE";
}
