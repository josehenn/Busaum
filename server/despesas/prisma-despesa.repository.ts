import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { CategoriaDespesa } from "@/lib/generated/prisma/enums";
import type { AtualizarDespesaDTO, CriarDespesaDTO } from "@/lib/esquemas/despesa";
import type { Despesa, IDespesaRepository } from "./despesa.repository";

const selecionar = {
  id: true,
  categoria: true,
  descricao: true,
  valor: true,
  data: true,
  comprovanteUrl: true,
  veiculo: { select: { id: true, placa: true, modelo: true } },
} as const;

export class PrismaDespesaRepository implements IDespesaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listar({ de, ate, categoria }: { de?: Date; ate?: Date; categoria?: CategoriaDespesa }): Promise<Despesa[]> {
    return this.prisma.despesa.findMany({
      where: { categoria, data: { gte: de, lt: ate } },
      select: selecionar,
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    });
  }

  buscarPorId(id: string): Promise<Despesa | null> {
    return this.prisma.despesa.findUnique({ where: { id }, select: selecionar });
  }

  criar(dados: CriarDespesaDTO & { comprovanteUrl: string | null; criadoPor: string }): Promise<Despesa> {
    return this.prisma.despesa.create({ data: dados, select: selecionar });
  }

  atualizar(id: string, dados: AtualizarDespesaDTO & { comprovanteUrl?: string }): Promise<Despesa> {
    return this.prisma.despesa.update({ where: { id }, data: dados, select: selecionar });
  }
}
