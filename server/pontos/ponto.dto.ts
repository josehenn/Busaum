import type { Ponto } from "./ponto.repository";

export {
  atualizarPontoSchema,
  criarPontoSchema,
  filtroPontosSchema,
} from "@/lib/esquemas/ponto";

export type PontoDTO = {
  id: string;
  descricao: string;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  referencia: string | null;
  latitude: string | null;
  longitude: string | null;
  ativo: boolean;
  instituicao: { id: string; nome: string; sigla: string | null } | null;
  rotas: { id: string; nome: string; ativa: boolean }[];
  /** Endereço numa linha, só com o que foi preenchido. */
  endereco: string;
};

/** "Rua X, 12 – Centro – Capivari de Baixo/SC" (pula o que estiver vazio). */
export function resumirEndereco(p: {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}) {
  const rua = [p.logradouro, p.numero].filter(Boolean).join(", ");
  const local = [p.cidade, p.uf].filter(Boolean).join("/");
  return [rua, p.bairro, local].filter(Boolean).join(" – ");
}

export function paraPontoDTO(ponto: Ponto): PontoDTO {
  return {
    id: ponto.id,
    descricao: ponto.descricao,
    logradouro: ponto.logradouro,
    numero: ponto.numero,
    complemento: ponto.complemento,
    bairro: ponto.bairro,
    cidade: ponto.cidade,
    uf: ponto.uf,
    cep: ponto.cep,
    referencia: ponto.referencia,
    latitude: ponto.latitude?.toString() ?? null,
    longitude: ponto.longitude?.toString() ?? null,
    ativo: ponto.ativo,
    instituicao: ponto.instituicao,
    rotas: ponto.rotas,
    endereco: resumirEndereco(ponto),
  };
}
