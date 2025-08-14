// ===== MÓDULO DE COMPETENCIA =====
// Sistema de evaluación para competidores del mercado

// Datos de competencia
window.competencia = [
    {
        id: 'cacep',
        nombre: 'CACEP',
        direccion: 'Ubicación por definir',
        activa: true,
        fechaCreacion: new Date().toISOString()
    },
    {
        id: 'starbucks',
        nombre: 'Starbucks',
        direccion: 'Ubicación por definir',
        activa: true,
        fechaCreacion: new Date().toISOString()
    },
    {
        id: 'gloria-jeans',
        nombre: 'Gloria Jeans',
        direccion: 'Ubicación por definir',
        activa: true,
        fechaCreacion: new Date().toISOString()
    },
    {
        id: 'cafeloco',
        nombre: 'Cafeloco',
        direccion: 'Ubicación por definir',
        activa: true,
        fechaCreacion: new Date().toISOString()
    },
    {
        id: 'cafeteria',
        nombre: 'Cafetería',
        direccion: 'Ubicación por definir',
        activa: true,
        fechaCreacion: new Date().toISOString()
    }
];

// Parámetros excluidos por competidor (similar a sucursales)
window.parametrosExcluidosPorCompetencia = {
    // Ejemplo: 'starbucks': ['parametro1', 'parametro2']
    // Se puede configurar según necesidades específicas
};

// ===== FUNCIONES DE GESTIÓN DE COMPETIDORES =====

