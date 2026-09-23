import { getHello } from "@/server/hello/hello.service";

export default async function Home() {
  const { message } = await getHello();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-4xl font-bold">{message}</h1>
      <p className="text-gray-500">Next.js full stack: UI e API no mesmo projeto</p>
    </main>
  );
}
