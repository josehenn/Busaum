import Link from "next/link";
import { BusIcon } from "lucide-react";

export function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <BusIcon className="size-4" />
      </span>
      BUSAUM
    </Link>
  );
}
