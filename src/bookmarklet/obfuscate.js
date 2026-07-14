const fs = require("fs");
const { minify } = require("uglify-js");
const JavaScriptObfuscator = require("javascript-obfuscator");

// --- Configuration ---
const rawPath = "./raw.js";
const outputFileName = "bookmarklet_final"; // We save this name, the build script handles the rest.

async function obfuscateCode() {
    try {
        // 1️⃣ Read raw source
        if (!fs.existsSync(rawPath)) {
            console.error(`\n❌ ERROR: Source file not found at ${rawPath}. Ensure raw.js is in the same directory.`);
            return null;
        }
        let code = fs.readFileSync(rawPath, "utf8");

        // 2️⃣ Minify (UglifyJS) - Capture potential error state
        console.log("--- Running UglifyJS Minification ---");
        const minifiedResult = await new Promise((resolve) => {
            minify(code, {
                compress: true, // Basic compression enabled
                mangle: true   // Rename variables aggressively
            }, (error, output) => {
                if (error) resolve({ error: error.message });
                else resolve({ code: output});
            });
        });

        let minifiedCode = minifiedResult.code;

        if (!minifiedCode && typeof minifiedResult.error === 'string') {
             console.error(`UglifyJS Error: ${minifiedResult.error}`);
             return null;
        }


        // 3️⃣ Obfuscate (aggressive preset)
        console.log("--- Running JSObfuscator ---");
        const obfuscated = JavaScriptObfuscator.obfuscate(minifiedCode, {
            compact: true,
            controlFlowFlatteningDepth: 5,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: true,
            polynomiizationKey: 'DIG_MASTER_KEY_SECRET', // Trackable key
            rotateStringArray: true,
            stringArray: true,
            stringArrayEncoding: ["base64"],
            stringArrayThreshold: 0.75
        });

        const finalCode = obfuscated.getObfuscatedCode();
        return finalCode;

    } catch (e) {
        console.error("\n🔴 FATAL ERROR during build process:", e);
        return null;
    }
}

// Main execution entry point when running this file directly
(async () => {
    const obfuscated = await obfuscateCode();
    if (obfuscated) {
        try {
            fs.writeFileSync("bookmarklet_final", obfuscated);
            console.log("\n✅ SUCCESS! Final bookmarklet generated successfully.");
            console.log(`   - Output file name: bookmarklet_final`);
        } catch (e) {
            console.error("Failed to write output file:", e);
        }
    } else {
         process.exit(1);
    }
})();

// Exporting the function for use in other parts of this module, if needed.
module.exports = { obfuscateCode };
