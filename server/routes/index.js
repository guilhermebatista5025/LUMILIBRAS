import { Router } from "express";
import authRouter from "./auth.js";

const router = Router();

router.get("/", (_request, response) => {
  response.json({
    name: "LumiLibras API",
    version: "1.0.0",
  });
});

router.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRouter);

export default router;
