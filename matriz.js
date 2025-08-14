// matriz.js - Módulo para renderizar la matriz de evaluación completa
// Muestra todos los 32 parámetros con manejo de exclusiones

/**
 * Función principal para renderizar la matriz completa
 * Mantiene las columnas de Entidad, Tipo y KPI General
 * Muestra todos los 32 parámetros con exclusiones en negro
 */
function renderMatrizCompleta() {
    console.log('Renderizando matriz completa para mes:', window.mesSeleccionado);
    
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
    
    // Obtener todas las entidades activas
    let entidades = [];
    
    if (window.sucursales) {
        window.sucursales.filter(s => s.activa).forEach(sucursal => {
            entidades.push({
                id: sucursal.id,
                nombre: sucursal.nombre,
                tipo: 'Sucursal'
            });
        });
    }
    
    if (window.franquicias) {
        window.franquicias.filter(f => f.activa).forEach(franquicia => {
            entidades.push({
                id: franquicia.id,
                nombre: franquicia.nombre,
                tipo: 'Franquicia'
            });
        });
    }
    
    if (entidades.length === 0) {
        html += '<p>No hay entidades activas para mostrar.</p>';
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
        <div style="overflow-x: auto; width: 100vw; margin-left: calc(-50vw + 50%); border: 1px solid #ddd; border-radius: 8px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <table class="matriz-table" style="width: max-content; min-width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); position: sticky; top: 0; z-index: 10;">
                        <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-weight: 600; color: #495057; min-width: 150px; position: sticky; left: 0; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); z-index: 11; box-shadow: 2px 0 4px rgba(0,0,0,0.1);">Entidad</th>
                        <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-weight: 600; color: #495057; min-width: 80px; position: sticky; left: 150px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); z-index: 11; box-shadow: 2px 0 4px rgba(0,0,0,0.1);">Tipo</th>
                        <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; min-width: 100px; position: sticky; left: 230px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); z-index: 11; box-shadow: 2px 0 4px rgba(0,0,0,0.1);">KPI General</th>
    `;
    
    // Agregar columnas para TODOS los parámetros (32)
    window.parametros.forEach((param, index) => {
        html += `
            <th style="border: 1px solid #ddd; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; min-width: 60px; writing-mode: vertical-rl; text-orientation: mixed; font-size: 10px; height: 120px;" 
                title="${param.nombre} (Peso: ${param.peso})">
                <div style="transform: rotate(180deg);">${param.nombre}</div>
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
                <td style="border: 1px solid #ddd; padding: 12px 8px; font-weight: 500; position: sticky; left: 0; background-color: ${rowBg}; z-index: 5;">${entidad.nombre}</td>
                <td style="border: 1px solid #ddd; padding: 12px 8px; position: sticky; left: 150px; background-color: ${rowBg}; z-index: 5;">${entidad.tipo}</td>
                <td style="border: 1px solid #ddd; padding: 12px 8px; text-align: center; font-weight: bold; color: ${kpiColor}; position: sticky; left: 230px; background-color: ${rowBg}; z-index: 5;">${kpiGeneral}</td>
        `;
        
        // Mostrar estado de TODOS los parámetros
        window.parametros.forEach(param => {
            const parametroExcluido = parametrosExcluidos.includes(param.nombre);
            
            if (parametroExcluido) {
                // Parámetro excluido - celda en negro
                html += `
                    <td style="border: 1px solid #ddd; padding: 8px 4px; text-align: center; background-color: #000000; color: #ffffff;" 
                        title="Parámetro excluido para ${entidad.nombre}">
                        <span style="font-size: 10px;">N/A</span>
                    </td>
                `;
            } else {
                // Parámetro aplicable - mostrar estado
                let estado = 'N/A';
                let color = '#999';
                let bgColor = 'transparent';
                let tooltip = `${param.nombre} - Sin evaluar`;
                
                if (evaluacion && evaluacion.parametros && evaluacion.parametros[param.id] !== undefined) {
                    const valor = parseInt(evaluacion.parametros[param.id]);
                    const peso = param.peso;
                    
                    if (valor === peso) {
                        estado = '✓';
                        color = '#ffffff';
                        bgColor = '#28a745';
                        tooltip = `${param.nombre} - Completo (${valor}/${peso})`;
                    } else if (valor > 0) {
                        estado = '◐';
                        color = '#ffffff';
                        bgColor = '#ffc107';
                        tooltip = `${param.nombre} - Parcial (${valor}/${peso})`;
                    } else {
                        estado = '✗';
                        color = '#ffffff';
                        bgColor = '#dc3545';
                        tooltip = `${param.nombre} - No cumple (${valor}/${peso})`;
                    }
                }
                
                html += `
                    <td style="border: 1px solid #ddd; padding: 8px 4px; text-align: center; color: ${color}; background-color: ${bgColor}; font-weight: bold;" 
                        title="${tooltip}">
                        ${estado}
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
 * @returns {Array} Array de nombres de parámetros excluidos
 */
function obtenerParametrosExcluidos(entidadId, tipo) {
    let parametrosExcluidos = [];
    
    if (tipo === 'sucursal' && window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId]) {
        parametrosExcluidos = window.parametrosExcluidosPorSucursal[entidadId];
    } else if (tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[entidadId]) {
        parametrosExcluidos = window.parametrosExcluidosPorFranquicia[entidadId];
    }
    
    console.log(`Parámetros excluidos para ${entidadId} (${tipo}):`, parametrosExcluidos);
    return parametrosExcluidos || [];
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
