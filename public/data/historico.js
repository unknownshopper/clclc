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

function calcularKPI2ParaEvaluacion(entidadId, tipo, evaluacionLocal) {
  try {
    const kpi2Utils = window.kpi2Utils || null;
    if (kpi2Utils && typeof kpi2Utils.calcularKPI2 === 'function') {
      return kpi2Utils.calcularKPI2(entidadId, tipo, evaluacionLocal);
    }
    return null;
  } catch (e) {
    console.warn('No se pudo calcular KPI2 (histórico)', e);
    return null;
  }
}

function calcularKPI2GlobalMesConFiltros(mes) {
  if (typeof obtenerEvaluacionesDelMes !== 'function') return { kpi: 0, count: 0 };
  if (typeof filtrarDatosPorRol !== 'function') return { kpi: 0, count: 0 };

  const todas = obtenerEvaluacionesDelMes(mes) || [];
  const filtradas = filtrarDatosPorRol(todas) || [];

  let sum = 0;
  let count = 0;

  filtradas.forEach(ev => {
    const kpi2 = calcularKPI2ParaEvaluacion(ev.entidadId, ev.tipo, ev.evaluacion);
    if (typeof kpi2 === 'number') {
      sum += (kpi2 * 100);
      count += 1;
    }
  });

  if (count === 0) return { kpi: 0, count: 0 };
  return { kpi: Math.round(sum / count), count };
}

function renderHistorico() {
  const container = document.getElementById('historico');
  if (!container) return;

  const meses = obtenerMesesUltimos(12);
  const resultados = meses.map(m => ({
    mes: m,
    label: (typeof formatearMesLegible === 'function' ? formatearMesLegible(m) : m),
    res: calcularKPIGlobalMesConFiltros(m),
    res2: calcularKPI2GlobalMesConFiltros(m)
  }));

  const comparables = resultados.filter(r => r.res.count > 0 && r.res2.count > 0);
  const labelsC = comparables.map(r => r.label);
  const datosC1 = comparables.map(r => r.res.kpi);
  const datosC2 = comparables.map(r => r.res2.kpi);
  const countsC1 = comparables.map(r => r.res.count);
  const countsC2 = comparables.map(r => r.res2.count);

  const html = `
    <div style="margin-bottom: 20px;">
      <h2 style="color:#0077cc; text-align:center;">Histórico - Resultados Globales por Mes</h2>
      <p style="text-align:center; color:#666;">Comparación de KPI vs KPI2 (según permisos) de todas las entidades evaluadas</p>
    </div>
    <div style="margin-top: 18px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <canvas id="graficoHistoricoComparacion" width="800" height="420" style="max-width:100%;"></canvas>
    </div>
  `;

  container.innerHTML = html;

  const canvasC = document.getElementById('graficoHistoricoComparacion');
  if (!canvasC) return;

  if (!labelsC.length) {
    container.innerHTML += `
      <div style="margin-top:16px; padding:16px; background:#f8f9fa; border-radius:8px; color:#666; text-align:center;">
        No hay meses con datos simultáneos (KPI y KPI2) para mostrar la comparación.
      </div>`;
    return;
  }

  if (window.Chart) {
    const shadowLine = {
      id: 'shadowLine',
      beforeDatasetsDraw(chart) {
        const {ctx} = chart;
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

    const ctxC = canvasC.getContext('2d');

    const minC = Math.min(...datosC1, ...datosC2);
    const maxC = Math.max(...datosC1, ...datosC2);
    const paddingC = 5;
    const yMinC = Math.max(0, Math.floor((minC - paddingC) / 5) * 5);
    const yMaxC = Math.min(100, Math.ceil((maxC + paddingC) / 5) * 5);

    new Chart(ctxC, {
      type: 'line',
      data: {
        labels: labelsC,
        datasets: [
          {
            label: 'KPI Global (%)',
            data: datosC1,
            borderColor: '#0a84ff',
            backgroundColor: 'rgba(10,132,255,0.08)',
            pointBackgroundColor: '#0a84ff',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            borderWidth: 3,
            cubicInterpolationMode: 'monotone',
            tension: 0.35,
            fill: false,
          },
          {
            label: 'KPI2 Global (%)',
            data: datosC2,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168,85,247,0.08)',
            pointBackgroundColor: '#a855f7',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            borderWidth: 3,
            cubicInterpolationMode: 'monotone',
            tension: 0.35,
            fill: false,
          },
          {
            label: 'Meta 95%',
            data: new Array(labelsC.length).fill(95),
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
              label: (c) => {
                const idx = c.dataIndex;
                const val = c.parsed.y;
                const cnt = c.datasetIndex === 0 ? countsC1[idx] : countsC2[idx];
                return ` ${val}%  ·  ${cnt} evals`;
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
            min: yMinC,
            max: yMaxC,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { color: '#6b7280', callback: (v) => v + '%' }
          }
        },
        interaction: { mode: 'nearest', intersect: false },
        animation: { duration: 800, easing: 'easeOutQuart' }
      },
      plugins: [shadowLine]
    });
  }
}
