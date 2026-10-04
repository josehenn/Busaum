import { randomUUID } from "node:crypto";
import { get, put } from "@vercel/blob";
import { TIPOS_ANEXO } from "@/lib/esquemas/arquivo";
import {
  FORMATO_CHAVE,
  type ArquivoAberto,
  type IStorageService,
  type PastaDeArquivos,
} from "./storage.service";

/**
 * Produção: Vercel Blob com acesso PRIVADO — o arquivo só sai pelo nosso
 * /api/arquivos, que confere a sessão. Usa BLOB_READ_WRITE_TOKEN, injetado
 * pela Vercel ao conectar um Blob store ao projeto.
 */
export class VercelBlobStorageService implements IStorageService {
  async salvar(arquivo: File, pasta: PastaDeArquivos) {
    const chave = `${pasta}/${randomUUID()}${TIPOS_ANEXO[arquivo.type]}`;
    await put(chave, arquivo, {
      access: "private",
      contentType: arquivo.type,
      addRandomSuffix: false,
    });
    return chave;
  }

  async abrir(chave: string): Promise<ArquivoAberto | null> {
    if (!FORMATO_CHAVE.test(chave)) return null;
    const resultado = await get(chave, { access: "private" });
    if (!resultado || resultado.statusCode !== 200) return null;
    return { corpo: resultado.stream, tipo: resultado.blob.contentType };
  }
}
