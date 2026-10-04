import { Badge } from "@/components/ui/badge";
import { StatusAluno } from "@/lib/generated/prisma/enums";
import { rotuloStatusAluno } from "@/lib/rotulos";

const variante = {
  [StatusAluno.ATIVO]: "default",
  [StatusAluno.TRANCADO]: "secondary",
  [StatusAluno.INATIVO]: "outline",
} as const;

export function StatusAlunoBadge({ status }: { status: StatusAluno }) {
  return <Badge variant={variante[status]}>{rotuloStatusAluno[status]}</Badge>;
}
