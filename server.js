const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const yargs = require('yargs');
const csv = require('csv-stringify');

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

// Ensure data directory exists
const dataDir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

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

// API endpoint for saving generated data
app.post('/api/save-data', express.json(), (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `candlestick_data_${timestamp}.csv`;
    const filepath = path.join(dataDir, filename);

    // Convert data to CSV
    csv.stringify(data, {
        header: true,
        columns: ['date', 'open', 'high', 'low', 'close']
    }, (err, output) => {
        if (err) {
            console.error('Error generating CSV:', err);
            return res.status(500).json({ error: 'Failed to generate CSV' });
        }

        // Write CSV file
        fs.writeFile(filepath, output, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ error: 'Failed to save file' });
            }
            res.json({ 
                success: true, 
                filename,
                path: `/data/${filename}`
            });
        });
    });
});

// API endpoint to list available data files
app.get('/api/list-data', (req, res) => {
    fs.readdir(dataDir, (err, files) => {
        if (err) {
            console.error('Error reading data directory:', err);
            return res.status(500).json({ error: 'Failed to list data files' });
        }
        res.json(files.filter(f => f.endsWith('.csv')));
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 