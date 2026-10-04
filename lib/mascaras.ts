// Formatação de documentos e telefones. O banco guarda só os dígitos; a máscara
// é coisa da tela.

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** "52998224725" → "529.982.247-25" (formata também enquanto se digita). */
export function formatarCpf(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** "52998224725" → "***.982.247-**": identifica sem expor o documento. */
export function mascararCpf(cpf: string) {
  const d = apenasDigitos(cpf);
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/** "48991010001" → "(48) 99101-0001"; com 10 dígitos, "(48) 3333-4444". */
export function formatarTelefone(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const meio = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, meio)}-${resto.slice(meio)}`;
}
