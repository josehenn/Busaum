import { Badge } from "@/components/ui/badge";
import { StatusVeiculo } from "@/lib/generated/prisma/enums";
import { rotuloStatusVeiculo } from "@/lib/rotulos";

const variante = {
  [StatusVeiculo.ATIVO]: "default",
  [StatusVeiculo.MANUTENCAO]: "secondary",
  [StatusVeiculo.INATIVO]: "outline",
} as const;

export function StatusVeiculoBadge({ status }: { status: StatusVeiculo }) {
  return <Badge variant={variante[status]}>{rotuloStatusVeiculo[status]}</Badge>;
}
