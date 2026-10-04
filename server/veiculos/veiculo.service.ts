// Regras de negócio de veículos. Recebe o repositório pelo construtor
// (injeção de dependência): não sabe que existe Prisma.
import { StatusVeiculo } from "@/lib/generated/prisma/enums";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import {
  atualizarVeiculoSchema,
  criarVeiculoSchema,
  paraVeiculoDTO,
  type VeiculoDTO,
} from "./veiculo.dto";
import type { IVeiculoRepository, Veiculo } from "./veiculo.repository";

export class VeiculoService {
  constructor(private readonly repositorio: IVeiculoRepository) {}

  async listar(): Promise<VeiculoDTO[]> {
    const veiculos = await this.repositorio.listar();
    return veiculos.map(paraVeiculoDTO);
  }

  async buscar(id: string): Promise<VeiculoDTO> {
    return paraVeiculoDTO(await this.obter(id));
  }

  /** `entrada` chega crua (JSON da API): a validação é parte da regra. */
  async criar(entrada: unknown, criadoPor: string): Promise<VeiculoDTO> {
    const dados = validar(criarVeiculoSchema, entrada);
    await this.garantirPlacaLivre(dados.placa);

    return paraVeiculoDTO(await this.repositorio.criar({ ...dados, criadoPor }));
  }

  async atualizar(id: string, entrada: unknown): Promise<VeiculoDTO> {
    const atual = await this.obter(id);
    const dados = validar(atualizarVeiculoSchema, entrada);

    if (dados.placa && dados.placa !== atual.placa) {
      await this.garantirPlacaLivre(dados.placa);
    }
    if (dados.status === StatusVeiculo.INATIVO && atual.status !== StatusVeiculo.INATIVO) {
      await this.garantirForaDeRotasAtivas(atual);
    }

    return paraVeiculoDTO(await this.repositorio.atualizar(id, dados));
  }

  // ---------------------------------------------------------------- Regras

  private async obter(id: string): Promise<Veiculo> {
    const veiculo = await this.repositorio.buscarPorId(id);
    if (!veiculo) throw new ErroNaoEncontrado("Veículo não encontrado.");
    return veiculo;
  }

  /** Placa única. A placa já chega normalizada pelo DTO, então "abc-1d23" e "ABC1D23" colidem. */
  private async garantirPlacaLivre(placa: string) {
    if (await this.repositorio.buscarPorPlaca(placa)) {
      throw new ErroDeConflito(`Já existe um veículo com a placa ${placa}.`, {
        placa: ["Esta placa já está cadastrada."],
      });
    }
  }

  /**
   * Veículo padrão de rota ativa não pode ser inativado: a rota ficaria sem
   * veículo e a lotação dos planos seria contada contra um veículo que não roda.
   * Manutenção é permitida — é temporária, e a viagem do dia pode usar outro veículo.
   */
  private async garantirForaDeRotasAtivas(veiculo: Veiculo) {
    const rotas = await this.repositorio.listarRotasAtivasDoVeiculo(veiculo.id);
    if (rotas.length > 0) {
      const nomes = rotas.map((r) => r.nome).join(", ");
      throw new ErroDeValidacao(
        `O veículo ${veiculo.placa} é o padrão da(s) rota(s) ${nomes}. Troque o veículo da rota antes de inativá-lo.`,
        { status: ["Veículo em uso por rota ativa."] },
      );
    }
  }
}
