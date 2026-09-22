async function getHello() {
  try {
    const res = await fetch(`${process.env.API_URL}/api/hello`, { cache: "no-store" });
    const data = await res.json();
    return data.message as string;
  } catch {
    return "Backend fora do ar";
  }
}

export default async function Home() {
  const message = await getHello();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-4xl font-bold">{message}</h1>
      <p className="text-gray-500">Frontend e backend conversando</p>
    </main>
  );
}
