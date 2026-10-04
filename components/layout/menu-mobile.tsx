"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";
import { nomeDaArea, type Area } from "./navegacao";

export function MenuMobile({ area }: { area: Area }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>BUSAUM · {nomeDaArea[area]}</SheetTitle>
        </SheetHeader>
        <div className="px-3">
          <NavLinks area={area} aoNavegar={() => setAberto(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
