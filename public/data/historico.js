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

function getParametrosExcluidosNormalizados(entidadId, tipo) {
  try {
    const tipoLower = (tipo || '').toLowerCase();
    if (window.obtenerParametrosExcluidos) {
      return (window.obtenerParametrosExcluidos(entidadId, tipoLower) || []).map(x => (x || '').toString().toLowerCase().replace(/[-_]/g, ''));
    }

    let nombres = [];
    if (tipoLower === 'sucursal' && window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId]) {
      nombres = window.parametrosExcluidosPorSucursal[entidadId] || [];
    } else if (tipoLower === 'franquicia' && window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[entidadId]) {
      nombres = window.parametrosExcluidosPorFranquicia[entidadId] || [];
    }

    const ids = (nombres || []).map(nombre => {
      const p = (Array.isArray(window.parametros) ? window.parametros.find(pp => (pp.nombre || '').trim().toLowerCase() === (nombre || '').trim().toLowerCase()) : null);
      return p ? p.id : null;
    }).filter(Boolean);

    return ids.map(x => (x || '').toString().toLowerCase().replace(/[-_]/g, ''));
  } catch (e) {
    return [];
  }
}

function getParametrosAplicablesAtencionVenta(entidadId, tipo, mes) {
  const categorias = new Set(['bienvenida', 'producto_ventas', 'atencion_mesa', 'tiempos']);
  const excluidos = new Set(getParametrosExcluidosNormalizados(entidadId, tipo));
  const params = Array.isArray(window.parametros) ? window.parametros.slice() : [];

  return params.filter(p => {
    if (!p) return false;
    if (!categorias.has(p.categoriaId)) return false;
    if (p.vigenteDesde && (!mes || mes < p.vigenteDesde)) return false;
    const idNorm = (p.id || '').toString().toLowerCase().replace(/[-_]/g, '');
    if (excluidos.has(idNorm)) return false;
    return true;
  });
}

function calcularKPIAtencionVentaParaEvaluacion(entidadId, tipo, evaluacionLocal, mes) {
  try {
    const ev = evaluacionLocal && evaluacionLocal.parametros ? evaluacionLocal : null;
    if (!ev) return null;
    const params = getParametrosAplicablesAtencionVenta(entidadId, tipo, mes);
    const totalMax = params.reduce((acc, p) => acc + (Number(p.peso) || 0), 0);
    if (totalMax <= 0) return null;
    const totalObt = params.reduce((acc, p) => {
      const v = ev.parametros[p.id];
      return acc + (parseInt(v ?? 0, 10) || 0);
    }, 0);
    return totalMax > 0 ? (totalObt / totalMax) : null;
  } catch (e) {
    return null;
  }
}

function calcularKPI2AtencionVentaParaEvaluacion(entidadId, tipo, evaluacionLocal, mes) {
  try {
    const ev = evaluacionLocal && evaluacionLocal.parametros ? evaluacionLocal : null;
    const kpi2Utils = window.kpi2Utils || null;
    if (!ev || !kpi2Utils || typeof kpi2Utils.getPesoKPI2 !== 'function') return null;

    const modelo = (typeof kpi2Utils.getModeloEntidad === 'function') ? kpi2Utils.getModeloEntidad(entidadId, tipo) : null;
    const params = getParametrosAplicablesAtencionVenta(entidadId, tipo, mes);

    let totalMax = 0;
    let totalObt = 0;
    params.forEach(p => {
      const pesoOriginal = Number(p.peso) || 0;
      const peso2 = Number(kpi2Utils.getPesoKPI2(p.id, p.peso, modelo)) || 0;
      if (peso2 <= 0) return;
      totalMax += peso2;
      const val = parseInt(ev.parametros[p.id] ?? 0, 10) || 0;
      if (pesoOriginal <= 0) return;
      const ratio = Math.max(0, Math.min(1, val / pesoOriginal));
      totalObt += (peso2 * ratio);
    });

    if (totalMax <= 0) return null;
    return totalObt / totalMax;
  } catch (e) {
    return null;
  }
}

function calcularKPIAtencionVentaGlobalMesConFiltros(mes) {
  if (typeof obtenerEvaluacionesDelMes !== 'function') return { kpi: 0, count: 0 };
  if (typeof filtrarDatosPorRol !== 'function') return { kpi: 0, count: 0 };

  const todas = obtenerEvaluacionesDelMes(mes) || [];
  const filtradas = filtrarDatosPorRol(todas) || [];

  let sum = 0;
  let count = 0;
  filtradas.forEach(ev => {
    const k = calcularKPIAtencionVentaParaEvaluacion(ev.entidadId, ev.tipo, ev.evaluacion, mes);
    if (typeof k === 'number') {
      sum += (k * 100);
      count += 1;
    }
  });

  if (count === 0) return { kpi: 0, count: 0 };
  return { kpi: Math.round(sum / count), count };
}

