
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, "../../.env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// Allow overrides via the current working directory (e.g. during local development)
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8080),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
