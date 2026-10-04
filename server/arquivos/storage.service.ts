// Onde os anexos ficam guardados (padrão Adapter): o resto do sistema só
// conhece esta interface. Em desenvolvimento, disco local; em produção, Vercel
// Blob — o sistema de arquivos da Vercel não guarda o que é enviado.
//
// O sistema guarda só a "chave" (ex.: "justificativas/3f2c...pdf") e serve o
// arquivo por /api/arquivos/<chave>, que confere quem está pedindo. Nenhum
// anexo tem URL pública: atestado é dado de saúde (LGPD).

export type PastaDeArquivos = "justificativas" | "despesas";

export type ArquivoAberto = {
  corpo: ReadableStream<Uint8Array> | Uint8Array;
  tipo: string;
};

export interface IStorageService {
  /** Grava e devolve a chave do arquivo. */
  salvar(arquivo: File, pasta: PastaDeArquivos): Promise<string>;
  /** null se a chave não existe. */
  abrir(chave: string): Promise<ArquivoAberto | null>;
}

/** Chaves que o sistema gera: pasta/uuid.ext. Barra caminhos como "../../.env". */
export const FORMATO_CHAVE = /^(justificativas|despesas)\/[0-9a-f-]{36}\.(pdf|jpg|png)$/;

export const tipoPorExtensao: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
};

/** URL interna (com controle de acesso) para uma chave. */
export function urlDoArquivo(chave: string) {
  return `/api/arquivos/${chave}`;
}
