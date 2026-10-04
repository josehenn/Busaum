// Regras de anexo (atestado, comprovante), usadas na tela e no servidor.

export const TIPOS_ANEXO: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};
export const TAMANHO_MAX_ANEXO = 5 * 1024 * 1024; // 5 MB
export const ACEITA_ANEXO = Object.keys(TIPOS_ANEXO).join(",");

/** Mensagem de erro do arquivo, ou null se está tudo certo. */
export function erroDoAnexo(arquivo: { size: number; type: string } | null | undefined, obrigatorio: boolean) {
  if (!arquivo || arquivo.size === 0) return obrigatorio ? "Anexe o comprovante." : null;
  if (!TIPOS_ANEXO[arquivo.type]) return "Envie um PDF, JPG ou PNG.";
  if (arquivo.size > TAMANHO_MAX_ANEXO) return "O arquivo pode ter no máximo 5 MB.";
  return null;
}
