// Falta justificada: o único jeito de um dia contratado não ser cobrado (além
// da viagem cancelada). Exige anexo e passa pela decisão do admin.
import { StatusJustificativa, StatusViagem, type MotivoJustificativa } from "@/lib/generated/prisma/enums";
import { dataIso, formatarCompetencia, competenciaDe, hojeLocal, somarDias } from "@/lib/datas";
import { erroDoAnexo } from "@/lib/esquemas/arquivo";
import {
  decidirJustificativaSchema,
  enviarJustificativaSchema,
  filtroJustificativasSchema,
} from "@/lib/esquemas/justificativa";
import type { IStorageService } from "@/server/arquivos/storage.service";
import { urlDoArquivo } from "@/server/arquivos/storage.service";
import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IMensalidadeRepository } from "@/server/mensalidades/mensalidade.repository";
import { diaContratado, planoVigenteNaViagem } from "@/server/viagens/esperados";
import type { IJustificativaRepository, Justificativa } from "./justificativa.repository";

/** Até quantos dias depois da viagem dá para justificar. */
export const JANELA_JUSTIFICATIVA_DIAS = 60;

export type JustificativaDTO = {
  id: string;
  motivo: MotivoJustificativa;
  descricao: string;
  anexoUrl: string;
  status: StatusJustificativa;
  observacaoDecisao: string | null;
  decididoEm: string | null;
  enviadaEm: string;
  aluno: { id: string; nome: string };
  viagem: { id: string; data: string; rota: string };
};

export type FaltaJustificavelDTO = { viagemId: string; data: string; rota: string; avisouAntes: boolean };

function paraDTO(j: Justificativa): JustificativaDTO {
  return {
    id: j.id,
    motivo: j.motivo,
    descricao: j.descricao,
    anexoUrl: j.anexoUrl,
    status: j.status,
    observacaoDecisao: j.observacaoDecisao,
    decididoEm: j.decididoEm?.toISOString() ?? null,
    enviadaEm: j.criadoEm.toISOString(),
    aluno: j.aluno,
    viagem: { id: j.viagem.id, data: dataIso(j.viagem.data), rota: j.viagem.rotaNome },
  };
}

export class JustificativaService {
  constructor(
    private readonly justificativas: IJustificativaRepository,
    private readonly mensalidades: IMensalidadeRepository,
    private readonly storage: IStorageService,
  ) {}

  async listar(filtro: unknown = {}): Promise<JustificativaDTO[]> {
    return (await this.justificativas.listar(filtroJustificativasSchema.parse(filtro))).map(paraDTO);
  }

  async listarDoAluno(alunoId: string): Promise<JustificativaDTO[]> {
    return (await this.justificativas.listar({ alunoId })).map(paraDTO);
  }

  /**
   * Viagens que o aluno pode justificar: já aconteceram (até 60 dias), eram dia
   * contratado, não foram canceladas, ele não usou nenhum trecho e ainda não
   * há justificativa.
   */
  async faltasJustificaveis(alunoId: string, agora = new Date()): Promise<FaltaJustificavelDTO[]> {
    const hoje = hojeLocal(agora);
    const { viagens, planos } = await this.justificativas.historicoDoAluno(
      alunoId,
      somarDias(hoje, -JANELA_JUSTIFICATIVA_DIAS),
      hoje,
    );
    return viagens
      .filter((v) => {
        const declaracao = v.declaracao && !v.declaracao.canceladoEm ? v.declaracao : null;
        return (
          v.horarioVolta < agora &&
          v.status !== StatusViagem.CANCELADA &&
          diaContratado(planoVigenteNaViagem(planos, v, alunoId), v) &&
          !v.declaracao?.temJustificativa &&
          (!declaracao || (!declaracao.usaIda && !declaracao.usaVolta))
        );
      })
      .map((v) => ({
        viagemId: v.id,
        data: dataIso(v.data),
        rota: v.rotaNome,
        avisouAntes: Boolean(v.declaracao && !v.declaracao.canceladoEm),
      }));
  }

  async enviar(alunoId: string, campos: unknown, arquivo: File | null) {
    const dados = validar(enviarJustificativaSchema, campos);
    const erroArquivo = erroDoAnexo(arquivo, true);
    if (erroArquivo) throw new ErroDeValidacao(erroArquivo, { anexo: [erroArquivo] });

    const faltas = await this.faltasJustificaveis(alunoId);
    if (!faltas.some((f) => f.viagemId === dados.viagemId)) {
      // Cobre: dia não contratado, viagem cancelada, trecho usado, já justificada, fora da janela.
      throw new ErroDeValidacao(
        "Esta viagem não pode ser justificada: só faltas do dia inteiro, em dia contratado, nos últimos 60 dias e ainda sem justificativa.",
        { viagemId: ["Escolha uma falta da lista."] },
      );
    }

    const chave = await this.storage.salvar(arquivo!, "justificativas");
    await this.justificativas.criar({
      ...dados,
      alunoId,
      anexoUrl: urlDoArquivo(chave),
      em: new Date(),
    });
  }

  /**
   * Aprovar isenta a diária. Se o mês já fechou e a mensalidade não foi paga,
   * ela é recalculada agora; se já foi paga, o admin lança um ajuste no
   * próximo mês. Decisão é final: APROVADA/RECUSADA não voltam para PENDENTE.
   */
  async decidir(id: string, entrada: unknown, adminId: string): Promise<{ mensagem: string }> {
    const { decisao, observacao } = validar(decidirJustificativaSchema, entrada);
    const j = await this.justificativas.buscarPorId(id);
    if (!j) throw new ErroNaoEncontrado("Justificativa não encontrada.");
    if (j.status !== StatusJustificativa.PENDENTE) {
      throw new ErroDeValidacao("Esta justificativa já foi decidida.");
    }

    const status = decisao === "APROVAR" ? StatusJustificativa.APROVADA : StatusJustificativa.RECUSADA;
    await this.justificativas.decidir(id, { status, observacao: observacao ?? null, por: adminId, em: new Date() });
    if (status === StatusJustificativa.RECUSADA) return { mensagem: "Justificativa recusada." };

    const mes = formatarCompetencia(competenciaDe(j.viagem.data));
    switch (await this.mensalidades.isentarDiaria(j.viagem.id, j.aluno.id, id)) {
      case "ISENTADA":
        return { mensagem: `Aprovada. A diária foi isentada e a mensalidade de ${mes} recalculada.` };
      case "MENSALIDADE_PAGA":
        return {
          mensagem: `Aprovada, mas a mensalidade de ${mes} já foi paga: lance um ajuste negativo na próxima.`,
        };
      default:
        return { mensagem: "Aprovada. A diária sai isenta no fechamento do mês." };
    }
  }

  /** Controle de acesso aos anexos: admin vê todos; aluno, só os dele. */
  async alunoPodeVerAnexo(anexoUrl: string, alunoId: string) {
    return this.justificativas.anexoEhDoAluno(anexoUrl, alunoId);
  }
}

