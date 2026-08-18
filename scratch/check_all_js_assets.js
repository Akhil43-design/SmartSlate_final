const fs = require('fs');
const path = require('path');

const publicDir = 'f:/smartSlate/parent-teacher/public';

function walkDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(walkDir(fullPath));
        } else if (/\.(html|js|css)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

const allFiles = walkDir(publicDir);
const assetRegex = /["'`]((\/(?:assets|css|js|shared)\/[^"'`\s\?]+))(?:\?[^"'`\s]*)?["'`]/g;

const foundAssets = new Set();
for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = assetRegex.exec(content)) !== null) {
        foundAssets.add(match[1]);
    }
}

let missing = 0;
console.log(`Found ${foundAssets.size} unique asset references across all frontend files:\n`);
for (const assetPath of Array.from(foundAssets).sort()) {
    const rel = assetPath.replace(/^\//, '');
    const diskPath = path.join(publicDir, rel);
    const exists = fs.existsSync(diskPath);
    console.log((exists ? '✅' : '❌ [404]') + ' ' + assetPath);
    if (!exists) missing++;
}

console.log(`\n=================================================`);
console.log(`TOTAL MISSING / 404 ASSETS: ${missing}`);
console.log(`=================================================`);
