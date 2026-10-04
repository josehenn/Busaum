import { repositorios } from "@/server/repositorios";
import { DeclaracaoService } from "./declaracao.service";

export const declaracaoService = new DeclaracaoService(
  repositorios.declaracoes,
  repositorios.viagens,
  repositorios.planos,
);

export type { SituacaoNaViagem, ViagemDoAlunoDTO } from "./declaracao.service";
