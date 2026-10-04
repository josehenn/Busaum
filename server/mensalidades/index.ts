import { paymentGateway } from "@/server/pagamentos";
import { repositorios } from "@/server/repositorios";
import { MensalidadeService } from "./mensalidade.service";

export const mensalidadeService = new MensalidadeService(
  repositorios.mensalidades,
  repositorios.viagens,
  paymentGateway,
);

export type { MensalidadeDTO, MensalidadeDetalheDTO } from "./mensalidade.service";
