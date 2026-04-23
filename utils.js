// ===== FUNCIONES UTILITARIAS =====

// Variables globales
window.mesSeleccionado = '';
window.vistaActual = 'dashboard';
window.evaluaciones = {
    sucursales: {},
    franquicias: {},
    competencia: {}
};

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

// Función para calcular porcentaje de evaluación
function calcularPorcentajeEvaluacion(entidadId, tipo, evaluacion) {
    if (!evaluacion || !window.parametros) return 0;
    
    let parametrosAplicables = window.parametros;
    
    // Obtener parámetros excluidos usando la misma lógica que en matriz.js
    let parametrosExcluidos = [];
    if (tipo === 'sucursal' && window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId]) {
        parametrosExcluidos = window.parametrosExcluidosPorSucursal[entidadId]
            .map(nombre => {
                const param = window.parametros.find(p => 
                    p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
                );
                return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
            })
            .filter(id => id !== null);
    } else if (tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[entidadId]) {
        parametrosExcluidos = window.parametrosExcluidosPorFranquicia[entidadId]
            .map(nombre => {
                const param = window.parametros.find(p => 
                    p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
                );
                return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
            })
            .filter(id => id !== null);
    }
    
    // Filtrar parámetros excluidos
    parametrosAplicables = parametrosAplicables.filter(param => 
        !parametrosExcluidos.includes(param.id.toLowerCase().replace(/[-_]/g, ''))
    );
    
    // Filtrar parámetros que aplican a la entidad
    if (tipo === 'sucursal') {
        parametrosAplicables = parametrosAplicables.filter(p => p.aplicaATodas || (p.aplicaASucursales && p.aplicaASucursales.includes(entidadId)));
    } else if (tipo === 'franquicia') {
        parametrosAplicables = parametrosAplicables.filter(p => p.aplicaATodas || (p.aplicaAFranquicias && p.aplicaAFranquicias.includes(entidadId)));
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
        // Los parámetros se capturan como checkbox (cumple/no cumple).
        // Si el valor histórico es >0, se considera cumplido y debe contar con el peso ACTUAL,
        // para no “bajar” KPI cuando cambian ponderancias en el tiempo.
        puntajeObtenido += v > 0 ? (Number(param.peso) || 0) : 0;
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
            mesas_sillas_estado: 2
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
            mesas_sillas_estado: 2
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
            mesas_sillas_estado: 2
        }
    };

    function getPesoKPI2(paramId, pesoActual, modelo) {
        const m = normalizarModelo(modelo);
        const tabla = m ? PONDERA_IA_PESOS_POR_MODELO[m] : null;
        const p = tabla ? tabla[paramId] : undefined;
        if (typeof p === 'number') return p;
        return Number(pesoActual) || 0;
    }

    function calcularKPI2(entidadId, tipo, evaluacionLocal) {
        try {
            if (!evaluacionLocal || !evaluacionLocal.parametros || !Array.isArray(window.parametros)) return null;

            const mesEval = evaluacionLocal.mes || window.mesSeleccionado || null;

            const modelo = getModeloEntidad(entidadId, tipo);

            let parametrosExcluidos = [];
            if (tipo === 'sucursal' && window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId]) {
                parametrosExcluidos = window.parametrosExcluidosPorSucursal[entidadId]
                    .map(nombre => {
                        const param = window.parametros.find(p =>
                            p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
                        );
                        return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
                    })
                    .filter(id => id !== null);
            } else if (tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[entidadId]) {
                parametrosExcluidos = window.parametrosExcluidosPorFranquicia[entidadId]
                    .map(nombre => {
                        const param = window.parametros.find(p =>
                            p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
                        );
                        return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
                    })
                    .filter(id => id !== null);
            }

            let parametrosAplicables = window.parametros.filter(param =>
                !parametrosExcluidos.includes(param.id.toLowerCase().replace(/[-_]/g, ''))
            );

            // Respetar vigencia de parámetros (p.ej. existencia desde 2026-03)
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

            let totalMax = 0;
            let totalObt = 0;
            parametrosAplicables.forEach(param => {
                // Si es un parámetro soloKPI2 (p.ej. existencia) pero aún no existe en la evaluación,
                // no debe penalizar: se omite del cálculo.
                const valorExiste = !!(evaluacionLocal && evaluacionLocal.parametros && evaluacionLocal.parametros[param.id] !== undefined);
                if (param?.soloKPI2 && !valorExiste) {
                    // Regla de negocio: se asume que "Menciona promociones" cumple por default en sucursales,
                    // excepto Walmart Carrizal (única que falló).
                    if (param.id === 'mencion_promociones' && tipo === 'sucursal') {
                        // continuar: se contará abajo como ratio=1 (default) o ratio=0 (Carrizal)
                    } else {
                        return;
                    }
                }

                const peso2 = getPesoKPI2(param.id, param.peso, modelo);
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

            if (totalMax <= 0) return null;
            return totalObt / totalMax;
        } catch (e) {
            console.warn('No se pudo calcular KPI2', e);
            return null;
        }
}

return {
    MES_KPI2_DESDE,
    MODO_DUAL_SIEMPRE,
    debeMostrarKPI2,
    getModeloEntidad,
    getPesoKPI2,
    PONDERA_IA_PESOS_POR_MODELO,
    calcularKPI2
};
})();