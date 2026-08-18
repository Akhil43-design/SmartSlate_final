const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Mount Local SQLite API
const localRoutes = require('./backend/routes/local.cjs');
app.use('/api/local', localRoutes);

const connectionsRoutes = require('../shared/routes/connections');
app.use('/api/connections', connectionsRoutes);
app.use('/api/student/connections', connectionsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'smartslate-elementary-backend' });
});

app.listen(PORT, () => {
    console.log(`[SQLite Elementary Backend] Running on http://localhost:${PORT}`);
});
