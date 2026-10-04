// Quem é esperado em uma viagem (docs/modelagem.md, "No dia a dia").
//
// Funções puras — sem banco — porque a mesma resposta serve a lista do
// motorista, os pontos a pular, a lotação do pedido avulso e o fechamento do
// mês. Um lugar só para a regra.
//
// - Em dia contratado o padrão é IR: quem não declarou nada está na viagem.
//   A declaração registra a ausência (ou o uso de um trecho só).
// - Em dia não contratado o padrão é NÃO ir: a declaração é o que inclui o aluno
//   (avulso).
import { diaSemanaIso } from "@/lib/datas";

export type PlanoParaEsperados = {
  id: string;
  alunoId: string;
  alunoNome: string;
  rotaId: string;
  diasSemana: number[];
  vigenteDe: Date;
  vigenteAte: Date | null;
  pontoEmbarqueId: string;
  pontoDestinoId: string;
  pontoRetornoId: string | null;
};

export type DeclaracaoParaEsperados = {
  alunoId: string;
  alunoNome: string;
  viagemId: string;
  usaIda: boolean;
  usaVolta: boolean;
  canceladoEm: Date | null;
};

export type ViagemParaEsperados = {
  id: string;
  rotaId: string;
  data: Date;
  prazoDeclaracao: Date;
};

export type Passageiro = {
  alunoId: string;
  nome: string;
  origem: "PLANO" | "AVULSO";
  vaiIda: boolean;
  vaiVolta: boolean;
  embarqueId: string;
  destinoId: string;
  /** Já resolvido: retorno em branco = ponto de embarque. */
  retornoId: string;
};

/**
 * O plano que vale para a viagem é o que estava vigente no prazo de declaração
 * dela — não o de hoje nem o do começo do mês. Trocar de plano depois do prazo
 * não muda a viagem que já estava fechada.
 */
export function planoVigenteNaViagem<P extends PlanoParaEsperados>(
  planos: P[],
  viagem: ViagemParaEsperados,
  alunoId: string,
): P | undefined {
  return planos.find(
    (p) =>
      p.alunoId === alunoId &&
      p.rotaId === viagem.rotaId &&
      p.vigenteDe <= viagem.prazoDeclaracao &&
      (p.vigenteAte === null || p.vigenteAte > viagem.prazoDeclaracao),
  );
}

/** O plano vigente cobre o dia da semana desta viagem? */
export function diaContratado(plano: PlanoParaEsperados | undefined, viagem: ViagemParaEsperados) {
  return Boolean(plano?.diasSemana.includes(diaSemanaIso(viagem.data)));
}

export function calcularEsperados(
  viagem: ViagemParaEsperados,
  planos: PlanoParaEsperados[],
  declaracoes: DeclaracaoParaEsperados[],
) {
  const ativas = declaracoes.filter((d) => d.viagemId === viagem.id && d.canceladoEm === null);
  const daRota = planos.filter((p) => p.rotaId === viagem.rotaId);
  const alunos = [...new Set(daRota.map((p) => p.alunoId))];

  const passageiros: Passageiro[] = [];
  const ausentes: { alunoId: string; nome: string }[] = [];

  for (const alunoId of alunos) {
    const plano = planoVigenteNaViagem(daRota, viagem, alunoId);
    if (!plano) continue;
    const declaracao = ativas.find((d) => d.alunoId === alunoId);
    const pontos = {
      embarqueId: plano.pontoEmbarqueId,
      destinoId: plano.pontoDestinoId,
      retornoId: plano.pontoRetornoId ?? plano.pontoEmbarqueId,
    };

    if (diaContratado(plano, viagem)) {
      // Sem declaração = vai nos dois trechos.
      const vaiIda = declaracao ? declaracao.usaIda : true;
      const vaiVolta = declaracao ? declaracao.usaVolta : true;
      if (vaiIda || vaiVolta) {
        passageiros.push({ alunoId, nome: plano.alunoNome, origem: "PLANO", vaiIda, vaiVolta, ...pontos });
      } else {
        ausentes.push({ alunoId, nome: plano.alunoNome });
      }
    } else if (declaracao && (declaracao.usaIda || declaracao.usaVolta)) {
      // Avulso: usa os pontos do plano que tem nesta rota.
      passageiros.push({
        alunoId,
        nome: plano.alunoNome,
        origem: "AVULSO",
        vaiIda: declaracao.usaIda,
        vaiVolta: declaracao.usaVolta,
        ...pontos,
      });
    }
  }

  passageiros.sort((a, b) => a.nome.localeCompare(b.nome));
  ausentes.sort((a, b) => a.nome.localeCompare(b.nome));
  return {
    passageiros,
    ausentes,
    ida: passageiros.filter((p) => p.vaiIda).length,
    volta: passageiros.filter((p) => p.vaiVolta).length,
  };
}

/**
 * Para cada parada do trajeto, quem sobe e quem desce em cada sentido. Um ponto
 * sem ninguém pode ser pulado — é consulta derivada, não coluna.
 * Ida: sobe no embarque, desce no destino. Volta: sobe no destino, desce no retorno.
 */
export function movimentoPorPonto(
  trajeto: { id: string; ordem: number; descricao: string }[],
  passageiros: Passageiro[],
) {
  return trajeto.map((ponto) => {
    const conta = (filtro: (p: Passageiro) => boolean) => passageiros.filter(filtro).length;
    const sobeIda = conta((p) => p.vaiIda && p.embarqueId === ponto.id);
    const desceIda = conta((p) => p.vaiIda && p.destinoId === ponto.id);
    const sobeVolta = conta((p) => p.vaiVolta && p.destinoId === ponto.id);
    const desceVolta = conta((p) => p.vaiVolta && p.retornoId === ponto.id);
    return {
      ...ponto,
      sobeIda,
      desceIda,
      sobeVolta,
      desceVolta,
      pularIda: sobeIda + desceIda === 0,
      pularVolta: sobeVolta + desceVolta === 0,
    };
  });
}