function calcularKPI2AtencionVentaGlobalMesConFiltros(mes) {
  if (typeof obtenerEvaluacionesDelMes !== 'function') return { kpi: 0, count: 0 };
  if (typeof filtrarDatosPorRol !== 'function') return { kpi: 0, count: 0 };

  const todas = obtenerEvaluacionesDelMes(mes) || [];
  const filtradas = filtrarDatosPorRol(todas) || [];

  let sum = 0;
  let count = 0;
  filtradas.forEach(ev => {
    const k = calcularKPI2AtencionVentaParaEvaluacion(ev.entidadId, ev.tipo, ev.evaluacion, mes);
    if (typeof k === 'number') {
      sum += (k * 100);
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

  const resultadosAV = meses.map(m => ({
    mes: m,
    label: (typeof formatearMesLegible === 'function' ? formatearMesLegible(m) : m),
    res: calcularKPIAtencionVentaGlobalMesConFiltros(m),
    res2: calcularKPI2AtencionVentaGlobalMesConFiltros(m)
  }));

  const comparables = resultados.filter(r => r.res.count > 0 && r.res2.count > 0);
  const labelsC = comparables.map(r => r.label);
  const datosC1 = comparables.map(r => r.res.kpi);
  const datosC2 = comparables.map(r => r.res2.kpi);
  const countsC1 = comparables.map(r => r.res.count);
  const countsC2 = comparables.map(r => r.res2.count);

  const comparablesAV = resultadosAV.filter(r => r.res.count > 0 && r.res2.count > 0);
  const labelsAV = comparablesAV.map(r => r.label);
  const datosAV1 = comparablesAV.map(r => r.res.kpi);
  const datosAV2 = comparablesAV.map(r => r.res2.kpi);
  const countsAV1 = comparablesAV.map(r => r.res.count);
  const countsAV2 = comparablesAV.map(r => r.res2.count);

  const html = `
    <div style="margin-bottom: 20px;">
      <h2 style="color:#0077cc; text-align:center;">Histórico - Resultados Globales por Mes</h2>
      <p style="text-align:center; color:#666;">Comparación de KPI vs KPI2 (según permisos) de todas las entidades evaluadas</p>
    </div>
    <div style="margin-top: 18px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: 420px; position: relative;">
      <canvas id="graficoHistoricoComparacion" width="800" height="420" style="max-width:100%;"></canvas>
    </div>

    <div style="margin-top: 18px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: 420px; position: relative;">
      <div style="text-align:center; font-weight: 800; color:#2d3e50; margin-bottom: 6px;">Atención + Venta</div>
      <div style="text-align:center; color:#6c757d; font-size: 12px; margin-bottom: 10px;">(Bienvenida + Producto/Ventas + Atención en mesa + Tiempos de espera)</div>
      <canvas id="graficoHistoricoComparacionAtencionVenta" width="800" height="420" style="max-width:100%;"></canvas>
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

    try {
      window.__chartHistoricoComparacion?.destroy?.();
    } catch (e) {}

    window.__chartHistoricoComparacion = new Chart(ctxC, {
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

    const canvasAV = document.getElementById('graficoHistoricoComparacionAtencionVenta');
    if (canvasAV && labelsAV.length) {
      const ctxAV = canvasAV.getContext('2d');
      const minAV = Math.min(...datosAV1, ...datosAV2);
      const maxAV = Math.max(...datosAV1, ...datosAV2);
      const paddingAV = 5;
      const yMinAV = Math.max(0, Math.floor((minAV - paddingAV) / 5) * 5);
      const yMaxAV = Math.min(100, Math.ceil((maxAV + paddingAV) / 5) * 5);

      try {
        window.__chartHistoricoComparacionAtencionVenta?.destroy?.();
      } catch (e) {}

      window.__chartHistoricoComparacionAtencionVenta = new Chart(ctxAV, {
        type: 'line',
        data: {
          labels: labelsAV,
          datasets: [
            {
              label: 'KPI Atención+Venta (%)',
              data: datosAV1,
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
              label: 'KPI2 Atención+Venta (%)',
              data: datosAV2,
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
              data: new Array(labelsAV.length).fill(95),
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
                  const cnt = c.datasetIndex === 0 ? countsAV1[idx] : countsAV2[idx];
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
              min: yMinAV,
              max: yMaxAV,
              grid: { color: 'rgba(0,0,0,0.06)' },
              ticks: { color: '#6b7280', callback: (v) => v + '%' }
            }
          },
          interaction: { mode: 'nearest', intersect: false },
          animation: { duration: 800, easing: 'easeOutQuart' }
        },
        plugins: [shadowLine]
      });
    } else if (canvasAV && !labelsAV.length) {
      container.innerHTML += `
        <div style="margin-top:16px; padding:16px; background:#f8f9fa; border-radius:8px; color:#666; text-align:center;">
          No hay meses con datos simultáneos (KPI y KPI2) para mostrar Atención + Venta.
        </div>`;
    }
  }
}
