const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "v1.0.0";

app.get('/', (req, res) => {
    res.send(`<h1>Application Running - Version: ${VERSION}</h1>`);
});

// Deployment verification health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", version: VERSION });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (Version: ${VERSION})`);
});
