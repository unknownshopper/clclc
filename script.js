// Función para cambiar vista
function cambiarVista(vista) {
    // Actualizar botones de navegación
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`[data-section="${vista}"]`)?.classList.add('active');
    
    // Ocultar todas las secciones
    document.querySelectorAll('.tab-section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    
    // Mostrar sección seleccionada
    const seccionActiva = document.getElementById(vista);
    if (seccionActiva) {
        seccionActiva.style.display = 'block';
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
        case 'matriz':
            renderMatriz();
            break;
        case 'graficas':
            renderGraficas();
            break;
        case 'historico':
            if (typeof renderHistorico === 'function') {
                renderHistorico();
            } else {
                console.warn('renderHistorico no está disponible. Asegúrate de incluir data/historico.js.');
            }
            break;
        case 'competencia':
            renderCompetencia();
            break;
    }
}

// Función para renderizar evaluaciones
async function renderEvaluaciones() {
    const container = document.getElementById('evaluaciones');
    if (!container) return;
    
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
    const evaluacionesFiltradas = filtrarDatosPorRol(todasLasEvaluaciones);
    
    console.log(`Evaluaciones - Total: ${todasLasEvaluaciones.length}, Filtradas: ${evaluacionesFiltradas.length}`);
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0077cc; margin-bottom: 10px; text-align: center;">
                Evaluaciones - ${formatearMesLegible(window.mesSeleccionado)}
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
        html += `
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <table class="evaluaciones-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #0077cc; color: white;">
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Tipo</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Entidad</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">KPI</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Estado</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Publicación</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Fecha</th>
                            ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') || tienePermiso('publicar') ? '<th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Acciones</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        evaluacionesFiltradas.forEach((evaluacion, index) => {
            const kpiPorcentaje = ((evaluacion.kpi || 0) * 100).toFixed(1);
            const estadoColor = evaluacion.estado === 'Excelente' ? '#28a745' : evaluacion.estado === 'Bueno' ? '#ffc107' : '#dc3545';
            const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            
            // Formatear tipo para mostrar
            let tipoMostrar = 'Sucursal';
            if (evaluacion.tipo === 'franquicia') tipoMostrar = 'Franquicia';
            else if (evaluacion.tipo === 'competencia') tipoMostrar = 'Competencia';
            // Estado de publicación
            const estadoPublicacion = evaluacion.estadoPublicacion || 'borrador';
            const esBorrador = estadoPublicacion === 'borrador';
            
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
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: ${estadoColor}; font-size: 16px;">
                        ${kpiPorcentaje}%
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        <span style="color: ${estadoColor}; font-weight: bold;">
                            ${evaluacion.estado}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        <span class="estado-publicacion ${esBorrador ? 'estado-borrador' : 'estado-publicado'}">
                            ${esBorrador ? 'Borrador' : 'Publicado'}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; color: #666;">
                        ${evaluacion.fecha}
                    </td>
                    ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') || tienePermiso('publicar') ? `
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        <div class="action-buttons" style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="verEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" 
                                    class="btn-action btn-view" 
                                    title="Ver evaluación">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${tienePermiso('editar') ? `
                            <button onclick="editarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" 
                                    class="btn-action btn-edit" 
                                    title="Editar evaluación">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${tienePermiso('eliminar') ? `
                            <button onclick="eliminarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" 
                                    class="btn-action btn-delete" 
                                    title="Eliminar evaluación">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                            ${tienePermiso('publicar') && esBorrador && existeEnFirebase(evaluacion.entidadId, evaluacion.tipo) ? `                            <button onclick="publicarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" 
                                    class="btn-action btn-publish" 
                                    title="Publicar evaluación">
                                <i class="fas fa-share"></i>
                            </button>
                            ` : ''}
                            <button onclick="verVideo('${evaluacion.entidadId}', '${evaluacion.tipo}')"
                                    class="btn-action btn-video" 
                                    title="Ver video de evaluación">
                                <i class="fas fa-video"></i>
                            </button>
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

// Función para abrir modal de nueva evaluación
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
    
    // Generar formulario de parámetros
    let html = '<div style="max-height: 400px; overflow-y: auto; margin: 10px 0;">';
    
    // Agregar botón "Seleccionar Todo" al inicio
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
    
    // Agrupar por categoría
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
        const nombreCategoria = getCategoriaName(categoriaId);
        
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
    
    // Calcular total inicial
    actualizarTotalPuntos();
    
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
        if (checkbox.checked) {
            const peso = parseInt(checkbox.getAttribute('data-peso'));
            totalObtenido += peso;
        }
        totalMaximo += parseInt(checkbox.getAttribute('data-peso'));
    });
    
    const porcentaje = totalMaximo > 0 ? Math.round((totalObtenido / totalMaximo) * 100) : 0;
    
    totalPuntosDiv.innerHTML = `
        <strong>Total de puntos: ${totalObtenido}/${totalMaximo} (${porcentaje}%)</strong>
    `;
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
    const kpi = totalMaximo > 0 ? (totalObtenido / totalMaximo) : 0;
    
    // Obtener información de la entidad
    const entidadInfo = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    // Estructura de datos para Firebase
    const evaluacionData = {
        tipo: tipo,
        entidadId: entidadId,
        entidadNombre: entidadInfo?.nombre || 'Desconocido',
        mes: window.mesSeleccionado,
        parametros: evaluacion,
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
                await window.firebaseDB.eliminarEvaluacion(entidadId, tipo, window.mesSeleccionado);
                
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
            parametros: evaluacion,
            totalObtenido: totalObtenido,
            totalMaximo: totalMaximo,
            kpi: kpi,
            estado: evaluacionData.estado,
            estadoPublicacion: evaluacionData.estadoPublicacion,
            fechaCreacion: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        if (tipo === 'sucursal') {
            if (!window.evaluaciones.sucursales[entidadId]) {
                window.evaluaciones.sucursales[entidadId] = {};
            }
            window.evaluaciones.sucursales[entidadId][window.mesSeleccionado] = evaluacionLocal;
        } else if (tipo === 'franquicia') {
            if (!window.evaluaciones.franquicias[entidadId]) {
                window.evaluaciones.franquicias[entidadId] = {};
            }
            window.evaluaciones.franquicias[entidadId][window.mesSeleccionado] = evaluacionLocal;
        } else if (tipo === 'competencia') {
            if (!window.evaluaciones.competencia[entidadId]) {
                window.evaluaciones.competencia[entidadId] = {};
            }
            window.evaluaciones.competencia[entidadId][window.mesSeleccionado] = evaluacionLocal;
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
    
    if (btnSeleccionarTodo.textContent === '✓ Seleccionar Todo') {
        checkboxes.forEach(checkbox => checkbox.checked = true);
        btnSeleccionarTodo.textContent = '✗ Deseleccionar Todo';
    } else {
        checkboxes.forEach(checkbox => checkbox.checked = false);
        btnSeleccionarTodo.textContent = '✓ Seleccionar Todo';
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
        
        <!-- Gráfico de Barras - Espacio Principal -->
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 30px;">
            <h3 style="text-align: center; margin-bottom: 25px; color: #2c3e50; font-size: 1.4rem; font-weight: 600;">
                📊 KPIs por Entidad
            </h3>
            <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                <canvas id="graficoKPIs" width="800" height="400" style="max-width: 100%; border-radius: 8px;"></canvas>
            </div>
            <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 15px;">
                Comparación del rendimiento individual de cada entidad evaluada
            </p>
        </div>
        
        <!-- Layout de 2 columnas para gráfico circular y resumen -->
        <div class="graficas-responsive" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; margin-bottom: 30px;">
            <!-- Gráfico Circular -->
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h3 style="text-align: center; margin-bottom: 20px; color: #2c3e50; font-size: 1.3rem; font-weight: 600;">
                    🎯 Distribución de Rendimiento
                </h3>
                <div style="display: flex; justify-content: center;">
                    <canvas id="graficoDistribucion" width="350" height="350" style="border-radius: 8px;"></canvas>
                </div>
                <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 15px;">
                    Proporción de entidades por nivel de rendimiento
                </p>
            </div>
            
            <!-- Resumen Estadístico -->
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h3 style="text-align: center; margin-bottom: 20px; color: #2c3e50; font-size: 1.3rem; font-weight: 600;">
                    📈 Resumen Estadístico
                </h3>
                <div id="resumenEstadistico"></div>
            </div>
        </div>
        
        <!-- Responsive design para móviles -->
        <style>
            @media (max-width: 768px) {
                .graficas-responsive {
                    grid-template-columns: 1fr !important;
                }
                #graficoKPIs {
                    width: 100% !important;
                    height: 300px !important;
                }
                #graficoDistribucion {
                    width: 280px !important;
                    height: 280px !important;
                }
            }
        </style>
    `;
    
    document.getElementById('graficas').innerHTML = html;
    
    // Generar datos para gráficas
    generarGraficosKPI();
    generarResumenEstadistico();
}

// Función para generar gráficos de KPI
function generarGraficosKPI() {
    const canvas1 = document.getElementById('graficoKPIs');
    const canvas2 = document.getElementById('graficoDistribucion');
    
    if (!canvas1 || !canvas2) return;
    
    // Obtener datos filtrados por rol usando la función existente
    const evaluacionesFiltradas = filtrarDatosPorRol(obtenerEvaluacionesDelMes(window.mesSeleccionado));
    
    // Obtener datos de KPIs de las evaluaciones filtradas
    let datosKPI = [];
    let entidades = [];
    let metas = [];
    
    evaluacionesFiltradas.forEach(evaluacion => {
        if (evaluacion.kpi !== undefined) {
            const kpiPorcentaje = Math.round(evaluacion.kpi * 100);
            datosKPI.push(kpiPorcentaje);
            entidades.push(evaluacion.entidad);
            metas.push({
                entidad: evaluacion.entidad,
                entidadId: evaluacion.entidadId,
                tipo: evaluacion.tipo, // 'sucursal' | 'franquicia' | 'competencia'
                evaluacion: evaluacion.evaluacion || null
            });
        }
    });
    
    // Dibujar gráfico de barras simple
    dibujarGraficoBarras(canvas1, entidades, datosKPI, metas);
    
    // Dibujar gráfico de distribución
    dibujarGraficoDistribucion(canvas2, datosKPI);
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
    
    // Establecer mes anterior como predeterminado
    window.mesSeleccionado = obtenerMesAnterior();
    
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
            
            console.log('Meses con datos reales en Firebase:', Array.from(mesesConDatos).sort());
            console.log('Mes seleccionado actualmente:', window.mesSeleccionado);
            
        } catch (error) {
            console.error('Error cargando desde Firebase:', error);
        }
    }
    
    // Generar datos de muestra solo si no hay datos en Firebase
    const evaluacionesExistentes = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    if (evaluacionesExistentes.length === 0) {
        console.log('No hay evaluaciones en Firebase, generando datos de muestra...');
        generarDatosEjemplo();
    } else {
        console.log(`Encontradas ${evaluacionesExistentes.length} evaluaciones existentes para ${window.mesSeleccionado}`);
    }
    
    // Poblar selector de mes
    poblarSelectorMes();
    
    // Configurar navegación
    configurarNavegacion();
    
    // Verificar autenticación
    const autenticado = verificarAutenticacion();
    
    if (autenticado) {
        // Si está autenticado, mostrar dashboard
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
                            <button class="btn btn-success btn-publicar" onclick="publicarEvaluacion('${evaluacion.entidadId}', '${evaluacion.tipo}')" title="Publicar evaluación">
                                <i class="fas fa-share"></i>
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
function verEvaluacion(entidadId, tipo) {
    const evaluacion = obtenerEvaluacion(entidadId, tipo, window.mesSeleccionado);
    if (!evaluacion) {
        alert('Evaluación no encontrada');
        return;
    }
    
    const entidad = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    const nombreEntidad = entidad ? entidad.nombre : entidadId;
    
    // Crear modal para mostrar detalles de la evaluación
    const totalObtenido = evaluacion.totalObtenido || 0;
    const totalMaximo = evaluacion.totalMaximo || 0;
    // Use the stored KPI value for consistency with the table
    const kpi = evaluacion.kpi ? (evaluacion.kpi * 100) : (totalMaximo > 0 ? (totalObtenido / totalMaximo) * 100 : 0);
    const estado = kpi >= 95 ? 'Excelente' : kpi >= 90 ? 'Bueno' : 'Necesita mejora';
    
    console.log(`Ver evaluación: ${entidadId} (${tipo})`);
    console.log(`Total obtenido: ${totalObtenido}, Total máximo: ${totalMaximo}, KPI: ${kpi.toFixed(1)}%`);
    console.log(`KPI almacenado: ${evaluacion.kpi}, KPI calculado: ${kpi}`);
    
    let detallesHtml = `
        <div class="modal" id="modalVerEvaluacion" style="display: block; z-index: 10001; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); overflow-y: auto;">
            <div class="modal-content" style="max-width: 800px; margin: 50px auto; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #333;"><i class="fas fa-eye"></i> Detalles de Evaluación</h2>
                    <button onclick="cerrarModalVerEvaluacion()" class="btn-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                            <h3 style="color: #555; margin-bottom: 15px;">Información General</h3>
                            <p><strong>Entidad:</strong> ${entidad.nombre}</p>
                            <p><strong>Tipo:</strong> ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
                            <p><strong>Mes:</strong> ${formatearMesLegible(window.mesSeleccionado)}</p>
                            <p><strong>Fecha:</strong> ${evaluacion.fechaCreacion || evaluacion.created_at || new Date().toLocaleDateString('es-ES')}</p>
                        </div>
                        <div>
                            <h3 style="color: #555; margin-bottom: 15px;">Resultados</h3>
                            <p><strong>KPI:</strong> <span style="color: ${kpi >= 95 ? '#28a745' : kpi >= 90 ? '#ffc107' : '#dc3545'}; font-weight: bold; font-size: 18px;">${kpi.toFixed(1)}%</span></p>
                            <p><strong>Estado:</strong> <span style="color: ${kpi >= 95 ? '#28a745' : kpi >= 90 ? '#ffc107' : '#dc3545'}; font-weight: bold;">${estado}</span></p>
                            <p><strong>Total Obtenido:</strong> ${evaluacion.totalObtenido || 0}</p>
                            <p><strong>Total Máximo:</strong> ${evaluacion.totalMaximo || 0}</p>
                        </div>
                    </div>
                    
                    <h3 style="color: #555; margin-bottom: 15px;">Parámetros Evaluados</h3>
                    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f5f5f5;">
                                    <th style="padding: 15px 12px; border-bottom: 2px solid #ddd; text-align: left; font-weight: 600;">Parámetro</th>
                                    <th style="padding: 15px 12px; border-bottom: 2px solid #ddd; text-align: center; font-weight: 600;">Valor</th>
                                    <th style="padding: 15px 12px; border-bottom: 2px solid #ddd; text-align: center; font-weight: 600;">Máximo</th>
                                    <th style="padding: 15px 12px; border-bottom: 2px solid #ddd; text-align: center; font-weight: 600;">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    Object.keys(evaluacion.parametros).forEach(parametroId => {
        const valor = evaluacion.parametros[parametroId];
        const parametro = window.parametros?.find(p => p.id === parametroId);
        const nombre = parametro ? parametro.nombre : parametroId;
        const maximo = parametro ? parametro.peso : 'N/A';
        
        // Determinar estado y color
        let estadoIcon, estadoColor, estadoTexto;
        if (valor === maximo) {
            estadoIcon = '✅';
            estadoColor = '#28a745';
            estadoTexto = 'Completo';
        } else if (valor > 0) {
            estadoIcon = '🟡';
            estadoColor = '#ffc107';
            estadoTexto = 'Parcial';
        } else {
            estadoIcon = '❌';
            estadoColor = '#dc3545';
            estadoTexto = 'No cumple';
        }
        
        detallesHtml += `
            <tr style="transition: background-color 0.2s ease; border-left: 3px solid ${estadoColor};" 
                onmouseover="this.style.backgroundColor='#f8f9fa'" 
                onmouseout="this.style.backgroundColor='white'">
                <td style="padding: 15px 12px; border-bottom: 1px solid #eee; font-weight: 500;">
                    ${nombre}
                </td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #eee; text-align: center; font-weight: 600; color: ${estadoColor}; font-size: 16px;">
                    ${valor}
                </td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #eee; text-align: center; color: #666;">
                    ${maximo}
                </td>
                <td style="padding: 15px 12px; border-bottom: 1px solid #eee; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span style="font-size: 16px;">${estadoIcon}</span>
                        <span style="color: ${estadoColor}; font-weight: 600; font-size: 12px;">${estadoTexto}</span>
                    </div>
                </td>
            </tr>
        `;
    });
    
    detallesHtml += `
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
                                <span style="font-size: 14px;">✅</span>
                                <span style="color: #28a745; font-weight: 600;">Completo</span>
                                <span style="color: #6c757d;">- Puntaje máximo obtenido</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 14px;">🟡</span>
                                <span style="color: #ffc107; font-weight: 600;">Parcial</span>
                                <span style="color: #6c757d;">- Puntaje parcial obtenido</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 14px;">❌</span>
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
function editarEvaluacion(entidadId, tipo) {
    if (!tienePermiso('editar')) {
        alert('No tiene permisos para editar evaluaciones');
        return;
    }
    
    console.log(`Editar evaluación: ${entidadId} (${tipo})`);
    
    // Buscar la evaluación existente
    const tipoEntidad = tipo === 'sucursal' ? 
        window.evaluaciones?.sucursales?.[entidadId]?.[window.mesSeleccionado]
        : window.evaluaciones?.franquicias?.[entidadId]?.[window.mesSeleccionado];
    
    if (!tipoEntidad) {
        alert('No se encontró la evaluación para editar');
        return;
    }
    
    // Obtener información de la entidad
    const entidadInfo = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    // Marcar que estamos en modo edición
    window.modoEdicion = {
        activo: true,
        entidadId: entidadId,
        tipo: tipo,
        mes: window.mesSeleccionado,
        datosOriginales: { ...tipoEntidad },
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
    modalTitle.textContent = `Editar Evaluación - ${entidadInfo?.nombre}`;
    
    // Cargar los parámetros para esta entidad específica
    const entidadValue = `${tipo}-${entidadId}`;
    cargarParametrosEvaluacion(entidadValue);
    
    // Esperar un poco para que se carguen los parámetros y luego pre-llenar los valores
    setTimeout(() => {
        precargarValoresEvaluacion(tipoEntidad.parametros);
        
        // Cambiar el texto del botón
        document.getElementById('btn-guardar-evaluacion').textContent = 'Actualizar Evaluación';
        document.getElementById('btn-guardar-evaluacion').style.display = 'block';
    }, 100);
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

    const entidad = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    const nombreEntidad = entidad ? entidad.nombre : entidadId;

    const mes = window.mesSeleccionado;
    const linksMes = window.videoLinks?.[mes] || {};
    const urlOriginal = linksMes[entidadId];

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
                controls: '1',         // mostrar controles de reproducción
                modestbranding: '1',   // menos branding
                iv_load_policy: '3',   // ocultar anotaciones
                fs: '1',               // permitir fullscreen
                disablekb: '0',        // habilitar teclado
                playsinline: '1',      // inline en móvil
                autoplay: '1'          // reproducir al abrir (iniciado por clic del usuario)
            });
            return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
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
                                     src="${embedUrl}"
                                     title="Video de evaluación"
                                     style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                                     frameborder="0"
                                     allow="autoplay; encrypted-media; picture-in-picture"
                                     allowfullscreen
                                 ></iframe>
                                <a href="https://www.youtube.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Abrir YouTube"
                                    title="Abrir YouTube"
                                    style="position:absolute; bottom:0; right:0; width: 90px; height: 90px; z-index: 4; display:block;">
                                </a>
                                <!-- Mensaje para deshabilitar la copia de enlace (arriba-derecha) -->
                                <div
                                    title="No se puede copiar el enlace"
                                    style="position:absolute; top:8px; right:8px; background: rgba(0,0,0,0.65); color:#fff; padding:6px 10px; border-radius: 14px; font-size:12px; z-index: 3; user-select:none; cursor:not-allowed;"
                                    onclick="event.stopPropagation(); event.preventDefault();"
                                >
                                    
                                </div>
                                <!-- Layer superior para bloquear enlaces (título y copiar vínculo) -->
                                <div
                                    title="No se puede copiar el enlace"
                                    style="
                                        position:absolute;
                                        top:0; left:0;
                                        width:100%;
                                        height:35%;        /* Ajusta 30–40% si hace falta */
                                        z-index: 2;        /* Debajo del chip (z-index: 3), encima del iframe */
                                        cursor:not-allowed;
                                    "
                                    onclick="event.stopPropagation(); event.preventDefault();"
                                    onmousedown="event.stopPropagation(); event.preventDefault();"
                                    onmouseup="event.stopPropagation(); event.preventDefault();"
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
                    const totalObtenido = evaluacion.totalObtenido || 0;
                    const totalMaximo = evaluacion.totalMaximo || 0;
                    const kpiPorcentaje = totalMaximo > 0 ? 
                        Math.round((totalObtenido / totalMaximo) * 100) : 0;
                    
                    // Obtener fecha de created_at o fechaCreacion
                    let fechaFormateada = 'N/A';
                    const fechaSource = evaluacion.created_at || evaluacion.fechaCreacion;
                    if (fechaSource) {
                        try {
                            const fecha = new Date(fechaSource);
                            if (!isNaN(fecha.getTime())) {
                                fechaFormateada = fecha.toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit', 
                                    year: 'numeric'
                                });
                            }
                        } catch (error) {
                            console.error('Error formateando fecha:', error);
                            fechaFormateada = String(fechaSource);
                        }
                    }
                    
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
                    const totalObtenido = evaluacion.totalObtenido || 0;
                    const totalMaximo = evaluacion.totalMaximo || 0;
                    const kpiPorcentaje = totalMaximo > 0 ? 
                        Math.round((totalObtenido / totalMaximo) * 100) : 0;
                    
                    // Obtener fecha de created_at o fechaCreacion
                    let fechaFormateada = 'N/A';
                    const fechaSource = evaluacion.created_at || evaluacion.fechaCreacion;
                    if (fechaSource) {
                        try {
                            const fecha = new Date(fechaSource);
                            if (!isNaN(fecha.getTime())) {
                                fechaFormateada = fecha.toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                });
                            }
                        } catch (error) {
                            console.error('Error formateando fecha:', error);
                            fechaFormateada = String(fechaSource);
                        }
                    }
                    
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
                    const totalObtenido = evaluacion.totalObtenido || 0;
                    const totalMaximo = evaluacion.totalMaximo || 0;
                    const kpiPorcentaje = totalMaximo > 0 ? 
                        Math.round((totalObtenido / totalMaximo) * 100) : 0;
                    
                    // Obtener fecha de created_at o fechaCreacion
                    let fechaFormateada = 'N/A';
                    const fechaSource = evaluacion.created_at || evaluacion.fechaCreacion;
                    if (fechaSource) {
                        try {
                            const fecha = new Date(fechaSource);
                            if (!isNaN(fecha.getTime())) {
                                fechaFormateada = fecha.toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit', 
                                    year: 'numeric'
                                });
                            }
                        } catch (error) {
                            console.error('Error formateando fecha:', error);
                            fechaFormateada = String(fechaSource);
                        }
                    }
                    
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
    
    // Ordenar por KPI descendente
    evaluacionesDelMes.sort((a, b) => b.kpi - a.kpi);
    
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
    
    evaluacionesFirebase.forEach(evaluacion => {
        const { tipo, entidadId, mes } = evaluacion;
        
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
        
        // Convertir datos de Firebase a formato local
        window.evaluaciones[tipoEntidad][entidadId][mes] = {
            parametros: evaluacion.parametros || {},
            totalObtenido: evaluacion.totalObtenido || 0,
            totalMaximo: evaluacion.totalMaximo || 0,
            kpi: evaluacion.kpi || 0,
            estado: evaluacion.estado || 'Sin evaluar',
            estadoPublicacion: evaluacion.estadoPublicacion || 'borrador',
            fechaPublicacion: evaluacion.fechaPublicacion ? 
                (evaluacion.fechaPublicacion.toDate ? evaluacion.fechaPublicacion.toDate() : evaluacion.fechaPublicacion) : null,
            fechaCreacion: evaluacion.fechaCreacion || evaluacion.created_at || new Date().toISOString(),
            timestamp: evaluacion.timestamp || Date.now()
        };
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
    
    const entidad = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    const nombreEntidad = entidad ? entidad.nombre : entidadId;
    
    const confirmacion = confirm(`¿Está seguro de que desea publicar la evaluación de ${nombreEntidad} para ${formatearMesLegible(window.mesSeleccionado)}?\n\nUna vez publicada, será visible para GOP, DG y franquicias.`);
    
    if (!confirmacion) return;
    
    try {
        // Actualizar en Firebase
        if (window.firebaseDB) {
            // Buscar y actualizar la evaluación en Firebase usando query
            const success = await window.firebaseDB.actualizarEstadoPublicacion(entidadId, tipo, window.mesSeleccionado, 'publicado');
            
            if (success) {
                console.log('Evaluación publicada en Firebase exitosamente');
                
                // También actualizar en estructura local si existe
                let tipoEntidad = 'franquicias';
                if (tipo === 'sucursal') tipoEntidad = 'sucursales';
                else if (tipo === 'franquicia') tipoEntidad = 'franquicias';
                else if (tipo === 'competencia') tipoEntidad = 'competencia';
                
                if (window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[window.mesSeleccionado]) {
                    window.evaluaciones[tipoEntidad][entidadId][window.mesSeleccionado].estadoPublicacion = 'publicado';
                    window.evaluaciones[tipoEntidad][entidadId][window.mesSeleccionado].fechaPublicacion = new Date();
                }
                
                alert(`Evaluación de ${nombreEntidad} publicada exitosamente.\nAhora es visible para todos los roles autorizados.`);
                
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
