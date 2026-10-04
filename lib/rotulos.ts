// Textos dos enums para exibição. Fica em lib/ (e não em server/) porque os
// Client Components também precisam deles, nos selects dos formulários.
import {
  CategoriaDespesa,
  MotivoJustificativa,
  SituacaoDiaria,
  StatusAluno,
  StatusJustificativa,
  StatusMensalidade,
  StatusVeiculo,
  StatusViagem,
  TipoVeiculo,
  Turno,
} from "@/lib/generated/prisma/enums";

export const rotuloTurno: Record<Turno, string> = {
  [Turno.MATUTINO]: "Matutino",
  [Turno.VESPERTINO]: "Vespertino",
  [Turno.NOTURNO]: "Noturno",
};

export const rotuloStatusAluno: Record<StatusAluno, string> = {
  [StatusAluno.ATIVO]: "Ativo",
  [StatusAluno.INATIVO]: "Inativo",
  [StatusAluno.TRANCADO]: "Trancado",
};

export const rotuloTipoVeiculo: Record<TipoVeiculo, string> = {
  [TipoVeiculo.ONIBUS]: "Ônibus",
  [TipoVeiculo.VAN]: "Van",
};

export const rotuloStatusVeiculo: Record<StatusVeiculo, string> = {
  [StatusVeiculo.ATIVO]: "Ativo",
  [StatusVeiculo.MANUTENCAO]: "Em manutenção",
  [StatusVeiculo.INATIVO]: "Inativo",
};

export const rotuloStatusViagem: Record<StatusViagem, string> = {
  [StatusViagem.AGENDADA]: "Agendada",
  [StatusViagem.REALIZADA]: "Realizada",
  [StatusViagem.CANCELADA]: "Cancelada",
};

export const rotuloMotivoJustificativa: Record<MotivoJustificativa, string> = {
  [MotivoJustificativa.ATESTADO]: "Atestado médico",
  [MotivoJustificativa.AULA_CANCELADA]: "Aula cancelada",
  [MotivoJustificativa.OUTRO]: "Outro motivo",
};

export const rotuloStatusJustificativa: Record<StatusJustificativa, string> = {
  [StatusJustificativa.PENDENTE]: "Pendente",
  [StatusJustificativa.APROVADA]: "Aprovada",
  [StatusJustificativa.RECUSADA]: "Recusada",
};

export const rotuloSituacaoDiaria: Record<SituacaoDiaria, string> = {
  [SituacaoDiaria.COBRADA]: "Cobrada",
  [SituacaoDiaria.ISENTA_JUSTIFICADA]: "Isenta (falta justificada)",
  [SituacaoDiaria.ISENTA_VIAGEM_CANCELADA]: "Isenta (viagem cancelada)",
};

export const rotuloStatusMensalidade: Record<StatusMensalidade, string> = {
  [StatusMensalidade.ABERTA]: "Em aberto",
  [StatusMensalidade.PAGA]: "Paga",
  [StatusMensalidade.VENCIDA]: "Vencida",
  [StatusMensalidade.CANCELADA]: "Cancelada",
};

export const rotuloCategoriaDespesa: Record<CategoriaDespesa, string> = {
  [CategoriaDespesa.COMBUSTIVEL]: "Combustível",
  [CategoriaDespesa.MANUTENCAO]: "Manutenção",
  [CategoriaDespesa.PEDAGIO]: "Pedágio",
  [CategoriaDespesa.SEGURO]: "Seguro",
  [CategoriaDespesa.SALARIO]: "Salários",
  [CategoriaDespesa.OUTROS]: "Outros",
};

/** Formato dos `items` do Select: [{ value, label }]. */
export function opcoes<T extends string>(rotulos: Record<T, string>) {
  return (Object.entries(rotulos) as [T, string][]).map(([value, label]) => ({ value, label }));
}
