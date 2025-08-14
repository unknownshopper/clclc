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
    console.log('Abriendo modal de evaluación para competencia:', competidorId);
    
    if (!competidorId) {
        alert('Error: ID de competidor no especificado');
        return;
    }
    
    // Buscar el competidor
    const competidor = window.competencia.find(c => c.id === competidorId);
    if (!competidor) {
        alert('Error: Competidor no encontrado');
        return;
    }
    
    // Usar el modal existente del sistema
    const modal = document.getElementById('modal-nueva-evaluacion');
    const selectEntidad = document.getElementById('select-entidad-evaluacion');
    const parametrosContainer = document.getElementById('parametros-evaluacion-container');
    const totalPuntosDiv = document.getElementById('total-puntos-evaluacion');
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    
    if (!modal || !selectEntidad) {
        alert('Error: Modal de evaluación no encontrado');
        return;
    }
    
    // Limpiar contenido previo
    parametrosContainer.innerHTML = '';
    totalPuntosDiv.textContent = 'Total de puntos: 0';
    btnGuardar.style.display = 'none';
    
    // Ocultar el selector de entidad ya que ya sabemos cuál es
    const labelEntidad = document.querySelector('label[for="select-entidad-evaluacion"]');
    if (labelEntidad) {
        labelEntidad.style.display = 'none';
    }
    selectEntidad.style.display = 'none';
    
    // Cambiar el título del modal
    const modalTitle = document.querySelector('#modal-nueva-evaluacion h2');
    if (modalTitle) {
        modalTitle.textContent = `Evaluar Competencia - ${competidor.nombre}`;
    }
    
    // Cargar parámetros usando el formato de cafeterías
    cargarParametrosParaCompetencia(competidorId);
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// Función para cargar parámetros usando el formato de cafeterías
function cargarParametrosParaCompetencia(competidorId) {
    const parametrosContainer = document.getElementById('parametros-evaluacion-container');
    const totalPuntosDiv = document.getElementById('total-puntos-evaluacion');
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    
    if (!parametrosContainer || !totalPuntosDiv || !btnGuardar) {
        console.error('Elementos del modal no encontrados');
        return;
    }
    
    console.log(`Cargando parámetros para competencia: ${competidorId}`);
    
    // Obtener parámetros aplicables (usar todos los parámetros para competencia)
    let parametrosAplicables = window.parametros ? window.parametros.slice() : [];
    
    // Aplicar exclusiones específicas para competencia si existen
    if (window.parametrosExcluidosPorCompetencia && window.parametrosExcluidosPorCompetencia[competidorId]) {
        const excluidos = window.parametrosExcluidosPorCompetencia[competidorId];
        console.log(`Aplicando exclusiones para competencia ${competidorId}:`, excluidos);
        parametrosAplicables = parametrosAplicables.filter(p => !excluidos.includes(p.nombre));
    }
    
    console.log(`Parámetros aplicables para competencia: ${parametrosAplicables.length}`);
    
    // Usar exactamente el mismo formato que el sistema de cafeterías
    let html = '<div style="max-height: 400px; overflow-y: auto; margin: 10px 0;">';
    
    // Agregar botón "Seleccionar Todo" igual que en cafeterías
    html += `
        <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border: 1px solid #0077cc; border-radius: 5px; text-align: center; position: relative; cursor: help;" 
               title="Marcar/desmarcar todos los parámetros">
            <button id="btn-seleccionar-todo" onclick="toggleSeleccionarTodo()" 
                    style="background: #0077cc; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                ✓ Seleccionar Todo
            </button>
            <span style="margin-left: 10px; font-size: 12px; color: #666;">
                Marca/desmarca todos los parámetros
            </span>
        </div>
    `;
    
    // Agrupar por categoría igual que en cafeterías
    const categorias = {};
    parametrosAplicables.forEach(param => {
        if (!categorias[param.categoriaId]) {
            categorias[param.categoriaId] = [];
        }
        categorias[param.categoriaId].push(param);
    });
    
    let numeroParametro = 1;
    
    Object.keys(categorias).forEach(categoriaId => {
        const categoria = categorias[categoriaId];
        const nombreCategoria = getCategoriaName ? getCategoriaName(categoriaId) : categoriaId;
        
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
                               onchange="actualizarTotalPuntos()">
                        <span style="font-size: 14px; color: #0077cc; font-weight: bold;">${param.peso} pts</span>
                    </div>
                </div>
            `;
            numeroParametro++;
        });
        
        html += '</div>';
    });
    
    html += '</div>';
    
    parametrosContainer.innerHTML = html;
    
    // Calcular total inicial usando la función del sistema
    if (typeof actualizarTotalPuntos === 'function') {
        actualizarTotalPuntos();
    }
    
    // Mostrar botón guardar y configurar para competencia
    btnGuardar.style.display = 'block';
    btnGuardar.textContent = 'Guardar Evaluación de Competencia';
    btnGuardar.onclick = () => guardarEvaluacionCompetencia(competidorId);
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

// Función para guardar evaluación de competencia
async function guardarEvaluacionCompetencia(competidorId) {
    console.log('Guardando evaluación de competencia para:', competidorId);
    
    const checkboxes = document.querySelectorAll('#parametros-evaluacion-container input[type="checkbox"]');
    
    const evaluacion = {};
    let totalObtenido = 0;
    let totalMaximo = 0;
    
    checkboxes.forEach(checkbox => {
        const paramId = checkbox.id.replace('param-', '');
        const peso = parseInt(checkbox.getAttribute('data-peso'));
        evaluacion[paramId] = checkbox.checked ? peso : 0;
        
        if (checkbox.checked) {
            totalObtenido += peso;
        }
        totalMaximo += peso;
    });
    
    // Calcular KPI
    const kpi = totalMaximo > 0 ? Math.round((totalObtenido / totalMaximo) * 100) : 0;
    
    // Obtener información del competidor
    const competidor = window.competencia.find(c => c.id === competidorId);
    
    // Estructura de datos para Firebase y almacenamiento local
    const evaluacionData = {
        tipo: 'competencia',
        entidadId: competidorId,
        entidadNombre: competidor?.nombre || 'Desconocido',
        mes: window.mesSeleccionado,
        parametros: evaluacion,
        totalObtenido: totalObtenido,
        totalMaximo: totalMaximo,
        kpi: kpi,
        estado: kpi >= 95 ? 'Excelente' : kpi >= 90 ? 'Bueno' : 'Necesita mejora',
        fechaCreacion: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    try {
        // Guardar en Firebase si está disponible
        if (window.firebaseDB && typeof window.firebaseDB.guardarEvaluacion === 'function') {
            const firebaseId = await window.firebaseDB.guardarEvaluacion(evaluacionData);
            evaluacionData.firebaseId = firebaseId;
            console.log('Evaluación de competencia guardada en Firebase exitosamente');
        }
        
        // Guardar en almacenamiento local
        if (!window.evaluaciones.competencia[competidorId]) {
            window.evaluaciones.competencia[competidorId] = {};
        }
        
        window.evaluaciones.competencia[competidorId][window.mesSeleccionado] = {
            parametros: evaluacion,
            totalObtenido: totalObtenido,
            totalMaximo: totalMaximo,
            kpi: kpi / 100, // Guardar como decimal para consistencia
            estado: evaluacionData.estado,
            fechaCreacion: evaluacionData.fechaCreacion,
            timestamp: evaluacionData.timestamp
        };
        
        // Cerrar modal
        cerrarModalEvaluacionCompetencia();
        
        // Actualizar vista de competencia
        renderCompetencia();
        
        // También actualizar otras vistas si están activas
        if (window.vistaActual === 'dashboard') {
            renderDashboard();
        } else if (window.vistaActual === 'evaluaciones') {
            renderEvaluaciones();
        }
        
        // Mostrar mensaje de éxito
        alert(`Evaluación guardada exitosamente para ${competidor?.nombre} - ${formatearMesLegible(window.mesSeleccionado)}\nKPI: ${kpi}% (${evaluacionData.estado})`);
        
    } catch (error) {
        console.error('Error guardando evaluación de competencia:', error);
        alert('Error al guardar la evaluación. Por favor, inténtalo de nuevo.');
    }
}

// Función para cerrar modal de evaluación de competencia
function cerrarModalEvaluacionCompetencia() {
    const modal = document.getElementById('modal-nueva-evaluacion');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Restaurar elementos del modal para futuras evaluaciones
    const labelEntidad = document.querySelector('label[for="select-entidad-evaluacion"]');
    const selectEntidad = document.getElementById('select-entidad-evaluacion');
    
    if (labelEntidad) {
        labelEntidad.style.display = 'block';
    }
    if (selectEntidad) {
        selectEntidad.style.display = 'block';
        selectEntidad.value = ''; // Limpiar selección
    }
    
    // Restaurar título del modal
    const modalTitle = document.querySelector('#modal-nueva-evaluacion h2');
    if (modalTitle) {
        modalTitle.textContent = 'Nueva evaluación';
    }
    
    // Restaurar botón
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    if (btnGuardar) {
        btnGuardar.textContent = 'Guardar evaluación';
        btnGuardar.onclick = null; // Limpiar evento
    }
    
    // Limpiar contenedor de parámetros
    const container = document.getElementById('parametros-evaluacion-container');
    if (container) {
        container.innerHTML = '';
    }
    
    // Limpiar total de puntos
    const totalPuntosDiv = document.getElementById('total-puntos-evaluacion');
    if (totalPuntosDiv) {
        totalPuntosDiv.textContent = 'Total de puntos: 0';
    }
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
