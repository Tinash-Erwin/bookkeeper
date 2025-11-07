import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import { config } from "./config.js";
import { apiRouter } from "./routes/index.js";
import { logger } from "./utils/logger.js";

const app = express();

const allowedOrigins = config.FRONTEND_ORIGIN.split(",").map((origin: string) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err: error }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "BrenKeeper API listening");
});
