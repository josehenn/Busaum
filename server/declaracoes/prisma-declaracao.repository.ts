import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { OrigemDeclaracao } from "@/lib/generated/prisma/enums";
import type { Declaracao, IDeclaracaoRepository } from "./declaracao.repository";

const incluir = { justificativa: { select: { id: true } } } as const;

function paraEntidade<T extends { justificativa: { id: string } | null }>({ justificativa, ...d }: T) {
  return { ...d, temJustificativa: justificativa !== null };
}

export class PrismaDeclaracaoRepository implements IDeclaracaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscar(viagemId: string, alunoId: string): Promise<Declaracao | null> {
    const d = await this.prisma.declaracao.findUnique({
      where: { viagemId_alunoId: { viagemId, alunoId } },
      include: incluir,
    });
    return d && paraEntidade(d);
  }

  async salvar(dados: {
    viagemId: string;
    alunoId: string;
    usaIda: boolean;
    usaVolta: boolean;
    origem: OrigemDeclaracao;
    em: Date;
  }): Promise<Declaracao> {
    const { viagemId, alunoId, usaIda, usaVolta, origem, em } = dados;
    const d = await this.prisma.declaracao.upsert({
      where: { viagemId_alunoId: { viagemId, alunoId } },
      create: { viagemId, alunoId, usaIda, usaVolta, origem, declaradoEm: em },
      update: { usaIda, usaVolta, origem, declaradoEm: em, canceladoEm: null },
      include: incluir,
    });
    return paraEntidade(d);
  }

  async desfazer(id: string, em: Date) {
    await this.prisma.declaracao.update({ where: { id }, data: { canceladoEm: em } });
  }
}
