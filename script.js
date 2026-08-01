// Función para cambiar vista
function cambiarVista(vista) {
    // Actualizar botones de navegación
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`[data-section="${vista}"]`)?.classList.add('active');

    try {
        const mainEl = document.querySelector('main');
        if (mainEl) {
            if (vista === 'matriz') {
                mainEl.classList.add('matriz-fullwidth');
            } else {
                mainEl.classList.remove('matriz-fullwidth');
            }
        }
    } catch (e) {}
    
    // Ocultar todas las secciones
    document.querySelectorAll('.tab-section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    
    // Mostrar sección seleccionada
    const seccionActiva = document.getElementById(vista);
    if (seccionActiva) {
        seccionActiva.style.display = 'block';
    }

    try {
        moverSelectorMesAGlobal();
    } catch (e) {
        console.warn('No se pudo mover el selector de mes:', e);
    }
    
    window.vistaActual = vista;
    
    // Renderizar contenido según la vista
    switch(vista) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'evaluaciones':
            renderEvaluaciones();
            break;
        case 'franquicias':
            renderEvaluacionesFranquicias();
            break;
        case 'matriz':
            renderMatriz();
            break;
        case 'graficas':
            renderGraficas();
            break;
        case 'historico':
            asegurarHistoricoCargado()
                .then(() => {
                    if (typeof renderHistorico === 'function') {
                        renderHistorico();
                    } else {
                        try {
                            renderHistoricoFallback();
                        } catch (e) {
                            console.warn('renderHistorico no está disponible. Asegúrate de incluir data/historico.js.');
                        }
                    }
                })
                .catch((e) => {
                    console.warn('No se pudo cargar el módulo histórico:', e);
                    try {
                        renderHistoricoFallback();
                    } catch (e2) {}
                });
            break;
        case 'competencia':
            renderCompetencia();
            if (typeof cargarCompetenciaPublicada === 'function') {
                cargarCompetenciaPublicada();
            }
            if (window.firebaseDB && typeof window.firebaseDB.cargarEvaluaciones === 'function') {
                window.firebaseDB.cargarEvaluaciones(window.mesSeleccionado)
                    .then(evaluacionesFirebase => {
                        if (typeof integrarDatosFirebase === 'function') {
                            integrarDatosFirebase(evaluacionesFirebase);
                        }
                        if (typeof renderCompetencia === 'function') {
                            renderCompetencia();
                        }
                    })
                    .catch(e => console.warn('No se pudieron recargar evaluaciones de competencia:', e));
            }
            break;
    }
}

function moverSelectorMesAGlobal() {
    const host = document.getElementById('mesSelectorGlobalHost');
    const selector = document.getElementById('mes-selector');
    if (!host || !selector) return;

    const contenedor = selector.closest('.mes-selector-container');
    if (!contenedor) return;

    // Evitar trabajo si ya está en el host
    if (contenedor.parentElement === host) return;

    host.appendChild(contenedor);
}

function moverSelectorMesASeccion(vista) {
    const selector = document.getElementById('mes-selector');
    if (!selector) return;

    const contenedorActual = selector.closest('.mes-selector-container');
    if (!contenedorActual) return;

    const host = document.querySelector(`#${vista} [data-mes-selector-host="${vista}"]`);
    if (!host) return;

    if (contenedorActual === host) return;

    // Mover todo el contenedor para conservar label y estilos
    host.replaceWith(contenedorActual);
    contenedorActual.setAttribute('data-mes-selector-host', vista);
}

function formatearFechaHoraCorta(valor) {
    try {
        if (!valor) return '—';

        let d = null;
        if (valor instanceof Date) {
            d = valor;
        } else if (typeof valor === 'string') {
            const parsed = new Date(valor);
            if (!isNaN(parsed.getTime())) d = parsed;
        } else if (typeof valor === 'number') {
            // Asumir milisegundos (Date.now())
            const parsed = new Date(valor);
            if (!isNaN(parsed.getTime())) d = parsed;
        } else if (typeof valor === 'object') {
            if (typeof valor.toDate === 'function') {
                const parsed = valor.toDate();
                if (parsed instanceof Date && !isNaN(parsed.getTime())) d = parsed;
            } else if (typeof valor.seconds === 'number') {
                const parsed = new Date(valor.seconds * 1000);
                if (!isNaN(parsed.getTime())) d = parsed;
            }
        }

        if (!d) return String(valor);

        const pad2 = (n) => String(n).padStart(2, '0');
        const dd = pad2(d.getDate());
        const mm = pad2(d.getMonth() + 1);
        const yy = pad2(d.getFullYear() % 100);
        const HH = pad2(d.getHours());
        const MM = pad2(d.getMinutes());
        return `${dd}/${mm}/${yy} ${HH}:${MM}`;
    } catch (e) {
        return String(valor);
    }
}

function aplicarCompatibilidadExistencia() {
    try {
        const MES_EXISTENCIA_DESDE = '2026-03';
        const PARAM_ID = 'existencia';
        const PESO = 5;
        const penalizar = new Set(['altabrisa', 'pista']);
        const tipos = ['sucursales', 'franquicias', 'competencia'];

        if (!window.evaluaciones) return;

        tipos.forEach(tipoEntidad => {
            const mapa = window.evaluaciones[tipoEntidad];
            if (!mapa) return;
            Object.keys(mapa).forEach(entidadId => {
                const porMes = mapa[entidadId];
                if (!porMes) return;
                Object.keys(porMes).forEach(mes => {
                    if (!mes || mes < MES_EXISTENCIA_DESDE) return;
                    const ev = porMes[mes];
                    if (!ev) return;

                    if (ev.__existenciaPatched) return;
                    if (!ev.parametros) ev.parametros = {};

                    if (ev.parametros[PARAM_ID] === undefined) {
                        ev.parametros[PARAM_ID] = penalizar.has(entidadId) ? 0 : PESO;
                    }

                    ev.__existenciaPatched = true;
                });
            });
        });
    } catch (e) {
        console.warn('Compatibilidad Existencia falló:', e);
    }
}

function asegurarHistoricoCargado() {
    if (typeof renderHistorico === 'function') return Promise.resolve();
    if (window.__cargandoHistoricoPromise) return window.__cargandoHistoricoPromise;

    const bust = window.__historicoCacheBust || (window.__historicoCacheBust = Date.now());

    const cargarScript = (src) => new Promise((resolve, reject) => {
        try {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('No se pudo cargar ' + src));
            document.head.appendChild(s);
        } catch (e) {
            reject(e);
        }
    });

    window.__cargandoHistoricoPromise = cargarScript(`data/historico.js?v=${bust}`)
        .catch(() => cargarScript(`public/data/historico.js?v=${bust}`))
        .catch((e) => {
            window.__cargandoHistoricoPromise = null;
            throw e;
        });

    return window.__cargandoHistoricoPromise;
}

