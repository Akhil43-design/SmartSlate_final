const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            checkDir(full);
        } else if (f.endsWith('.js')) {
            try {
                execSync(`node -c "${full}"`);
                console.log(`✅ OK: ${f}`);
            } catch (err) {
                console.error(`❌ SYNTAX ERROR: ${full}`);
                process.exit(1);
            }
        }
    }
}

console.log("Checking parent-teacher/public/js syntax...");
checkDir(path.join(__dirname, '../parent-teacher/public/js'));
console.log("\nAll JS files passed syntax validation!");
