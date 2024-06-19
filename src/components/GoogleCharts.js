// components/GoogleChart.js
'use client'
import React, { useEffect, useRef } from 'react';
import Loader from 'loader';

const GoogleChart = ({ data, options, width, height }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        // Function to load Google Charts library
        const loadGoogleCharts = () => {
            if (!window.google) {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = 'https://www.gstatic.com/charts/loader.js';
                script.onload = () => {
                    google.charts.load('current', { packages: ['corechart'] });
                    google.charts.setOnLoadCallback(drawChart);
                };
                document.head.appendChild(script);
            } else {
                google.charts.load('current', { packages: ['corechart'] });
                google.charts.setOnLoadCallback(drawChart);
            }
        };

        loadGoogleCharts();
    }, []);

    const drawChart = () => {
        if (chartRef.current && data) {
            const chartData = google.visualization.arrayToDataTable(data);
            const chart = new google.visualization.PieChart(chartRef.current);
            chart.draw(chartData, options);
        }
    };

    return <div ref={chartRef} style={{ width, height }} />;
};

export default GoogleChart;