function renderHistoricoFallback() {
    const container = document.getElementById('historico');
    if (!container) return;

    const corteFinKPI = (window.kpiCorte && window.kpiCorte.MES_KPI_FIN) ? window.kpiCorte.MES_KPI_FIN : '2026-05';

    const obtenerMesesUltimos = (n = 12) => {
        const meses = [];
        const ahora = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const año = fecha.getFullYear();
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            meses.push(`${año}-${mes}`);
        }
        return meses;
    };

    const calcularKPIGlobalMesConFiltros = (mes) => {
        if (typeof obtenerEvaluacionesDelMes !== 'function') return { kpi: 0, count: 0 };
        if (typeof filtrarDatosPorRol !== 'function') return { kpi: 0, count: 0 };
        const todas = obtenerEvaluacionesDelMes(mes) || [];
        const filtradas = filtrarDatosPorRol(todas) || [];
        const count = filtradas.length;
        if (count === 0) return { kpi: 0, count: 0 };
        const sum = filtradas.reduce((acc, ev) => acc + ((ev.kpi || 0) * 100), 0);
        return { kpi: Math.round(sum / count), count };
    };

    const calcularKPI2GlobalMesConFiltros = (mes) => {
        if (typeof obtenerEvaluacionesDelMes !== 'function') return { kpi: 0, count: 0 };
        if (typeof filtrarDatosPorRol !== 'function') return { kpi: 0, count: 0 };
        const todas = obtenerEvaluacionesDelMes(mes) || [];
        const filtradas = filtrarDatosPorRol(todas) || [];
        const kpi2Utils = window.kpi2Utils || null;
        let sum = 0;
        let count = 0;
        filtradas.forEach(ev => {
            const evBase = ev.evaluacion || null;
            const evParaKPI2 = (evBase && evBase.modalidades && evBase.modalidades.kpi2)
                ? evBase.modalidades.kpi2
                : (evBase && evBase._kpi2 ? evBase._kpi2 : evBase);
            const kpi2 = (kpi2Utils && typeof kpi2Utils.calcularKPI2 === 'function')
                ? kpi2Utils.calcularKPI2(ev.entidadId, ev.tipo, evParaKPI2)
                : null;
            if (typeof kpi2 === 'number') {
                sum += (kpi2 * 100);
                count += 1;
            }
        });
        if (count === 0) return { kpi: 0, count: 0 };
        return { kpi: Math.round(sum / count), count };
    };

    const debeMostrarKPI = (mes) => {
        if (typeof window.debeMostrarKPI === 'function') return window.debeMostrarKPI(mes);
        const m = (mes || '').toString().trim();
        return !!m && m <= corteFinKPI;
    };

    const meses = obtenerMesesUltimos(12);
    const resultados = meses.map(m => {
        const r1 = debeMostrarKPI(m) ? calcularKPIGlobalMesConFiltros(m) : { kpi: null, count: 0 };
        const r2 = calcularKPI2GlobalMesConFiltros(m);
        return {
            mes: m,
            label: (typeof formatearMesLegible === 'function' ? formatearMesLegible(m) : m),
            res: r1,
            res2: r2
        };
    });

    const labelsC = resultados.map(r => r.label);
    const datosC1 = resultados.map(r => (r.res && r.res.count > 0 && typeof r.res.kpi === 'number' ? r.res.kpi : null));
    const datosC2 = resultados.map(r => (r.res2 && r.res2.count > 0 && typeof r.res2.kpi === 'number' ? r.res2.kpi : null));
    const countsC1 = resultados.map(r => (r.res && r.res.count > 0) ? r.res.count : 0);
    const countsC2 = resultados.map(r => (r.res2 && r.res2.count > 0) ? r.res2.count : 0);

    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color:#0077cc; text-align:center;">Histórico - Resultados Globales por Mes</h2>
            <p style="text-align:center; color:#666;">Comparación de KPI vs KPI2 (según permisos) de todas las entidades evaluadas</p>
        </div>
        <div style="margin-top: 18px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <canvas id="graficoHistoricoComparacion" width="800" height="420" style="max-width:100%;"></canvas>
        </div>
    `;

    const canvasC = document.getElementById('graficoHistoricoComparacion');
    if (!canvasC) return;

    if (!labelsC.length) return;

    if (!window.Chart) return;

    const ctxC = canvasC.getContext('2d');
    const valoresC = [...datosC1, ...datosC2].filter(v => typeof v === 'number' && Number.isFinite(v));
    const minC = valoresC.length ? Math.min(...valoresC) : 0;
    const maxC = valoresC.length ? Math.max(...valoresC) : 100;
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
        }
    });
}

// Editar (forzar actualización) del enlace de video (solo admin)
async function editarVideo(entidadId, tipo) {
    try {
        if (!tienePermiso('admin')) {
            alert('Solo un administrador puede editar el enlace de video.');
            return;
        }
        if (!window.firebaseAdminAuthenticated) {
            alert('Para guardar el enlace de video debes iniciar sesión en Firebase con la cuenta administradora.');
            return;
        }
        const mes = window.mesSeleccionado;
        const evalActual = typeof obtenerEvaluacion === 'function' ? obtenerEvaluacion(entidadId, tipo, mes) : null;
        const urlActual = evalActual && evalActual.videoUrl ? evalActual.videoUrl : '';
        const entidad = tipo === 'sucursal' ? 
            window.sucursales.find(s => s.id === entidadId)
            : window.franquicias.find(f => f.id === entidadId);
        const nombreEntidad = entidad ? entidad.nombre : entidadId;
        let videoUrl = prompt(`Editar enlace de YouTube para ${nombreEntidad} (${formatearMesLegible(mes)}):`, urlActual) || '';
        videoUrl = videoUrl.trim();
        if (!videoUrl) return;
        const estadoActual = (evalActual && evalActual.estadoPublicacion) ? evalActual.estadoPublicacion : 'borrador';
        if (window.firebaseDB && typeof window.firebaseDB.actualizarEstadoPublicacion === 'function') {
            const ok = await window.firebaseDB.actualizarEstadoPublicacion(entidadId, tipo, mes, estadoActual, videoUrl);
            if (!ok) throw new Error('No se pudo guardar el enlace de video en Firebase');
        }
        let tipoEntidad = 'franquicias';
        if (tipo === 'sucursal') tipoEntidad = 'sucursales';
        else if (tipo === 'franquicia') tipoEntidad = 'franquicias';
        else if (tipo === 'competencia') tipoEntidad = 'competencia';
        if (window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[mes]) {
            window.evaluaciones[tipoEntidad][entidadId][mes].videoUrl = videoUrl;
        }
        alert('Enlace de video actualizado correctamente.');
        if (window.vistaActual === 'evaluaciones') {
            renderEvaluaciones();
        }
    } catch (e) {
        console.error('Error en editarVideo:', e);
        alert('Ocurrió un error al actualizar el video.');
    }
}

// Manejo de botón de video en Evaluaciones: ver si existe; subir si no existe (solo admin)
async function manejarVideo(entidadId, tipo) {
    try {
        const mes = window.mesSeleccionado;
        const evalActual = typeof obtenerEvaluacion === 'function' ? obtenerEvaluacion(entidadId, tipo, mes) : null;
        const urlLocal = evalActual && evalActual.videoUrl ? evalActual.videoUrl : null;
        const linksMes = window.videoLinks?.[mes] || {};
        const urlMapeada = linksMes[entidadId];
        const existe = !!(urlLocal || urlMapeada);

        if (existe) {
            // Si es admin autenticado, permitir editar el link con el mismo botón (sin botón extra)
            if (tienePermiso('admin') && window.firebaseAdminAuthenticated) {
                const editar = confirm('¿Deseas editar el enlace de video?\n\nAceptar: editar\nCancelar: ver');
                if (editar) {
                    const entidad = tipo === 'sucursal' ? 
                        window.sucursales.find(s => s.id === entidadId)
                        : window.franquicias.find(f => f.id === entidadId);
                    const nombreEntidad = entidad ? entidad.nombre : entidadId;
                    let videoUrl = prompt(`Editar enlace de YouTube para ${nombreEntidad} (${formatearMesLegible(mes)}):`, String(urlLocal || urlMapeada || '')) || '';
                    videoUrl = videoUrl.trim();
                    if (!videoUrl) return;

                    const estadoActual = (evalActual && evalActual.estadoPublicacion) ? evalActual.estadoPublicacion : 'borrador';
                    if (window.firebaseDB && typeof window.firebaseDB.actualizarEstadoPublicacion === 'function') {
                        const ok = await window.firebaseDB.actualizarEstadoPublicacion(entidadId, tipo, mes, estadoActual, videoUrl);
                        if (!ok) throw new Error('No se pudo guardar el enlace de video en Firebase');
                    }

                    let tipoEntidad = 'franquicias';
                    if (tipo === 'sucursal') tipoEntidad = 'sucursales';
                    else if (tipo === 'franquicia') tipoEntidad = 'franquicias';
                    else if (tipo === 'competencia') tipoEntidad = 'competencia';
                    if (window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[mes]) {
                        window.evaluaciones[tipoEntidad][entidadId][mes].videoUrl = videoUrl;
                    }

                    alert('Enlace de video actualizado correctamente.');
                    if (window.vistaActual === 'evaluaciones') {
                        renderEvaluaciones();
                    }
                    return;
                }
            }

            return verVideo(entidadId, tipo);
        }

        if (!tienePermiso('admin')) {
            alert('Aún no hay video cargado para esta evaluación. Sólo un administrador puede agregar el enlace de video.');
            return;
        }
        if (!window.firebaseAdminAuthenticated) {
            alert('Para guardar el enlace de video debes iniciar sesión en Firebase con la cuenta administradora.');
            return;
        }

        const entidad = tipo === 'sucursal' ? 
            window.sucursales.find(s => s.id === entidadId)
            : window.franquicias.find(f => f.id === entidadId);
        const nombreEntidad = entidad ? entidad.nombre : entidadId;

        let videoUrl = prompt(`Agregar enlace de YouTube para ${nombreEntidad} (${formatearMesLegible(mes)}):`, '') || '';
        videoUrl = videoUrl.trim();
        if (!videoUrl) return;

        // Mantener el estado de publicación actual al actualizar sólo el video
        const estadoActual = (evalActual && evalActual.estadoPublicacion) ? evalActual.estadoPublicacion : 'borrador';

        if (window.firebaseDB && typeof window.firebaseDB.actualizarEstadoPublicacion === 'function') {
            const ok = await window.firebaseDB.actualizarEstadoPublicacion(entidadId, tipo, mes, estadoActual, videoUrl);
            if (!ok) throw new Error('No se pudo guardar el enlace de video en Firebase');
        }

        // Actualizar estructura local
        let tipoEntidad = 'franquicias';
        if (tipo === 'sucursal') tipoEntidad = 'sucursales';
        else if (tipo === 'franquicia') tipoEntidad = 'franquicias';
        else if (tipo === 'competencia') tipoEntidad = 'competencia';
        if (window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[mes]) {
            window.evaluaciones[tipoEntidad][entidadId][mes].videoUrl = videoUrl;
        }

        alert('Enlace de video guardado correctamente.');
        if (window.vistaActual === 'evaluaciones') {
            renderEvaluaciones();
        } else if (window.vistaActual === 'franquicias') {
            renderEvaluacionesFranquicias();
        }
    } catch (e) {
        console.error('Error en manejarVideo:', e);
        alert('Ocurrió un error al guardar/ver el video.');
    }
}

// Función para renderizar evaluaciones
async function renderEvaluacionesBase({
    containerId,
    titulo,
    tipoFiltro
}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const kpi2Utils = window.kpi2Utils || null;
    const debeMostrarKPI2 = (mes) => {
        if (kpi2Utils && typeof kpi2Utils.debeMostrarKPI2 === 'function') return kpi2Utils.debeMostrarKPI2(mes);
        return !!mes && mes >= '2026-02';
    };
    const calcularKPI2 = (entidadId, tipo, evaluacionLocal) => {
        if (kpi2Utils && typeof kpi2Utils.calcularKPI2 === 'function') return kpi2Utils.calcularKPI2(entidadId, tipo, evaluacionLocal);
        return null;
    };

    const listarPuntosAMejorarKPI2 = (entidadId, tipo, evaluacionLocal) => {
        try {
            if (!evaluacionLocal || !evaluacionLocal.parametros || !Array.isArray(window.parametros)) return [];

            const mesEval = evaluacionLocal.mes || window.mesSeleccionado || null;

            let parametrosExcluidos = [];
            if (tipo === 'sucursal' && window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId]) {
                parametrosExcluidos = window.parametrosExcluidosPorSucursal[entidadId]
                    .map(nombre => {
                        const param = window.parametros.find(p =>
                            p.nombre.trim().toLowerCase() === String(nombre || '').trim().toLowerCase()
                        );
                        return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
                    })
                    .filter(id => id !== null);
            } else if (tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[entidadId]) {
                parametrosExcluidos = window.parametrosExcluidosPorFranquicia[entidadId]
                    .map(nombre => {
                        const param = window.parametros.find(p =>
                            p.nombre.trim().toLowerCase() === String(nombre || '').trim().toLowerCase()
                        );
                        return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
                    })
                    .filter(id => id !== null);
            }

            let parametrosAplicables = window.parametros.filter(param =>
                !parametrosExcluidos.includes(String(param.id || '').toLowerCase().replace(/[-_]/g, ''))
            );

            if (mesEval) {
                parametrosAplicables = parametrosAplicables.filter(p => {
                    if (!p || !p.vigenteDesde) return true;
                    return mesEval >= p.vigenteDesde;
                });
            }

            if (tipo === 'sucursal') {
                parametrosAplicables = parametrosAplicables.filter(p => p.aplicaATodas || (p.aplicaASucursales && p.aplicaASucursales.includes(entidadId)));
            } else if (tipo === 'franquicia') {
                parametrosAplicables = parametrosAplicables.filter(p => p.aplicaATodas || (p.aplicaAFranquicias && p.aplicaAFranquicias.includes(entidadId)));
            }

            const malos = [];
            parametrosAplicables.forEach(param => {
                const id = param.id;
                const pesoOriginal = Number(param.peso) || 0;
                if (pesoOriginal <= 0) return;

                const valorExiste = evaluacionLocal.parametros[id] !== undefined;
                if (!valorExiste) return;

                const valor = Number(evaluacionLocal.parametros[id] ?? 0) || 0;
                const ratio = (param && param.tipo === 'booleano')
                    ? (valor > 0 ? 1 : 0)
                    : Math.max(0, Math.min(1, valor / pesoOriginal));

                if (ratio < 1) {
                    malos.push(param.nombre || id);
                }
            });

            return malos;
        } catch (e) {
            return [];
        }
    };
    
    // Cargar evaluaciones desde Firebase si está disponible
    if (window.firebaseDB) {
        try {
            await window.firebaseDB.cargarEvaluaciones();
        } catch (error) {
            console.error('Error cargando evaluaciones desde Firebase:', error);
        }
    }
    
    // Obtener evaluaciones del mes y aplicar filtro por rol
    const todasLasEvaluaciones = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    let evaluacionesFiltradas = filtrarDatosPorRol(todasLasEvaluaciones);

    // Forzar vista por tipo (evitar mezclar sucursales con franquicias aquí)
    if (tipoFiltro) {
        evaluacionesFiltradas = (evaluacionesFiltradas || []).filter(ev => ev && ev.tipo === tipoFiltro);
    }
    
    console.log(`Evaluaciones - Total: ${todasLasEvaluaciones.length}, Filtradas: ${evaluacionesFiltradas.length}`);
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0077cc; margin-bottom: 10px; text-align: center;">
                ${titulo} - ${formatearMesLegible(window.mesSeleccionado)}
            </h2>
            ${tienePermiso('crear') ? `
            <div style="text-align: center; margin-bottom: 20px;">
                <button onclick="abrirModalNuevaEvaluacion()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-plus"></i> Nueva Evaluación
                </button>
            </div>
            ` : ''}
            <p style="text-align: center; color: #666; margin-bottom: 20px;">
                Total de evaluaciones: ${evaluacionesFiltradas.length} (Rol: ${usuarioActual?.rol || 'N/A'})
            </p>
        </div>
    `;
    
    if (evaluacionesFiltradas.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No hay evaluaciones para ${formatearMesLegible(window.mesSeleccionado)}</h3>
                <p>No se encontraron evaluaciones con sus permisos actuales.</p>
                ${tienePermiso('crear') ? '<button onclick="abrirModalNuevaEvaluacion()" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Evaluación</button>' : ''}
            </div>
        `;
    } else {
        if (!window.evaluacionesOrden || typeof window.evaluacionesOrden !== 'object') {
            window.evaluacionesOrden = { campo: null, dir: 'asc' };
        }

        const ordenar = (campo) => {
            const c = String(campo || '').toLowerCase().trim();
            const actual = window.evaluacionesOrden || { campo: null, dir: 'asc' };
            const mismoCampo = actual.campo === c;
            window.evaluacionesOrden = {
                campo: c,
                dir: mismoCampo ? (actual.dir === 'asc' ? 'desc' : 'asc') : 'asc'
            };
            if (containerId === 'franquicias') {
                renderEvaluacionesFranquicias();
            } else {
                renderEvaluaciones();
            }
        };
        window.ordenarEvaluacionesPor = ordenar;

        const orden = window.evaluacionesOrden || { campo: null, dir: 'asc' };
        const debeKPI2 = debeMostrarKPI2(window.mesSeleccionado);
        const soloKPI2 = (typeof window.debeUsarSoloKPI2 === 'function') ? window.debeUsarSoloKPI2(window.mesSeleccionado) : false;
        const kpiPermitido = (typeof window.debeMostrarKPI === 'function') ? window.debeMostrarKPI(window.mesSeleccionado) : true;
        const campoActivo = soloKPI2
            ? 'kpi2'
            : (orden.campo === 'kpi2')
                ? 'kpi2'
                : (orden.campo === 'kpi')
                    ? 'kpi'
                    : (debeKPI2 ? 'kpi2' : 'kpi');
        const arrow = (campo) => {
            if (!orden || orden.campo !== campo) return '';
            return orden.dir === 'asc' ? ' ▲' : ' ▼';
        };

        if (orden.campo === 'entidad') {
            evaluacionesFiltradas = evaluacionesFiltradas
                .slice()
                .sort((a, b) => {
                    const dir = (orden.dir === 'desc') ? -1 : 1;
                    const an = String(a.entidad || '').toLowerCase();
                    const bn = String(b.entidad || '').toLowerCase();
                    return an.localeCompare(bn, 'es', { sensitivity: 'base' }) * dir;
                });
        } else if ((orden.campo === 'kpi' && !soloKPI2) || (orden.campo === 'kpi2' && debeKPI2) || (soloKPI2 && debeKPI2)) {
            evaluacionesFiltradas = evaluacionesFiltradas
                .map((e) => {
                    let kpi2v = null;
                    if (debeKPI2) {
                        const evalLocal = typeof obtenerEvaluacion === 'function'
                            ? obtenerEvaluacion(e.entidadId, e.tipo, window.mesSeleccionado)
                            : null;
                        const evalParaKPI2 = (evalLocal && evalLocal.modalidades && evalLocal.modalidades.kpi2)
                            ? evalLocal.modalidades.kpi2
                            : (evalLocal && evalLocal._kpi2 ? evalLocal._kpi2 : evalLocal);
                        const k2 = calcularKPI2(e.entidadId, e.tipo, evalParaKPI2);
                        kpi2v = (typeof k2 === 'number' && !Number.isNaN(k2)) ? (k2 * 100) : null;
                    }
                    return { ...e, __kpi2v: kpi2v };
                })
                .sort((a, b) => {
                    const dir = (orden.dir === 'desc') ? -1 : 1;
                    const av = (!soloKPI2 && orden.campo === 'kpi')
                        ? (((a.kpi || 0) * 100))
                        : (typeof a.__kpi2v === 'number' ? a.__kpi2v : Number.POSITIVE_INFINITY);
                    const bv = (!soloKPI2 && orden.campo === 'kpi')
                        ? (((b.kpi || 0) * 100))
                        : (typeof b.__kpi2v === 'number' ? b.__kpi2v : Number.POSITIVE_INFINITY);
                    if (av < bv) return -1 * dir;
                    if (av > bv) return 1 * dir;
                    return 0;
                });
        }

        const opKPI = (campoActivo === 'kpi') ? '1' : '0.35';
        const opKPI2 = (campoActivo === 'kpi2') ? '1' : '0.35';

        html += `
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <table class="evaluaciones-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #0077cc; color: white;">
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Tipo</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer; user-select:none;" onclick="ordenarEvaluacionesPor('entidad')" title="Ordenar por Entidad">Entidad${arrow('entidad')}</th>
                            ${(!soloKPI2 && kpiPermitido) ? `<th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd; cursor:pointer; user-select:none; opacity:${opKPI};" onclick="ordenarEvaluacionesPor('kpi')" title="Ordenar por KPI">KPI${arrow('kpi')}</th>` : ''}
                            ${debeMostrarKPI2(window.mesSeleccionado) ? `<th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd; cursor:pointer; user-select:none; opacity:${opKPI2};" onclick="ordenarEvaluacionesPor('kpi2')" title="Ordenar por KPI2">KPI2${arrow('kpi2')}</th>` : ''}
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Estado</th>
                            ${(tienePermiso('admin'))
                                ? `<th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Publicación</th>`
                                : `<th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Puntos a mejorar</th>`
                            }
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Fecha</th>
                            ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') || tienePermiso('publicar') ? '<th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Acciones</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        evaluacionesFiltradas.forEach((evaluacion, index) => {
            const kpiPorcentaje = ((evaluacion.kpi || 0) * 100).toFixed(1);
            const soloKPI2 = (typeof window.debeUsarSoloKPI2 === 'function') ? window.debeUsarSoloKPI2(window.mesSeleccionado) : false;
            const kpiPermitido = (typeof window.debeMostrarKPI === 'function') ? window.debeMostrarKPI(window.mesSeleccionado) : true;
            const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            
            // Formatear tipo para mostrar
            let tipoMostrar = 'Sucursal';
            if (evaluacion.tipo === 'franquicia') tipoMostrar = 'Franquicia';
            else if (evaluacion.tipo === 'competencia') tipoMostrar = 'Competencia';

            // Para video y KPI2 usamos el registro local/actual (si existe)
            const evalLocal = typeof obtenerEvaluacion === 'function'
                ? obtenerEvaluacion(evaluacion.entidadId, evaluacion.tipo, window.mesSeleccionado)
                : null;

            // Estado de publicación
            const estadoPublicacion = (evalLocal && evalLocal.estadoPublicacion)
                ? evalLocal.estadoPublicacion
                : (evaluacion.estadoPublicacion || 'borrador');
            const esBorrador = estadoPublicacion === 'borrador';
            const esPublicado = estadoPublicacion === 'publicado';
            const adminPuedeEscribir = !!window.firebaseAdminAuthenticated;
            const linksMes = window.videoLinks?.[window.mesSeleccionado] || {};
            const hasVideo = !!((evalLocal && evalLocal.videoUrl) || linksMes[evaluacion.entidadId]);

            const mostrarOjoKPI2 = !tienePermiso('admin');

            const evalParaKPI2 = (evalLocal && evalLocal.modalidades && evalLocal.modalidades.kpi2)
                ? evalLocal.modalidades.kpi2
                : (evalLocal && evalLocal._kpi2 ? evalLocal._kpi2 : evalLocal);
            const kpi2 = debeMostrarKPI2(window.mesSeleccionado) ? calcularKPI2(evaluacion.entidadId, evaluacion.tipo, evalParaKPI2) : null;
            const kpi2Porcentaje = (typeof kpi2 === 'number') ? (kpi2 * 100).toFixed(1) : null;

            const puntosMalos = (!tienePermiso('admin') && debeMostrarKPI2(window.mesSeleccionado))
                ? listarPuntosAMejorarKPI2(evaluacion.entidadId, evaluacion.tipo, evalParaKPI2)
                : [];
            const puntosMalosTexto = (puntosMalos && puntosMalos.length)
                ? (puntosMalos.map(p => String(p)).join('<br>'))
                : '—';

            const kpiNum = parseFloat(kpiPorcentaje);
            const kpi2Num = (kpi2Porcentaje !== null) ? parseFloat(kpi2Porcentaje) : null;

            const valorActivo = (campoActivo === 'kpi2') ? kpi2Num : kpiNum;
            const estadoActivo = (typeof valorActivo === 'number' && !Number.isNaN(valorActivo))
                ? (valorActivo >= 95 ? 'Excelente' : valorActivo >= 90 ? 'Bueno' : 'Necesita mejora')
                : '—';
            const estadoColor = (estadoActivo === 'Excelente') ? '#28a745' : (estadoActivo === 'Bueno') ? '#ffc107' : (estadoActivo === 'Necesita mejora') ? '#dc3545' : '#666';

            html += `
                <tr style="background: ${bgColor};">
                    <td style="padding: 12px; border-bottom: 1px solid #ddd;">
                        <span style="background: ${evaluacion.tipo === 'sucursal' ? '#007bff' : evaluacion.tipo === 'franquicia' ? '#6f42c1' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 10px;">
                            ${tipoMostrar}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; font-weight: 500;">
                        ${evaluacion.entidad}
                    </td>
                    ${(!soloKPI2 && kpiPermitido) ? `
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: ${estadoColor}; font-size: 16px; opacity:${opKPI};">
                        ${kpiPorcentaje}%
                    </td>
                    ` : ''}
                    ${debeMostrarKPI2(window.mesSeleccionado) ? `
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: ${kpi2Porcentaje !== null ? (parseFloat(kpi2Porcentaje) >= 95 ? '#28a745' : parseFloat(kpi2Porcentaje) >= 90 ? '#ffc107' : '#dc3545') : '#2d3e50'}; font-size: 16px; opacity:${opKPI2};" title="KPI2 usa ponderación competitividad (PONDERA IA).">
                        ${kpi2Porcentaje !== null ? (kpi2Porcentaje + '%') : '—'}
                    </td>
                    ` : ''}
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        <span style="color: ${estadoColor}; font-weight: bold;">
                            ${estadoActivo}
                        </span>
                    </td>
                    ${(tienePermiso('admin')) ? `
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        <span class="estado-publicacion ${esBorrador ? 'estado-borrador' : 'estado-publicado'}">
                            ${esBorrador ? 'Borrador' : 'Publicado'}
                        </span>
                    </td>
                    ` : `
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left; font-size: 12px; color:#2d3e50; line-height: 1.25;">
                        ${puntosMalosTexto}
                    </td>
                    `}
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; color: #666;">
                        ${evaluacion.fecha}
                    </td>
                    ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') || tienePermiso('publicar') ? `
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        <div class="action-buttons" style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="verEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}', '${(soloKPI2 || !kpiPermitido) ? 'kpi2' : 'kpi'}')" 
                                    class="btn-action btn-view" 
                                    title="Ver evaluación"
                                    style="background:${(soloKPI2 || !kpiPermitido) ? '#a855f7' : '#0a84ff'};color:#fff;">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="manejarVideo('${evaluacion.entidadId}', '${evaluacion.tipo}')"
                                    class="btn-action btn-video" 
                                    title="${hasVideo ? 'Ver video de evaluación' : 'Agregar enlace de video'}"
                                    style="${hasVideo ? 'background:#28a745;color:#fff;' : 'background:#6c757d;color:#fff;'}">
                                <i class="fas fa-video"></i>
                            </button>
                            ${(usuarioActual?.rol === 'admin') ? `
                            <button 
                                    onclick="${adminPuedeEscribir ? `editarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}', 'kpi2')` : `alert('Para editar necesitas iniciar sesión como admin con Firebase Auth (email admin).')`}" 
                                    class="btn-action btn-edit" 
                                    title="${adminPuedeEscribir ? 'Editar KPI2' : 'Requiere autenticación Firebase admin'}"
                                    style="background:#a855f7;color:#fff;${adminPuedeEscribir ? '' : 'opacity:0.45;cursor:not-allowed;'}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button 
                                    onclick="${adminPuedeEscribir ? `eliminarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')` : `alert('Para eliminar necesitas iniciar sesión como admin con Firebase Auth (email admin).')`}" 
                                    class="btn-action btn-delete" 
                                    title="${adminPuedeEscribir ? 'Eliminar evaluación' : 'Requiere autenticación Firebase admin'}"
                                    style="${adminPuedeEscribir ? '' : 'opacity:0.45;cursor:not-allowed;'}">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                            ${(usuarioActual?.rol === 'admin') ? `
                            <button
                                    onclick="${adminPuedeEscribir ? `publicarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')` : `alert('Para publicar/despublicar necesitas iniciar sesión como admin con Firebase Auth (email admin).')`}" 
                                    class="btn-action ${esPublicado ? 'btn-unpublish' : 'btn-publish'}" 
                                    title="${adminPuedeEscribir ? (esPublicado ? 'Despublicar evaluación' : 'Publicar evaluación') : 'Requiere autenticación Firebase admin'}"
                                    style="${esPublicado ? 'background:#ffc107;color:#2d3e50;' : 'background:#28a745;color:#fff;'};${adminPuedeEscribir ? '' : 'opacity:0.45;cursor:not-allowed;'}">
                                <i class="fas ${esPublicado ? 'fa-undo' : 'fa-share'}"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                    ` : ''}
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Aplicar restricciones de rol después de renderizar
    // aplicarRestriccionesPorRol();
}

async function renderEvaluaciones() {
    return renderEvaluacionesBase({
        containerId: 'evaluaciones',
        titulo: 'Evaluaciones (Sucursales)',
        tipoFiltro: 'sucursal'
    });
}

async function renderEvaluacionesFranquicias() {
    return renderEvaluacionesBase({
        containerId: 'franquicias',
        titulo: 'Evaluaciones (Franquicias)',
        tipoFiltro: 'franquicia'
    });
}

function abrirModalNuevaEvaluacion() {
    const modal = document.getElementById('modal-nueva-evaluacion');
    const selectEntidad = document.getElementById('select-entidad-evaluacion');
    const parametrosContainer = document.getElementById('parametros-evaluacion-container');
    const totalPuntosDiv = document.getElementById('total-puntos-evaluacion');
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    
    if (!modal || !selectEntidad) {
        console.error('Modal o elementos no encontrados');
        return;
    }
    
    // Limpiar contenido previo
    selectEntidad.innerHTML = '<option value="">Selecciona una opción</option>';
    parametrosContainer.innerHTML = '';
    totalPuntosDiv.textContent = 'Total de puntos: 0';
    btnGuardar.style.display = 'none';
    
    // Poblar selector con sucursales y franquicias
    if (window.sucursales) {
        window.sucursales.filter(s => s.activa).forEach(sucursal => {
            const option = document.createElement('option');
            option.value = `sucursal-${sucursal.id}`;
            option.textContent = `${sucursal.nombre} (Sucursal)`;
            selectEntidad.appendChild(option);
        });
    }
    
    if (window.franquicias) {
        window.franquicias.filter(f => f.activa).forEach(franquicia => {
            const option = document.createElement('option');
            option.value = `franquicia-${franquicia.id}`;
            option.textContent = `${franquicia.nombre} (Franquicia)`;
            selectEntidad.appendChild(option);
        });
    }
    
    // Event listener para cambio de entidad
    selectEntidad.addEventListener('change', function() {
        cargarParametrosEvaluacion(this.value);
    });
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Por default, capturamos en KPI2 (KPI legacy se mantiene para lectura/auditoría)
    window.modoEdicion = { activo: false, modalidad: 'kpi2' };
}

// Función para cargar parámetros según la entidad seleccionada
function cargarParametrosEvaluacion(entidadValue) {
    const parametrosContainer = document.getElementById('parametros-evaluacion-container');
    const totalPuntosDiv = document.getElementById('total-puntos-evaluacion');
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    
    if (!entidadValue) {
        parametrosContainer.innerHTML = '';
        totalPuntosDiv.textContent = 'Total de puntos: 0';
        btnGuardar.style.display = 'none';
        return;
    }
    
    // Extraer tipo y ID de la entidad (corregir para IDs con guiones)
    const firstDashIndex = entidadValue.indexOf('-');
    const tipo = entidadValue.substring(0, firstDashIndex);
    const entidadId = entidadValue.substring(firstDashIndex + 1);
    
    console.log(`Cargando parámetros para ${tipo}: ${entidadId}`);
    
    // Obtener parámetros aplicables - SOLUCIÓN SIMPLE Y CORRECTA
    let parametrosAplicables;
    
    // Usar TODOS los parámetros para ambos tipos (sucursales y franquicias)
    // Las exclusiones se encargarán de filtrar los que no aplican
    parametrosAplicables = window.parametros.slice(); // Copia de todos los parámetros

    // Filtrar por vigencia de parámetros (p.ej. parámetros nuevos desde cierto mes)
    try {
        const mes = window.mesSeleccionado;
        parametrosAplicables = parametrosAplicables.filter(p => {
            if (!p || !p.vigenteDesde) return true;
            // En edición KPI2 permitimos mostrar parámetros soloKPI2 aunque el mes sea anterior,
            // para poder capturarlos sin dejar el modal incompleto.
            const modEdicion = (window.modoEdicion && window.modoEdicion.activo && window.modoEdicion.modalidad)
                ? String(window.modoEdicion.modalidad).toLowerCase().trim()
                : 'kpi';
            if (modEdicion === 'kpi2' && p.soloKPI2) return true;
            return !!mes && mes >= p.vigenteDesde;
        });
    } catch (e) {}

    // Parámetros específicos solo para sucursales en KPI2
    try {
        parametrosAplicables = parametrosAplicables.filter(p => {
            if (!p) return false;
            if (p.id === 'mencion_promociones' && tipo !== 'sucursal') return false;
            return true;
        });
    } catch (e) {}
    console.log(`Usando todos los parámetros para ${tipo}: ${entidadId} (${parametrosAplicables.length} parámetros)`);
    
    console.log('Lista de parámetros antes de exclusiones:', parametrosAplicables.map(p => p.nombre));
    
    // Verificar si existen las exclusiones
    console.log('Verificando exclusiones...');
    console.log('window.parametrosExcluidosPorSucursal existe:', !!window.parametrosExcluidosPorSucursal);
    console.log('window.parametrosExcluidosPorFranquicia existe:', !!window.parametrosExcluidosPorFranquicia);
    
    if (window.parametrosExcluidosPorSucursal && tipo === 'sucursal' && window.parametrosExcluidosPorSucursal[entidadId]) {
        const excluidos = window.parametrosExcluidosPorSucursal[entidadId];
        console.log(`APLICANDO exclusiones para sucursal ${entidadId}:`, excluidos);
        const parametrosAntesDelFiltro = parametrosAplicables.length;
        parametrosAplicables = parametrosAplicables.filter(p => !excluidos.includes(p.nombre));
        console.log(`Parámetros filtrados: ${parametrosAntesDelFiltro} -> ${parametrosAplicables.length}`);
        console.log('Lista de parámetros después de exclusiones:', parametrosAplicables.map(p => p.nombre));
    } else if (tipo === 'sucursal') {
        console.log(`NO se encontraron exclusiones para sucursal ${entidadId}`);
        console.log('Claves disponibles en parametrosExcluidosPorSucursal:', Object.keys(window.parametrosExcluidosPorSucursal || {}));
    }
    
    if (window.parametrosExcluidosPorFranquicia && tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia[entidadId]) {
        const excluidos = window.parametrosExcluidosPorFranquicia[entidadId];
        console.log(`APLICANDO exclusiones para franquicia ${entidadId}:`, excluidos);
        const parametrosAntesDelFiltro = parametrosAplicables.length;
        parametrosAplicables = parametrosAplicables.filter(p => !excluidos.includes(p.nombre));
        console.log(`Parámetros filtrados: ${parametrosAntesDelFiltro} -> ${parametrosAplicables.length}`);
        console.log('Lista de parámetros después de exclusiones:', parametrosAplicables.map(p => p.nombre));
    } else if (tipo === 'franquicia') {
        console.log(`NO se encontraron exclusiones para franquicia ${entidadId}`);
        console.log('Claves disponibles en parametrosExcluidosPorFranquicia:', Object.keys(window.parametrosExcluidosPorFranquicia || {}));
    }
    
    const modalidadForm = (window.modoEdicion && window.modoEdicion.modalidad)
        ? String(window.modoEdicion.modalidad).toLowerCase().trim()
        : 'kpi';

    // Generar formulario de parámetros
    let html = '<div style="max-height: 400px; overflow-y: auto; margin: 10px 0;">';
    
    // Agregar botón "Seleccionar Todo" al inicio
    html += `
        <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border: 1px solid #0077cc; border-radius: 5px; text-align: center; position: relative; cursor: help;" 
               title="Marcar/desmarcar todos los parámetros">
            <button id="btn-seleccionar-todo" onclick="toggleSeleccionarTodo()" 
                    style="background: #0077cc; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                ↺ Reset (Todo cumple)
            </button>
            <span style="margin-left: 10px; font-size: 12px; color: #666;">
                Restablece todos los parámetros como "Cumple"
            </span>
        </div>
    `;
    
    // Agrupar por categoría
    const categorias = {};
    parametrosAplicables.forEach(param => {
        if (!categorias[param.categoriaId]) {
            categorias[param.categoriaId] = [];
        }
        categorias[param.categoriaId].push(param);
    });
    
    let numeroParametro = 1;
    
    // Ordenar categorías por suma de ponderancias (desc)
    const categoriaIdsOrdenadas = Object.keys(categorias).sort((a, b) => {
        const sumA = (categorias[a] || []).reduce((acc, p) => acc + (Number(p.peso) || 0), 0);
        const sumB = (categorias[b] || []).reduce((acc, p) => acc + (Number(p.peso) || 0), 0);
        if (sumB !== sumA) return sumB - sumA;
        return getCategoriaName(a).localeCompare(getCategoriaName(b));
    });

    categoriaIdsOrdenadas.forEach(categoriaId => {
        const categoria = (categorias[categoriaId] || []).slice();
        const nombreCategoria = getCategoriaName(categoriaId);

        // Ordenar parámetros dentro de cada categoría por ponderancia desc
        categoria.sort((p1, p2) => {
            const w1 = Number(p1.peso) || 0;
            const w2 = Number(p2.peso) || 0;
            if (w2 !== w1) return w2 - w1;
            return (p1.nombre || '').localeCompare(p2.nombre || '');
        });
        
        html += `
            <div style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; padding: 10px;">
                <h4 style="margin: 0; color: #0077cc; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                    ${nombreCategoria} (${categoria.length} parámetros)
                </h4>
        `;
        
        categoria.forEach(param => {
            html += `
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f9f9f9; border-radius: 4px;">
                    <div style="flex: 1; display: flex; align-items: center;">
                        <span style="background: #0077cc; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 10px;">
                            ${numeroParametro}
                        </span>
                        <div>
                            <strong>${param.nombre}</strong>
                            <div style="font-size: 12px; color: #666;">${param.descripcion}</div>
                        </div>
                    </div>
                    <div style="margin-left: 10px; display: flex; align-items: center;">
                        <input type="checkbox" 
                               id="param-${param.id}" 
                               data-peso="${param.peso}"
                               style="width: 18px; height: 18px; margin-right: 8px; cursor: pointer;"
                               onchange="actualizarTotalPuntos(); actualizarObservacionParametro('${param.id}')">
                        <span style="font-size: 14px; color: #0077cc; font-weight: bold;">${param.peso} pts</span>
                    </div>
                </div>
                ${(modalidadForm === 'kpi2') ? `
                <div id="obs-wrap-${param.id}" style="margin: -6px 0 10px 34px; display:none;">
                    <textarea id="obs-${param.id}" rows="2" placeholder="Observación" style="width: calc(100% - 10px); padding: 8px; border: 1px solid #ddd; border-radius: 6px; resize: vertical;" disabled></textarea>
                </div>
                ` : ''}
            `;
            numeroParametro++;
        });
        
        html += '</div>';
    });
    
    html += '</div>';
    
    parametrosContainer.innerHTML = html;

    if (!window.modoEdicion || !window.modoEdicion.activo) {
        const checkboxes = document.querySelectorAll('#parametros-evaluacion-container input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    // Calcular total inicial
    actualizarTotalPuntos();

    // Si estamos editando (KPI/KPI2), aplicar precarga después de que el DOM ya tiene los checkboxes.
    // Evita problemas de timing con setTimeout y asegura que KPI2 abra con sus parámetros actuales.
    try {
        if (window.modoEdicion && window.modoEdicion.activo && window.modoEdicion.parametrosPrecarga) {
            precargarValoresEvaluacion(window.modoEdicion.parametrosPrecarga);
            window.modoEdicion.parametrosPrecarga = null;
        }
    } catch (e) {}

    // Sincronizar visibilidad de observaciones DESPUÉS de precargar, para que solo aparezcan
    // en parámetros desmarcados (No cumple).
    try {
        if (modalidadForm === 'kpi2') {
            const checkboxes = document.querySelectorAll('#parametros-evaluacion-container input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const paramId = checkbox.id.replace('param-', '');
                actualizarObservacionParametro(paramId);
            });

            // Precargar texto de observaciones ya guardadas (solo para no cumple)
            const obsPrecarga = (window.modoEdicion && window.modoEdicion.activo && window.modoEdicion.observacionesPrecarga && typeof window.modoEdicion.observacionesPrecarga === 'object')
                ? window.modoEdicion.observacionesPrecarga
                : null;
            if (obsPrecarga) {
                checkboxes.forEach(checkbox => {
                    const paramId = checkbox.id.replace('param-', '');
                    if (checkbox.checked) return;
                    const input = document.getElementById(`obs-${paramId}`);
                    if (!input) return;
                    const t = obsPrecarga[paramId];
                    if (typeof t === 'string' && t.trim()) {
                        input.value = t;
                    }
                });
            }
        }
    } catch (e) {}
    
    // Mostrar botón guardar
    btnGuardar.style.display = 'block';
    btnGuardar.onclick = () => guardarEvaluacion(entidadValue);
}

// Función para obtener nombre de categoría
function getCategoriaName(categoriaId) {
    const categorias = {
        'bienvenida': 'Bienvenida y Atención al Cliente',
        'producto_ventas': 'Conocimiento del Producto y Ventas',
        'atencion_mesa': 'Atención en Mesa',
        'tiempos': 'Tiempos de Espera',
        'personal': 'Personal y Presentación',
        'presentacion_producto': 'Presentación del Producto',
        'exteriores': 'Instalaciones - Exteriores',
        'interiores': 'Instalaciones - Interiores'
    };
    return categorias[categoriaId] || categoriaId;
}

// Función para actualizar total de puntos
function actualizarTotalPuntos() {
    const totalPuntosDiv = document.getElementById('total-puntos-evaluacion');
    const checkboxes = document.querySelectorAll('#parametros-evaluacion-container input[type="checkbox"]');
    
    let totalObtenido = 0;
    let totalMaximo = 0;
    
    checkboxes.forEach(checkbox => {
        const pesoRaw = Number(checkbox.getAttribute('data-peso'));
        const peso = Number.isFinite(pesoRaw) ? pesoRaw : 0;
        if (checkbox.checked) {
            totalObtenido += peso;
        }
        totalMaximo += peso;
    });
    
    const porcentaje = totalMaximo > 0 ? Math.round((totalObtenido / totalMaximo) * 100) : 0;
    
    totalPuntosDiv.innerHTML = `
        <strong>Total de puntos: ${totalObtenido}/${totalMaximo} (${porcentaje}%)</strong>
    `;
}

function actualizarObservacionParametro(paramId) {
    try {
        const checkbox = document.getElementById(`param-${paramId}`);
        const wrap = document.getElementById(`obs-wrap-${paramId}`);
        const input = document.getElementById(`obs-${paramId}`);
        if (!checkbox || !wrap || !input) return;

        if (!checkbox.checked) {
            wrap.style.display = 'block';
            input.disabled = false;
        } else {
            input.value = '';
            input.disabled = true;
            wrap.style.display = 'none';
        }
    } catch (e) {}
}

// Función para guardar evaluación
async function guardarEvaluacion(entidadValue) {
    // Extraer tipo y ID de la entidad (corregir para IDs con guiones)
    const firstDashIndex = entidadValue.indexOf('-');
    const tipo = entidadValue.substring(0, firstDashIndex);
    const entidadId = entidadValue.substring(firstDashIndex + 1);
    
    const checkboxes = document.querySelectorAll('#parametros-evaluacion-container input[type="checkbox"]');
    
    const evaluacion = {};
    let totalObtenido = 0;
    let totalMaximo = 0;

    const observaciones = {};
    
    checkboxes.forEach(checkbox => {
        const paramId = checkbox.id.replace('param-', '');
        const pesoRaw = Number(checkbox.getAttribute('data-peso'));
        const peso = Number.isFinite(pesoRaw) ? pesoRaw : 0;
        evaluacion[paramId] = checkbox.checked ? peso : 0;

        if (!checkbox.checked) {
            const obs = document.getElementById(`obs-${paramId}`);
            const texto = (obs && typeof obs.value === 'string') ? obs.value.trim() : '';
            if (texto) {
                observaciones[paramId] = texto;
            }
        }
        
        if (checkbox.checked) {
            totalObtenido += peso;
        }
        totalMaximo += peso;
    });
    
    // Calcular KPI
    const kpi = totalMaximo > 0 ? (totalObtenido / totalMaximo) : 0;

    const modalidadEdicion = (window.modoEdicion && window.modoEdicion.modalidad)
        ? String(window.modoEdicion.modalidad).toLowerCase().trim()
        : 'kpi';
    
    // Obtener información de la entidad
    const entidadInfo = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    // Estructura de datos para Firebase
    const evaluacionData = {
        modalidad: modalidadEdicion,
        tipo: tipo,
        entidadId: entidadId,
        entidadNombre: entidadInfo?.nombre || 'Desconocido',
        mes: window.mesSeleccionado,
        parametros: evaluacion,
        ...(modalidadEdicion === 'kpi2' ? { observaciones } : {}),
        totalObtenido: totalObtenido,
        totalMaximo: totalMaximo,
        kpi: kpi,
        estado: (kpi * 100) >= 95 ? 'Excelente' : (kpi * 100) >= 90 ? 'Bueno' : 'Necesita mejora',
        estadoPublicacion: 'borrador',
        fechaPublicacion: null
    };
    
    try {
        // Verificar si estamos en modo edición
        const esEdicion = window.modoEdicion && window.modoEdicion.activo;
        
        if (esEdicion) {
            console.log(`Actualizando evaluación existente: ${entidadId} (${tipo})`);
            
            // Para edición, eliminar la evaluación existente y crear una nueva
            if (window.firebaseDB) {
                // Eliminar la evaluación existente
                if (typeof window.firebaseDB.eliminarEvaluacion === 'function') {
                    try {
                        if (window.firebaseDB.eliminarEvaluacion.length >= 4) {
                            await window.firebaseDB.eliminarEvaluacion(entidadId, tipo, window.mesSeleccionado, modalidadEdicion);
                        } else {
                            await window.firebaseDB.eliminarEvaluacion(entidadId, tipo, window.mesSeleccionado);
                        }
                    } catch (e) {
                        console.warn('Error eliminando evaluación previa (continuando):', e);
                    }
                }
                
                // Crear la nueva evaluación
                const firebaseId = await window.firebaseDB.guardarEvaluacion(evaluacionData);
                evaluacionData.firebaseId = firebaseId;
                console.log('Evaluación actualizada en Firebase exitosamente');
            }
        } else {
            console.log(`Creando nueva evaluación: ${entidadId} (${tipo})`);
            
            // Guardar nueva evaluación en Firebase
            if (window.firebaseDB) {
                const firebaseId = await window.firebaseDB.guardarEvaluacion(evaluacionData);
                evaluacionData.firebaseId = firebaseId;
                console.log('Evaluación guardada en Firebase exitosamente');
            }
        }
        
        // Actualizar también en almacenamiento local
        const evaluacionLocal = {
            modalidad: modalidadEdicion,
            parametros: evaluacion,
            ...(modalidadEdicion === 'kpi2' ? { observaciones } : {}),
            totalObtenido: totalObtenido,
            totalMaximo: totalMaximo,
            kpi: kpi,
            estado: evaluacionData.estado,
            estadoPublicacion: evaluacionData.estadoPublicacion,
            fechaCreacion: new Date().toISOString(),
            timestamp: Date.now()
        };

        // Integrar en cache local manteniendo coexistencia KPI/KPI2
        const tipoEntidadCache = (tipo === 'sucursal') ? 'sucursales' : (tipo === 'franquicia') ? 'franquicias' : 'competencia';
        if (!window.evaluaciones[tipoEntidadCache]) window.evaluaciones[tipoEntidadCache] = {};
        if (!window.evaluaciones[tipoEntidadCache][entidadId]) window.evaluaciones[tipoEntidadCache][entidadId] = {};

        const mes = window.mesSeleccionado;
        const actual = window.evaluaciones[tipoEntidadCache][entidadId][mes] || null;

        if (modalidadEdicion === 'kpi') {
            const base = { ...evaluacionLocal };
            base.modalidades = { kpi: base };
            if (actual && actual.modalidades && typeof actual.modalidades === 'object') {
                base.modalidades = { ...actual.modalidades, kpi: base };
                if (actual.modalidades.kpi2) base.modalidades.kpi2 = actual.modalidades.kpi2;
                if (actual.modalidades.kpi3) base.modalidades.kpi3 = actual.modalidades.kpi3;
            }
            window.evaluaciones[tipoEntidadCache][entidadId][mes] = base;
        } else {
            if (actual) {
                if (!actual.modalidades || typeof actual.modalidades !== 'object') {
                    actual.modalidades = { kpi: actual };
                }
                actual.modalidades[modalidadEdicion] = evaluacionLocal;
                actual[`_${modalidadEdicion}`] = evaluacionLocal;

                // Mantener el contenedor base con totales actuales para que la UI (KPI) no quede en 0
                // cuando solo existe modalidad KPI2.
                actual.totalObtenido = evaluacionLocal.totalObtenido;
                actual.totalMaximo = evaluacionLocal.totalMaximo;
                actual.kpi = evaluacionLocal.kpi;
                actual.estado = evaluacionLocal.estado;
                actual.estadoPublicacion = evaluacionLocal.estadoPublicacion;
                actual.fechaCreacion = evaluacionLocal.fechaCreacion;
                actual.timestamp = evaluacionLocal.timestamp;
                window.evaluaciones[tipoEntidadCache][entidadId][mes] = actual;
            } else {
                const contenedor = {
                    modalidad: 'kpi',
                    parametros: {},
                    totalObtenido: evaluacionLocal.totalObtenido,
                    totalMaximo: evaluacionLocal.totalMaximo,
                    kpi: evaluacionLocal.kpi,
                    estado: evaluacionLocal.estado,
                    estadoPublicacion: evaluacionLocal.estadoPublicacion,
                    fechaPublicacion: null,
                    fechaCreacion: evaluacionLocal.fechaCreacion,
                    timestamp: evaluacionLocal.timestamp,
                    videoUrl: null,
                    modalidades: {}
                };
                contenedor.modalidades[modalidadEdicion] = evaluacionLocal;
                contenedor[`_${modalidadEdicion}`] = evaluacionLocal;
                window.evaluaciones[tipoEntidadCache][entidadId][mes] = contenedor;
            }
        }
        
        // Cerrar modal
        cerrarModalEvaluacion();
        
        // Actualizar vista actual
        if (window.vistaActual === 'dashboard') {
            renderDashboard();
        } else if (window.vistaActual === 'matriz') {
            renderMatriz();
        } else if (window.vistaActual === 'graficas') {
            renderGraficas();
        } else if (window.vistaActual === 'competencia') {
            renderCompetencia();
        }
        
        // También actualizar la sección de evaluaciones para mostrar la nueva evaluación
        renderEvaluaciones();
        
        // Mostrar mensaje de éxito
        const accion = esEdicion ? 'actualizada' : 'guardada';
        const kpiPorcentaje = Math.round(kpi * 100);
        alert(`Evaluación ${accion} exitosamente para ${entidadInfo?.nombre} - ${formatearMesLegible(window.mesSeleccionado)}\nKPI: ${kpiPorcentaje}% (${evaluacionData.estado})`);
        
    } catch (error) {
        console.error('Error guardando evaluación:', error);
        alert('Error al guardar la evaluación. Por favor, inténtalo de nuevo.');
    }
}

// Función para cerrar modal
function cerrarModalEvaluacion() {
    const modal = document.getElementById('modal-nueva-evaluacion');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Restaurar elementos del modal para futuras creaciones
    const labelEntidad = document.querySelector('label[for="select-entidad-evaluacion"]');
    const selectEntidad = document.getElementById('select-entidad-evaluacion');
    
    if (labelEntidad) {
        labelEntidad.style.display = 'block';
    }
    if (selectEntidad) {
        selectEntidad.style.display = 'block';
        selectEntidad.value = ''; // Limpiar selección
    }
    
    // Restaurar título y botón por defecto
    const modalTitle = document.querySelector('#modal-nueva-evaluacion h2');
    if (modalTitle) {
        modalTitle.textContent = 'Nueva evaluación';
    }
    
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    if (btnGuardar) {
        btnGuardar.textContent = 'Guardar evaluación';
    }
    
    // Limpiar modo edición
    window.modoEdicion = { activo: false };
    
    // Limpiar contenedor de parámetros
    const container = document.getElementById('parametros-evaluacion-container');
    if (container) {
        container.innerHTML = '';
    }
}

// Función para seleccionar/deseleccionar todos los parámetros
function toggleSeleccionarTodo() {
    const checkboxes = document.querySelectorAll('#parametros-evaluacion-container input[type="checkbox"]');
    const btnSeleccionarTodo = document.getElementById('btn-seleccionar-todo');

    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        const paramId = checkbox.id.replace('param-', '');
        actualizarObservacionParametro(paramId);
    });

    if (btnSeleccionarTodo) {
        btnSeleccionarTodo.textContent = '↺ Reset (Todo cumple)';
    }

    actualizarTotalPuntos();
}

// Función para renderizar gráficas
function renderGraficas() {
    console.log('Renderizando gráficas para mes:', window.mesSeleccionado);
    
    let html = `
        <div style="margin-bottom: 30px;">
            <h2 style="color: #0077cc; margin-bottom: 10px; text-align: center; font-size: 2rem;">
                Gráficas de Rendimiento - ${formatearMesLegible(window.mesSeleccionado)}
            </h2>
            <p style="text-align: center; color: #666; margin-bottom: 30px; font-size: 1.1rem;">
                Visualización de KPIs y tendencias
            </p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 30px;">
            <h3 style="text-align: center; margin-bottom: 25px; color: #2c3e50; font-size: 1.4rem; font-weight: 600;">
                📈 KPI2 por entidad
            </h3>
            <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                <canvas id="graficoKPIsComparacion" width="900" height="440" style="max-width: 100%; border-radius: 8px;"></canvas>
            </div>
            <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 15px;">
                KPI2 (PONDERA IA) por entidad
            </p>
        </div>

        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 30px;">
            <h3 style="text-align: center; margin-bottom: 20px; color: #2c3e50; font-size: 1.3rem; font-weight: 600;">
                📌 Top drivers KPI2 (puntos perdidos)
            </h3>
            <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: -5px; margin-bottom: 18px;">
                Parámetros que más están bajando el KPI2 en el mes seleccionado
            </p>
            <div id="topDriversKPI2"></div>
        </div>
        
        <!-- Responsive design para móviles -->
        <style>
            @media (max-width: 768px) {
                #graficoKPIsComparacion {
                    width: 100% !important;
                    height: 360px !important;
                }
            }
        </style>
    `;
    
    document.getElementById('graficas').innerHTML = html;
    
    // Generar datos para gráficas
    generarGraficosKPI();
    generarTopDriversKPI2();
}

function generarTopDriversKPI2() {
    const host = document.getElementById('topDriversKPI2');
    if (!host) return;

    const kpi2Utils = window.kpi2Utils || null;
    if (!kpi2Utils || typeof kpi2Utils.getPesoKPI2 !== 'function') {
        host.innerHTML = '<div style="text-align:center; color:#666;">KPI2 no está disponible para calcular drivers</div>';
        return;
    }

    const evaluacionesFiltradas = filtrarDatosPorRol(obtenerEvaluacionesDelMes(window.mesSeleccionado));
    const drivers = new Map();
    let evaluacionesContadas = 0;

    const normKey = (s) => {
        try {
            return String(s || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '')
                .replace(/[-_]/g, '');
        } catch (e) {
            return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');
        }
    };

    evaluacionesFiltradas.forEach(e => {
        const entidadId = e.entidadId;
        const tipo = e.tipo;
        const evBase = e.evaluacion || null;
        const evLocal = (evBase && evBase.modalidades && evBase.modalidades.kpi2)
            ? evBase.modalidades.kpi2
            : evBase;
        if (!entidadId || !tipo || !evLocal) return;
        if (!window.parametros || !Array.isArray(window.parametros)) return;

        const modelo = (typeof kpi2Utils.getModeloEntidad === 'function')
            ? kpi2Utils.getModeloEntidad(entidadId, tipo)
            : null;

        const parametrosExcluidos = (tipo === 'sucursal' && typeof window.obtenerParametrosExcluidos === 'function')
            ? window.obtenerParametrosExcluidos(entidadId)
            : (tipo === 'franquicia' && typeof window.obtenerParametrosExcluidosFranquicia === 'function')
                ? window.obtenerParametrosExcluidosFranquicia(entidadId)
                : [];

        const excluidosNorm = Array.isArray(parametrosExcluidos)
            ? parametrosExcluidos.map(normKey)
            : [];

        const tipoLower = String(tipo).toLowerCase();

        const aplicaEntidad = (p) => {
            if (!p) return false;
            if (p.aplicaATodas) return true;
            const hasSuc = Array.isArray(p.aplicaASucursales);
            const hasFra = Array.isArray(p.aplicaAFranquicias);
            if (!hasSuc && !hasFra) return true;
            if (tipoLower === 'sucursal') {
                if (!hasSuc) return true;
                return p.aplicaASucursales.includes(entidadId);
            }
            if (tipoLower === 'franquicia') {
                if (!hasFra) return true;
                return p.aplicaAFranquicias.includes(entidadId);
            }
            return false;
        };

        const esExcluido = (p) => {
            if (!aplicaEntidad(p)) return true;
            const idNorm = normKey(p.id);
            const nombreNorm = normKey(p.nombre);
            // Listas de exclusión vienen por nombre; comparamos por ambos para compatibilidad.
            return excluidosNorm.includes(idNorm) || (nombreNorm && excluidosNorm.includes(nombreNorm));
        };

        evaluacionesContadas++;

        window.parametros.forEach(p => {
            if (!p || esExcluido(p)) return;

            if (p.id === 'mencion_promociones' && tipo !== 'sucursal') return;

            const peso2 = kpi2Utils.getPesoKPI2(p.id, p.peso, modelo);
            if (!peso2 || peso2 <= 0) return;

            const pesoOriginal = Number(p.peso) || 0;
            if (pesoOriginal <= 0) return;

            const existe = !!(evLocal.parametros && evLocal.parametros[p.id] !== undefined);
            // En KPI2, un undefined suele significar "no capturado" (no es falla). No debe generar puntos perdidos.
            // Excepción: mencion_promociones tiene default por negocio.
            if (!existe) {
                if (p.id === 'mencion_promociones' && tipoLower === 'sucursal') {
                    // default: cumple para todas salvo Carrizal
                    const valorPromo = (entidadId !== 'walmart-carrizal') ? pesoOriginal : 0;
                    const ratioPromo = (p.tipo === 'booleano')
                        ? (valorPromo > 0 ? 1 : 0)
                        : Math.max(0, Math.min(1, valorPromo / pesoOriginal));
                    const perdidoPromo = peso2 * (1 - ratioPromo);
                    if (Number.isFinite(perdidoPromo) && perdidoPromo > 0) {
                        const prev = drivers.get(p.id) || { id: p.id, nombre: p.nombre || p.id, perdido: 0, casos: 0 };
                        prev.perdido += perdidoPromo;
                        prev.casos += 1;
                        drivers.set(p.id, prev);
                    }
                }
                return;
            }

            const valor = Number(evLocal.parametros[p.id] ?? 0) || 0;

            const ratio = (p.tipo === 'booleano')
                ? (valor > 0 ? 1 : 0)
                : Math.max(0, Math.min(1, valor / pesoOriginal));

            const perdido = peso2 * (1 - ratio);
            if (!Number.isFinite(perdido) || perdido <= 0) return;

            const prev = drivers.get(p.id) || { id: p.id, nombre: p.nombre || p.id, perdido: 0, casos: 0 };
            prev.perdido += perdido;
            prev.casos += 1;
            drivers.set(p.id, prev);
        });
    });

    const rows = Array.from(drivers.values())
        .sort((a, b) => b.perdido - a.perdido)
        .slice(0, 12);

    if (!rows.length) {
        host.innerHTML = '<div style="text-align:center; color:#666;">No hay suficiente información para calcular drivers</div>';
        return;
    }

    const maxPerdido = Math.max(...rows.map(r => r.perdido));

    host.innerHTML = `
        <div style="display:flex; justify-content: space-between; gap: 12px; align-items:center; margin-bottom: 12px; color:#6b7280; font-size: 12px;">
            <div><strong>Evaluaciones consideradas:</strong> ${evaluacionesContadas}</div>
            <div><strong>Top:</strong> ${rows.length} parámetros</div>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left; padding:10px; border-bottom:1px solid #eee;">Parámetro</th>
                        <th style="text-align:right; padding:10px; border-bottom:1px solid #eee;">Puntos perdidos</th>
                        <th style="text-align:left; padding:10px; border-bottom:1px solid #eee;">Impacto</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => {
                        const pct = maxPerdido > 0 ? Math.round((r.perdido / maxPerdido) * 100) : 0;
                        return `
                            <tr>
                                <td style="padding:10px; border-bottom:1px solid #f3f4f6;">${r.nombre}</td>
                                <td style="padding:10px; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:700; color:#111827;">${r.perdido.toFixed(1)}</td>
                                <td style="padding:10px; border-bottom:1px solid #f3f4f6;">
                                    <div style="height:10px; background:#eef2ff; border-radius:999px; overflow:hidden;">
                                        <div style="width:${pct}%; height:10px; background:#a855f7;"></div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generarGraficosKPI() {
    const canvas2 = document.getElementById('graficoDistribucion');
    const canvasC = document.getElementById('graficoKPIsComparacion');
    
    if (!canvas2 && !canvasC) return;

    const kpi2Utils = window.kpi2Utils || null;
    const calcularKPI2ParaGrafica = (entidadId, tipo, evaluacionLocal) => {
        if (kpi2Utils && typeof kpi2Utils.calcularKPI2 === 'function') {
            return kpi2Utils.calcularKPI2(entidadId, tipo, evaluacionLocal);
        }
        return null;
    };
    
    // Obtener datos filtrados por rol usando la función existente
    const evaluacionesFiltradas = filtrarDatosPorRol(obtenerEvaluacionesDelMes(window.mesSeleccionado));
    
    const soloKPI2 = (typeof window.debeUsarSoloKPI2 === 'function') ? window.debeUsarSoloKPI2(window.mesSeleccionado) : false;
    const kpiPermitido = (typeof window.debeMostrarKPI === 'function') ? window.debeMostrarKPI(window.mesSeleccionado) : true;

    // Obtener datos de KPIs de las evaluaciones filtradas
    let datosKPI = [];
    let datosKPI2 = [];
    let entidades = [];
    let metas = [];
    
    evaluacionesFiltradas.forEach(evaluacion => {
        const entidadId = evaluacion.entidadId;
        const tipo = evaluacion.tipo;
        const evLocal = evaluacion.evaluacion || null;
        const evParaKPI2 = (evLocal && evLocal.modalidades && evLocal.modalidades.kpi2)
            ? evLocal.modalidades.kpi2
            : (evLocal && evLocal._kpi2 ? evLocal._kpi2 : evLocal);

        const kpi2 = calcularKPI2ParaGrafica(entidadId, tipo, evParaKPI2);
        const kpi2Porcentaje = (typeof kpi2 === 'number') ? Math.round(kpi2 * 100) : null;

        let kpiPorcentaje = null;
        if (!soloKPI2 && kpiPermitido) {
            // KPI: recalcular desde parámetros para no depender de totales/kpi históricos (p.ej. cambios soloKPI2 como existencia)
            if (typeof calcularPorcentajeEvaluacion === 'function' && entidadId && tipo && evLocal) {
                try {
                    kpiPorcentaje = calcularPorcentajeEvaluacion(entidadId, tipo, evLocal);
                } catch (e) {
                    kpiPorcentaje = null;
                }
            }
            if (typeof kpiPorcentaje !== 'number' || !Number.isFinite(kpiPorcentaje)) {
                if (evaluacion.kpi !== undefined && evaluacion.kpi !== null) {
                    kpiPorcentaje = Math.round(evaluacion.kpi * 100);
                }
            }
        }

        if (soloKPI2) {
            if (kpi2Porcentaje !== null) {
                datosKPI2.push(kpi2Porcentaje);
                entidades.push(evaluacion.entidad);
                metas.push({ entidad: evaluacion.entidad, entidadId, tipo, evaluacion: evParaKPI2 });
            }
        } else {
            if (kpiPorcentaje !== null && kpiPorcentaje !== undefined) {
                datosKPI.push(kpiPorcentaje);
                datosKPI2.push(kpi2Porcentaje);
                entidades.push(evaluacion.entidad);
                metas.push({ entidad: evaluacion.entidad, entidadId, tipo, evaluacion: evParaKPI2 });
            }
        }
    });
    
    // Dibujar gráfico de distribución
    if (canvas2) {
        dibujarGraficoDistribucion(canvas2, soloKPI2 ? datosKPI2 : datosKPI);
    }

    // Dibujar gráfico comparativo KPI vs KPI2 (un solo chart)
    if (canvasC) {
        if (soloKPI2) {
            const ctxC = canvasC.getContext('2d');
            try {
                window._chartGraficasComparacion?.destroy?.();
            } catch (e) {}
            window._chartGraficasComparacion = null;

            const labelsC = entidades.slice();
            const dataC = datosKPI2.slice();

            if (!labelsC.length || !window.Chart) {
                ctxC.clearRect(0, 0, canvasC.width, canvasC.height);
                ctxC.fillStyle = '#666';
                ctxC.font = '16px Arial';
                ctxC.textAlign = 'center';
                ctxC.fillText('No hay datos suficientes para graficar KPI2', canvasC.width / 2, canvasC.height / 2);
                return;
            }

            window._chartGraficasComparacion = new Chart(ctxC, {
                type: 'bar',
                data: {
                    labels: labelsC,
                    datasets: [
                        {
                            label: 'KPI2 (%)',
                            data: dataC,
                            backgroundColor: 'rgba(168,85,247,0.22)',
                            borderColor: '#a855f7',
                            borderWidth: 2,
                            borderRadius: 6,
                        },
                        {
                            label: 'Meta 95%',
                            data: new Array(labelsC.length).fill(95),
                            type: 'line',
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
                            labels: { color: '#2c3e50' }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: (c) => ` ${c.dataset.label}: ${c.parsed.y}%`
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#6b7280', maxRotation: 45, minRotation: 45 },
                            grid: { display: false }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            ticks: { color: '#6b7280', callback: (v) => v + '%' },
                            grid: { color: 'rgba(0,0,0,0.06)' }
                        }
                    },
                    interaction: { mode: 'nearest', intersect: false },
                    animation: { duration: 800, easing: 'easeOutQuart' }
                }
            });
            return;
        }

        const idxs = [];
        for (let i = 0; i < entidades.length; i++) {
            if (datosKPI[i] !== null && datosKPI[i] !== undefined && datosKPI2[i] !== null && datosKPI2[i] !== undefined) {
                idxs.push(i);
            }
        }

        const labelsC = idxs.map(i => entidades[i]);
        const dataC1 = idxs.map(i => datosKPI[i]);
        const dataC2 = idxs.map(i => datosKPI2[i]);

        const ctxC = canvasC.getContext('2d');
        if (!labelsC.length) {
            ctxC.clearRect(0, 0, canvasC.width, canvasC.height);
            ctxC.fillStyle = '#666';
            ctxC.font = '16px Arial';
            ctxC.textAlign = 'center';
            ctxC.fillText('No hay datos simultáneos (KPI y KPI2) para comparar', canvasC.width / 2, canvasC.height / 2);
        } else if (window.Chart) {
            try {
                if (window._chartGraficasComparacion) {
                    window._chartGraficasComparacion.destroy();
                }
            } catch (e) {
                window._chartGraficasComparacion = null;
            }

            window._chartGraficasComparacion = new Chart(ctxC, {
                type: 'bar',
                data: {
                    labels: labelsC,
                    datasets: [
                        {
                            label: 'KPI (%)',
                            data: dataC1,
                            backgroundColor: 'rgba(10,132,255,0.25)',
                            borderColor: '#0a84ff',
                            borderWidth: 2,
                            borderRadius: 6,
                        },
                        {
                            label: 'KPI2 (%)',
                            data: dataC2,
                            backgroundColor: 'rgba(168,85,247,0.22)',
                            borderColor: '#a855f7',
                            borderWidth: 2,
                            borderRadius: 6,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#2c3e50' }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: (c) => ` ${c.dataset.label}: ${c.parsed.y}%`
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#6b7280', maxRotation: 45, minRotation: 45 },
                            grid: { display: false }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            ticks: { color: '#6b7280', callback: (v) => v + '%' },
                            grid: { color: 'rgba(0,0,0,0.06)' }
                        }
                    },
                    interaction: { mode: 'nearest', intersect: false },
                    animation: { duration: 800, easing: 'easeOutQuart' }
                }
            });
        } else {
            ctxC.clearRect(0, 0, canvasC.width, canvasC.height);
            ctxC.fillStyle = '#666';
            ctxC.font = '16px Arial';
            ctxC.textAlign = 'center';
            ctxC.fillText('Chart.js no está disponible para la comparación', canvasC.width / 2, canvasC.height / 2);
        }
    }
}

// Función para dibujar gráfico de barras
function dibujarGraficoBarras(canvas, labels, data, metas = []) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos para mostrar', width/2, height/2);
        // Asegurar que no queden tooltips visibles
        ocultarTooltipGrafica();
        // Limpia listeners previos
        canvas.onmousemove = null;
        canvas.onmouseleave = null;
        return;
    }
    
    const maxValue = Math.max(...data, 100);
    const barWidth = (width - 60) / data.length;
    const maxBarHeight = height - 60;
    
    // Guardar rectángulos de barras para hover
    const barras = [];
    
    // Dibujar barras
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * maxBarHeight;
        const x = 30 + index * barWidth;
        const y = height - 30 - barHeight;
        
        // Color según rendimiento
        let color = '#dc3545'; // Rojo para bajo
        if (value >= 95) color = '#28a745'; // Verde para alto
        else if (value >= 90) color = '#ffc107'; // Amarillo para medio
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 5, barHeight);
        
        // Calcular parámetros fallidos (valor < peso), excluyendo los excluidos
        let fallidos = [];
        const meta = metas[index];
        if (meta && meta.evaluacion && meta.evaluacion.parametros && Array.isArray(window.parametros)) {
            try {
                const tipoLower = (meta.tipo || '').toLowerCase();
                const excluidos = (window.obtenerParametrosExcluidos ? window.obtenerParametrosExcluidos(meta.entidadId, tipoLower) : []) || [];
                const excluidosSet = new Set(excluidos);
                window.parametros.forEach(param => {
                    // Normalizar id para comparar con excluidos
                    const idNorm = param.id.toLowerCase().replace(/[-_]/g, '');
                    if (excluidosSet.has(idNorm)) return; // saltar excluidos
                    const valor = parseInt(meta.evaluacion.parametros[param.id] ?? 0, 10);
                    const peso = parseInt(param.peso ?? 0, 10);
                    if (peso > 0 && valor < peso) {
                        fallidos.push(param.nombre);
                    }
                });
            } catch (e) {
                console.warn('No se pudieron calcular parámetros fallidos para', meta?.entidad, e);
            }
        }
        
        // Registrar barra para detección de hover
        barras.push({
            x,
            y,
            w: barWidth - 5,
            h: barHeight,
            label: labels[index],
            value,
            color,
            fallidos
        });
        
        // Etiqueta de valor
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}%`, x + barWidth/2 - 2.5, y - 5);
        
        // Etiqueta de entidad (rotada)
        ctx.save();
        ctx.translate(x + barWidth/2 - 2.5, height - 10);
        ctx.rotate(-Math.PI/4);
        ctx.font = '10px Arial';
        ctx.fillText(labels[index].substring(0, 8), 0, 0);
        ctx.restore();
    });
    
    // Eje Y
    ctx.strokeStyle = '#666';
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(30, height - 30);
    ctx.stroke();
    
    // Marcas del eje Y
    for (let i = 0; i <= 100; i += 20) {
        const y = height - 30 - (i / 100) * maxBarHeight;
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${i}%`, 25, y + 3);
    }

    // Listeners para tooltip
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const bar = barras.find(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h);
        if (bar) {
            const estado = bar.value >= 95 ? 'Excelente' : bar.value >= 90 ? 'Bueno' : 'Necesita mejora';
            // Construir listado compacto de parámetros fallidos
            const totalFallidos = Array.isArray(bar.fallidos) ? bar.fallidos.length : 0;
            const lista = (bar.fallidos || []).slice(0, 4).join(', ');
            const resto = totalFallidos > 4 ? ` … (+${totalFallidos - 4})` : '';
            const html = `
                <div class="matriz-tooltip-row">
                    <div class="matriz-tooltip-icon">🏢</div>
                    <div class="matriz-tooltip-label">Entidad</div>
                    <div class="matriz-tooltip-value">${bar.label}</div>
                </div>
                <div class="matriz-tooltip-row">
                    <div class="matriz-tooltip-icon">📊</div>
                    <div class="matriz-tooltip-label">KPI</div>
                    <div class="matriz-tooltip-value">${bar.value}%</div>
                </div>
                <div class="matriz-tooltip-row">
                    <div class="matriz-tooltip-icon">📈</div>
                    <div class="matriz-tooltip-label">Estado</div>
                    <div class="matriz-tooltip-value">${estado}</div>
                </div>
                ${totalFallidos > 0 ? `
                <div class="matriz-tooltip-row">
                    <div class="matriz-tooltip-icon">❌</div>
                    <div class="matriz-tooltip-label">Fallidos</div>
                    <div class="matriz-tooltip-value">${totalFallidos} ${lista ? `— ${lista}${resto}` : ''}</div>
                </div>` : ''}
            `;
            mostrarTooltipGrafica(html, e.clientX, e.clientY);
        } else {
            ocultarTooltipGrafica();
        }
    };
    canvas.onmouseleave = () => {
        ocultarTooltipGrafica();
    };
}

// Función para dibujar gráfico de distribución (dona simple)
function dibujarGraficoDistribucion(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos para mostrar', width/2, height/2);
        ocultarTooltipGrafica();
        canvas.onmousemove = null;
        canvas.onmouseleave = null;
        return;
    }
    
    // Categorizar datos
    let alto = data.filter(d => d >= 95).length;
    let medio = data.filter(d => d >= 90 && d < 95).length;
    let bajo = data.filter(d => d < 90).length;
    
    const total = alto + medio + bajo;
    if (total === 0) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    // Dibujar sectores y registrar arcos para hover
    let startAngle = 0;
    const sectores = [];
    
    // Alto (Verde)
    if (alto > 0) {
        const angle = (alto / total) * 2 * Math.PI;
        ctx.fillStyle = '#28a745';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fill();
        sectores.push({ start: startAngle, end: startAngle + angle, color: '#28a745', label: 'Alto (≥95%)', count: alto, percent: Math.round((alto/total)*100) });
        startAngle += angle;
    }
    
    // Medio (Amarillo)
    if (medio > 0) {
        const angle = (medio / total) * 2 * Math.PI;
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fill();
        sectores.push({ start: startAngle, end: startAngle + angle, color: '#ffc107', label: 'Medio (90–94%)', count: medio, percent: Math.round((medio/total)*100) });
        startAngle += angle;
    }
    
    // Bajo (Rojo)
    if (bajo > 0) {
        const angle = (bajo / total) * 2 * Math.PI;
        ctx.fillStyle = '#dc3545';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fill();
        sectores.push({ start: startAngle, end: startAngle + angle, color: '#dc3545', label: 'Bajo (<90%)', count: bajo, percent: Math.round((bajo/total)*100) });
    }
    
    // Leyenda
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#28a745';
    ctx.fillRect(20, height - 60, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText(`Alto (≥95%): ${alto}`, 40, height - 48);
    
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(20, height - 40, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText(`Medio (90-94%): ${medio}`, 40, height - 28);
    
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(20, height - 20, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText(`Bajo (<90%): ${bajo}`, 40, height - 8);

    // Listeners para tooltip del pastel
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dx = mx - centerX;
        const dy = my - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > radius) { ocultarTooltipGrafica(); return; }
        let ang = Math.atan2(dy, dx);
        if (ang < 0) ang += 2*Math.PI;
        const sector = sectores.find(s => ang >= s.start && ang <= s.end);
        if (sector) {
            const html = `
                <div class="matriz-tooltip-row">
                    <div class="matriz-tooltip-icon">🧮</div>
                    <div class="matriz-tooltip-label">Categoría</div>
                    <div class="matriz-tooltip-value">${sector.label}</div>
                </div>
                <div class="matriz-tooltip-row">
                    <div class="matriz-tooltip-icon">🔢</div>
                    <div class="matriz-tooltip-label">Cantidad</div>
                    <div class="matriz-tooltip-value">${sector.count} / ${total}</div>
                </div>
                <div class="matriz-tooltip-row">
                    <div class="matriz-tooltip-icon">📈</div>
                    <div class="matriz-tooltip-label">Porcentaje</div>
                    <div class="matriz-tooltip-value">${sector.percent}%</div>
                </div>
            `;
            mostrarTooltipGrafica(html, e.clientX, e.clientY);
        } else {
            ocultarTooltipGrafica();
        }
    };
    canvas.onmouseleave = () => {
        ocultarTooltipGrafica();
    };
}

// Función para generar resumen estadístico
function generarResumenEstadistico() {
    const container = document.getElementById('resumenEstadistico');
    if (!container) return;
    
    // Recopilar todos los KPIs
    let kpis = [];
    
    // Sucursales
    if (window.sucursales) {
        window.sucursales.filter(s => s.activa).forEach(sucursal => {
            const evaluacion = window.evaluaciones?.sucursales?.[sucursal.id]?.[window.mesSeleccionado];
            if (evaluacion && evaluacion.totalObtenido !== undefined && evaluacion.totalMaximo !== undefined) {
                const kpi = evaluacion.totalMaximo > 0 ? 
                    Math.round((evaluacion.totalObtenido / evaluacion.totalMaximo) * 100) : 0;
                kpis.push(kpi);
            }
        });
    }
    
    // Franquicias
    if (window.franquicias) {
        window.franquicias.filter(f => f.activa).forEach(franquicia => {
            const evaluacion = window.evaluaciones?.franquicias?.[franquicia.id]?.[window.mesSeleccionado];
            if (evaluacion && evaluacion.totalObtenido !== undefined && evaluacion.totalMaximo !== undefined) {
                const kpi = evaluacion.totalMaximo > 0 ? 
                    Math.round((evaluacion.totalObtenido / evaluacion.totalMaximo) * 100) : 0;
                kpis.push(kpi);
            }
        });
    }
    
    if (kpis.length === 0) {
        container.innerHTML = '<p>No hay datos de evaluaciones para el período seleccionado.</p>';
        return;
    }
    
    // Calcular estadísticas
    const promedio = kpis.reduce((a, b) => a + b, 0) / kpis.length;
    const maximo = Math.max(...kpis);
    const minimo = Math.min(...kpis);
    const alto = kpis.filter(k => k >= 95).length;
    const medio = kpis.filter(k => k >= 90 && k < 95).length;
    const bajo = kpis.filter(k => k < 90).length;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0; color: #0077cc;">Promedio General</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${promedio.toFixed(1)}%</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0; color: #28a745;">Mejor Rendimiento</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${maximo}%</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0; color: #dc3545;">Menor Rendimiento</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${minimo}%</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0; color: #6c757d;">Total Evaluadas</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${kpis.length}</div>
            </div>
        </div>
        
        <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 8px;">
                <strong style="color: #155724;">Alto Rendimiento</strong><br>
                <span style="font-size: 18px;">${alto} entidades (≥95%)</span>
            </div>
            <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 8px;">
                <strong style="color: #856404;">Rendimiento Medio</strong><br>
                <span style="font-size: 18px;">${medio} entidades (90-94%)</span>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 8px;">
                <strong style="color: #721c24;">Bajo Rendimiento</strong><br>
                <span style="font-size: 18px;">${bajo} entidades (<90%)</span>
            </div>
        </div>
    `;
}

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iniciando aplicación...');
    
    // Establecer mes actual como predeterminado para el dashboard
    window.mesSeleccionado = typeof obtenerMesActual === 'function' ? obtenerMesActual() : obtenerMesAnterior();

    let ultimoMesConDatos = null;
    
    // Inicializar estructura de evaluaciones si no existe
    if (!window.evaluaciones) {
        window.evaluaciones = { sucursales: {}, franquicias: {}, competencia: {} };
    }
    
    // Cargar evaluaciones desde Firebase primero
    if (window.firebaseDB) {
        try {
            console.log('Cargando evaluaciones desde Firebase...');
            const evaluacionesFirebase = await window.firebaseDB.cargarEvaluaciones();
            console.log('Evaluaciones cargadas desde Firebase exitosamente');
            
            // Integrar datos de Firebase en estructura local
            integrarDatosFirebase(evaluacionesFirebase);

            try {
                aplicarCompatibilidadExistencia();
            } catch (e) {}
            
            // DEBUG: Mostrar qué meses tienen datos reales
            console.log('=== DEBUG: MESES CON DATOS REALES ===');
            const mesesConDatos = new Set();
            
            // Revisar sucursales
            if (window.evaluaciones.sucursales) {
                Object.keys(window.evaluaciones.sucursales).forEach(sucursalId => {
                    Object.keys(window.evaluaciones.sucursales[sucursalId]).forEach(mes => {
                        mesesConDatos.add(mes);
                    });
                });
            }
            
            // Revisar franquicias
            if (window.evaluaciones.franquicias) {
                Object.keys(window.evaluaciones.franquicias).forEach(franquiciaId => {
                    Object.keys(window.evaluaciones.franquicias[franquiciaId]).forEach(mes => {
                        mesesConDatos.add(mes);
                    });
                });
            }
            
            const mesesOrdenados = Array.from(mesesConDatos).sort();
            ultimoMesConDatos = mesesOrdenados.length > 0 ? mesesOrdenados[mesesOrdenados.length - 1] : null;
            console.log('Meses con datos reales en Firebase:', mesesOrdenados);
            console.log('Mes seleccionado actualmente:', window.mesSeleccionado);
            
        } catch (error) {
            console.error('Error cargando desde Firebase:', error);
        }
    }
    
    // Si el mes en curso no tiene evaluaciones pero sí hay datos en otros meses, caer al último mes con datos
    const evaluacionesExistentes = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    if (evaluacionesExistentes.length === 0 && ultimoMesConDatos) {
        console.log(`Mes ${window.mesSeleccionado} sin datos. Cambiando automáticamente al último mes con datos: ${ultimoMesConDatos}`);
        window.mesSeleccionado = ultimoMesConDatos;
    }

    // Generar datos de muestra solo si no hay datos en ningún mes y la función existe
    const evaluacionesTrasFallback = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    if (evaluacionesTrasFallback.length === 0) {
        console.log('No hay evaluaciones para el mes seleccionado.');
        if (typeof generarDatosEjemplo === 'function') {
            console.log('Generando datos de muestra...');
            generarDatosEjemplo();
        }
    } else {
        console.log(`Encontradas ${evaluacionesTrasFallback.length} evaluaciones existentes para ${window.mesSeleccionado}`);
    }
    
    // Poblar selector de mes
    poblarSelectorMes();
    
    // Configurar navegación
    configurarNavegacion();
    
    // Verificar autenticación
    const autenticado = verificarAutenticacion();
    
    if (autenticado) {
        // Si está autenticado, mostrar dashboard y asegurar selector en mes actual
        cambiarVista('dashboard');
        // aplicarRestriccionesPorRol();
        console.log(`Sistema inicializado para usuario: ${usuarioActual.nombre} (${usuarioActual.rol})`);
    } else {
        // Si no está autenticado, solo mostrar login
        console.log('Usuario no autenticado, mostrando login');
    }
});

