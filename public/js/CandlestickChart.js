class CandlestickChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.selectionManager = new SelectionManager();
        this.dataPoints = [];
        this.navigatorPoints = [];
        
        // Default options that can be overridden
        this.options = {
            title: options.title || "Candlestick Chart",
            dateFormat: options.dateFormat || "MM/dd/yyyy",
            pricePrefix: options.pricePrefix || "$",
            timeRange: options.timeRange || {
                minimum: null,
                maximum: null
            },
            onSave: options.onSave || this.defaultSaveHandler,
            height: options.height || "60vh",
            risingColor: options.risingColor || "#008000",        // Green by default
            fallingColor: options.fallingColor || "#FF0000",      // Red by default
            highlightColor: options.highlightColor || "#00FF00"   // Bright green by default
        };

        this.initialize();
    }

    initialize() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.style.height = this.options.height;
            container.style.width = '100%';
        }

        this.chart = new CanvasJS.StockChart(this.containerId, {
            theme: "light2",
            exportEnabled: true,
            title: {
                text: this.options.title
            },
            charts: [{
                axisY: {
                    prefix: this.options.pricePrefix
                },
                zoomEnabled: false,
                panEnabled: true,
                toolTip: {
                    enabled: false
                },
                data: [{
                    type: "candlestick",
                    yValueFormatString: this.options.pricePrefix + "#,###.00",
                    dataPoints: this.dataPoints,
                    risingColor: this.options.risingColor,          // Add rising color
                    fallingColor: this.options.fallingColor,        // Add falling color
                    highlightEnabled: true,                         // Enable highlighting
                    highlightColor: this.options.highlightColor,    // Add highlight color
                    click: (e) => {
                        if (this.selectionManager.isCtrlPressed) {
                            this.chart.charts[0].set("panEnabled", false);
                            this.selectionManager.togglePoint(e.dataPoint, this.chart.charts[0].data[0]);
                        }
                    }
                }]
            }],
            navigator: {
                data: [{
                    color: "#6D78AD",
                    dataPoints: this.navigatorPoints
                }],
                slider: {
                    minimum: this.options.timeRange.minimum,
                    maximum: this.options.timeRange.maximum
                }
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        const chartContainer = document.getElementById(this.containerId);
        
        // Mouse event listeners for drag selection
        chartContainer.addEventListener('mousedown', (e) => {
            if (this.selectionManager.isCtrlPressed) {
                e.preventDefault();
                e.stopPropagation();
                this.chart.charts[0].set("panEnabled", false);
                
                const rect = chartContainer.getBoundingClientRect();
                const plotArea = this.chart.charts[0].plotArea;
                
                // Calculate position relative to plot area
                const x = e.clientX; // - rect.left - plotArea.x1;
                const y = e.clientY; // - rect.top - plotArea.y1;
                
                this.selectionManager.startDrag(x, y);
            }
        }, true);

        document.addEventListener('mousemove', (e) => {
            if (this.selectionManager.isCtrlPressed && this.selectionManager.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this.chart.charts[0].set("panEnabled", false);
                
                const rect = chartContainer.getBoundingClientRect();
                const plotArea = this.chart.charts[0].plotArea;
                
                // Calculate position relative to plot area
                const x = e.clientX; // - rect.left - plotArea.x1;
                const y = e.clientY; // - rect.top - plotArea.y1;
                
                this.selectionManager.updateDrag(x, y);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.selectionManager.isCtrlPressed && this.selectionManager.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                
                const rect = chartContainer.getBoundingClientRect();
                const plotArea = this.chart.charts[0].plotArea;
                
                // Calculate position relative to plot area
                const x = e.clientX; // - rect.left - plotArea.x1;
                const y = e.clientY; // - rect.top - plotArea.y1;
                
                this.selectionManager.endDrag(this.chart.charts[0].data[0], x, y);
            }
            if (!this.selectionManager.isCtrlPressed) {
                this.chart.charts[0].set("panEnabled", true);
            }
        });

        // Keyboard event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control') {
                this.chart.charts[0].set("panEnabled", false);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                this.chart.charts[0].set("panEnabled", true);
            }
        });

        // Button event listeners
        document.getElementById('clearSelection')?.addEventListener('click', () => {
            this.selectionManager.clearSelection(this.chart.charts[0].data[0]);
        });

        document.getElementById('saveSelection')?.addEventListener('click', async () => {
            try {
                const selectedData = await this.selectionManager.saveSelection(this.chart.charts[0].data[0]);
                this.options.onSave(selectedData);
            } catch (error) {
                console.error('Error saving selection:', error);
            }
        });
    }

    loadData(data) {
        if (!data || !Array.isArray(data)) {
            console.error('Invalid data format');
            return;
        }

        this.dataPoints.length = 0;  // Clear existing data
        this.navigatorPoints.length = 0;

        data.forEach(item => {
            const date = new Date(item.date);
            const candlestick = {
                x: date,
                y: [
                    Number(item.open),
                    Number(item.high),
                    Number(item.low),
                    Number(item.close)
                ]
            };
            this.dataPoints.push(candlestick);
            this.navigatorPoints.push({
                x: date,
                y: Number(item.close)
            });
        });

        // Set the data directly
        this.chart.options.charts[0].data[0].dataPoints = this.dataPoints;
        this.chart.options.navigator.data[0].dataPoints = this.navigatorPoints;

        // Update time range if not set
        if (!this.options.timeRange.minimum) {
            this.chart.options.navigator.slider.minimum = this.dataPoints[0].x;
            this.chart.options.navigator.slider.maximum = this.dataPoints[this.dataPoints.length - 1].x;
        }

        this.chart.render();
    }

    defaultSaveHandler(selectedData) {
        console.log('Selected dates:', selectedData);
    }

    getSelectedData() {
        const selectedPoints = this.selectionManager.getSelectedPoints(this.chart.charts[0].data[0]);
        // Transform the data to only return formatted dates
        return selectedPoints.map(point => {
            const date = point.x;
            return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
        });
    }
} 