import {
  BusIcon,
  CalendarDaysIcon,
  FileCheckIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  ReceiptIcon,
  RouteIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

export type Area = "admin" | "aluno";

export type ItemNavegacao = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
};

export const navegacao: Record<Area, ItemNavegacao[]> = {
  admin: [
    { href: "/admin", rotulo: "Painel", icone: LayoutDashboardIcon },
    { href: "/admin/veiculos", rotulo: "Veículos", icone: BusIcon },
    { href: "/admin/alunos", rotulo: "Alunos", icone: UsersIcon },
    { href: "/admin/pontos", rotulo: "Pontos", icone: MapPinIcon },
    { href: "/admin/rotas", rotulo: "Rotas e planos", icone: RouteIcon },
    { href: "/admin/viagens", rotulo: "Viagens", icone: CalendarDaysIcon },
    { href: "/admin/justificativas", rotulo: "Justificativas", icone: FileCheckIcon },
    { href: "/admin/mensalidades", rotulo: "Mensalidades", icone: WalletIcon },
    { href: "/admin/despesas", rotulo: "Despesas", icone: ReceiptIcon },
  ],
  aluno: [
    { href: "/aluno", rotulo: "Início", icone: LayoutDashboardIcon },
    { href: "/aluno/viagens", rotulo: "Minhas viagens", icone: CalendarDaysIcon },
    { href: "/aluno/justificativas", rotulo: "Justificativas", icone: FileCheckIcon },
    { href: "/aluno/mensalidades", rotulo: "Mensalidades", icone: WalletIcon },
  ],
};

export const nomeDaArea: Record<Area, string> = {
  admin: "Administração",
  aluno: "Área do aluno",
};
