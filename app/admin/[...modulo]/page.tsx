// Captura os itens do menu que ainda não têm página. Cada módulo, ao criar a sua
// (ex.: app/admin/veiculos/page.tsx), passa na frente desta rota automaticamente.
import { EmConstrucao } from "@/components/layout/em-construcao";

export default function ModuloEmConstrucao() {
  return <EmConstrucao />;
}
