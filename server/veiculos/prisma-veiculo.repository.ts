import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { ErroDeConflito } from "@/server/comum/erros";
import type { AtualizarVeiculoDTO, CriarVeiculoDTO } from "./veiculo.dto";
import type { IVeiculoRepository, Veiculo } from "./veiculo.repository";

export class PrismaVeiculoRepository implements IVeiculoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listar(): Promise<Veiculo[]> {
    // Enum ordena pela ordem de declaração: ATIVO, MANUTENCAO, INATIVO.
    return this.prisma.veiculo.findMany({ orderBy: [{ status: "asc" }, { placa: "asc" }] });
  }

  buscarPorId(id: string): Promise<Veiculo | null> {
    return this.prisma.veiculo.findUnique({ where: { id } });
  }

  buscarPorPlaca(placa: string): Promise<Veiculo | null> {
    return this.prisma.veiculo.findUnique({ where: { placa } });
  }

  async criar(dados: CriarVeiculoDTO & { criadoPor: string }): Promise<Veiculo> {
    try {
      return await this.prisma.veiculo.create({ data: dados });
    } catch (erro) {
      throw traduzirPlacaDuplicada(erro, dados.placa);
    }
  }

  async atualizar(id: string, dados: AtualizarVeiculoDTO): Promise<Veiculo> {
    try {
      return await this.prisma.veiculo.update({ where: { id }, data: dados });
    } catch (erro) {
      throw traduzirPlacaDuplicada(erro, dados.placa);
    }
  }

  listarRotasAtivasDoVeiculo(id: string) {
    return this.prisma.rota.findMany({
      where: { veiculoId: id, ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }
}

/**
 * O service já confere a placa antes de gravar, mas duas requisições simultâneas
 * podem passar juntas pela conferência. Aí quem barra é o @unique do banco, e o
 * erro do Prisma (P2002) vira o mesmo ErroDeConflito.
 */
function traduzirPlacaDuplicada(erro: unknown, placa?: string) {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    return new ErroDeConflito(`Já existe um veículo com a placa ${placa}.`, {
      placa: ["Esta placa já está cadastrada."],
    });
  }
  return erro;
}
