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