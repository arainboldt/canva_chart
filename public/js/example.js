// Example usage
const chart = new CandlestickChart('chartContainer', {
    title: "Custom Candlestick Chart",
    pricePrefix: "€",
    timeRange: {
        minimum: new Date(2023, 0, 1),
        maximum: new Date(2023, 11, 31)
    },
    onSave: (selectedData) => {
        // Custom save handler
        console.log('Custom save handler:', selectedData);
    }
});

// Load data
fetch('your-data-endpoint')
    .then(response => response.json())
    .then(data => chart.loadData(data)); 