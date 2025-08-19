// matriz.js - Módulo para renderizar la matriz de evaluación completa
// Muestra todos los 32 parámetros con manejo de exclusiones

/**
 * Función principal para renderizar la matriz completa
 * Mantiene las columnas de Entidad, Tipo y KPI General
 * Muestra todos los 32 parámetros con exclusiones en negro
 */
function renderMatrizCompleta() {
    console.log('Renderizando matriz completa para mes:', window.mesSeleccionado);
    
    // Nueva verificación dinámica por rol y estado de publicación
    let evaluacionesVisibles = [];
    try {
        const todas = typeof obtenerEvaluacionesDelMes === 'function' ? obtenerEvaluacionesDelMes(window.mesSeleccionado) : [];
        evaluacionesVisibles = typeof filtrarDatosPorRol === 'function' ? filtrarDatosPorRol(todas) : [];
        console.log('Evaluaciones visibles para matriz:', evaluacionesVisibles.length);
    } catch (e) {
        console.warn('No se pudieron obtener/filtrar evaluaciones para la matriz:', e);
        evaluacionesVisibles = [];
    }

    // Si no hay evaluaciones visibles para el rol actual (y no es admin), ocultar matriz
    if (usuarioActual && usuarioActual.rol !== 'admin' && evaluacionesVisibles.length === 0) {
        const html = `
            <div style="margin-bottom: 20px; text-align: center; padding: 40px;">
                <h2 style="color: #0077cc; margin-bottom: 20px;">
                    Matriz de Evaluación - ${formatearMesLegible(window.mesSeleccionado)}
                </h2>
                <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 30px; max-width: 520px; margin: 0 auto;">
                    <i class="fas fa-eye-slash" style="font-size: 48px; color: #6c757d; margin-bottom: 20px;"></i>
                    <h3 style="color: #495057; margin-bottom: 15px;">Matriz no disponible</h3>
                    <p style="color: #6c757d; margin: 0;">
                        No hay evaluaciones publicadas visibles para su rol en ${formatearMesLegible(window.mesSeleccionado)}.
                    </p>
                </div>
            </div>
        `;
        document.getElementById('matriz').innerHTML = html;
        return;
    }
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0077cc; margin-bottom: 10px; text-align: center;">
                Matriz de Evaluación - ${formatearMesLegible(window.mesSeleccionado)}
            </h2>
            <p style="text-align: center; color: #666; margin-bottom: 20px;">
                Vista detallada de parámetros por sucursal/franquicia
            </p>
        </div>
    `;
    
    // Obtener todas las entidades activas (filtradas por rol si corresponde)
    let entidades = [];

    // Construir sets de entidades con evaluación visible para roles no-admin
    const esAdmin = usuarioActual && usuarioActual.rol === 'admin';
    const visiblesSuc = new Set();
    const visiblesFra = new Set();
    if (!esAdmin) {
        evaluacionesVisibles.forEach(ev => {
            if (ev.tipo === 'sucursal') visiblesSuc.add(ev.entidadId);
            if (ev.tipo === 'franquicia') visiblesFra.add(ev.entidadId);
        });
        console.log('Entidades visibles - Sucursales:', Array.from(visiblesSuc));
        console.log('Entidades visibles - Franquicias:', Array.from(visiblesFra));
    }
    
    if (window.sucursales) {
        window.sucursales.filter(s => s.activa).forEach(sucursal => {
            if (esAdmin || visiblesSuc.has(sucursal.id)) {
                entidades.push({
                    id: sucursal.id,
                    nombre: sucursal.nombre,
                    tipo: 'Sucursal'
                });
            }
        });
    }
    
    if (window.franquicias) {
        window.franquicias.filter(f => f.activa).forEach(franquicia => {
            if (esAdmin || visiblesFra.has(franquicia.id)) {
                entidades.push({
                    id: franquicia.id,
                    nombre: franquicia.nombre,
                    tipo: 'Franquicia'
                });
            }
        });
    }
    
    if (entidades.length === 0) {
        html += '<p>No hay entidades para mostrar con evaluaciones visibles.</p>';
        document.getElementById('matriz').innerHTML = html;
        return;
    }
    
    // Verificar que tenemos parámetros
    if (!window.parametros || window.parametros.length === 0) {
        html += '<p>No se han cargado los parámetros de evaluación.</p>';
        document.getElementById('matriz').innerHTML = html;
        return;
    }
    
    console.log(`Mostrando ${window.parametros.length} parámetros para ${entidades.length} entidades`);
    
    // Crear tabla de matriz con scroll horizontal
    html += `
        <div class="matriz-wrapper">
            <table class="matriz-table">
                <thead>
                    <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); position: sticky; top: 0; z-index: 10;">
                        <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-weight: 600; color: #495057; min-width: 150px; position: sticky; left: 0; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); z-index: 11; box-shadow: 2px 0 4px rgba(0,0,0,0.1);">Entidad</th>
                        <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-weight: 600; color: #495057; min-width: 80px; position: sticky; left: 150px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); z-index: 11; box-shadow: 2px 0 4px rgba(0,0,0,0.1);">Tipo</th>
                        <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; min-width: 100px; position: sticky; left: 230px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); z-index: 11; box-shadow: 2px 0 4px rgba(0,0,0,0.1);">KPI General</th>
    `;
    
    // Agregar columnas para TODOS los parámetros (32)
    window.parametros.forEach((param, index) => {
        html += `
            <th class="param-th" style="border: 1px solid #ddd; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; min-width: 48px; writing-mode: vertical-rl; text-orientation: mixed; font-size: 10px; height: 100px;">
                <div class="matriz-tooltip" style="display: block;">
                    <div style="transform: rotate(180deg);">${param.nombre}</div>
                    <div class="matriz-tooltip-bubble">
                        <div class="matriz-tooltip-row">
                            <div class="matriz-tooltip-icon">📊</div>
                            <div class="matriz-tooltip-label">Parámetro</div>
                            <div class="matriz-tooltip-value">${param.nombre}</div>
                        </div>
                        <div class="matriz-tooltip-row">
                            <div class="matriz-tooltip-icon">⚖️</div>
                            <div class="matriz-tooltip-label">Peso</div>
                            <div class="matriz-tooltip-value">${param.peso}</div>
                        </div>
                    </div>
                </div>
            </th>
        `;
    });
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Generar filas para cada entidad
    entidades.forEach((entidad, entidadIndex) => {
        const tipoLower = entidad.tipo.toLowerCase();
        const mes = window.mesSeleccionado;
        
        // Obtener evaluación
        const evaluacion = tipoLower === 'sucursal' ? 
            window.evaluaciones?.sucursales?.[entidad.id]?.[mes]
            : window.evaluaciones?.franquicias?.[entidad.id]?.[mes];
        
        // Calcular KPI General usando valores almacenados
        let kpiGeneral = 'N/A';
        let kpiColor = '#999';
        if (evaluacion && evaluacion.totalObtenido !== undefined && evaluacion.totalMaximo !== undefined) {
            const porcentaje = evaluacion.totalMaximo > 0 ? 
                Math.round((evaluacion.totalObtenido / evaluacion.totalMaximo) * 100) : 0;
            kpiGeneral = `${porcentaje}%`;
            kpiColor = porcentaje >= 95 ? '#28a745' : porcentaje >= 90 ? '#ffc107' : '#dc3545';
        }
        
        // Obtener parámetros excluidos para esta entidad
        const parametrosExcluidos = obtenerParametrosExcluidos(entidad.id, tipoLower);
        
        const rowBg = entidadIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';
        
        html += `
            <tr style="background-color: ${rowBg};" onmouseover="this.style.backgroundColor='#e3f2fd'" onmouseout="this.style.backgroundColor='${rowBg}'">
                <td style="border: 1px solid #ddd; padding: 12px 8px; font-weight: 500; position: sticky; left: 0; background-color: ${rowBg}; z-index: 5;">
                    <div class="matriz-tooltip" style="display: inline-block;">
                        ${entidad.nombre}
                        <div class="matriz-tooltip-bubble">
                            <div class="matriz-tooltip-row">
                                <div class="matriz-tooltip-icon">🏢</div>
                                <div class="matriz-tooltip-label">Entidad</div>
                                <div class="matriz-tooltip-value">${entidad.nombre}</div>
                            </div>
                            <div class="matriz-tooltip-row">
                                <div class="matriz-tooltip-icon">🔖</div>
                                <div class="matriz-tooltip-label">Tipo</div>
                                <div class="matriz-tooltip-value">${entidad.tipo}</div>
                            </div>
                            <div class="matriz-tooltip-row">
                                <div class="matriz-tooltip-icon">📈</div>
                                <div class="matriz-tooltip-label">KPI General</div>
                                <div class="matriz-tooltip-value">${kpiGeneral}</div>
                            </div>
                        </div>
                    </div>
                </td>
                <td style="border: 1px solid #ddd; padding: 12px 8px; position: sticky; left: 150px; background-color: ${rowBg}; z-index: 5;">${entidad.tipo}</td>
                <td style="border: 1px solid #ddd; padding: 12px 8px; text-align: center; font-weight: bold; color: ${kpiColor}; position: sticky; left: 230px; background-color: ${rowBg}; z-index: 5;">${kpiGeneral}</td>
        `;
        
        // Mostrar estado de TODOS los parámetros
        window.parametros.forEach(param => {
            // Verificar si el ID del parámetro actual está en la lista de excluidos
            const esExcluido = parametrosExcluidos.some(idExcluido => {
                // Comparar IDs normalizados (sin guiones, en minúsculas)
                const idParam = param.id.toLowerCase().replace(/[-_]/g, '');
                return idParam === idExcluido;
            });
            
            if (esExcluido) {
                // Parámetro excluido - celda en negro con tooltip estilizado
                html += `
                    <td style="border: 1px solid #ddd; padding: 8px 4px; text-align: center; background-color: #000000; color: #ffffff;">
                        <div class="matriz-tooltip">
                            <span style="font-size: 10px;">N/A</span>
                            <div class="matriz-tooltip-bubble">
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">🏢</div>
                                    <div class="matriz-tooltip-label">Entidad</div>
                                    <div class="matriz-tooltip-value">${entidad.tipo}: ${entidad.nombre}</div>
                                </div>
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">📊</div>
                                    <div class="matriz-tooltip-label">Parámetro</div>
                                    <div class="matriz-tooltip-value">${param.nombre}</div>
                                </div>
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">🚫</div>
                                    <div class="matriz-tooltip-label">Estado</div>
                                    <div class="matriz-tooltip-value">Excluido</div>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
            } else {
                // Parámetro aplicable - mostrar estado
                let estado = 'N/A';
                let color = '#999';
                let bgColor = 'transparent';
                let estadoTexto = 'Sin evaluar';
                let valor = 0;
                let peso = param.peso;
                let estadoIcono = '⏳';
                
                if (evaluacion && evaluacion.parametros && evaluacion.parametros[param.id] !== undefined) {
                    valor = parseInt(evaluacion.parametros[param.id]);
                    peso = param.peso;
                    
                    if (valor === peso) {
                        estado = '✓';
                        color = '#ffffff';
                        bgColor = '#28a745';
                        estadoTexto = 'Completo';
                        estadoIcono = '✅';
                    } else if (valor > 0) {
                        estado = '◐';
                        color = '#ffffff';
                        bgColor = '#ffc107';
                        estadoTexto = 'Parcial';
                        estadoIcono = '⚠️';
                    } else {
                        estado = '✗';
                        color = '#ffffff';
                        bgColor = '#dc3545';
                        estadoTexto = 'No cumple';
                        estadoIcono = '❌';
                    }
                }
                
                html += `
                    <td style="border: 1px solid #ddd; padding: 8px 4px; text-align: center; color: ${color}; background-color: ${bgColor}; font-weight: bold;">
                        <div class="matriz-tooltip">
                            ${estado}
                            <div class="matriz-tooltip-bubble">
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">🏢</div>
                                    <div class="matriz-tooltip-label">Entidad</div>
                                    <div class="matriz-tooltip-value">${entidad.tipo}: ${entidad.nombre}</div>
                                </div>
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">📊</div>
                                    <div class="matriz-tooltip-label">Parámetro</div>
                                    <div class="matriz-tooltip-value">${param.nombre}</div>
                                </div>
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">${estadoIcono}</div>
                                    <div class="matriz-tooltip-label">Estado</div>
                                    <div class="matriz-tooltip-value">${estadoTexto}</div>
                                </div>
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">🎯</div>
                                    <div class="matriz-tooltip-label">Puntuación</div>
                                    <div class="matriz-tooltip-value">${valor}/${peso} puntos</div>
                                </div>
                                <div class="matriz-tooltip-row">
                                    <div class="matriz-tooltip-icon">⚖️</div>
                                    <div class="matriz-tooltip-label">Peso</div>
                                    <div class="matriz-tooltip-value">${peso}</div>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
            }
        });
        
        html += '</tr>';
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 1px solid #dee2e6;">
            <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px; font-weight: 600;">
                <i class="fas fa-info-circle" style="margin-right: 8px; color: #6c757d;"></i>
                Leyenda de Estados
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 20px; height: 20px; background-color: #28a745; color: white; text-align: center; line-height: 20px; border-radius: 3px; font-weight: bold;">✓</span>
                    <span style="color: #28a745; font-weight: 600;">Completo</span>
                    <span style="color: #6c757d;">- Puntaje máximo obtenido</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 20px; height: 20px; background-color: #ffc107; color: white; text-align: center; line-height: 20px; border-radius: 3px; font-weight: bold;">◐</span>
                    <span style="color: #ffc107; font-weight: 600;">Parcial</span>
                    <span style="color: #6c757d;">- Puntaje parcial obtenido</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 20px; height: 20px; background-color: #dc3545; color: white; text-align: center; line-height: 20px; border-radius: 3px; font-weight: bold;">✗</span>
                    <span style="color: #dc3545; font-weight: 600;">No cumple</span>
                    <span style="color: #6c757d;">- Sin puntaje obtenido</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 20px; height: 20px; background-color: #000000; color: white; text-align: center; line-height: 20px; border-radius: 3px; font-size: 10px;">N/A</span>
                    <span style="color: #000000; font-weight: 600;">Excluido</span>
                    <span style="color: #6c757d;">- Parámetro no aplica a esta entidad</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 20px; height: 20px; background-color: #999; color: white; text-align: center; line-height: 20px; border-radius: 3px; font-size: 10px;">N/A</span>
                    <span style="color: #999; font-weight: 600;">Sin evaluar</span>
                    <span style="color: #6c757d;">- Parámetro no evaluado aún</span>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 15px; font-size: 12px; color: #6c757d; text-align: center;">
            <p><strong>Total de parámetros:</strong> ${window.parametros.length} | <strong>Entidades mostradas:</strong> ${entidades.length}</p>
        </div>
    `;
    
    document.getElementById('matriz').innerHTML = html;
    console.log('Matriz completa renderizada exitosamente');
}

