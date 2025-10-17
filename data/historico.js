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
  if (typeof obtenerEvaluacionesDelMes !== 'function') return 0;
  if (typeof filtrarDatosPorRol !== 'function') return 0;

  const todas = obtenerEvaluacionesDelMes(mes) || [];
  const filtradas = filtrarDatosPorRol(todas) || [];

  if (filtradas.length === 0) return 0;

  // kpi viene 0..1 en script.js; convertimos a porcentaje 0..100 para la gráfica
  const sum = filtradas.reduce((acc, ev) => acc + ((ev.kpi || 0) * 100), 0);
  return Math.round(sum / filtradas.length);
}

function renderHistorico() {
  const container = document.getElementById('historico');
  if (!container) return;

  const meses = obtenerMesesUltimos(12);
  const labels = meses.map(m => (typeof formatearMesLegible === 'function' ? formatearMesLegible(m) : m));
  const datos = meses.map(m => calcularKPIGlobalMesConFiltros(m));

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

  if (typeof dibujarGraficoBarras === 'function') {
    dibujarGraficoBarras(canvas, labels, datos);
  } else if (window.Chart) {
    // Fallback a Chart.js si existe en esta versión de índice
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'KPI Global (%)',
          data: datos,
          borderColor: '#0077cc',
          backgroundColor: 'rgba(0,119,204,0.15)',
          tension: 0.25,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  } else {
    console.warn('No hay función de dibujo disponible (dibujarGraficoBarras ni Chart.js)');
  }
}
