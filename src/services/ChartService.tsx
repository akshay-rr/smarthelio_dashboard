import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
    responsive: true,
    legend: {
        display: false,
    },
    tooltips: {
        callbacks: {
            label: function(tooltipItem: any) {
                    return tooltipItem.yLabel;
            }
        }
    },
    plugins: {
        legend: {
        position: 'top' as const,
        }
    },
};

export const Graph = (props: { x: number[], y: number[], label: string}) => {

    const {x, y, label} = props;
    const dates = x.map((element) => (new Date(element*1000)).toDateString());

    const data = {
        labels: dates,
        datasets: [
          {
            label: label,
            data: y,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
    };

    return (
        <Line options={options} data={data} />
    )
}