/**
 * Obtiene los parámetros excluidos para una entidad específica
 * @param {string} entidadId - ID de la entidad
 * @param {string} tipo - Tipo de entidad ('sucursal' o 'franquicia')
 * @returns {Array} Array de IDs de parámetros excluidos normalizados
 */
function obtenerParametrosExcluidos(entidadId, tipo) {
    let nombresExcluidos = [];
    
    if (tipo === 'sucursal' && window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId]) {
        nombresExcluidos = window.parametrosExcluidosPorSucursal[entidadId];
    } else if (tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[entidadId]) {
        nombresExcluidos = window.parametrosExcluidosPorFranquicia[entidadId];
    }
    
    // Mapear nombres de parámetros a sus IDs normalizados
    const idsExcluidos = nombresExcluidos
        .map(nombre => {
            const param = window.parametros.find(p => 
                p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
            );
            return param ? param.id.toLowerCase().replace(/[-_]/g, '') : null;
        })
        .filter(id => id !== null);
    
    console.log(`Parámetros excluidos normalizados para ${entidadId} (${tipo}):`, idsExcluidos);
    return idsExcluidos;
}

/**
 * Reemplaza la función renderMatriz original con la versión completa
 * Mantiene compatibilidad con el código existente
 */
function renderMatriz() {
    renderMatrizCompleta();
}

// Exportar funciones para uso global
window.renderMatrizCompleta = renderMatrizCompleta;
window.obtenerParametrosExcluidos = obtenerParametrosExcluidos;

console.log('Módulo matriz.js cargado exitosamente');
