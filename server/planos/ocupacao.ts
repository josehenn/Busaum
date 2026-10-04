// Lotação é travada na contratação, por dia da semana (docs/modelagem.md): conta
// quantos planos em vigor cobrem cada dia e compara com a capacidade do veículo.

/** { 1: 12, 2: 15, ... } — quantos planos cobrem cada dia pedido. */
export function contarPorDia(planos: { diasSemana: number[] }[], dias: number[]) {
  return Object.fromEntries(
    dias.map((d) => [d, planos.filter((p) => p.diasSemana.includes(d)).length]),
  ) as Record<number, number>;
}

/** Maior ocupação entre os dias — o que um veículo novo precisaria comportar. */
export function picoDeOcupacao(planos: { diasSemana: number[] }[]) {
  const porDia = contarPorDia(planos, [1, 2, 3, 4, 5, 6, 7]);
  return Math.max(0, ...Object.values(porDia));
}
