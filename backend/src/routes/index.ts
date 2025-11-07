import { Router } from "express";
import multer from "multer";
import { handleUpload } from "../uploadHandler.js";
import { handleChat } from "../chatHandler.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const apiRouter = Router();

apiRouter.post("/upload", upload.single("statement"), handleUpload);
apiRouter.post("/chat", handleChat);
