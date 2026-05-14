import path from "path";
import { fileURLToPath } from "url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      /\.vercel\.app$/,
      /localhost/,
      /\.replit\.dev$/,
      /\.replit\.app$/,
    ];
    const clientOrigin = process.env.CLIENT_ORIGIN;
    if (clientOrigin) allowed.push(new RegExp(clientOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    if (allowed.some((pattern) => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built React frontend and fall back to index.html
// for any non-/api route so the SPA router works correctly.
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // The frontend is built to artifacts/eon-browser/dist/public.
  // This file lives at artifacts/api-server/dist/index.mjs, so:
  const frontendDist = path.resolve(__dirname, "../../eon-browser/dist/public");

  app.use(express.static(frontendDist));

  app.get("(.*)", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
