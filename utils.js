// ===== FUNCIONES UTILITARIAS =====

// Variables globales
window.mesSeleccionado = '';
window.vistaActual = 'dashboard';
window.evaluaciones = {
    sucursales: {},
    franquicias: {},
    competencia: {}
};

// Corte: KPI legacy muere en 2026-05; desde 2026-06 todo el sistema usa KPI2 como motor único
window.kpiCorte = window.kpiCorte || {
    MES_KPI_FIN: '2026-05',
    MES_KPI2_UNICO: '2026-06'
};

function debeMostrarKPI(mes) {
    const m = (mes || '').toString().trim();
    return !!m && m <= (window.kpiCorte?.MES_KPI_FIN || '2026-05');
}

function debeUsarSoloKPI2(mes) {
    const m = (mes || '').toString().trim();
    return !!m && m >= (window.kpiCorte?.MES_KPI2_UNICO || '2026-06');
}

window.debeMostrarKPI = debeMostrarKPI;
window.debeUsarSoloKPI2 = debeUsarSoloKPI2;

// Función para obtener el mes anterior
function obtenerMesAnterior() {
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const año = mesAnterior.getFullYear();
    const mes = (mesAnterior.getMonth() + 1).toString().padStart(2, '0');
    return `${año}-${mes}`;
}

// Función para obtener el mes actual (YYYY-MM)
function obtenerMesActual() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    return `${año}-${mes}`;
}

