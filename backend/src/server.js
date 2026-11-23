import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import cors from "cors";
import express from "express";
import { connectDB, getDbStatus } from "./config/db.js";
import { apiRouter } from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/api", apiRouter);

// Start server and handle DB connection gracefully
async function startServer() {
  if (process.env.NODE_ENV !== "test") {
    try {
      await connectDB();
    } catch (err) {
      console.warn("[Server] DB connection note:", err.message);
    }
  }

  const server = app.listen(PORT, () => {
    const mode = getDbStatus() ? "MongoDB Atlas" : "High-Performance Persistent Store";
    console.log(`[Backend] Server listening on http://localhost:${PORT}`);
    console.log(`[Backend] Storage engine: ${mode}`);
    console.log(`[Backend] Healthcheck: http://localhost:${PORT}/api/health`);
  });

  return server;
}

// Start automatically only when run directly as main entry point
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("/server.js");
if (isMain && process.env.NODE_ENV !== "test") {
  startServer();
}

export { startServer, app };
export default app;
