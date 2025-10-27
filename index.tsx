// We are using Chart.js from a CDN, so we declare it to TypeScript to avoid errors.
declare const Chart: any;

const MAX_DATA_POINTS = 30; // Show the last 30 seconds of data

// --- Chart Configuration ---
function createChartConfig(label: string, color: string, data: number[], gradient: CanvasGradient) {
    return {
        type: 'line',
        data: {
            labels: generateInitialLabels(),
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#888', font: { family: "'Inter', sans-serif" } },
                    grid: { color: '#333' }
                },
                x: {
                    ticks: {
                        color: '#888',
                        font: { family: "'Inter', sans-serif" },
                        callback: function(value: number, index: number, ticks: any) {
                            const numericValue = this.getLabelForValue(value);
                            if (numericValue === 0) return 'Now';
                            if (numericValue % 5 === 0 && numericValue < 0) return `${numericValue}s`;
                            return ''; // Hide other labels for clarity
                        }
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            animation: {
                duration: 200, // Faster animation to make the morph less noticeable
                easing: 'linear',
            }
        }
    };
}

// --- Data Simulation ---
let cpuValue = 50 + (Math.random() - 0.5) * 20;
let memoryValue = 40 + (Math.random() - 0.5) * 10;
let diskValue = 20 + (Math.random() - 0.5) * 5;
let gpuValue = 30 + (Math.random() - 0.5) * 15;

const simulateData = () => {
    // CPU: More volatile
    cpuValue += (Math.random() - 0.5) * 15;
    cpuValue = Math.max(5, Math.min(95, cpuValue));

    // Memory: Less volatile
    memoryValue += (Math.random() - 0.48) * 4;
    memoryValue = Math.max(10, Math.min(90, memoryValue));

    // Disk: Very stable, small changes
    diskValue += (Math.random() - 0.5) * 0.5;
    diskValue = Math.max(15, Math.min(85, diskValue));

    // GPU: Volatile like CPU
    gpuValue += (Math.random() - 0.5) * 12;
    gpuValue = Math.max(5, Math.min(95, gpuValue));

    return {
        cpu: parseFloat(cpuValue.toFixed(2)),
        memory: parseFloat(memoryValue.toFixed(2)),
        disk: parseFloat(diskValue.toFixed(2)),
        gpu: parseFloat(gpuValue.toFixed(2)),
    };
};

// --- Helper Functions ---
const generateInitialData = (initialValue: number) => Array(MAX_DATA_POINTS).fill(initialValue);
const generateInitialLabels = () => Array.from({ length: MAX_DATA_POINTS }, (_, i) => i - (MAX_DATA_POINTS - 1));

const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight);
    gradient.addColorStop(0, `${color}80`); // 50% opacity
    gradient.addColorStop(1, `${color}00`); // 0% opacity
    return gradient;
};

const updateMetric = (chart: any, newData: number, percentageEl: HTMLElement) => {
    if (!chart || !percentageEl) return;
    
    // Update numerical display
    percentageEl.textContent = `${newData.toFixed(1)}%`;
    
    // Shift data - remove the first element and add the new one at the end.
    const dataArray = chart.data.datasets[0].data;
    dataArray.shift();
    dataArray.push(newData);
    
    // The labels array remains static: [-29, -28, ..., 0].
    // Chart.js smoothly animates the data shifting along this static axis.
    // This avoids the jerky animation caused by recalculating labels on every frame.
    chart.update();
};


// --- Main Execution ---
function initializeDashboard() {
    const cpuCanvas = document.getElementById('cpu-chart') as HTMLCanvasElement;
    const memoryCanvas = document.getElementById('memory-chart') as HTMLCanvasElement;
    const diskCanvas = document.getElementById('disk-chart') as HTMLCanvasElement;
    const gpuCanvas = document.getElementById('gpu-chart') as HTMLCanvasElement;

    const cpuPercentageEl = document.getElementById('cpu-percentage') as HTMLElement;
    const memoryPercentageEl = document.getElementById('memory-percentage') as HTMLElement;
    const diskPercentageEl = document.getElementById('disk-percentage') as HTMLElement;
    const gpuPercentageEl = document.getElementById('gpu-percentage') as HTMLElement;

    if (!cpuCanvas || !memoryCanvas || !diskCanvas || !gpuCanvas) {
        console.error("One or more canvas elements not found!");
        return;
    }

    const cpuCtx = cpuCanvas.getContext('2d')!;
    const memoryCtx = memoryCanvas.getContext('2d')!;
    const diskCtx = diskCanvas.getContext('2d')!;
    const gpuCtx = gpuCanvas.getContext('2d')!;

    const cpuChart = new Chart(cpuCtx, createChartConfig('CPU', '#00aaff', generateInitialData(cpuValue), createGradient(cpuCtx, '#00aaff')));
    const memoryChart = new Chart(memoryCtx, createChartConfig('Memory', '#00ffaa', generateInitialData(memoryValue), createGradient(memoryCtx, '#00ffaa')));
    const diskChart = new Chart(diskCtx, createChartConfig('Disk', '#ffaa00', generateInitialData(diskValue), createGradient(diskCtx, '#ffaa00')));
    const gpuChart = new Chart(gpuCtx, createChartConfig('GPU', '#ff40ff', generateInitialData(gpuValue), createGradient(gpuCtx, '#ff40ff')));

    setInterval(() => {
        const { cpu, memory, disk, gpu } = simulateData();
        updateMetric(cpuChart, cpu, cpuPercentageEl);
        updateMetric(memoryChart, memory, memoryPercentageEl);
        updateMetric(diskChart, disk, diskPercentageEl);
        updateMetric(gpuChart, gpu, gpuPercentageEl);
    }, 1000);
}

// Wait for the DOM to be fully loaded before initializing the charts
document.addEventListener('DOMContentLoaded', initializeDashboard);