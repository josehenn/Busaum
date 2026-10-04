// Página pública de transparência. LGPD: lê apenas Despesa e Veiculo — nenhum
// dado de aluno — e não expõe comprovantes (podem trazer dados de terceiros,
// como o holerite do motorista).
import { CategoriaDespesa } from "@/lib/generated/prisma/enums";
import {
  competenciaDe,
  dataIso,
  fimDaCompetencia,
  hojeLocal,
  inicioDaCompetencia,
  somarDias,
} from "@/lib/datas";
import { paraDespesaDTO, somar } from "@/server/despesas/despesa.service";
import type { IDespesaRepository } from "@/server/despesas/despesa.repository";

const MESES_NO_HISTORICO = 12;

export class TransparenciaService {
  constructor(private readonly despesas: IDespesaRepository) {}

  mesAtual() {
    return competenciaDe(hojeLocal());
  }

  /** Totais dos últimos 12 meses até `mes`, por categoria no mês, e os lançamentos dele. */
  async resumo(mes: string) {
    const meses: string[] = [];
    let inicio = inicioDaCompetencia(mes);
    for (let i = 0; i < MESES_NO_HISTORICO; i++) {
      meses.unshift(competenciaDe(inicio));
      inicio = inicioDaCompetencia(competenciaDe(somarDias(inicio, -1)));
    }

    const periodo = (
      await this.despesas.listar({ de: inicioDaCompetencia(meses[0]), ate: fimDaCompetencia(mes) })
    ).map(paraDespesaDTO);
    const doMes = periodo.filter((d) => d.data.startsWith(mes));

    return {
      mes,
      totalDoMes: somar(doMes),
      porMes: meses.map((m) => ({ mes: m, total: somar(periodo.filter((d) => d.data.startsWith(m))) })),
      porCategoria: Object.values(CategoriaDespesa)
        .map((categoria) => ({ categoria, total: somar(doMes.filter((d) => d.categoria === categoria)) }))
        .filter((c) => Number(c.total) > 0)
        .sort((a, b) => Number(b.total) - Number(a.total)),
      // Campo a campo, de propósito: um campo novo em DespesaDTO não vaza para
      // a página pública sem alguém decidir que ele é público.
      lancamentos: doMes.map((d) => ({
        id: d.id,
        data: d.data,
        categoria: d.categoria,
        descricao: d.descricao,
        valor: d.valor,
        veiculo: d.veiculo && { placa: d.veiculo.placa, modelo: d.veiculo.modelo },
      })),
      atualizadoEm: dataIso(hojeLocal()),
    };
  }
}
