import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import apiRouter from "./routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

// ─── Global Middleware ───────────────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────────────

app.use("/api", apiRouter);

// ─── Global Error Handler (must be last) ─────────────────────────

app.use(errorHandler);

export default app;
