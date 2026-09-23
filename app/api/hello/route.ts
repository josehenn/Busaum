import { NextResponse } from "next/server";
import { getHello } from "@/server/hello/hello.service";

export async function GET() {
  return NextResponse.json(await getHello());
}
