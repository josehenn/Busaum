// Regras de entrada do ponto (parada). Só a descrição é obrigatória: o cadastro
// precisa funcionar para "Posto da BR-101" antes de alguém ter o CEP em mãos.
import { z } from "zod";
import { apenasDigitos } from "@/lib/mascaras";
import { idOpcional, textoObrigatorio, textoOpcional } from "./comum";

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export const LIMITES_PONTO = {
  descricaoMax: 120,
  logradouroMax: 120,
  numeroMax: 10,
  complementoMax: 60,
  bairroMax: 60,
  cidadeMax: 60,
  referenciaMax: 200,
} as const;

const uf = z
  .string()
  .trim()
  .toUpperCase()
  .transform((valor) => (valor === "" ? null : valor))
  .refine((valor) => valor === null || (UFS as readonly string[]).includes(valor), "UF inválida.")
  .nullish();

const cep = z
  .string()
  .transform(apenasDigitos)
  .refine((valor) => valor === "" || valor.length === 8, "O CEP tem 8 dígitos.")
  .transform((valor) => (valor === "" ? null : valor))
  .nullish();

/** Coordenada em graus decimais ("-28.4813" ou "-28,4813"). Vazio → null. */
function coordenada(rotulo: string, limite: number) {
  return z
    .string()
    .trim()
    .transform((valor) => valor.replace(",", "."))
    .refine(
      (valor) => valor === "" || (/^-?\d{1,3}(\.\d{1,7})?$/.test(valor) && Math.abs(Number(valor)) <= limite),
      `${rotulo} inválida: use graus decimais entre -${limite} e ${limite}.`,
    )
    .transform((valor) => (valor === "" ? null : valor))
    .nullish();
}

const campos = {
  descricao: textoObrigatorio("descrição", 2, LIMITES_PONTO.descricaoMax, "a"),
  logradouro: textoOpcional("logradouro", LIMITES_PONTO.logradouroMax),
  numero: textoOpcional("número", LIMITES_PONTO.numeroMax),
  complemento: textoOpcional("complemento", LIMITES_PONTO.complementoMax),
  bairro: textoOpcional("bairro", LIMITES_PONTO.bairroMax),
  cidade: textoOpcional("cidade", LIMITES_PONTO.cidadeMax, "a"),
  uf,
  cep,
  referencia: textoOpcional("referência", LIMITES_PONTO.referenciaMax, "a"),
  instituicaoId: idOpcional(),
  latitude: coordenada("Latitude", 90),
  longitude: coordenada("Longitude", 180),
};

export const criarPontoSchema = z.object(campos);

export const atualizarPontoSchema = z
  .object({ ...campos, ativo: z.boolean({ error: "Status inválido." }) })
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar.");

export const filtroPontosSchema = z.object({
  busca: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(["ATIVO", "INATIVO"]).optional().catch(undefined),
});

export type CriarPontoDTO = z.output<typeof criarPontoSchema>;
export type AtualizarPontoDTO = z.output<typeof atualizarPontoSchema>;
export type FiltroPontos = z.output<typeof filtroPontosSchema>;
