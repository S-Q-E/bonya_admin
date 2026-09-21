// Minimal static server for Railway
// Serves Vite build output with SPA fallback and correct caching.
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");

// Fingerprinted assets — immutable
app.use("/assets", express.static(path.join(DIST, "assets"), {
  immutable: true,
  maxAge: "1y",
}));

// Everything else — serve, fallback to index.html for SPA routing
app.use(express.static(DIST, { index: false }));
app.get("*", (_req, res) => {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(DIST, "index.html"));
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend listening on ${PORT}`);
});