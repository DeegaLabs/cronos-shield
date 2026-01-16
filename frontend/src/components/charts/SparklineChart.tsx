import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
)

interface SparklineChartProps {
  data: number[]
  color: string
}

export const SparklineChart = ({ data, color }: SparklineChartProps) => {
  const chartData = {
    labels: Array(data.length).fill(''),
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: `${color}1a`, // 10% opacity
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
      fill: true,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
  }

  return (
    <div className="h-10 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
