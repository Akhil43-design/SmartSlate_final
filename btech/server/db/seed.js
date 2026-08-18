const sharedSeed = require('../../../shared/db/seed');
const localDb = require('./database');

module.exports = {
    seed: () => sharedSeed.seed(localDb)
};
