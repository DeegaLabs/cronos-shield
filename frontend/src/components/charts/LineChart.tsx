import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

interface LineChartProps {
  labels: string[]
  data: number[]
  color: string
  title?: string
  yAxisLabel?: string
  max?: number
}

export const LineChart = ({
  labels,
  data,
  color,
  title,
  yAxisLabel,
  max,
}: LineChartProps) => {
  const chartData = {
    labels,
    datasets: [{
      label: title,
      data,
      borderColor: color,
      backgroundColor: `${color}1a`, // 10% opacity
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(148, 163, 184, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { 
          color: '#94a3b8',
          callback: yAxisLabel ? function(this: any, tickValue: string | number) {
            return `${tickValue}${yAxisLabel}`
          } : undefined,
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
    },
  }

  return (
    <div className="h-[300px] w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