// Función para configurar la navegación
function configurarNavegacion() {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            const vista = this.getAttribute('data-section');
            cambiarVista(vista);
        });
    });
    console.log('Navegación configurada');
}

// Función para actualizar el dashboard
function actualizarDashboard() {
    if (!window.mesSeleccionado) {
        console.error('No hay mes seleccionado');
        return;
    }
    
    console.log('Actualizando dashboard para mes:', window.mesSeleccionado);
    
    // Obtener evaluaciones del mes y aplicar filtro por rol
    const todasLasEvaluaciones = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    const evaluacionesFiltradas = filtrarDatosPorRol(todasLasEvaluaciones);
    
    console.log(`Evaluaciones totales: ${todasLasEvaluaciones.length}, Filtradas por rol: ${evaluacionesFiltradas.length}`);
    
    // Calcular estadísticas basadas en datos filtrados
    const stats = calcularEstadisticas(evaluacionesFiltradas);
    
    // Actualizar tarjetas de estadísticas
    actualizarTarjetasEstadisticas(stats);
    
    // Actualizar tabla de ranking
    actualizarTablaRanking(evaluacionesFiltradas);
    
    // Actualizar distribución de rendimiento
    actualizarDistribucionRendimiento(evaluacionesFiltradas);
    
    console.log('Dashboard actualizado con restricciones de rol:', usuarioActual?.rol);
}

