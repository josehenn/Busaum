import express from "express";

const app = express();
app.use(express.json());

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello, BUSAUM!" });
});

const port = Number(process.env.PORT) || 3333;
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
