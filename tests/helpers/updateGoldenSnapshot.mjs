import fs from 'fs';
import path from 'path';

import capture from "./capture.mjs";

const args = process.argv.slice(2);

// Parse arguments
let outputDir = './';
let configPath = './tests/helpers/capture_config.json'; // Default config path

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
        outputDir = args[i + 1];
        i++;
    } else if (args[i] === '--config' || args[i] === '-c') {
        configPath = args[i + 1];
        i++;
    } else if (!args[i].startsWith('-')) {
        // Treat as config path
        configPath = args[i];
    }
}

// Ensure output directory exists
const resolvedOutputDir = path.resolve(outputDir);
if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
}

// Run captures
const results = await capture.capturePages(configPath);

// Write outputs
for (const { page, output } of results) {
    const basename = path.basename(page);
    const outputName = path.join(resolvedOutputDir, `${basename}`);
    fs.writeFileSync(outputName, output);
    console.log(`✅ Captured: ${outputName}`);
}

console.log('\n🎉 All done!');

