import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TIPOS_ANEXO } from "@/lib/esquemas/arquivo";
import {
  FORMATO_CHAVE,
  tipoPorExtensao,
  type ArquivoAberto,
  type IStorageService,
  type PastaDeArquivos,
} from "./storage.service";

/** Desenvolvimento: grava em ./uploads (fora do git e fora de public/). */
export class LocalStorageService implements IStorageService {
  private readonly raiz = path.join(process.cwd(), "uploads");

  async salvar(arquivo: File, pasta: PastaDeArquivos) {
    const chave = `${pasta}/${randomUUID()}${TIPOS_ANEXO[arquivo.type]}`;
    const destino = path.join(this.raiz, chave);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, Buffer.from(await arquivo.arrayBuffer()));
    return chave;
  }

  async abrir(chave: string): Promise<ArquivoAberto | null> {
    if (!FORMATO_CHAVE.test(chave)) return null;
    try {
      const corpo = await readFile(path.join(this.raiz, chave));
      return { corpo: new Uint8Array(corpo), tipo: tipoPorExtensao[chave.split(".").pop()!] };
    } catch {
      return null;
    }
  }
}