// Función para mostrar evaluaciones
function mostrarEvaluaciones() {
    const container = document.getElementById('evaluaciones-container');
    if (!container) {
        console.error('Container de evaluaciones no encontrado');
        return;
    }
    
    // Obtener evaluaciones del mes y aplicar filtro por rol
    const todasLasEvaluaciones = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    const evaluacionesFiltradas = filtrarDatosPorRol(todasLasEvaluaciones);
    
    console.log(`Mostrando evaluaciones filtradas por rol ${usuarioActual?.rol}: ${evaluacionesFiltradas.length} de ${todasLasEvaluaciones.length}`);
    
    if (evaluacionesFiltradas.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No hay evaluaciones disponibles</h3>
                <p>No se encontraron evaluaciones para ${window.mesSeleccionado} con sus permisos actuales.</p>
                ${tienePermiso('crear') ? '<button onclick="abrirModalNuevaEvaluacion()" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Evaluación</button>' : ''}
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="evaluaciones-header">
            <h2>Evaluaciones de ${window.mesSeleccionado}</h2>
            ${tienePermiso('crear') ? '<button onclick="abrirModalNuevaEvaluacion()" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Evaluación</button>' : ''}
        </div>
        <div class="evaluaciones-grid">
    `;
    
    evaluacionesFiltradas.forEach(evaluacion => {
        const porcentaje = ((evaluacion.kpi || 0) * 100).toFixed(1);
        const estadoClass = evaluacion.estado === 'Excelente' ? 'excelente' : 
                           evaluacion.estado === 'Bueno' ? 'bueno' : 'mejora';
        
        html += `
            <div class="evaluacion-card ${estadoClass}">
                <div class="evaluacion-header">
                    <h3>${evaluacion.entidad}</h3>
                    <span class="tipo-badge">${evaluacion.tipo}</span>
                </div>
                <div class="evaluacion-content">
                    <div class="kpi-display">
                        <span class="kpi-value">${porcentaje}%</span>
                        <span class="kpi-label">KPI</span>
                    </div>
                    <div class="evaluacion-details">
                        <p><strong>Estado:</strong> ${evaluacion.estado}</p>
                        <p><strong>Fecha:</strong> ${evaluacion.fecha}</p>
                    </div>
                </div>
                ${tienePermiso('editar') || tienePermiso('eliminar') || tienePermiso('publicar') ? `
                <div class="evaluacion-actions">
                    ${tienePermiso('editar') ? `
                    <button class="btn btn-secondary btn-editar" onclick="editarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" title="Editar evaluación">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${tienePermiso('eliminar') ? `
                            <button class="btn btn-danger btn-eliminar" onclick="eliminarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" title="Eliminar evaluación">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                            ${tienePermiso('publicar') ? `
                            <button class="btn ${((evaluacion.estadoPublicacion || 'borrador') === 'publicado') ? 'btn-warning' : 'btn-success'} btn-publicar" onclick="publicarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" title="${((evaluacion.estadoPublicacion || 'borrador') === 'publicado') ? 'Despublicar evaluación' : 'Publicar evaluación'}">
                                <i class="fas ${((evaluacion.estadoPublicacion || 'borrador') === 'publicado') ? 'fa-undo' : 'fa-share'}"></i>
                            </button>
                            ` : ''}
                            <button onclick="verVideo('${evaluacion.entidadId}', '${evaluacion.tipo}')"
                                    class="btn btn-video" 
                                    title="Ver video de evaluación">
                                <i class="fas fa-video"></i>
                            </button>
                        </div>
                        ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Aplicar restricciones de rol después de renderizar
    // aplicarRestriccionesPorRol();
}

// Función para cargar entidades en el modal de evaluación
function cargarEntidadesEvaluacion() {
    const selectEntidad = document.getElementById('entidad-evaluacion');
    if (!selectEntidad) return;
    
    selectEntidad.innerHTML = '<option value="">Seleccione una opción...</option>';
    
    if (!usuarioActual) {
        console.log('Usuario no autenticado, no se cargan entidades');
        return;
    }
    
    const rol = usuarioActual.rol;
    
    // Filtrar entidades según el rol del usuario
    if (rol === 'admin' || rol === 'dg' || rol === 'capacitacion') {
        // Admin y DG pueden ver sucursales
        if (window.sucursales) {
            window.sucursales.filter(s => s.activa).forEach(sucursal => {
                const option = document.createElement('option');
                option.value = `sucursal-${sucursal.id}`;
                option.textContent = `${sucursal.nombre} (Sucursal)`;
                selectEntidad.appendChild(option);
            });
        }
    }
    
    if (rol === 'admin' || rol === 'dg' || rol === 'capacitacion' || rol === 'franquicias') {
        // Admin, DG y Franquicias pueden ver franquicias
        if (window.franquicias) {
            window.franquicias.filter(f => f.activa).forEach(franquicia => {
                const option = document.createElement('option');
                option.value = `franquicia-${franquicia.id}`;
                option.textContent = `${franquicia.nombre} (Franquicia)`;
                selectEntidad.appendChild(option);
            });
        }
    }
    
    if (rol === 'admin' || rol === 'gop') {
        // Admin y GOP pueden ver entidades GOP (si existen)
        // Aquí podrías agregar entidades específicas de GOP si las tienes definidas
        console.log('Cargando entidades GOP para rol:', rol);
    }
    
    console.log(`Entidades cargadas para rol ${rol}:`, selectEntidad.children.length - 1);
}

// ===== FUNCIONES DE ACCIONES PARA EVALUACIONES =====

// Función para ver una evaluación
function verEvaluacion(entidadId, tipo, modalidad = 'kpi') {
    const base = obtenerEvaluacion(entidadId, tipo, window.mesSeleccionado);
    if (!base) {
        alert('Evaluación no encontrada');
        return;
    }

    try {
        const existente = document.getElementById('modalVerEvaluacion');
        if (existente) existente.remove();
    } catch (e) {}

    const mod = modalidad ? String(modalidad).toLowerCase().trim() : 'kpi';
    const evaluacion = (mod === 'kpi')
        ? (base.modalidades && base.modalidades.kpi ? base.modalidades.kpi : base)
        : (base.modalidades && base.modalidades[mod] ? base.modalidades[mod] : (base[`_${mod}`] || null));

    // Si aún no existe un payload guardado para la modalidad solicitada (p.ej. KPI2 en transición),
    // permitir visualizar una versión derivada desde el KPI legacy para no ocultar el botón.
    // Esto no altera datos guardados; solo afecta visualización.
    const evaluacionFinal = evaluacion || {
        modalidad: mod,
        parametros: (base && base.parametros) ? base.parametros : {},
        totalObtenido: base?.totalObtenido || 0,
        totalMaximo: base?.totalMaximo || 0,
        kpi: base?.kpi || 0,
        estado: base?.estado || 'Sin evaluar',
        estadoPublicacion: base?.estadoPublicacion || 'borrador',
        mes: base?.mes || window.mesSeleccionado,
        fechaPublicacion: base?.fechaPublicacion || null,
        fechaCreacion: base?.fechaCreacion || null,
        timestamp: base?.timestamp || null,
        videoUrl: base?.videoUrl || null
    };
    
    const entidad = (tipo === 'sucursal')
        ? window.sucursales.find(s => s.id === entidadId)
        : (tipo === 'franquicia')
            ? window.franquicias.find(f => f.id === entidadId)
            : null;
    
    const nombreEntidad = entidad ? entidad.nombre : entidadId;
    
    // Crear modal para mostrar detalles de la evaluación
    const totalObtenido = evaluacionFinal.totalObtenido || 0;
    const totalMaximo = evaluacionFinal.totalMaximo || 0;

    const kpi2Utils = window.kpi2Utils || null;
    const evalParaKPI2 = (base && base.modalidades && base.modalidades.kpi2)
        ? base.modalidades.kpi2
        : evaluacionFinal;
    const kpi2Calculado = (mod === 'kpi2' && kpi2Utils && typeof kpi2Utils.calcularKPI2 === 'function')
        ? kpi2Utils.calcularKPI2(entidadId, tipo, evalParaKPI2)
        : null;

    // Use the stored KPI value for consistency with the table
    const kpiPorcentaje = (mod === 'kpi2' && typeof kpi2Calculado === 'number')
        ? (kpi2Calculado * 100)
        : (evaluacionFinal.kpi ? (evaluacionFinal.kpi * 100) : (totalMaximo > 0 ? (totalObtenido / totalMaximo) * 100 : 0));
    const estado = kpiPorcentaje >= 95 ? 'Excelente' : kpiPorcentaje >= 90 ? 'Bueno' : 'Necesita mejora';

    const fechaCorta = formatearFechaHoraCorta(
        evaluacionFinal.fechaCreacion || evaluacionFinal.created_at || evaluacionFinal.timestamp || null
    );
    
    console.log(`Ver evaluación: ${entidadId} (${tipo})`);
    console.log(`Total obtenido: ${totalObtenido}, Total máximo: ${totalMaximo}, KPI: ${kpiPorcentaje.toFixed(1)}%`);
    console.log(`KPI almacenado: ${evaluacionFinal.kpi}, KPI calculado: ${kpiPorcentaje}`);

    const obtenerParametrosParaMostrar = () => {
        try {
            if (mod !== 'kpi2') {
                return Object.entries(evaluacionFinal.parametros || {});
            }

            const mes = window.mesSeleccionado;
            let parametrosAplicables = Array.isArray(window.parametros) ? window.parametros.slice() : [];

            // Filtrar por vigencia (excepto soloKPI2) para que el modal KPI2 muestre
            // parámetros nuevos aunque el mes sea anterior (p.ej. menciona_promociones).
            parametrosAplicables = parametrosAplicables.filter(p => {
                if (!p) return false;
                if (!p.vigenteDesde) return true;
                if (p.soloKPI2) return true;
                return !!mes && mes >= p.vigenteDesde;
            });

            // Filtrar por aplicación a entidad
            if (tipo === 'sucursal') {
                parametrosAplicables = parametrosAplicables.filter(p => p.aplicaATodas || (p.aplicaASucursales && p.aplicaASucursales.includes(entidadId)));
            } else if (tipo === 'franquicia') {
                parametrosAplicables = parametrosAplicables.filter(p => p.aplicaATodas || (p.aplicaAFranquicias && p.aplicaAFranquicias.includes(entidadId)));
            }

            // Solo sucursales para menciona_promociones
            parametrosAplicables = parametrosAplicables.filter(p => {
                if (!p) return false;
                if (p.id === 'mencion_promociones' && tipo !== 'sucursal') return false;
                return true;
            });

            return parametrosAplicables.map(p => {
                const existe = !!(evaluacionFinal.parametros && evaluacionFinal.parametros[p.id] !== undefined);
                if (!existe) {
                    if (p.id === 'mencion_promociones' && tipo === 'sucursal') {
                        const vPromo = (entidadId !== 'walmart-carrizal') ? (Number(p.peso) || 0) : 0;
                        return [p.id, vPromo];
                    }
                    if (p.soloKPI2) {
                        return [p.id, null];
                    }
                }
                const v = existe ? evaluacionFinal.parametros[p.id] : 0;
                return [p.id, v];
            });
        } catch (e) {
            return Object.entries(evaluacionFinal.parametros || {});
        }
    };

    const parametrosParaMostrar = obtenerParametrosParaMostrar();
    
    let detallesHtml = `
        <div class="modal" id="modalVerEvaluacion" style="display: block; z-index: 10000;">
            <div class="modal-content" style="max-width: 800px; margin: 50px auto; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #333;"><i class="fas fa-eye"></i> Detalles de Evaluación</h2>
                    <button onclick="cerrarModalVerEvaluacion()" class="btn-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                            <h3 style="color: #555; margin-bottom: 15px;">Información General</h3>
                            <p><strong>Entidad:</strong> ${nombreEntidad}</p>
                            <p><strong>Tipo:</strong> ${tipo ? (String(tipo).charAt(0).toUpperCase() + String(tipo).slice(1)) : ''}</p>
                            <p><strong>Mes:</strong> ${formatearMesLegible(window.mesSeleccionado)}</p>
                            <p><strong>Fecha:</strong> ${fechaCorta}</p>
                        </div>
                        <div>
                            <h3 style="color: #555; margin-bottom: 15px;">Resultados</h3>
                            <p><strong>KPI:</strong> <span style="color: ${kpiPorcentaje >= 95 ? '#28a745' : kpiPorcentaje >= 90 ? '#ffc107' : '#dc3545'}; font-weight: bold; font-size: 18px;">${kpiPorcentaje.toFixed(1)}%</span></p>
                            <p><strong>Estado:</strong> <span style="color: ${kpiPorcentaje >= 95 ? '#28a745' : kpiPorcentaje >= 90 ? '#ffc107' : '#dc3545'}; font-weight: bold;">${estado}</span></p>
                            <p><strong>Total Obtenido:</strong> ${evaluacionFinal.totalObtenido || 0}</p>
                            <p><strong>Total Máximo:</strong> ${evaluacionFinal.totalMaximo || 0}</p>
                        </div>
                    </div>
                    
                    <h3 style="color: #555; margin-bottom: 15px;">Parámetros Evaluados</h3>
                    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee; position: sticky; top: 0; background: #f8f9fa; z-index: 2; box-shadow: 0 1px 0 rgba(0,0,0,0.08);">Parámetro</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; position: sticky; top: 0; background: #f8f9fa; z-index: 2; box-shadow: 0 1px 0 rgba(0,0,0,0.08);">Estado</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #eee; position: sticky; top: 0; background: #f8f9fa; z-index: 2; box-shadow: 0 1px 0 rgba(0,0,0,0.08);">Peso</th>
                                    ${mod === 'kpi2' ? '<th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee; position: sticky; top: 0; background: #f8f9fa; z-index: 2; box-shadow: 0 1px 0 rgba(0,0,0,0.08);">Observación</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${parametrosParaMostrar.map(([paramId, valor]) => {
                                    const param = window.parametros?.find(p => p.id === paramId);
                                    const nombreParam = param ? param.nombre : paramId;
                                    const peso = param ? param.peso : valor;
                                    const noCapturado = (valor === null || valor === undefined);
                                    const cumple = !noCapturado && (Number(valor) > 0);
                                    const obs = (mod === 'kpi2' && evaluacionFinal && evaluacionFinal.observaciones && typeof evaluacionFinal.observaciones === 'object')
                                        ? (evaluacionFinal.observaciones[paramId] || '')
                                        : '';
                                    
                                    return `
                                        <tr style="border-bottom: 1px solid #f0f0f0;">
                                            <td style="padding: 10px;">${nombreParam}</td>
                                            <td style="padding: 10px; text-align: center;">
                                                ${noCapturado
                                                    ? `<span style="background: #e9ecef; color: #495057; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">— No capturado</span>`
                                                    : `<span style="background: ${cumple ? '#d4edda' : '#f8d7da'}; color: ${cumple ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${cumple ? '✓ Cumple' : '✗ No cumple'}</span>`}
                                            </td>
                                            <td style="padding: 10px; text-align: center; font-weight: bold;">${peso}</td>
                                            ${mod === 'kpi2' ? `<td style="padding: 10px; color: #2d3e50;">${(!noCapturado && !cumple && obs) ? obs : ''}</td>` : ''}
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Leyenda de estados -->
                    <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 1px solid #dee2e6;">
                        <h4 style="margin: 0; color: #495057; font-size: 14px; font-weight: 600;">
                            <i class="fas fa-info-circle" style="margin-right: 8px; color: #6c757d;"></i>
                            Leyenda de Estados
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 14px;">✓</span>
                                <span style="color: #28a745; font-weight: 600;">Cumple</span>
                                <span style="color: #6c757d;">- Puntaje máximo obtenido</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 14px;">✗</span>
                                <span style="color: #dc3545; font-weight: 600;">No cumple</span>
                                <span style="color: #6c757d;">- Sin puntaje obtenido</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; background: #f8f9fa; border-radius: 0 0 8px 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 12px; color: #6c757d;">
                        <i class="fas fa-calendar-alt" style="margin-right: 5px;"></i>
                        Evaluación del ${formatearMesLegible(window.mesSeleccionado)}
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${tienePermiso('editar') ? `
                        <button onclick="editarEvaluacion('${entidadId}', '${tipo}')" 
                                style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,123,255,0.3);"
                                onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,123,255,0.4)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,123,255,0.3)'">
                            <i class="fas fa-edit"></i>Editar
                        </button>
                        ` : ''}
                        <button onclick="cerrarModalVerEvaluacion()" 
                                style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(108,117,125,0.3);"
                                onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(108,117,125,0.4)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(108,117,125,0.3)'">
                            <i class="fas fa-times"></i>Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log('Creando modal HTML...');
    document.body.insertAdjacentHTML('beforeend', detallesHtml);
    
    // Verificar que el modal se creó y forzar su visibilidad
    const modal = document.getElementById('modalVerEvaluacion');
    console.log('Modal creado:', modal);
    
    if (modal) {
        modal.style.display = 'block';
        modal.style.zIndex = '99999';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        console.log('Modal forzado a ser visible');
    } else {
        console.error('Modal no se pudo crear');
    }
}

// Función para cerrar modal de ver evaluación
function cerrarModalVerEvaluacion() {
    const modal = document.getElementById('modalVerEvaluacion');
    if (modal) {
        modal.remove();
    }
}

// Función para editar una evaluación
function editarEvaluacion(entidadId, tipo, modalidad = 'kpi') {
    if (!tienePermiso('editar')) {
        alert('No tiene permisos para editar evaluaciones');
        return;
    }
    
    const mod = modalidad ? String(modalidad).toLowerCase().trim() : 'kpi';
    console.log(`Editar evaluación: ${entidadId} (${tipo}) [${mod}]`);
    
    const mes = window.mesSeleccionado;

    // Buscar la evaluación existente (preferir helper central si existe)
    const base = (typeof obtenerEvaluacion === 'function')
        ? obtenerEvaluacion(entidadId, tipo, mes)
        : (tipo === 'sucursal'
            ? window.evaluaciones?.sucursales?.[entidadId]?.[mes]
            : window.evaluaciones?.franquicias?.[entidadId]?.[mes]);

    if (!base) {
        alert('No se encontró la evaluación para editar');
        return;
    }

    const evalModalidad = (mod === 'kpi')
        ? (base.modalidades && base.modalidades.kpi ? base.modalidades.kpi : base)
        : (base.modalidades && base.modalidades[mod] ? base.modalidades[mod] : (base[`_${mod}`] || null));

    const modalidadesBase = (base && base.modalidades && typeof base.modalidades === 'object') ? base.modalidades : null;
    const primeraModalidad = (modalidadesBase && Object.keys(modalidadesBase).length)
        ? modalidadesBase[Object.keys(modalidadesBase)[0]]
        : null;

    const evalPrecarga = evalModalidad
        || (modalidadesBase && modalidadesBase.kpi2 ? modalidadesBase.kpi2 : null)
        || (modalidadesBase && modalidadesBase.kpi ? modalidadesBase.kpi : null)
        || primeraModalidad
        || base;
    
    // Obtener información de la entidad
    const entidadInfo = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    // Marcar que estamos en modo edición
    window.modoEdicion = {
        activo: true,
        entidadId: entidadId,
        tipo: tipo,
        mes: mes,
        modalidad: mod,
        parametrosPrecarga: (evalPrecarga && evalPrecarga.parametros) ? evalPrecarga.parametros : {},
        observacionesPrecarga: (mod === 'kpi2' && evalPrecarga && evalPrecarga.observaciones && typeof evalPrecarga.observaciones === 'object') ? evalPrecarga.observaciones : {},
        datosOriginales: { ...base },
        entidadInfo: entidadInfo
    };
    
    // Abrir el modal de nueva evaluación
    document.getElementById('modal-nueva-evaluacion').style.display = 'flex';
    
    // OCULTAR el selector de entidad y su label en modo edición
    const labelEntidad = document.querySelector('label[for="select-entidad-evaluacion"]');
    const selectEntidad = document.getElementById('select-entidad-evaluacion');
    
    if (labelEntidad) {
        labelEntidad.style.display = 'none';
    }
    if (selectEntidad) {
        selectEntidad.style.display = 'none';
        // Pre-seleccionar la entidad internamente (para que cargarParametrosEvaluacion funcione)
        selectEntidad.value = `${tipo}-${entidadId}`;
    }
    
    // Cambiar el título del modal para mostrar la entidad específica
    const modalTitle = document.querySelector('#modal-nueva-evaluacion h2');
    modalTitle.textContent = `Editar Evaluación ${mod.toUpperCase()} - ${entidadInfo?.nombre}`;
    
    // Cargar los parámetros para esta entidad específica
    const entidadValue = `${tipo}-${entidadId}`;
    cargarParametrosEvaluacion(entidadValue);
    
    // Cambiar el texto del botón (la precarga se hace dentro de cargarParametrosEvaluacion)
    setTimeout(() => {
        document.getElementById('btn-guardar-evaluacion').textContent = 'Actualizar Evaluación';
        document.getElementById('btn-guardar-evaluacion').style.display = 'block';
    }, 50);
}

// Función para precargar valores de evaluación
function precargarValoresEvaluacion(parametros) {
    const checkboxes = document.querySelectorAll('#parametros-evaluacion-container input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        const paramId = checkbox.id.replace('param-', '');
        checkbox.checked = parametros[paramId] > 0;
    });
    
    actualizarTotalPuntos();
}

// Función para eliminar una evaluación
function eliminarEvaluacion(entidadId, tipo) {
    if (!tienePermiso('eliminar')) {
        alert('No tiene permisos para eliminar evaluaciones');
        return;
    }
    
    const entidad = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    const nombreEntidad = entidad ? entidad.nombre : entidadId;
    
    console.log(`Intentando eliminar: ${entidadId} (${tipo}) del mes ${window.mesSeleccionado}`);
    
    // Determinar el tipo de entidad correctamente
    let tipoEntidad = 'franquicias';
    if (tipo === 'sucursal') tipoEntidad = 'sucursales';
    else if (tipo === 'franquicia') tipoEntidad = 'franquicias';
    else if (tipo === 'competencia') tipoEntidad = 'competencia';
    
    // Verificar si existe la evaluación
    const evaluacionExiste = window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[window.mesSeleccionado];
    console.log(`Evaluación existe:`, evaluacionExiste);
    console.log(`Estructura evaluaciones:`, window.evaluaciones);
    
    if (!evaluacionExiste) {
        alert(`No se encontró la evaluación de ${nombreEntidad} para ${formatearMesLegible(window.mesSeleccionado)}`);
        return;
    }
    
    if (confirm(`¿Está seguro de que desea eliminar la evaluación de ${nombreEntidad} para ${formatearMesLegible(window.mesSeleccionado)}?\n\nUna vez eliminada, no podrá ser recuperada.`)) {
        try {
            // Eliminar de la estructura local
            delete window.evaluaciones[tipoEntidad][entidadId][window.mesSeleccionado];
            
            // Eliminar de Firebase si está disponible
            if (window.firebaseDB) {
                window.firebaseDB.eliminarEvaluacion(entidadId, tipo, window.mesSeleccionado);
            }
            
            alert('Evaluación eliminada correctamente');
            
            // Actualizar vista
            cambiarVista('evaluaciones');
            
            console.log(`Evaluación eliminada: ${entidadId} (${tipo})`);
            
        } catch (error) {
            console.error('Error eliminando evaluación:', error);
            alert('Error al eliminar la evaluación');
        }
    }
}

// Función para ver video de una evaluación

// Función para ver video de una evaluación
function verVideo(entidadId, tipo) {
    console.log(`Ver video: ${entidadId} (${tipo})`);

    const entidad = tipo === 'sucursal'
        ? window.sucursales.find(s => s.id === entidadId)
        : tipo === 'competencia'
            ? window.competencia.find(c => c.id === entidadId)
            : window.franquicias.find(f => f.id === entidadId);
    const nombreEntidad = entidad ? entidad.nombre : entidadId;

    const mes = window.mesSeleccionado;
    const evalActual = typeof obtenerEvaluacion === 'function' ? obtenerEvaluacion(entidadId, tipo, mes) : null;
    const urlLocal = evalActual && evalActual.videoUrl ? evalActual.videoUrl : null;
    const linksMes = window.videoLinks?.[mes] || {};
    const urlMapeada = linksMes[entidadId];
    const urlCompetencia = tipo === 'competencia' && typeof obtenerYoutubeCompetencia === 'function' ? obtenerYoutubeCompetencia(entidadId, mes) : null;
    const urlOriginal = urlLocal || urlCompetencia || urlMapeada;

    // Helper local para construir URL de embed de YouTube sin controles
    const construirYouTubeEmbed = (url) => {
        if (!url) return null;
        try {
            let videoId = null;
            const u = new URL(url);
            if (u.hostname.includes('youtu.be')) {
                // Formato corto: youtu.be/VIDEOID
                videoId = u.pathname.replace('/', '').split('/')[0];
            } else if (u.hostname.includes('youtube.com')) {
                if (u.pathname === '/watch') {
                    videoId = u.searchParams.get('v');
                } else if (u.pathname.startsWith('/embed/')) {
                    videoId = u.pathname.split('/')[2];
                } else if (u.pathname.startsWith('/shorts/')) {
                    videoId = u.pathname.split('/')[2];
                }
            }
            if (!videoId) return null;
            // Parámetros para minimizar UI de YouTube
            const params = new URLSearchParams({
                rel: '0',              // no relacionados fuera del canal
                controls: '0',         // ocultar controles
                modestbranding: '1',   // menos branding
                iv_load_policy: '3',   // ocultar anotaciones
                fs: '0',               // deshabilitar fullscreen
                disablekb: '1',        // deshabilitar teclado
                playsinline: '1',      // inline en móvil
                autoplay: '0',         // inicia en pausa, se controla con clic
                enablejsapi: '1'       // habilitar control por JS
            });
            // especificar origen por seguridad del IFrame API
            try { params.set('origin', window.location.origin); } catch (e) {}
            const finalUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
            try { console.debug('YouTube embed URL:', finalUrl); } catch (e) {}
            return finalUrl;
        } catch (e) {
            return null;
        }
        
    };

    if (urlOriginal) {
        const embedUrl = construirYouTubeEmbed(urlOriginal);
        if (embedUrl) {
            // Construir modal con iframe embed
            const legibleMes = typeof formatearMesLegible === 'function' ? formatearMesLegible(mes) : mes;
            const videoHtml = `
                <div class="modal" id="modalVideo" style="display: block; z-index: 10001; position: fixed; inset: 0; background-color: rgba(0,0,0,0.6);">
                    <div class="modal-content" style="max-width: 960px; margin: 40px auto; background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); overflow: hidden;">
                        <div class="modal-header" style="padding: 14px 18px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="margin: 0; color: #333; font-size: 1.1rem;"><i class="fas fa-video"></i> Video de Evaluación - ${nombreEntidad} • ${legibleMes}</h2>
                            <button onclick="cerrarModalVideo()" class="btn-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; line-height: 1;">&times;</button>
                        </div>
                        <div class="modal-body" style="padding: 0; background:#000;">
                            <div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 */ background:#000;">
                                <iframe
                                     id="ytplayer"
                                     src="${embedUrl}"
                                     title="Video de evaluación"
                                     style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                                     frameborder="0"
                                     allow="autoplay; encrypted-media"
                                 ></iframe>
                                <!-- Capa completa para capturar clics y alternar play/pausa -->
                                <div
                                    id="ytOverlay"
                                    data-playing="0"
                                    onclick="toggleYTPlayPause(this)"
                                    ondblclick="event.preventDefault(); event.stopPropagation();"
                                    style="position:absolute; inset:0; z-index: 5; cursor: pointer;"
                                ></div>
                                <!-- Máscara inferior para ocultar visualmente la barra de controles de YouTube -->
                                <div
                                    aria-hidden="true"
                                    style="position:absolute; left:0; right:0; bottom:0; height:88px; z-index:6; pointer-events:none; background: linear-gradient(transparent, rgba(0,0,0,0.9));"
                                ></div>
                             </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="padding: 10px 14px; border-top: 1px solid #eee; display:flex; justify-content:flex-end; gap:8px;">
                            <button onclick="cerrarModalVideo()" class="btn btn-secondary">Cerrar</button>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', videoHtml);
            return;
        } else {
            // Si no es un enlace válido de YouTube, abrir en nueva pestaña como fallback
            const win = window.open(urlOriginal, '_blank', 'noopener');
            if (!win) alert('El navegador bloqueó la ventana emergente. Permite pop-ups para abrir el video.');
            return;
        }
    }

    // Fallback cuando no hay enlace
    const legibleMes = typeof formatearMesLegible === 'function' ? formatearMesLegible(mes) : mes;
    alert(`No hay enlace de video registrado para ${nombreEntidad} en ${legibleMes}.`);
}

// Función para cerrar modal de video
function cerrarModalVideo() {
    const modal = document.getElementById('modalVideo');
    if (modal) {
        modal.remove();
    }
}

// Alterna reproducción del iframe de YouTube usando postMessage
function toggleYTPlayPause(overlayEl) {
    try {
        const modal = document.getElementById('modalVideo');
        if (!modal) return;
        const iframe = modal.querySelector('iframe#ytplayer');
        if (!iframe || !iframe.contentWindow) return;
        const isPlaying = overlayEl.getAttribute('data-playing') === '1';
        const payload = JSON.stringify({ event: 'command', func: isPlaying ? 'pauseVideo' : 'playVideo', args: [] });
        iframe.contentWindow.postMessage(payload, '*');
        overlayEl.setAttribute('data-playing', isPlaying ? '0' : '1');
    } catch (e) {
        console.warn('No se pudo controlar el reproductor de YouTube:', e);
    }
}

// Función para subir video (placeholder)
function subirVideo(entidadId, tipo) {
    if (!tienePermiso('editar')) {
        alert('No tiene permisos para subir videos');
        return;
    }
    
    alert(`Función de subida de video para ${entidadId} (${tipo}) - En desarrollo`);
}

// Función auxiliar para obtener una evaluación específica
function obtenerEvaluacion(entidadId, tipo, mes) {
    // Mapear tipos correctamente a las estructuras de datos
    let tipoEntidad;
    switch(tipo) {
        case 'sucursal':
            tipoEntidad = 'sucursales';
            break;
        case 'franquicia':
            tipoEntidad = 'franquicias';
            break;
        case 'competencia':
            tipoEntidad = 'competencia';
            break;
        default:
            console.error('Tipo de entidad no reconocido:', tipo);
            return null;
    }
    
    return window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[mes];
}

// Función para obtener evaluaciones de un mes específico
function obtenerEvaluacionesDelMes(mes) {
    const evaluacionesDelMes = [];
    
    if (!mes || !window.evaluaciones) {
        console.log('No hay mes seleccionado o evaluaciones disponibles');
        return evaluacionesDelMes;
    }
    
    // Recopilar evaluaciones de sucursales
    if (window.evaluaciones.sucursales) {
        Object.keys(window.evaluaciones.sucursales).forEach(sucursalId => {
            const evaluacion = window.evaluaciones.sucursales[sucursalId][mes];
            if (evaluacion) {
                const sucursal = window.sucursales?.find(s => s.id === sucursalId);
                if (sucursal) {
                    // Calcular KPI directamente de los totales almacenados
                    let kpiPorcentaje = null;
                    try {
                        const evBase = evaluacion || null;
                        const evParaKPI = (evBase && evBase.modalidades && evBase.modalidades.kpi)
                            ? evBase.modalidades.kpi
                            : (evBase && evBase.modalidades && evBase.modalidades.kpi2)
                                ? evBase.modalidades.kpi2
                                : (evBase && evBase._kpi2 ? evBase._kpi2 : evBase);
                        if (typeof calcularPorcentajeEvaluacion === 'function' && evParaKPI) {
                            kpiPorcentaje = calcularPorcentajeEvaluacion(sucursalId, 'sucursal', evParaKPI);
                        }
                    } catch (e) {
                        kpiPorcentaje = null;
                    }
                    if (typeof kpiPorcentaje !== 'number' || !Number.isFinite(kpiPorcentaje)) {
                        const totalObtenido = evaluacion.totalObtenido || 0;
                        const totalMaximo = evaluacion.totalMaximo || 0;
                        kpiPorcentaje = totalMaximo > 0
                            ? Math.round((totalObtenido / totalMaximo) * 100)
                            : 0;
                    }
                    
                    // Obtener fecha de created_at o fechaCreacion
                    const fechaFormateada = formatearFechaHoraCorta(
                        evaluacion.created_at || evaluacion.fechaCreacion || evaluacion.fechaPublicacion || evaluacion.timestamp || null
                    );
                    
                    evaluacionesDelMes.push({
                        tipo: 'sucursal',
                        entidad: sucursal.nombre,
                        entidadId: sucursalId,
                        kpi: kpiPorcentaje / 100, // Guardar como decimal para consistencia
                        estado: kpiPorcentaje >= 95 ? 'Excelente' : kpiPorcentaje >= 90 ? 'Bueno' : 'Necesita Mejora',
                        fecha: fechaFormateada,
                        estadoPublicacion: evaluacion.estadoPublicacion || 'borrador',
                        fechaPublicacion: evaluacion.fechaPublicacion,
                        evaluacion: evaluacion
                    });
                }
            }
        });
    }
    
    // Recopilar evaluaciones de franquicias
    if (window.evaluaciones.franquicias) {
        Object.keys(window.evaluaciones.franquicias).forEach(franquiciaId => {
            const evaluacion = window.evaluaciones.franquicias[franquiciaId][mes];
            if (evaluacion) {
                const franquicia = window.franquicias?.find(f => f.id === franquiciaId);
                if (franquicia || true) { // Procesar todas las evaluaciones
                    const nombreFranquicia = franquicia ? franquicia.nombre : franquiciaId;
                    
                    // Calcular KPI directamente de los totales almacenados
                    let kpiPorcentaje = null;
                    try {
                        const evBase = evaluacion || null;
                        const evParaKPI = (evBase && evBase.modalidades && evBase.modalidades.kpi)
                            ? evBase.modalidades.kpi
                            : (evBase && evBase.modalidades && evBase.modalidades.kpi2)
                                ? evBase.modalidades.kpi2
                                : (evBase && evBase._kpi2 ? evBase._kpi2 : evBase);
                        if (typeof calcularPorcentajeEvaluacion === 'function' && evParaKPI) {
                            kpiPorcentaje = calcularPorcentajeEvaluacion(franquiciaId, 'franquicia', evParaKPI);
                        }
                    } catch (e) {
                        kpiPorcentaje = null;
                    }
                    if (typeof kpiPorcentaje !== 'number' || !Number.isFinite(kpiPorcentaje)) {
                        const totalObtenido = evaluacion.totalObtenido || 0;
                        const totalMaximo = evaluacion.totalMaximo || 0;
                        kpiPorcentaje = totalMaximo > 0
                            ? Math.round((totalObtenido / totalMaximo) * 100)
                            : 0;
                    }
                    
                    // Obtener fecha de created_at o fechaCreacion
                    const fechaFormateada = formatearFechaHoraCorta(
                        evaluacion.created_at || evaluacion.fechaCreacion || evaluacion.fechaPublicacion || evaluacion.timestamp || null
                    );
                    
                    evaluacionesDelMes.push({
                        tipo: 'franquicia',
                        entidad: nombreFranquicia,
                        entidadId: franquiciaId,
                        kpi: kpiPorcentaje / 100,
                        estado: kpiPorcentaje >= 95 ? 'Excelente' : kpiPorcentaje >= 90 ? 'Bueno' : 'Necesita Mejora',
                        fecha: fechaFormateada,
                        estadoPublicacion: evaluacion.estadoPublicacion || 'borrador',
                        fechaPublicacion: evaluacion.fechaPublicacion || null,
                        evaluacion: evaluacion
                    });
                }
            }
        });
    }
    
    // Recopilar evaluaciones de competencia
    if (window.evaluaciones.competencia) {
        Object.keys(window.evaluaciones.competencia).forEach(competenciaId => {
            const evaluacion = window.evaluaciones.competencia[competenciaId][mes];
            if (evaluacion) {
                const competencia = window.competencia?.find(c => c.id === competenciaId);
                if (competencia) {
                    // Calcular KPI directamente de los totales almacenados
                    let kpiPorcentaje = null;
                    try {
                        const evBase = evaluacion || null;
                        const evParaKPI = (evBase && evBase.modalidades && evBase.modalidades.kpi)
                            ? evBase.modalidades.kpi
                            : (evBase && evBase.modalidades && evBase.modalidades.kpi2)
                                ? evBase.modalidades.kpi2
                                : (evBase && evBase._kpi2 ? evBase._kpi2 : evBase);
                        if (typeof calcularPorcentajeEvaluacion === 'function' && evParaKPI) {
                            kpiPorcentaje = calcularPorcentajeEvaluacion(competenciaId, 'competencia', evParaKPI);
                        }
                    } catch (e) {
                        kpiPorcentaje = null;
                    }
                    if (typeof kpiPorcentaje !== 'number' || !Number.isFinite(kpiPorcentaje)) {
                        const totalObtenido = evaluacion.totalObtenido || 0;
                        const totalMaximo = evaluacion.totalMaximo || 0;
                        kpiPorcentaje = totalMaximo > 0
                            ? Math.round((totalObtenido / totalMaximo) * 100)
                            : 0;
                    }
                    
                    // Obtener fecha de created_at o fechaCreacion
                    const fechaFormateada = formatearFechaHoraCorta(
                        evaluacion.created_at || evaluacion.fechaCreacion || evaluacion.fechaPublicacion || evaluacion.timestamp || null
                    );
                    
                    evaluacionesDelMes.push({
                        tipo: 'competencia',
                        entidad: competencia.nombre,
                        entidadId: competenciaId,
                        kpi: kpiPorcentaje / 100, // Guardar como decimal para consistencia
                        estado: kpiPorcentaje >= 95 ? 'Excelente' : kpiPorcentaje >= 90 ? 'Bueno' : 'Necesita Mejora',
                        fecha: fechaFormateada,
                        estadoPublicacion: evaluacion.estadoPublicacion || 'borrador',
                        fechaPublicacion: evaluacion.fechaPublicacion,
                        evaluacion: evaluacion
                    });
                }
            }
        });
    }
    
    // Ordenar por KPI ascendente (peor primero)
    evaluacionesDelMes.sort((a, b) => a.kpi - b.kpi);
    
    console.log(`Obtenidas ${evaluacionesDelMes.length} evaluaciones para ${mes}`);
    return evaluacionesDelMes;
}

// Función para validar que los botones de acción funcionen correctamente
function validarBotonesAccion() {
    const botonesVer = document.querySelectorAll('.btn-view');
    const botonesEditar = document.querySelectorAll('.btn-edit, .btn-editar');
    const botonesEliminar = document.querySelectorAll('.btn-delete, .btn-eliminar');
    const botonesVideo = document.querySelectorAll('.btn-video');
    
    console.log('=== VALIDACIÓN DE BOTONES DE ACCIÓN ===');
    console.log(`Botones Ver: ${botonesVer.length}`);
    console.log(`Botones Editar: ${botonesEditar.length}`);
    console.log(`Botones Eliminar: ${botonesEliminar.length}`);
    console.log(`Botones Video: ${botonesVideo.length}`);
    console.log(`Usuario actual: ${usuarioActual?.nombre} (${usuarioActual?.rol})`);
    
    // Verificar que los botones tengan los onclick correctos
    botonesEditar.forEach((btn, index) => {
        const onclick = btn.getAttribute('onclick');
        console.log(`Botón Editar ${index + 1}: ${onclick}`);
    });
    
    botonesEliminar.forEach((btn, index) => {
        const onclick = btn.getAttribute('onclick');
        console.log(`Botón Eliminar ${index + 1}: ${onclick}`);
    });
}

// Función para integrar datos de Firebase en la estructura local window.evaluaciones
function integrarDatosFirebase(evaluacionesFirebase) {
    if (!evaluacionesFirebase || !Array.isArray(evaluacionesFirebase)) return;
    
    console.log(`Integrando ${evaluacionesFirebase.length} evaluaciones de Firebase...`);

    const obtenerTiempoEvaluacion = (ev) => {
        if (!ev) return 0;
        const valor = ev.timestamp || ev.timestampPublicacion || ev.fechaPublicacion || ev.fechaCreacion || ev.created_at || 0;
        if (typeof valor === 'number') return valor;
        if (valor && typeof valor.toMillis === 'function') return valor.toMillis();
        if (valor && typeof valor.toDate === 'function') return valor.toDate().getTime();
        const parsed = Date.parse(valor);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    
    evaluacionesFirebase.forEach(evaluacion => {
        const { tipo, entidadId, mes } = evaluacion;
        const modalidad = (evaluacion && evaluacion.modalidad) ? String(evaluacion.modalidad).toLowerCase().trim() : 'kpi';
        
        if (!tipo || !entidadId || !mes) {
            console.warn('Evaluación con datos incompletos:', evaluacion);
            return;
        }
        
        // Determinar el tipo de entidad (sucursales, franquicias o competencia)
        let tipoEntidad = 'franquicias';
        if (tipo === 'sucursal') tipoEntidad = 'sucursales';
        else if (tipo === 'franquicia') tipoEntidad = 'franquicias';
        else if (tipo === 'competencia') tipoEntidad = 'competencia';
        
        // Inicializar estructura si no existe
        if (!window.evaluaciones[tipoEntidad][entidadId]) {
            window.evaluaciones[tipoEntidad][entidadId] = {};
        }

        const convertido = {
            modalidad,
            parametros: evaluacion.parametros || {},
            totalObtenido: evaluacion.totalObtenido || 0,
            totalMaximo: evaluacion.totalMaximo || 0,
            kpi: evaluacion.kpi || 0,
            estado: evaluacion.estado || 'Sin evaluar',
            estadoPublicacion: evaluacion.estadoPublicacion || 'borrador',
            mes: mes,
            fechaPublicacion: evaluacion.fechaPublicacion ?
                (evaluacion.fechaPublicacion.toDate ? evaluacion.fechaPublicacion.toDate() : evaluacion.fechaPublicacion) : null,
            fechaCreacion: evaluacion.fechaCreacion || evaluacion.created_at || new Date().toISOString(),
            timestamp: evaluacion.timestamp || Date.now(),
            videoUrl: evaluacion.videoUrl || null,
            firebaseId: evaluacion.id || evaluacion.firebaseId || null
        };

        const actual = window.evaluaciones[tipoEntidad][entidadId][mes] || null;
        const tiempoConvertido = obtenerTiempoEvaluacion(convertido);
        const tiempoActual = obtenerTiempoEvaluacion(actual);

        if (actual && modalidad === 'kpi' && tiempoActual > tiempoConvertido) {
            return;
        }

        // Mantener compatibilidad: el registro principal por mes sigue siendo el KPI legacy.
        // Para modalidades nuevas, anexamos bajo .modalidades sin pisar lo existente.
        if (modalidad === 'kpi') {
            const base = convertido;
            base.modalidades = { kpi: base };
            // Si ya existía algo (p.ej. llegó KPI2 primero), conservarlo.
            if (actual && actual.modalidades && typeof actual.modalidades === 'object') {
                base.modalidades = { ...actual.modalidades, kpi: base };
                if (actual.modalidades.kpi2) base.modalidades.kpi2 = actual.modalidades.kpi2;
                if (actual.modalidades.kpi3) base.modalidades.kpi3 = actual.modalidades.kpi3;
            }
            window.evaluaciones[tipoEntidad][entidadId][mes] = base;
        } else {
            // Modalidad no-legacy: adjuntar dentro del objeto del mes.
            if (actual) {
                if (!actual.modalidades || typeof actual.modalidades !== 'object') {
                    actual.modalidades = { kpi: actual };
                }
                actual.modalidades[modalidad] = convertido;
                // cache rápido opcional para UI
                actual[`_${modalidad}`] = convertido;
                // Si el documento de la modalidad viene publicado, reflejarlo en el contenedor base.
                // Esto es importante porque la UI/filtrado por rol revisa estadoPublicacion del contenedor.
                if (convertido.estadoPublicacion && convertido.estadoPublicacion !== actual.estadoPublicacion) {
                    // Solo “subimos” a publicado; nunca bajamos a borrador desde una modalidad.
                    if (convertido.estadoPublicacion === 'publicado') {
                        actual.estadoPublicacion = 'publicado';
                        if (convertido.fechaPublicacion) actual.fechaPublicacion = convertido.fechaPublicacion;
                    }
                }
                // Propagar videoUrl al contenedor base para que la UI (que lee evalActual.videoUrl)
                // lo encuentre aunque el video se haya guardado en el documento KPI2.
                if (convertido.videoUrl && (!actual.videoUrl || actual.videoUrl !== convertido.videoUrl)) {
                    actual.videoUrl = convertido.videoUrl;
                }
                window.evaluaciones[tipoEntidad][entidadId][mes] = actual;
            } else {
                // Si no hay KPI legacy, crear un contenedor mínimo.
                const contenedor = {
                    modalidad: 'kpi',
                    parametros: {},
                    totalObtenido: 0,
                    totalMaximo: 0,
                    kpi: 0,
                    estado: 'Sin evaluar',
                    estadoPublicacion: convertido.estadoPublicacion || 'borrador',
                    mes,
                    fechaPublicacion: convertido.fechaPublicacion || null,
                    fechaCreacion: new Date().toISOString(),
                    timestamp: Date.now(),
                    videoUrl: convertido.videoUrl || null,
                    modalidades: {}
                };
                contenedor.modalidades[modalidad] = convertido;
                contenedor[`_${modalidad}`] = convertido;
                window.evaluaciones[tipoEntidad][entidadId][mes] = contenedor;
            }
        }
    });
    
    console.log('Datos de Firebase integrados exitosamente');
}

// Función para verificar si una evaluación existe en Firebase
function existeEnFirebase(entidadId, tipo) {
    // Lista de franquicias que sabemos que existen en Firebase
    const franquiciasReales = ['cd-carmen', 'jalpa', 'cunduacan', 'cumuapa', 'dosbocas', 'paraiso', 'cardenas', 'citycenter', 'via2'];
    
    if (tipo === 'franquicia') {
        return franquiciasReales.includes(entidadId);
    }
    
    // Para sucursales, asumimos que todas existen (puedes ajustar si es necesario)
    return true;
}

// Función para publicar una evaluación (solo admin)
async function publicarEvaluacion(entidadId, tipo) {
    if (!tienePermiso('admin')) {
        alert('Solo los administradores pueden publicar evaluaciones');
        return;
    }

    if (!window.firebaseAdminAuthenticated) {
        alert('Para publicar evaluaciones debes iniciar sesión en Firebase con la cuenta administradora.');
        return;
    }
    
    const entidad = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    const nombreEntidad = entidad ? entidad.nombre : entidadId;
    
    const evalLocal = typeof obtenerEvaluacion === 'function' ? obtenerEvaluacion(entidadId, tipo, window.mesSeleccionado) : null;
    const estadoActual = (evalLocal && evalLocal.estadoPublicacion) ? evalLocal.estadoPublicacion : 'borrador';
    const esPublicado = estadoActual === 'publicado';

    const confirmacion = esPublicado
        ? confirm(`¿Desea despublicar la evaluación de ${nombreEntidad} para ${formatearMesLegible(window.mesSeleccionado)}?\n\nAl despublicar, dejará de ser visible para GOP, DG y franquicias.`)
        : confirm(`¿Está seguro de que desea publicar la evaluación de ${nombreEntidad} para ${formatearMesLegible(window.mesSeleccionado)}?\n\nUna vez publicada, será visible para GOP, DG y franquicias.`);

    if (!confirmacion) return;
    
    try {
        // Actualizar en Firebase
        if (window.firebaseDB) {
            let nuevoEstado = esPublicado ? 'borrador' : 'publicado';
            let videoUrl = null;

            if (!esPublicado) {
                try {
                    videoUrl = prompt('Ingrese el enlace de video (YouTube) para esta evaluación (opcional):', '') || '';
                    videoUrl = videoUrl && typeof videoUrl === 'string' ? videoUrl.trim() : '';
                } catch (e) { videoUrl = ''; }
                videoUrl = videoUrl ? videoUrl : null;
            } else {
                // Al despublicar, conservar el video actual si existe
                videoUrl = (evalLocal && evalLocal.videoUrl) ? evalLocal.videoUrl : null;
            }

            // Buscar y actualizar la evaluación en Firebase usando query
            const success = await window.firebaseDB.actualizarEstadoPublicacion(entidadId, tipo, window.mesSeleccionado, nuevoEstado, videoUrl);
            
            if (success) {
                console.log(`Evaluación ${nuevoEstado === 'publicado' ? 'publicada' : 'despublicada'} en Firebase exitosamente`);
                
                // También actualizar en estructura local si existe
                let tipoEntidad = 'franquicias';
                if (tipo === 'sucursal') tipoEntidad = 'sucursales';
                else if (tipo === 'franquicia') tipoEntidad = 'franquicias';
                else if (tipo === 'competencia') tipoEntidad = 'competencia';
                
                if (window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[window.mesSeleccionado]) {
                    window.evaluaciones[tipoEntidad][entidadId][window.mesSeleccionado].estadoPublicacion = nuevoEstado;
                    window.evaluaciones[tipoEntidad][entidadId][window.mesSeleccionado].fechaPublicacion = (nuevoEstado === 'publicado') ? new Date() : null;
                    if (videoUrl) {
                        window.evaluaciones[tipoEntidad][entidadId][window.mesSeleccionado].videoUrl = videoUrl;
                    }
                }

                alert(`Evaluación de ${nombreEntidad} ${nuevoEstado === 'publicado' ? 'publicada' : 'despublicada'} exitosamente.`);
                
                // Actualizar vista actual
                if (window.vistaActual === 'evaluaciones') {
                    renderEvaluaciones();
                }
            } else {
                throw new Error('No se pudo actualizar la evaluación en Firebase');
            }
        } else {
            throw new Error('Firebase no está disponible');
        }
        
    } catch (error) {
        console.error('Error publicando evaluación:', error);
        alert('Error al publicar la evaluación. Por favor, inténtalo de nuevo.');
    }
}

// Función auxiliar para obtener una evaluación específica
function obtenerEvaluacion(entidadId, tipo, mes) {
    // Mapear tipos correctamente a las estructuras de datos
    let tipoEntidad;
    switch(tipo) {
        case 'sucursal':
            tipoEntidad = 'sucursales';
            break;
        case 'franquicia':
            tipoEntidad = 'franquicias';
            break;
        case 'competencia':
            tipoEntidad = 'competencia';
            break;
        default:
            console.error('Tipo de entidad no reconocido:', tipo);
            return null;
    }
    
    return window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[mes];
}

// ====== Tooltips HTML reutilizables para gráficas (estilo matriz) ======
function obtenerTooltipGrafica() {
    if (!window.__tooltipGrafica) {
        const div = document.createElement('div');
        div.className = 'matriz-tooltip-bubble';
        div.style.position = 'fixed';
        div.style.display = 'none';
        div.style.pointerEvents = 'none';
        div.style.bottom = 'auto';
        div.style.transform = 'none';
        document.body.appendChild(div);
        window.__tooltipGrafica = div;
    }
    return window.__tooltipGrafica;
}

function mostrarTooltipGrafica(html, clientX, clientY) {
    const tt = obtenerTooltipGrafica();
    tt.innerHTML = html;
    tt.style.display = 'block';
    const offset = 12;
    let left = clientX + offset;
    let top = clientY + offset;
    // Evitar desbordes de viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Ancho/alto estimados tras setear HTML
    tt.style.left = '0px';
    tt.style.top = '0px';
    const rect = tt.getBoundingClientRect();
    if (left + rect.width > vw - 8) left = clientX - rect.width - offset;
    if (top + rect.height > vh - 8) top = clientY - rect.height - offset;
    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
    tt.style.zIndex = 1000;
}

function ocultarTooltipGrafica() {
    const tt = obtenerTooltipGrafica();
    tt.style.display = 'none';
}
