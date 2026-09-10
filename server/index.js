import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import apiRouter from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((request, response, next) => {
  const unsafeMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const requestOrigin = request.get("origin");

  if (unsafeMethod && requestOrigin && requestOrigin !== clientOrigin) {
    return response.status(403).json({
      error: "Origem da solicitação não permitida.",
      code: "INVALID_ORIGIN",
    });
  }

  return next();
});

app.use("/api", apiRouter);

app.use((request, response) => {
  response.status(404).json({
    error: "Rota não encontrada",
    path: request.originalUrl,
  });
});

app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  const code = error.code || "INTERNAL_ERROR";

  if (!error.code) console.error(error);

  response.status(status).json({
    error: error.code
      ? error.message
      : "Erro interno do servidor. Tente novamente mais tarde.",
    code,
  });
});

app.listen(port, () => {
  console.log(`LumiLibras API disponível em http://localhost:${port}`);
});
