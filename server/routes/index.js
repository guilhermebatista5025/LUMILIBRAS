import { Router } from "express";
import authRouter from "./auth.js";
import profileRouter from "./profile.js";
import gameRouter from "./game.js";
import storeRouter from "./store.js";
import abilitiesRouter from "./abilities.js";
import socialRouter from "./social.js";

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
router.use("/profile", profileRouter);
router.use("/game", gameRouter);
router.use("/store", storeRouter);
router.use("/abilities", abilitiesRouter);
router.use("/social", socialRouter);

export default router;
