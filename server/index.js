import app from "./app.js";

const port = Number(process.env.PORT) || 3001;
const server = app.listen(port, () => {
  console.log(`LumiLibras API disponível em http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("Erro no servidor API LumiLibras:", error);
  process.exit(1);
});
