import { storageService } from "@/server/arquivos";
import { repositorios } from "@/server/repositorios";
import { DespesaService } from "./despesa.service";

export const despesaService = new DespesaService(repositorios.despesas, repositorios.veiculos, storageService);

export type { DespesaDTO } from "./despesa.service";
