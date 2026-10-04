// Integração de pagamento (padrões Adapter + Strategy). O módulo de
// mensalidades só conhece esta interface; qual gateway roda é decidido na
// montagem (server/pagamentos/index.ts). Trocar o fake por um real (Pix,
// boleto) é escrever outra implementação — nenhuma regra muda.

export type CobrancaParaRegistrar = {
  competencia: string;
  alunoId: string;
  valor: string;
  vencimentoEm: Date;
};

export interface PaymentGateway {
  /** Registra a cobrança no provedor e devolve a referência dele. */
  registrarCobranca(cobranca: CobrancaParaRegistrar): Promise<{ referencia: string }>;
  /** Confirma o pagamento de uma cobrança (baixa manual pelo admin). */
  confirmarPagamento(referencia: string): Promise<{ pagoEm: Date }>;
}
