document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://localhost:8000';

    google.charts.load('current', {'packages':['table', 'corechart']});
    google.charts.setOnLoadCallback(() => {
        refreshDashboard();
        setInterval(refreshDashboard, 60000); // refresh every minute
    });

    // fetch JSON from the dashboard API
    async function fetchJson(path) {
        const res = await fetch(`${API_BASE_URL}${path}`);
        if (!res.ok) throw new Error(`${path} returned ${res.status}`);
        return res.json();
    }

    // fetch/update table and chart
    async function refreshDashboard() {
        try {
            const [alerts, dailyCounts] = await Promise.all([
                fetchJson('/active-alerts'),
                fetchJson('/daily-counts')
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
        data.addColumn('string', 'Timestamp (UTC)');
        data.addColumn('string', 'Motor ID');
        data.addColumn('string', 'Sensor');
        data.addColumn('number', 'Value');

        alerts.forEach(alert => {
            data.addRow([
                new Date(alert.timestamp).toLocaleString(undefined, { timeZone: 'UTC' }),
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
        data.addColumn('string', 'Date (UTC)');
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
