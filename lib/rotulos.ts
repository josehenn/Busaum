// Textos dos enums para exibição. Fica em lib/ (e não em server/) porque os
// Client Components também precisam deles, nos selects dos formulários.
import { StatusVeiculo, TipoVeiculo } from "@/lib/generated/prisma/enums";

export const rotuloTipoVeiculo: Record<TipoVeiculo, string> = {
  [TipoVeiculo.ONIBUS]: "Ônibus",
  [TipoVeiculo.VAN]: "Van",
};

export const rotuloStatusVeiculo: Record<StatusVeiculo, string> = {
  [StatusVeiculo.ATIVO]: "Ativo",
  [StatusVeiculo.MANUTENCAO]: "Em manutenção",
  [StatusVeiculo.INATIVO]: "Inativo",
};

/** Formato dos `items` do Select: [{ value, label }]. */
export function opcoes<T extends string>(rotulos: Record<T, string>) {
  return (Object.entries(rotulos) as [T, string][]).map(([value, label]) => ({ value, label }));
}
