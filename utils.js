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
    
    // Calcular puntaje máximo posible
    const puntajeMaximo = parametrosAplicables.reduce((total, param) => total + (param.peso || 1), 0);
    
    if (puntajeMaximo === 0) return 0;
    
    // Calcular puntaje obtenido
    let puntajeObtenido = 0;
    parametrosAplicables.forEach(param => {
        if (evaluacion.parametros && evaluacion.parametros[param.id] !== undefined) {
            puntajeObtenido += parseInt(evaluacion.parametros[param.id]) || 0;
        }
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

    function debeMostrarKPI2(mes) {
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
            bienvenida_contacto_visual: 9,
            bienvenida_agradecimiento: 5,
            conocimiento_productos: 5,
            producto_mes: 4,
            venta_cruzada: 9,
            app_cabana: 6,
            pin_personalizador: 3,
            atencion_mesa: 6,
            entrega_ticket: 3,
            tiempo_espera_atencion: 4,
            tiempo_fila: 3,
            tiempo_espera_cafe: 4,
            cantidad_colaboradores: 1,
            apariencia_personal: 2,
            tableta: 1,
            presentacion_vaso: 2,
            presentacion_cafe: 4,
            presentacion_alimento: 4,
            existencia: 5,
            panera_estado: 1,
            fachada_limpieza: 1,
            letrero_anuncio: 1,
            jardineras_macetas: 0,
            iluminacion: 1,
            puertas_vidrios: 1,
            musica_volumen: 0,
            area_mostrador: 1,
            mesas_sillas_limpieza: 1,
            piso_limpieza: 1,
            banos_estado: 2,
            basura_estado: 1,
            barra_limpieza: 1,
            clima_funcionando: 2,
            mesas_sillas_estado: 1
        },
        'Express': {
            bienvenida_contacto_visual: 8,
            bienvenida_agradecimiento: 4,
            conocimiento_productos: 6,
            producto_mes: 5,
            venta_cruzada: 12,
            app_cabana: 7,
            pin_personalizador: 4,
            atencion_mesa: 4,
            entrega_ticket: 4,
            tiempo_espera_atencion: 4,
            tiempo_fila: 3,
            tiempo_espera_cafe: 4,
            cantidad_colaboradores: 1,
            apariencia_personal: 2,
            tableta: 1,
            presentacion_vaso: 2,
            presentacion_cafe: 3,
            presentacion_alimento: 3,
            existencia: 5,
            panera_estado: 1,
            fachada_limpieza: 1,
            letrero_anuncio: 1,
            jardineras_macetas: 0,
            iluminacion: 1,
            puertas_vidrios: 1,
            musica_volumen: 0,
            area_mostrador: 1,
            mesas_sillas_limpieza: 1,
            piso_limpieza: 1,
            banos_estado: 2,
            basura_estado: 1,
            barra_limpieza: 1,
            clima_funcionando: 1,
            mesas_sillas_estado: 1
        },
        'Móvil': {
            bienvenida_contacto_visual: 8,
            bienvenida_agradecimiento: 4,
            conocimiento_productos: 5,
            producto_mes: 4,
            venta_cruzada: 9,
            app_cabana: 7,
            pin_personalizador: 4,
            atencion_mesa: 4,
            entrega_ticket: 4,
            tiempo_espera_atencion: 4,
            tiempo_fila: 3,
            tiempo_espera_cafe: 4,
            cantidad_colaboradores: 1,
            apariencia_personal: 2,
            tableta: 1,
            presentacion_vaso: 2,
            presentacion_cafe: 3,
            presentacion_alimento: 3,
            existencia: 5,
            panera_estado: 1,
            fachada_limpieza: 1,
            letrero_anuncio: 1,
            jardineras_macetas: 0,
            iluminacion: 1,
            puertas_vidrios: 1,
            musica_volumen: 0,
            area_mostrador: 1,
            mesas_sillas_limpieza: 1,
            piso_limpieza: 1,
            banos_estado: 2,
            basura_estado: 1,
            barra_limpieza: 1,
            clima_funcionando: 1,
            mesas_sillas_estado: 1
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
                const peso2 = getPesoKPI2(param.id, param.peso, modelo);
                if (peso2 <= 0) return;
                totalMax += peso2;

                const valor = Number(evaluacionLocal.parametros[param.id] ?? 0) || 0;
                const cumplio = valor > 0;
                if (cumplio) totalObt += peso2;
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
        debeMostrarKPI2,
        getModeloEntidad,
        getPesoKPI2,
        PONDERA_IA_PESOS_POR_MODELO,
        calcularKPI2
    };
})();