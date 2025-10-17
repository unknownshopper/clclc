// Histórico: Resultados globales por mes

function obtenerMesesUltimos(n = 12) {
  const meses = [];
  const ahora = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    meses.push(`${año}-${mes}`);
  }
  return meses;
}

function calcularKPIGlobalMesConFiltros(mes) {
  // Usa las funciones existentes para respetar roles y publicación
  if (typeof obtenerEvaluacionesDelMes !== 'function') return { kpi: 0, count: 0 };
  if (typeof filtrarDatosPorRol !== 'function') return { kpi: 0, count: 0 };

  const todas = obtenerEvaluacionesDelMes(mes) || [];
  const filtradas = filtrarDatosPorRol(todas) || [];

  const count = filtradas.length;
  if (count === 0) return { kpi: 0, count: 0 };

  // kpi viene 0..1 en script.js; convertimos a porcentaje 0..100 para la gráfica
  const sum = filtradas.reduce((acc, ev) => acc + ((ev.kpi || 0) * 100), 0);
  return { kpi: Math.round(sum / count), count };
}

function renderHistorico() {
  const container = document.getElementById('historico');
  if (!container) return;

  const meses = obtenerMesesUltimos(12);
  const resultados = meses.map(m => ({
    mes: m,
    label: (typeof formatearMesLegible === 'function' ? formatearMesLegible(m) : m),
    res: calcularKPIGlobalMesConFiltros(m)
  }));

  // Filtrar meses sin evaluaciones
  const filtrados = resultados.filter(r => r.res.count > 0);
  const labels = filtrados.map(r => r.label);
  const datos = filtrados.map(r => r.res.kpi);
  const counts = filtrados.map(r => r.res.count);

  const html = `
    <div style="margin-bottom: 20px;">
      <h2 style="color:#0077cc; text-align:center;">Histórico - Resultados Globales por Mes</h2>
      <p style="text-align:center; color:#666;">Promedio de KPI (según permisos) de todas las entidades evaluadas</p>
    </div>
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <canvas id="graficoHistorico" width="800" height="380" style="max-width:100%;"></canvas>
    </div>
  `;

  container.innerHTML = html;

  const canvas = document.getElementById('graficoHistorico');
  if (!canvas) return;

  // Si no hay datos tras filtrar, mostrar mensaje amigable
  if (!labels.length) {
    container.innerHTML += `
      <div style="margin-top:16px; padding:16px; background:#f8f9fa; border-radius:8px; color:#666; text-align:center;">
        No hay meses con evaluaciones para mostrar en el histórico.
      </div>`;
    return;
  }

  if (window.Chart) {
    const ctx = canvas.getContext('2d');

    // Gradiente moderno
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(10,132,255,0.35)');
    gradient.addColorStop(1, 'rgba(10,132,255,0.06)');

    // Rango dinámico para dramatizar diferencias
    const minVal = Math.min(...datos);
    const maxVal = Math.max(...datos);
    const padding = 5;
    const yMin = Math.max(0, Math.floor((minVal - padding) / 5) * 5);
    const yMax = Math.min(100, Math.ceil((maxVal + padding) / 5) * 5);

    // Colores por umbral (verde ≥95, amarillo 90–94, rojo <90)
    const pointColors = datos.map(v => {
      if (v >= 95) return '#22c55e'; // verde
      if (v >= 90) return '#f59e0b'; // amarillo
      return '#ef4444'; // rojo
    });
    const pointBorders = pointColors.map(c => '#ffffff');

    // Plugin sombra para dramatismo
    const shadowLine = {
      id: 'shadowLine',
      beforeDatasetsDraw(chart, args, pluginOptions) {
        const {ctx, chartArea: {top, bottom}} = chart;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
        ctx.lineJoin = 'round';
      },
      afterDatasetsDraw(chart) {
        chart.ctx.restore();
      }
    };

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'KPI Global (%)',
            data: datos,
            borderColor: '#0a84ff',
            backgroundColor: gradient,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointBorders,
            pointBorderWidth: 3,
            pointRadius: 7,
            pointHoverRadius: 10,
            pointHitRadius: 12,
            borderWidth: 3,
            cubicInterpolationMode: 'monotone',
            tension: 0.35,
            fill: true,
          },
          {
            label: 'Meta 95%',
            data: new Array(datos.length).fill(95),
            borderColor: '#22c55e',
            borderDash: [6, 6],
            pointRadius: 0,
            borderWidth: 2,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#2c3e50', usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (items) => items[0]?.label || '',
              label: (ctx) => {
                const idx = ctx.dataIndex;
                const val = ctx.parsed.y;
                return ` ${val}%  ·  ${counts[idx]} evals`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6b7280' }
          },
          y: {
            min: yMin,
            max: yMax,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { color: '#6b7280', callback: (v) => v + '%' }
          }
        },
        interaction: { mode: 'nearest', intersect: false },
        animation: { duration: 800, easing: 'easeOutQuart' }
      },
      plugins: [shadowLine]
    });
  } else if (typeof dibujarGraficoBarras === 'function') {
    // Fallback simple
    dibujarGraficoBarras(canvas, labels, datos);
  } else {
    console.warn('No hay función de dibujo disponible (dibujarGraficoBarras ni Chart.js)');
  }
}
