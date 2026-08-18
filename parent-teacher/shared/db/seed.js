const path = require('path');
const fs = require('fs');

const candidateSeedPaths = [
    path.resolve(__dirname, '../../../shared/db/seed'),
    path.resolve(__dirname, '../../shared/db/seed'),
    path.resolve(__dirname, '../db/seed')
];

let sharedSeed = null;
for (const sp of candidateSeedPaths) {
    if (fs.existsSync(sp + '.js') || fs.existsSync(sp)) {
        sharedSeed = require(sp);
        break;
    }
}

module.exports = sharedSeed || { seed: () => Promise.resolve() };
