class SelectionManager {
    constructor() {
        this.selectedPoints = new Set();
        this.isCtrlPressed = false;
        this.isDragging = false;
        this.dragStartX = null;
        this.dragStartY = null;
        this.dragRect = null;
        
        this.setupKeyboardListeners();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                e.preventDefault();
                e.stopPropagation();
                this.isCtrlPressed = true;
                const chartContainer = document.getElementById('chartContainer');
                if (chartContainer) {
                    chartContainer.style.cursor = 'crosshair !important';
                    const style = document.createElement('style');
                    style.id = 'cursor-style';
                    style.textContent = '#chartContainer, #chartContainer * { cursor: crosshair !important; }';
                    document.head.appendChild(style);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                this.isCtrlPressed = false;
                this.isDragging = false;
                const chartContainer = document.getElementById('chartContainer');
                if (chartContainer) {
                    chartContainer.style.cursor = 'default';
                    const style = document.getElementById('cursor-style');
                    if (style) {
                        style.remove();
                    }
                }
                if (this.dragRect) {
                    document.body.removeChild(this.dragRect);
                    this.dragRect = null;
                }
            }
        });

        window.addEventListener('blur', () => {
            this.isCtrlPressed = false;
            this.isDragging = false;
            const chartContainer = document.getElementById('chartContainer');
            if (chartContainer) {
                chartContainer.style.cursor = 'default';
            }
            if (this.dragRect) {
                document.body.removeChild(this.dragRect);
                this.dragRect = null;
            }
        });
    }

    startDrag(x, y) {
        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        
        this.dragRect = document.createElement('div');
        this.dragRect.style.position = 'absolute';
        this.dragRect.style.border = '1px solid #FF9900';
        this.dragRect.style.backgroundColor = 'rgba(255, 153, 0, 0.1)';
        this.dragRect.style.pointerEvents = 'none';
        document.body.appendChild(this.dragRect);
    }

    updateDrag(x, y) {
        if (!this.isDragging || !this.dragRect) return;

        const left = Math.min(x, this.dragStartX);
        const top = Math.min(y, this.dragStartY);
        const width = Math.abs(x - this.dragStartX);
        const height = Math.abs(y - this.dragStartY);

        this.dragRect.style.left = left + 'px';
        this.dragRect.style.top = top + 'px';
        this.dragRect.style.width = width + 'px';
        this.dragRect.style.height = height + 'px';
    }

    endDrag(chart, x, y) {
        if (!this.isDragging) return;

        const left = Math.min(x, this.dragStartX);
        const right = Math.max(x, this.dragStartX);
        const top = Math.min(y, this.dragStartY);
        const bottom = Math.max(y, this.dragStartY);

        const axisX = chart.parent.axisX[0];
        const axisY = chart.parent.axisY[0];

        const startDate = axisX.convertPixelToValue(left);
        const endDate = axisX.convertPixelToValue(right);
        const highPrice = axisY.convertPixelToValue(top);
        const lowPrice = axisY.convertPixelToValue(bottom);

        chart.dataPoints.forEach(point => {
            const [open, high, low, close] = point.y;
            if (point.x >= new Date(startDate) && point.x <= new Date(endDate)) {
                if (high >= lowPrice && low <= highPrice) {
                    this.selectedPoints.add(point.x.getTime());
                }
            }
        });

        // Clean up drag rectangle
        if (this.dragRect && this.dragRect.parentNode) {
            this.dragRect.parentNode.removeChild(this.dragRect);
        }
        this.dragRect = null;
        this.isDragging = false;

        // Force immediate visual update
        this.refreshDisplay(chart.parent);
    }

    addPoint(point, chart) {
        const pointId = point.x.getTime();
        if (!this.selectedPoints.has(pointId)) {
            this.selectedPoints.add(pointId);
            point.borderColor = "#FF9900";
            point.color = "#FFB84D";
            // Force immediate render for visual feedback
            chart.parent.render();
        }
    }

    togglePoint(point, chart) {
        const pointId = point.x.getTime();
        
        if (this.selectedPoints.has(pointId)) {
            this.selectedPoints.delete(pointId);
        } else {
            this.selectedPoints.add(pointId);
        }
        
        // Force immediate visual update
        this.refreshDisplay(chart.parent);
    }

    clearSelection(chart) {
        this.selectedPoints.clear();
        // Force immediate visual update
        this.refreshDisplay(chart.parent);
    }

    refreshDisplay(chart) {
        // First reset all highlights
        chart.data[0].dataPoints.forEach(point => {
            point.borderColor = null;
            point.color = null;
        });

        // Then apply highlights to selected points
        chart.data[0].dataPoints.forEach(point => {
            const pointId = point.x.getTime();
            if (this.selectedPoints.has(pointId)) {
                point.borderColor = "#FF9900";
                point.color = "#FFB84D";
            }
        });

        // Update selection display
        const container = document.querySelector('.selection-content');
        container.innerHTML = '';

        this.selectedPoints.forEach(pointId => {
            const point = chart.data[0].dataPoints.find(p => p.x.getTime() === pointId);
            if (point) {
                const div = document.createElement('div');
                div.className = 'candlestick-item';
                div.innerHTML = `
                    Date: ${point.x.toLocaleDateString()}<br>
                    Open: $${point.y[0].toFixed(2)}<br>
                    High: $${point.y[1].toFixed(2)}<br>
                    Low: $${point.y[2].toFixed(2)}<br>
                    Close: $${point.y[3].toFixed(2)}
                `;
                container.appendChild(div);
            } else {
                this.selectedPoints.delete(pointId);
            }
        });

        // Force chart render
        chart.render();
    }

    async saveSelection(chart) {
        const selectedData = Array.from(this.selectedPoints).map(pointId => {
            const point = chart.dataPoints.find(p => p.x.getTime() === pointId);
            return {
                date: point.x,
                open: point.y[0],
                high: point.y[1],
                low: point.y[2],
                close: point.y[3]
            };
        });
        
        try {
            const response = await fetch('/api/save-selection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedData)
            });
            
            const result = await response.json();
            console.log('Save result:', result);
            return selectedData;
        } catch (error) {
            console.error('Error saving selection:', error);
            throw error;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SelectionManager;
} 