// Función para renderizar la vista de competencia
function renderCompetencia() {
    console.log('Renderizando competencia para mes:', window.mesSeleccionado);
    
    const container = document.getElementById('competencia');
    if (!container) return;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0077cc; margin-bottom: 10px; text-align: center;">
                Competencia - ${formatearMesLegible(window.mesSeleccionado)}
            </h2>
            <p style="text-align: center; color: #666; margin-bottom: 20px;">
                Evaluación de competidores del mercado
            </p>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0;">Lista de Competidores</h3>
            ${tienePermiso('crear') ? `
                <div>
                    <button onclick="abrirModalNuevoCompetidor()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Nuevo Competidor
                    </button>
                    <button onclick="abrirModalEvaluacionCompetencia()" class="btn btn-success" style="margin-left: 10px;">
                        <i class="fas fa-chart-line"></i> Nueva Evaluación
                    </button>
                </div>
            ` : ''}
        </div>
        
        <div class="competidores-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
    `;
    
    // Obtener evaluaciones de competencia para el mes actual
    const evaluacionesCompetencia = obtenerEvaluacionesCompetencia(window.mesSeleccionado);
    
    window.competencia.filter(comp => comp.activa).forEach(competidor => {
        const evaluacion = evaluacionesCompetencia.find(eval => eval.entidadId === competidor.id);
        const kpi = evaluacion ? Math.round(evaluacion.kpi * 100) : 0;
        const estado = evaluacion ? evaluacion.estado : 'Sin evaluar';
        const estadoColor = kpi >= 95 ? '#28a745' : kpi >= 90 ? '#ffc107' : '#dc3545';
        
        html += `
            <div class="competidor-card" style="
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                padding: 20px;
                border-left: 4px solid ${estadoColor};
            ">
                <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${competidor.nombre}</h4>
                        <p style="margin: 0; color: #666; font-size: 14px;">${competidor.direccion}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: bold; color: ${estadoColor};">
                            ${kpi}%
                        </div>
                        <div style="font-size: 12px; color: ${estadoColor};">
                            ${estado}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    ${evaluacion ? `
                        <button onclick="verEvaluacionCompetencia('${competidor.id}')" 
                                class="btn btn-info btn-sm">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    ` : ''}
                    
                    ${tienePermiso('editar') ? `
                        <button onclick="editarCompetidor('${competidor.id}')" 
                                class="btn btn-warning btn-sm">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ${evaluacion ? `
                            <button onclick="editarEvaluacionCompetencia('${competidor.id}')" 
                                    class="btn btn-primary btn-sm">
                                <i class="fas fa-chart-line"></i> Evaluar
                            </button>
                        ` : `
                            <button onclick="crearEvaluacionCompetencia('${competidor.id}')" 
                                    class="btn btn-success btn-sm">
                                <i class="fas fa-plus"></i> Evaluar
                            </button>
                        `}
                    ` : ''}
                    
                    ${tienePermiso('eliminar') && evaluacion ? `
                        <button onclick="eliminarEvaluacionCompetencia('${competidor.id}')" 
                                class="btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        
        <!-- Estadísticas de competencia -->
        <div style="margin-top: 30px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="text-align: center; margin-bottom: 20px;">Estadísticas de Competencia</h3>
            <div id="estadisticas-competencia"></div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Generar estadísticas
    generarEstadisticasCompetencia();
}

// Función para obtener evaluaciones de competencia de un mes
function obtenerEvaluacionesCompetencia(mes) {
    const evaluacionesDelMes = [];
    
    if (!mes || !window.evaluaciones.competencia) {
        return evaluacionesDelMes;
    }
    
    Object.keys(window.evaluaciones.competencia).forEach(competidorId => {
        const evaluacion = window.evaluaciones.competencia[competidorId][mes];
        if (evaluacion) {
            const competidor = window.competencia.find(c => c.id === competidorId);
            if (competidor) {
                const kpiPorcentaje = evaluacion.totalMaximo > 0 ? 
                    Math.round((evaluacion.totalObtenido / evaluacion.totalMaximo) * 100) : 0;
                
                evaluacionesDelMes.push({
                    tipo: 'competencia',
                    entidad: competidor.nombre,
                    entidadId: competidorId,
                    kpi: kpiPorcentaje / 100,
                    estado: kpiPorcentaje >= 95 ? 'Excelente' : kpiPorcentaje >= 90 ? 'Bueno' : 'Necesita Mejora',
                    fecha: evaluacion.fechaCreacion || evaluacion.created_at || new Date().toLocaleDateString('es-ES'),
                    evaluacion: evaluacion
                });
            }
        }
    });
    
    return evaluacionesDelMes.sort((a, b) => b.kpi - a.kpi);
}

// Función para generar estadísticas de competencia
function generarEstadisticasCompetencia() {
    const container = document.getElementById('estadisticas-competencia');
    if (!container) return;
    
    const evaluaciones = obtenerEvaluacionesCompetencia(window.mesSeleccionado);
    const total = evaluaciones.length;
    const evaluados = evaluaciones.filter(e => e.kpi > 0).length;
    const promedioKPI = total > 0 ? Math.round(evaluaciones.reduce((sum, e) => sum + (e.kpi * 100), 0) / total) : 0;
    
    const alto = evaluaciones.filter(e => e.kpi >= 0.95).length;
    const medio = evaluaciones.filter(e => e.kpi >= 0.90 && e.kpi < 0.95).length;
    const bajo = evaluaciones.filter(e => e.kpi < 0.90).length;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                <h4 style="margin: 0; color: #1976d2;">Total Competidores</h4>
                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${window.competencia.filter(c => c.activa).length}</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3e5f5; border-radius: 8px;">
                <h4 style="margin: 0; color: #7b1fa2;">Evaluados</h4>
                <div style="font-size: 24px; font-weight: bold; color: #7b1fa2;">${evaluados}</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                <h4 style="margin: 0; color: #388e3c;">KPI Promedio</h4>
                <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${promedioKPI}%</div>
            </div>
        </div>
        
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 8px;">
                <strong style="color: #155724;">Alto Rendimiento</strong><br>
                <span style="font-size: 18px;">${alto} competidores (≥95%)</span>
            </div>
            <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 8px;">
                <strong style="color: #856404;">Rendimiento Medio</strong><br>
                <span style="font-size: 18px;">${medio} competidores (90-94%)</span>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 8px;">
                <strong style="color: #721c24;">Bajo Rendimiento</strong><br>
                <span style="font-size: 18px;">${bajo} competidores (<90%)</span>
            </div>
        </div>
    `;
}

// ===== FUNCIONES PARA GESTIÓN DE COMPETIDORES =====

// Función para abrir modal de nuevo competidor
function abrirModalNuevoCompetidor() {
    const modalHtml = `
        <div class="modal" id="modalNuevoCompetidor" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Nuevo Competidor</h2>
                    <span class="close" onclick="cerrarModalNuevoCompetidor()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="nombreCompetidor">Nombre del Competidor:</label>
                        <input type="text" id="nombreCompetidor" class="form-control" placeholder="Ej: McDonald's">
                    </div>
                    <div class="form-group">
                        <label for="direccionCompetidor">Dirección/Ubicación:</label>
                        <input type="text" id="direccionCompetidor" class="form-control" placeholder="Ej: Plaza Central">
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="guardarNuevoCompetidor()" class="btn btn-primary">Guardar</button>
                    <button onclick="cerrarModalNuevoCompetidor()" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Función para cerrar modal de nuevo competidor
function cerrarModalNuevoCompetidor() {
    const modal = document.getElementById('modalNuevoCompetidor');
    if (modal) {
        modal.remove();
    }
}

// Función para guardar nuevo competidor
function guardarNuevoCompetidor() {
    const nombre = document.getElementById('nombreCompetidor').value.trim();
    const direccion = document.getElementById('direccionCompetidor').value.trim();
    
    if (!nombre) {
        alert('Por favor, ingrese el nombre del competidor');
        return;
    }
    
    // Generar ID único
    const id = nombre.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
    
    // Verificar que no exista
    if (window.competencia.find(c => c.id === id)) {
        alert('Ya existe un competidor con ese nombre');
        return;
    }
    
    // Agregar nuevo competidor
    const nuevoCompetidor = {
        id: id,
        nombre: nombre,
        direccion: direccion || 'Ubicación por definir',
        activa: true,
        fechaCreacion: new Date().toISOString()
    };
    
    window.competencia.push(nuevoCompetidor);
    
    // Inicializar estructura de evaluaciones
    if (!window.evaluaciones.competencia[id]) {
        window.evaluaciones.competencia[id] = {};
    }
    
    // Guardar en Firebase si está disponible
    if (window.firebaseDB) {
        // Aquí se podría agregar lógica para guardar competidores en Firebase
        console.log('Guardando competidor en Firebase:', nuevoCompetidor);
    }
    
    alert(`Competidor "${nombre}" agregado exitosamente`);
    cerrarModalNuevoCompetidor();
    renderCompetencia();
}

// ===== FUNCIONES PARA EVALUACIONES DE COMPETENCIA =====

// Función para crear evaluación de competencia
function crearEvaluacionCompetencia(competidorId) {
    // Reutilizar la lógica del modal de evaluación existente
    // pero adaptada para competencia
    abrirModalEvaluacionCompetencia(competidorId);
}

// Función para abrir modal de evaluación de competencia
function abrirModalEvaluacionCompetencia(competidorId = null) {
    // Esta función se implementará usando la misma lógica que las evaluaciones
    // de sucursales/franquicias pero adaptada para competencia
    console.log('Abriendo modal de evaluación para competencia:', competidorId);
    alert('Funcionalidad de evaluación en desarrollo - se integrará con el sistema existente');
}

// Función para ver evaluación de competencia
function verEvaluacionCompetencia(competidorId) {
    console.log('Ver evaluación de competencia:', competidorId);
    alert('Funcionalidad de visualización en desarrollo');
}

// Función para editar competidor
function editarCompetidor(competidorId) {
    console.log('Editar competidor:', competidorId);
    alert('Funcionalidad de edición en desarrollo');
}

// Función para eliminar evaluación de competencia
function eliminarEvaluacionCompetencia(competidorId) {
    console.log('Eliminar evaluación de competencia:', competidorId);
    alert('Funcionalidad de eliminación en desarrollo');
}

// ===== INTEGRACIÓN CON SISTEMA PRINCIPAL =====

// Función para integrar competencia en el dashboard principal (opcional)
function integrarCompetenciaEnDashboard() {
    // Esta función se puede usar para mostrar estadísticas de competencia
    // en el dashboard principal si se desea
    const evaluaciones = obtenerEvaluacionesCompetencia(window.mesSeleccionado);
    return {
        total: evaluaciones.length,
        promedio: evaluaciones.length > 0 ? 
            Math.round(evaluaciones.reduce((sum, e) => sum + (e.kpi * 100), 0) / evaluaciones.length) : 0,
        evaluaciones: evaluaciones
    };
}

console.log('Módulo de Competencia cargado exitosamente');
