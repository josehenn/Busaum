import { LocalStorageService } from "./local-storage.service";
import type { IStorageService } from "./storage.service";
import { VercelBlobStorageService } from "./vercel-blob-storage.service";

/** Com o token do Blob (produção na Vercel), usa o Blob; senão, disco local. */
export const storageService: IStorageService = process.env.BLOB_READ_WRITE_TOKEN
  ? new VercelBlobStorageService()
  : new LocalStorageService();

export { urlDoArquivo } from "./storage.service";
