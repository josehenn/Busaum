export type Hello = {
  message: string;
};

export async function getHello(): Promise<Hello> {
  return { message: "Hello, BUSAUM!" };
}
