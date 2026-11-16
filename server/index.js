import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

// Modular Route Handlers
import categoriesRouter from "./routes/categories.js";
import bahanRouter from "./routes/bahan.js";
import productsRouter from "./routes/products.js";
import employeesRouter from "./routes/employees.js";
import jasaRouter from "./routes/jasa.js";
import mutasiBahanRouter from "./routes/mutasiBahan.js";
import antreanRouter from "./routes/antrean.js";
import mutasiGudangJadiRouter from "./routes/mutasiGudangJadi.js";
import sizesRouter from "./routes/sizes.js";
import pembayaranUpahRouter from "./routes/pembayaranUpah.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    system: "Konveksi Management API",
    time: new Date().toISOString(),
  });
});

// Mount Domain Routes
app.use("/api/categories", categoriesRouter);
app.use("/api/bahan", bahanRouter);
app.use("/api/products", productsRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/tahapan", (req, res) => res.json([]));
app.use("/api/jasa", jasaRouter);
app.use("/api/mutasi-bahan", mutasiBahanRouter);
app.use("/api/antrean", antreanRouter);
app.use("/api/mutasi-gudang-jadi", mutasiGudangJadiRouter);
app.use("/api/sizes", sizesRouter);
app.use("/api/pembayaran-upah", pembayaranUpahRouter);

// Static Frontend Serve & SPA Fallback (Produksi VPS - Express 4 & 5 Compatible)
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) next();
    });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Server Error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start Server (Port 3001)
app.listen(PORT, () => {
  console.log(`🚀 Server API Konveksi aktif di http://localhost:${PORT}`);
});
