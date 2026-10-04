import { randomUUID } from "node:crypto";
import type { CobrancaParaRegistrar, PaymentGateway } from "./payment-gateway";

/**
 * Gateway de mentira: gera referências "FAKE-..." e confirma qualquer
 * pagamento na hora. Serve para desenvolvimento e para a entrega acadêmica,
 * sem depender de conta em provedor de pagamento.
 */
export class FakePaymentGateway implements PaymentGateway {
  async registrarCobranca(cobranca: CobrancaParaRegistrar) {
    return { referencia: `FAKE-${cobranca.competencia}-${randomUUID().slice(0, 8)}` };
  }

  async confirmarPagamento() {
    return { pagoEm: new Date() };
  }
}
