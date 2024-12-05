window.onload = function() {
    const selectionManager = new SelectionManager();
    let dataPoints1 = [], dataPoints2 = [];

    const stockChart = new CanvasJS.StockChart("chartContainer", {
        theme: "light2",
        exportEnabled: true,
        title: {
            text: "Ethereum Price"
        },
        charts: [{
            axisY: {
                prefix: "$"
            },
            zoomEnabled: false,
            panEnabled: true,
            data: [{
                type: "candlestick",
                yValueFormatString: "$#,###.00",
                dataPoints: dataPoints1,
                click: function(e) {
                    if (selectionManager.isCtrlPressed) {
                        stockChart.charts[0].set("panEnabled", false);
                        selectionManager.togglePoint(e.dataPoint, this);
                    }
                }
            }]
        }],
        navigator: {
            data: [{
                color: "#6D78AD",
                dataPoints: dataPoints2
            }],
            slider: {
                minimum: new Date(2018, 4, 1),
                maximum: new Date(2018, 6, 1)
            }
        }
    });

    const chartContainer = document.getElementById('chartContainer');
    
    chartContainer.addEventListener('mousedown', function(e) {
        if (selectionManager.isCtrlPressed) {
            e.preventDefault();
            e.stopPropagation();
            stockChart.charts[0].set("panEnabled", false);
            selectionManager.startDrag(e.clientX - chartContainer.getBoundingClientRect().left, 
                                    e.clientY - chartContainer.getBoundingClientRect().top);
        }
    }, true);

    document.addEventListener('mousemove', function(e) {
        if (selectionManager.isCtrlPressed && selectionManager.isDragging) {
            e.preventDefault();
            e.stopPropagation();
            stockChart.charts[0].set("panEnabled", false);
            const rect = chartContainer.getBoundingClientRect();
            selectionManager.updateDrag(e.clientX - rect.left, e.clientY - rect.top);
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (selectionManager.isCtrlPressed && selectionManager.isDragging) {
            e.preventDefault();
            e.stopPropagation();
            const rect = chartContainer.getBoundingClientRect();
            selectionManager.endDrag(stockChart.charts[0].data[0], 
                                   e.clientX - rect.left, e.clientY - rect.top);
        }
        if (!selectionManager.isCtrlPressed) {
            stockChart.charts[0].set("panEnabled", true);
        }
    });

    // Button event listeners
    document.getElementById('clearSelection').addEventListener('click', () => {
        selectionManager.clearSelection(stockChart.charts[0].data[0]);
    });

    document.getElementById('saveSelection').addEventListener('click', async () => {
        try {
            await selectionManager.saveSelection(stockChart.charts[0].data[0]);
            alert('Selection saved successfully!');
        } catch (error) {
            alert('Error saving selection');
        }
    });

    // Load initial data
    $.getJSON("https://canvasjs.com/data/docs/ethusd2018.json", function(data) {
        for(var i = 0; i < data.length; i++) {
            dataPoints1.push({
                x: new Date(data[i].date),
                y: [
                    Number(data[i].open),
                    Number(data[i].high),
                    Number(data[i].low),
                    Number(data[i].close)
                ]
            });
            dataPoints2.push({
                x: new Date(data[i].date),
                y: Number(data[i].close)
            });
        }
        stockChart.render();
    });

    // Update keyboard event listeners
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Control') {
            stockChart.charts[0].set("panEnabled", false);
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Control') {
            stockChart.charts[0].set("panEnabled", true);
        }
    });
}; 