const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const yargs = require('yargs');

// Parse command line arguments
const argv = yargs
    .option('logging', {
        alias: 'l',
        description: 'Enable logging to log.txt',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', 'h')
    .argv;

const app = express();
const port = process.env.PORT || 3000;

// Setup logging if enabled
if (argv.logging) {
    // Create a write stream for logging
    const accessLogStream = fs.createWriteStream(
        path.join(__dirname, 'log.txt'), 
        { flags: 'a' }
    );
    
    // Custom logging format
    const logFormat = ':timestamp :method :url :status :response-time ms';
    morgan.token('timestamp', () => new Date().toISOString());
    
    // Use morgan for logging
    app.use(morgan(logFormat, { stream: accessLogStream }));
    console.log('Logging enabled - writing to log.txt');
}

// Serve static files
app.use(express.static('public'));

// API endpoint for saving selections
app.post('/api/save-selection', express.json(), (req, res) => {
    const selection = req.body;
    const timestamp = new Date().toISOString();
    
    if (argv.logging) {
        fs.appendFileSync(
            path.join(__dirname, 'log.txt'),
            `${timestamp} - Selection saved: ${JSON.stringify(selection)}\n`
        );
    }
    
    res.json({ success: true, message: 'Selection saved' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 