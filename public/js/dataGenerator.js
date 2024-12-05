class DataGenerator {
    constructor() {
        this.basePrice = 1000;
        this.volatility = 0.02;
    }

    generateCandlestickData(days = 100) {
        const data = [];
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < days; i++) {
            const open = this.basePrice * (1 + (Math.random() - 0.5) * this.volatility);
            const high = open * (1 + Math.random() * this.volatility);
            const low = open * (1 - Math.random() * this.volatility);
            const close = (high + low) / 2 + (Math.random() - 0.5) * (high - low);

            data.push({
                date: new Date(currentDate - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                open: open.toFixed(2),
                high: high.toFixed(2),
                low: low.toFixed(2),
                close: close.toFixed(2)
            });
        }

        return data.reverse();
    }

    async saveToCSV(data) {
        try {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save data');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataGenerator;
} 