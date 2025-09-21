document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://localhost:8000';
    
    google.charts.load('current', {'packages':['table', 'corechart']});
    google.charts.setOnLoadCallback(() => {
        initializeDashboard();
        setInterval(initializeDashboard, 60000); // refresh every minute
    });

    // initialize the dashboard
    async function initializeDashboard() {
        try {
            const [alerts, dailyCounts] = await Promise.all([
                fetch(`${API_BASE_URL}/active-alerts`).then(res => res.json()),
                fetch(`${API_BASE_URL}/daily-counts`).then(res => res.json())
            ]);

            createTable(alerts);
            createChart(dailyCounts);
            updateLastUpdated();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            document.getElementById('table-container').innerText = 'Error loading data.';
            document.getElementById('chart-container').innerText = 'Error loading data.';
        }
    }

    // data grid for active alerts
    function createTable(alerts) {
        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Timestamp');
        data.addColumn('string', 'Motor ID');
        data.addColumn('string', 'Sensor');
        data.addColumn('number', 'Value');
        
        alerts.forEach(alert => {
            data.addRow([
                new Date(alert.timestamp).toLocaleString(),
                String(alert.motor_id), 
                String(alert.sensor_type), 
                Number(alert.value)
            ]);
        });

        const table = new google.visualization.Table(document.getElementById('table-container'));
        table.draw(data, {showRowNumber: true, width: '100%', height: '100%'});
    }

    // bar chart for daily alert counts
    function createChart(dailyCounts) {
        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Date');
        data.addColumn('number', 'Count');
        
        dailyCounts.forEach(item => {
            data.addRow([item.date, item.count]);
        });

        const options = {
            legend: { position: 'none' },
            fontName: 'Consolas',
        };

        const chart = new google.visualization.ColumnChart(document.getElementById('chart-container'));
        chart.draw(data, options);
    }
    
    function updateLastUpdated() {
        const now = new Date();
        document.getElementById('last-updated').textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
});