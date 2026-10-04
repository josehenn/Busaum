/**
 * Só aceita caminhos internos ("/admin/alunos"). Barra "//site.com" e "/\site.com"
 * (o navegador trata como outro domínio) e URLs absolutas: sem isto, um link
 * /login?proxima=https://golpe.com mandaria a vítima para fora depois do login.
 */
export function caminhoInterno(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.startsWith("/")) return null;
  if (valor.startsWith("//") || valor.startsWith("/\\")) return null;
  return valor;
}