// Función para formatear mes legible
function formatearMesLegible(mesString) {
    if (!mesString) return 'Mes no seleccionado';
    const [año, mes] = mesString.split('-');
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[parseInt(mes) - 1]} ${año}`;
}

// Override de aplicabilidad cargado desde Firestore (configuracion/ponderanciasKPI2).
// Si existe para la entidad, contiene el conjunto EFECTIVO de parámetros excluidos
// (ids) y sustituye tanto a las listas del catálogo como a parametros_excluidos.js.
function obtenerAplicabilidadOverride(entidadId, tipo) {
    try {
        const ov = window.kpi2ConfigOverrides && window.kpi2ConfigOverrides.aplicabilidad;
        const grupo = tipo === 'sucursal' ? 'sucursales' : (tipo === 'franquicia' ? 'franquicias' : null);
        if (ov && grupo && ov[grupo] && Array.isArray(ov[grupo][entidadId])) {
            return ov[grupo][entidadId];
        }
    } catch (e) {}
    return null;
}
window.obtenerAplicabilidadOverride = obtenerAplicabilidadOverride;

// Regla única de aplicabilidad de parámetros (misma que usa la Matriz y el
// formulario de captura): un parámetro aplica si tiene aplicaATodas, si la
// entidad está en su lista específica, o si no tiene listas (back-compat).
// Lo que "no aplica" se controla exclusivamente vía parametros_excluidos.js,
// salvo que exista override de aplicabilidad (Firestore) para la entidad.
function parametroAplicaAEntidad(param, tipo, entidadId) {
    if (!param) return false;
    // Los parámetros de bonificación (p.ej. actitud_servicio) nunca se capturan
    // en el formulario ni cuentan en el máximo: se otorgan aparte vía bonoActitud.
    // También los protege de overrides de aplicabilidad guardados antes de que
    // existieran (los overrides solo listan excluidos conocidos).
    if (param.bono) return false;
    const override = obtenerAplicabilidadOverride(entidadId, tipo);
    if (override) {
        const idNorm = param.id.toLowerCase().replace(/[-_]/g, '');
        return !override.some(x => String(x || '').toLowerCase().replace(/[-_]/g, '') === idNorm);
    }
    if (param.aplicaATodas) return true;
    if (param.aplicaATodas) return true;
    const hasSuc = Array.isArray(param.aplicaASucursales);
    const hasFra = Array.isArray(param.aplicaAFranquicias);
    if (!hasSuc && !hasFra) return true;
    if (tipo === 'sucursal') return !hasSuc || param.aplicaASucursales.includes(entidadId);
    if (tipo === 'franquicia') return !hasFra || param.aplicaAFranquicias.includes(entidadId);
    return true;
}
window.parametroAplicaAEntidad = parametroAplicaAEntidad;

// IDs normalizados de los parámetros excluidos para una entidad
// (las listas en parametros_excluidos.js vienen por nombre).
function obtenerIdsParametrosExcluidos(entidadId, tipo) {
    const override = obtenerAplicabilidadOverride(entidadId, tipo);
    if (override) {
        return override.map(id => String(id || '').toLowerCase().replace(/[-_]/g, ''));
    }
    const nombres = (tipo === 'sucursal' && window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId])
        ? window.parametrosExcluidosPorSucursal[entidadId]
        : (tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[entidadId])
            ? window.parametrosExcluidosPorFranquicia[entidadId]
            : [];
    return nombres
        .map(nombre => {
            const param = (window.parametros || []).find(p =>
                p.nombre.trim().toLowerCase() === String(nombre).trim().toLowerCase()
            );
            return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
        })
        .filter(id => id !== null);
}
window.obtenerIdsParametrosExcluidos = obtenerIdsParametrosExcluidos;

// Función para calcular porcentaje de evaluación
function calcularPorcentajeEvaluacion(entidadId, tipo, evaluacion) {
    if (!evaluacion || !window.parametros) return 0;
    
    let parametrosAplicables = window.parametros;
    
    // Obtener parámetros excluidos usando la misma lógica que en matriz.js
    const parametrosExcluidos = obtenerIdsParametrosExcluidos(entidadId, tipo);
    
    // Filtrar parámetros excluidos
    parametrosAplicables = parametrosAplicables.filter(param => 
        !parametrosExcluidos.includes(param.id.toLowerCase().replace(/[-_]/g, ''))
    );
    
    // Filtrar parámetros que aplican a la entidad (misma regla que la Matriz)
    if (tipo === 'sucursal' || tipo === 'franquicia') {
        parametrosAplicables = parametrosAplicables.filter(p => parametroAplicaAEntidad(p, tipo, entidadId));
    }
    
    // Calcular puntaje máximo posible.
    // - Excluye parámetros soloKPI2
    // - Si la evaluación no trae el parámetro (undefined), se omite para no penalizar históricos
    const puntajeMaximo = parametrosAplicables
        .filter(param => {
            if (param?.soloKPI2) return false;
            const tieneValor = evaluacion?.parametros && evaluacion.parametros[param.id] !== undefined;
            return !!tieneValor;
        })
        .reduce((total, param) => total + (param.peso || 1), 0);
    
    if (puntajeMaximo === 0) return 0;
    
    // Calcular puntaje obtenido
    let puntajeObtenido = 0;
    parametrosAplicables.forEach(param => {
        if (param?.soloKPI2) return;
        if (!evaluacion.parametros || evaluacion.parametros[param.id] === undefined) return;
        const v = parseInt(evaluacion.parametros[param.id]) || 0;
        const peso = Number(param.peso) || 0;
        if (peso <= 0) return;

        // En KPI legacy muchos parámetros eran checkbox (cumple/no cumple), pero en KPI2 pueden
        // venir valores parciales (0..peso). Para evitar discrepancias visuales en Matriz,
        // calculamos proporcional cuando el parámetro NO es booleano.
        if (param && param.tipo === 'booleano') {
            puntajeObtenido += v > 0 ? peso : 0;
            return;
        }

        const ratio = Math.max(0, Math.min(1, v / peso));
        puntajeObtenido += (peso * ratio);
    });
    
    return Math.round((puntajeObtenido / puntajeMaximo) * 100);
}

// Función para poblar selector de mes
function poblarSelectorMes() {
    const selector = document.getElementById('mes-selector'); 
    if (!selector) return;
    
    selector.innerHTML = '';
    
    // Generar opciones para los últimos 12 meses
    const ahora = new Date();
    for (let i = 0; i < 12; i++) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const año = fecha.getFullYear();
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const mesString = `${año}-${mes}`;
        
        const option = document.createElement('option');
        option.value = mesString;
        option.textContent = formatearMesLegible(mesString);
        
        // Seleccionar el mes anterior por defecto
        if (mesString === window.mesSeleccionado) {
            option.selected = true;
        }
        
        selector.appendChild(option);
    }
    
    // Asegurar que el selector refleje el mes seleccionado actual
    if (window.mesSeleccionado) {
        selector.value = window.mesSeleccionado;
    }
    
    // Event listener para cambio de mes
    selector.onchange = function() {
        window.mesSeleccionado = this.value;
        console.log(`Mes seleccionado cambiado a: ${this.value}`);
        
        // Actualizar vista actual
        if (window.vistaActual === 'dashboard') {
            renderDashboard();
        } else if (window.vistaActual === 'matriz') {
            renderMatriz();
        } else if (window.vistaActual === 'evaluaciones') {
            renderEvaluaciones();
        } else if (window.vistaActual === 'graficas') {
            renderGraficas();
        } else if (window.vistaActual === 'competencia') {
            renderCompetencia();
        } else if (window.vistaActual === 'ponderancias' && typeof renderPonderancias === 'function') {
            renderPonderancias();
        }

        // Siempre actualizar evaluaciones para que los datos estén listos
        renderEvaluaciones();
        
    };
}

window.kpi2Utils = (function() {
    const MES_KPI2_DESDE = '2026-02';
    const MODO_DUAL_SIEMPRE = true;

    function debeMostrarKPI2(mes) {
        if (MODO_DUAL_SIEMPRE) return true;
        return !!mes && mes >= MES_KPI2_DESDE;
    }

    function normalizarModelo(modelo) {
        const m = (modelo || '').toString().trim().toLowerCase();
        if (m === 'móvil' || m === 'movil') return 'Móvil';
        if (m === 'express') return 'Express';
        if (m === 'cafetería' || m === 'cafeteria') return 'Cafetería';
        return '';
    }

    function getModeloEntidad(entidadId, tipo) {
        try {
            if (!entidadId) return '';
            if (tipo === 'sucursal') {
                const s = Array.isArray(window.sucursales) ? window.sucursales.find(x => x.id === entidadId) : null;
                return normalizarModelo(s && s.modelo);
            }
            if (tipo === 'franquicia') {
                const f = Array.isArray(window.franquicias) ? window.franquicias.find(x => x.id === entidadId) : null;
                return normalizarModelo(f && f.modelo);
            }
        } catch (e) {}
        return '';
    }

    const PONDERA_IA_PESOS_POR_MODELO = {
        'Cafetería': {
            bienvenida_contacto_visual: 4,
            bienvenida_agradecimiento: 2,
            conocimiento_productos: 2,
            producto_mes: 3,
            venta_cruzada: 5,
            mencion_promociones: 3,
            app_cabana: 9,
            pin_personalizador: 3,
            atencion_mesa: 2,
            entrega_ticket: 3,
            tiempo_espera_atencion: 3,
            tiempo_fila: 3,
            tiempo_espera_cafe: 4,
            cantidad_colaboradores: 1,
            apariencia_personal: 2,
            tableta: 1,
            presentacion_vaso: 2,
            presentacion_cafe: 4,
            presentacion_alimento: 4,
            existencia: 5,
            panera_estado: 2,
            fachada_limpieza: 2,
            letrero_anuncio: 2,
            jardineras_macetas: 2,
            iluminacion: 2,
            puertas_vidrios: 2,
            musica_volumen: 2,
            area_mostrador: 2,
            mesas_sillas_limpieza: 2,
            piso_limpieza: 2,
            banos_estado: 4,
            basura_estado: 2,
            barra_limpieza: 2,
            clima_funcionando: 4,
            mesas_sillas_estado: 2,
            interfon: 4
        },
        'Express': {
            bienvenida_contacto_visual: 4,
            bienvenida_agradecimiento: 2,
            conocimiento_productos: 2,
            producto_mes: 3,
            venta_cruzada: 5,
            mencion_promociones: 3,
            app_cabana: 9,
            pin_personalizador: 4,
            atencion_mesa: 2,
            entrega_ticket: 3,
            tiempo_espera_atencion: 3,
            tiempo_fila: 3,
            tiempo_espera_cafe: 4,
            cantidad_colaboradores: 1,
            apariencia_personal: 2,
            tableta: 1,
            presentacion_vaso: 2,
            presentacion_cafe: 3,
            presentacion_alimento: 3,
            existencia: 5,
            panera_estado: 2,
            fachada_limpieza: 2,
            letrero_anuncio: 2,
            jardineras_macetas: 2,
            iluminacion: 2,
            puertas_vidrios: 2,
            musica_volumen: 2,
            area_mostrador: 2,
            mesas_sillas_limpieza: 2,
            piso_limpieza: 2,
            banos_estado: 4,
            basura_estado: 2,
            barra_limpieza: 2,
            clima_funcionando: 4,
            mesas_sillas_estado: 2,
            interfon: 4
        },
        'Móvil': {
            bienvenida_contacto_visual: 4,
            bienvenida_agradecimiento: 2,
            conocimiento_productos: 2,
            producto_mes: 3,
            venta_cruzada: 5,
            mencion_promociones: 3,
            app_cabana: 9,
            pin_personalizador: 4,
            atencion_mesa: 2,
            entrega_ticket: 3,
            tiempo_espera_atencion: 3,
            tiempo_fila: 3,
            tiempo_espera_cafe: 4,
            cantidad_colaboradores: 1,
            apariencia_personal: 2,
            tableta: 1,
            presentacion_vaso: 2,
            presentacion_cafe: 3,
            presentacion_alimento: 3,
            existencia: 5,
            panera_estado: 2,
            fachada_limpieza: 2,
            letrero_anuncio: 2,
            jardineras_macetas: 2,
            iluminacion: 2,
            puertas_vidrios: 2,
            musica_volumen: 2,
            area_mostrador: 2,
            mesas_sillas_limpieza: 2,
            piso_limpieza: 2,
            banos_estado: 4,
            basura_estado: 2,
            barra_limpieza: 2,
            clima_funcionando: 4,
            mesas_sillas_estado: 2,
            interfon: 4
        }
    };

    // ===== Ponderancias KPI2 versionadas por vigencia =====
    // '0000-00' es la base compilada en código. Las versiones guardadas en
    // Firestore (configuracion/ponderanciasKPI2) se insertan aquí; cada
    // evaluación se calcula con la versión vigente en SU mes → histórico congelado.
    const versionesPonderancia = [
        { vigenteDesde: '0000-00', nombre: 'Base', pesos: PONDERA_IA_PESOS_POR_MODELO }
    ];

    function obtenerVersionPesos(mes) {
        const m = mes ? String(mes) : '9999-99';
        let vigente = versionesPonderancia[0];
        versionesPonderancia.forEach(v => {
            if (v && v.vigenteDesde && v.vigenteDesde <= m && v.vigenteDesde >= vigente.vigenteDesde) {
                vigente = v;
            }
        });
        return vigente;
    }

    function listarVersionesPonderancia() {
        return versionesPonderancia.map(v => ({
            vigenteDesde: v.vigenteDesde,
            nombre: v.nombre || '',
            pesos: v.pesos
        }));
    }

    function getPesoKPI2(paramId, pesoActual, modelo, mes) {
        const m = normalizarModelo(modelo);
        const tabla = m ? (obtenerVersionPesos(mes).pesos || {})[m] : null;
        const p = tabla ? tabla[paramId] : undefined;
        if (typeof p === 'number') return p;
        return Number(pesoActual) || 0;
    }

    // Aplica configuración remota: versiones de ponderancias + overrides de
    // aplicabilidad por entidad. Devuelve true si aplicó algo.
    function aplicarConfiguracionKPI2(cfg) {
        try {
            if (!cfg || typeof cfg !== 'object') return false;
            if (Array.isArray(cfg.versiones)) {
                cfg.versiones.forEach(v => {
                    if (!v || !v.vigenteDesde || !v.pesos || typeof v.pesos !== 'object') return;
                    if (v.vigenteDesde === '0000-00') return;
                    const i = versionesPonderancia.findIndex(x => x.vigenteDesde === v.vigenteDesde);
                    if (i >= 0) versionesPonderancia[i] = v;
                    else versionesPonderancia.push(v);
                });
                versionesPonderancia.sort((a, b) => String(a.vigenteDesde).localeCompare(String(b.vigenteDesde)));
            }
            if (cfg.aplicabilidad && typeof cfg.aplicabilidad === 'object') {
                window.kpi2ConfigOverrides = window.kpi2ConfigOverrides || {};
                window.kpi2ConfigOverrides.aplicabilidad = cfg.aplicabilidad;
            }
            return true;
        } catch (e) {
            console.warn('No se pudo aplicar configuración KPI2:', e);
            return false;
        }
    }

    // opciones (para simulador): { tablaPesos: {Modelo:{paramId:peso}}, esAplicable: (param,entidadId,tipo)=>bool }
    function calcularDetalleKPI2(entidadId, tipo, evaluacionLocal, opciones) {
        try {
            const opts = opciones || {};
            if (!evaluacionLocal || !evaluacionLocal.parametros || !Array.isArray(window.parametros)) return null;

            const mesEval = evaluacionLocal.mes || window.mesSeleccionado || null;

            const modelo = getModeloEntidad(entidadId, tipo);
            const tablaPesos = (opts.tablaPesos && typeof opts.tablaPesos === 'object') ? opts.tablaPesos : null;

            const parametrosExcluidos = obtenerIdsParametrosExcluidos(entidadId, tipo);
            const conAplicableCustom = typeof opts.esAplicable === 'function';

            let parametrosAplicables = window.parametros.filter(param =>
                conAplicableCustom
                    ? !!opts.esAplicable(param, entidadId, tipo)
                    : !parametrosExcluidos.includes(param.id.toLowerCase().replace(/[-_]/g, ''))
            );

            // Respetar vigencia de parámetros (p.ej. existencia desde 2026-03)
            if (mesEval) {
                parametrosAplicables = parametrosAplicables.filter(p => {
                    if (!p || !p.vigenteDesde) return true;
                    return mesEval >= p.vigenteDesde;
                });
            }

            // Misma regla de aplicabilidad que la Matriz: lo que no está excluido
            // por nombre en parametros_excluidos.js cuenta en el KPI2.
            // (Con esAplicable custom o override Firestore ya viene resuelto.)
            if (!conAplicableCustom && (tipo === 'sucursal' || tipo === 'franquicia')) {
                parametrosAplicables = parametrosAplicables.filter(p => parametroAplicaAEntidad(p, tipo, entidadId));
            }

            let totalMax = 0;
            let totalObt = 0;
            parametrosAplicables.forEach(param => {
                // "No capturado" (undefined) no penaliza ni infla el máximo: se omite del cálculo,
                // igual que en la Matriz, topDrivers y calcularPorcentajeEvaluacion.
                const valorExiste = !!(evaluacionLocal && evaluacionLocal.parametros && evaluacionLocal.parametros[param.id] !== undefined);
                if (!valorExiste) {
                    // Regla de negocio: se asume que "Menciona promociones" cumple por default en sucursales,
                    // excepto Walmart Carrizal (única que falló).
                    if (param?.soloKPI2 && param.id === 'mencion_promociones' && tipo === 'sucursal') {
                        // continuar: se contará abajo como ratio=1 (default) o ratio=0 (Carrizal)
                    } else {
                        return;
                    }
                }

                const peso2 = (tablaPesos && modelo && tablaPesos[modelo] && typeof tablaPesos[modelo][param.id] === 'number')
                    ? tablaPesos[modelo][param.id]
                    : getPesoKPI2(param.id, param.peso, modelo, mesEval);
                if (peso2 <= 0) return;
                totalMax += peso2;

                const pesoOriginal = Number(param.peso) || 0;
                const valor = (!valorExiste && param.id === 'mencion_promociones' && tipo === 'sucursal')
                    ? (entidadId !== 'walmart-carrizal' ? pesoOriginal : 0)
                    : (Number(evaluacionLocal.parametros[param.id] ?? 0) || 0);
                if (pesoOriginal <= 0) return;

                const ratio = (param && param.tipo === 'booleano')
                    ? (valor > 0 ? 1 : 0)
                    : Math.max(0, Math.min(1, valor / pesoOriginal));
                totalObt += (peso2 * ratio);
            });

            // Bono "Actitud de servicio": puntos extra otorgados por Dirección de
            // Operaciones. Suman al obtenido SIN aumentar el máximo (el KPI puede
            // pasar de 100%). Respeta vigenteDesde del parámetro.
            let bono = 0;
            if (evaluacionLocal.bonoActitud && evaluacionLocal.bonoActitud.otorgado) {
                const pb = window.parametros.find(x => x && x.id === 'actitud_servicio');
                const vigente = !pb || !pb.vigenteDesde || !mesEval || mesEval >= pb.vigenteDesde;
                if (vigente) {
                    bono = (tablaPesos && modelo && typeof tablaPesos[modelo]?.actitud_servicio === 'number')
                        ? tablaPesos[modelo].actitud_servicio
                        : getPesoKPI2('actitud_servicio', pb ? pb.peso : 0, modelo, mesEval);
                    totalObt += bono;
                }
            }

            if (totalMax <= 0) return null;
            return { totalObt, totalMax, kpi: totalObt / totalMax, bono };
        } catch (e) {
            console.warn('No se pudo calcular KPI2', e);
            return null;
        }
}

    function calcularKPI2(entidadId, tipo, evaluacionLocal, opciones) {
        const detalle = calcularDetalleKPI2(entidadId, tipo, evaluacionLocal, opciones);
        return detalle ? detalle.kpi : null;
    }

return {
    MES_KPI2_DESDE,
    MODO_DUAL_SIEMPRE,
    debeMostrarKPI2,
    getModeloEntidad,
    normalizarModelo,
    getPesoKPI2,
    obtenerVersionPesos,
    listarVersionesPonderancia,
    aplicarConfiguracionKPI2,
    PONDERA_IA_PESOS_POR_MODELO,
    MODELOS: ['Cafetería', 'Express', 'Móvil'],
    calcularKPI2,
    calcularDetalleKPI2
};
})();