import { FakePaymentGateway } from "./fake-payment-gateway";
import type { PaymentGateway } from "./payment-gateway";

/**
 * Estratégia escolhida por ambiente. Só existe o fake por enquanto; um gateway
 * real entraria aqui (ex.: PAYMENT_GATEWAY=pix → new PixGateway(...)).
 */
export const paymentGateway: PaymentGateway = new FakePaymentGateway();
