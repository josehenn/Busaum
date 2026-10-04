import { CategoriaDespesa } from "@/lib/generated/prisma/enums";
import { dataIso, fimDaCompetencia, inicioDaCompetencia } from "@/lib/datas";
import { centavosParaDecimal, decimalParaCentavos } from "@/lib/dinheiro";
import { erroDoAnexo } from "@/lib/esquemas/arquivo";
import { atualizarDespesaSchema, criarDespesaSchema, filtroDespesasSchema } from "@/lib/esquemas/despesa";
import type { IStorageService } from "@/server/arquivos/storage.service";
import { urlDoArquivo } from "@/server/arquivos/storage.service";
import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IVeiculoRepository } from "@/server/veiculos/veiculo.repository";
import type { Despesa, IDespesaRepository } from "./despesa.repository";

export type DespesaDTO = {
  id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: string;
  data: string;
  comprovanteUrl: string | null;
  veiculo: { id: string; placa: string; modelo: string } | null;
};

export function paraDespesaDTO(d: Despesa): DespesaDTO {
  return {
    id: d.id,
    categoria: d.categoria,
    descricao: d.descricao,
    valor: Number(d.valor.toString()).toFixed(2),
    data: dataIso(d.data),
    comprovanteUrl: d.comprovanteUrl,
    veiculo: d.veiculo,
  };
}

/** Soma em centavos e devolve decimal — nunca soma Float. */
export function somar(despesas: { valor: string }[]) {
  return centavosParaDecimal(despesas.reduce((t, d) => t + decimalParaCentavos(d.valor), 0));
}

export class DespesaService {
  constructor(
    private readonly despesas: IDespesaRepository,
    private readonly veiculos: IVeiculoRepository,
    private readonly storage: IStorageService,
  ) {}

  /** Lista do mês (ou tudo, sem mês) com o total. */
  async listar(filtro: unknown = {}) {
    const { mes, categoria } = filtroDespesasSchema.parse(filtro);
    const lista = (
      await this.despesas.listar({
        categoria,
        ...(mes && { de: inicioDaCompetencia(mes), ate: fimDaCompetencia(mes) }),
      })
    ).map(paraDespesaDTO);
    return { despesas: lista, total: somar(lista) };
  }

  async buscar(id: string): Promise<DespesaDTO> {
    const d = await this.despesas.buscarPorId(id);
    if (!d) throw new ErroNaoEncontrado("Despesa não encontrada.");
    return paraDespesaDTO(d);
  }

  async criar(campos: unknown, comprovante: File | null, criadoPor: string): Promise<DespesaDTO> {
    const dados = validar(criarDespesaSchema, campos);
    if (dados.veiculoId) await this.garantirVeiculo(dados.veiculoId);
    const comprovanteUrl = await this.salvarComprovante(comprovante);
    return paraDespesaDTO(await this.despesas.criar({ ...dados, comprovanteUrl, criadoPor }));
  }

  /** Sem arquivo novo, o comprovante atual é mantido. */
  async atualizar(id: string, campos: unknown, comprovante: File | null): Promise<DespesaDTO> {
    await this.buscar(id);
    const dados = validar(atualizarDespesaSchema, campos);
    if (dados.veiculoId) await this.garantirVeiculo(dados.veiculoId);
    const comprovanteUrl = await this.salvarComprovante(comprovante);
    return paraDespesaDTO(
      await this.despesas.atualizar(id, { ...dados, ...(comprovanteUrl && { comprovanteUrl }) }),
    );
  }

  private async salvarComprovante(arquivo: File | null) {
    const erro = erroDoAnexo(arquivo, false);
    if (erro) throw new ErroDeValidacao(erro, { comprovante: [erro] });
    if (!arquivo || arquivo.size === 0) return null;
    return urlDoArquivo(await this.storage.salvar(arquivo, "despesas"));
  }

  /** Qualquer status serve: despesa de manutenção é justamente de veículo parado. */
  private async garantirVeiculo(id: string) {
    if (!(await this.veiculos.buscarPorId(id))) {
      throw new ErroDeValidacao("Veículo não encontrado.", { veiculoId: ["Escolha um veículo da lista."] });
    }
  }
}
