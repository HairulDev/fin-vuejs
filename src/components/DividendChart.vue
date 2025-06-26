<template>
  <Line :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const props = defineProps({
  data: { type: Array, required: true },
});

const chartData = {
  labels: props.data.map(item => {
    const dateObj = new Date(item.date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  }),
  datasets: [
    {
      label: 'Dividend History',
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      data: props.data.map(item => item.dividend),
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#1F2937',
      pointBorderWidth: 2,
      borderWidth: 2,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      display: false
    },
    tooltip: { 
      mode: 'index', 
      intersect: false,
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      titleColor: '#F9FAFB',
      bodyColor: '#F9FAFB',
      borderColor: '#6B7280',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        title: function(context) {
          return context[0].label;
        },
        label: function(context) {
          const value = context.parsed.y;
          const lastValue = props.data[props.data.length - 1]?.dividend || 0;
          return `$${value.toFixed(2)} USD`;
        },
        afterLabel: function(context) {
          const currentIndex = context.dataIndex;
          const currentValue = context.parsed.y;
          const date = new Date(props.data[currentIndex].date);
          return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          });
        }
      }
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
  scales: {
    x: { 
      display: true,
      grid: {
        display: true,
        color: 'rgba(75, 85, 99, 0.3)',
        lineWidth: 1,
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11,
        },
        maxTicksLimit: 6,
      },
      border: {
        display: false,
      }
    },
    y: {
      display: true,
      position: 'right',
      grid: {
        display: true,
        color: 'rgba(75, 85, 99, 0.3)',
        lineWidth: 1,
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11,
        },
        callback: function(value) {
          return '$' + value.toFixed(2);
        },
        precision: 2,
      },
      border: {
        display: false,
      }
    },
  },
  elements: {
    point: {
      hoverBorderWidth: 3,
    }
  },
  layout: {
    padding: {
      top: 10,
      right: 10,
      bottom: 5,
      left: 5,
    }
  }
};
</script>

<style scoped>
/* Dark theme canvas styling */
:deep(canvas) {
  background: transparent;
}

/* Container styling to match dark theme */
:deep(.chartjs-render-monitor) {
  background: transparent;
}
</style>