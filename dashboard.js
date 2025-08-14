// ===== MÓDULO DE DASHBOARD =====

// Función para renderizar dashboard
function renderDashboard() {
    console.log('Renderizando dashboard para mes:', window.mesSeleccionado);
    
    const container = document.getElementById('dashboard');
    if (!container) return;
    
    // Buscar si ya existe un contenedor de contenido del dashboard
    let contentContainer = document.getElementById('dashboard-content');
    
    // Si no existe, crearlo después del selector de mes
    if (!contentContainer) {
        contentContainer = document.createElement('div');
        contentContainer.id = 'dashboard-content';
        container.appendChild(contentContainer);
    }
    
    // Verificar autenticación
    if (!usuarioActual) {
        contentContainer.innerHTML = '<div class="no-data"><h3>Debe iniciar sesión para ver el dashboard</h3></div>';
        return;
    }
    
    let html = `
        <div style="margin-bottom: 30px;">
            <h2 style="color: #0077cc; margin-bottom: 10px; text-align: center;">
                Dashboard - ${formatearMesLegible(window.mesSeleccionado)}
            </h2>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">
                Resumen ejecutivo de evaluaciones del período (${usuarioActual.rol})
            </p>
        </div>
    `;
    
    // Obtener evaluaciones del mes y aplicar filtro por rol
    const todasLasEvaluaciones = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    const evaluacionesFiltradas = filtrarDatosPorRol(todasLasEvaluaciones);
    
    console.log(`Dashboard - Evaluaciones totales: ${todasLasEvaluaciones.length}, Filtradas: ${evaluacionesFiltradas.length}`);
    
    // Contar evaluaciones por tipo
    const sucursalesCount = evaluacionesFiltradas.filter(eval => eval.tipo === 'sucursal').length;
    const franquiciasCount = evaluacionesFiltradas.filter(eval => eval.tipo === 'franquicia').length;
    const totalEvaluaciones = evaluacionesFiltradas.length;
    
    // Recopilar todos los KPIs de las evaluaciones filtradas
    let kpis = [];
    
    evaluacionesFiltradas.forEach(eval => {
        if (eval.kpi !== undefined) {
            const kpiPorcentaje = eval.kpi * 100;
            kpis.push(kpiPorcentaje);
            
            // DEBUG: Mostrar datos detallados de cada evaluación
            console.log(`DEBUG - ${eval.entidad} (${eval.tipo}):`, {
                kpi: kpiPorcentaje,
                totalObtenido: eval.evaluacion?.totalObtenido,
                totalMaximo: eval.evaluacion?.totalMaximo,
                estado: eval.estado
            });
        }
    });
    
    // DEBUG: Mostrar resumen de KPIs
    console.log('DEBUG - KPIs recopilados:', kpis);
    console.log('DEBUG - Distribución:', {
        alto: kpis.filter(k => k >= 95).length,
        medio: kpis.filter(k => k >= 90 && k < 95).length,
        bajo: kpis.filter(k => k < 90).length
    });
    
    // Calcular estadísticas
    const promedioKPI = kpis.length > 0 ? Math.round(kpis.reduce((a, b) => a + b, 0) / kpis.length) : 0;
    const alto = kpis.filter(k => k >= 95).length;
    const medio = kpis.filter(k => k >= 90 && k < 95).length;
    const bajo = kpis.filter(k => k < 90).length;
    
    html += `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; position: relative; cursor: help;" 
                 title="Total de evaluaciones completadas en ${formatearMesLegible(window.mesSeleccionado)}">
                <h3 style="margin: 0; font-size: 16px; opacity: 0.9;">Total Evaluaciones</h3>
                <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${totalEvaluaciones}</div>
                <small style="opacity: 0.8;">${sucursalesCount} sucursales + ${franquiciasCount} franquicias</small>
                <div style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.2); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">📊</div>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; position: relative; cursor: help;"
                 title="Promedio de KPI de todas las evaluaciones del mes. Meta: ≥95% para excelencia">
                <h3 style="margin: 0; font-size: 16px; opacity: 0.9;">KPI Promedio</h3>
                <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${promedioKPI}%</div>
                <small style="opacity: 0.8;">Meta: ≥95%</small>
                <div style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.2); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🎯</div>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; text-align: center;">
                <h3 style="margin: 0; font-size: 16px; opacity: 0.9;">Desglose por Tipo</h3>
                <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                    Sucursales: ${sucursalesCount}<br>
                    Franquicias: ${franquiciasCount}
                </div>
                <small style="opacity: 0.8;">Entidades evaluadas</small>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #28a745; position: relative; cursor: help;" 
                 title="Entidades con rendimiento excelente (95-100%). Cumplen con los más altos estándares de calidad.">
                <h4 style="margin: 0; color: #155724;">Alto Rendimiento</h4>
                <div style="font-size: 24px; font-weight: bold; color: #155724;">${alto}</div>
                <small style="color: #155724;">≥ 95% de cumplimiento</small>
                <div style="position: absolute; top: 8px; right: 8px; color: #155724; font-size: 16px;">🏆</div>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #ffc107; position: relative; cursor: help;"
                 title="Entidades con rendimiento medio (90-94%). Buen desempeño pero pueden mejorar.">
                <h4 style="margin: 0; color: #856404;">Rendimiento Medio</h4>
                <div style="font-size: 24px; font-weight: bold; color: #856404;">${medio}</div>
                <small style="color: #856404;">90% - 94% de cumplimiento</small>
                <div style="position: absolute; top: 8px; right: 8px; color: #856404; font-size: 16px;">⚠️</div>
            </div>
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545; position: relative; cursor: help;"
                 title="Entidades que necesitan mejora urgente (<90%). Requieren atención inmediata.">
                <h4 style="margin: 0; color: #721c24;">Necesita Mejora</h4>
                <div style="font-size: 24px; font-weight: bold; color: #721c24;">${bajo}</div>
                <small style="color: #721c24;">< 90% de cumplimiento</small>
                <div style="position: absolute; top: 8px; right: 8px; color: #721c24; font-size: 16px;">🚨</div>
            </div>
        </div>
    `;
    
    // Ranking de mejores entidades (Top 10)
    if (evaluacionesFiltradas.length > 0) {
        const ranking = evaluacionesFiltradas
            .sort((a, b) => (b.kpi || 0) - (a.kpi || 0))
            .slice(0, 10);
        
        html += `
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h3 style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-trophy" style="color: #ffd700;"></i> Top 10 Ranking
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #0077cc; color: white;">
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">#</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Entidad</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">KPI</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Estado</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Fecha</th>
                                ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') ? '<th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Acciones</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        ranking.forEach((item, index) => {
            const kpiPorcentaje = ((item.kpi || 0) * 100).toFixed(1);
            const estadoColor = item.estado === 'Excelente' ? '#28a745' : item.estado === 'Bueno' ? '#ffc107' : '#dc3545';
            
            html += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 12px; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 12px;">${item.entidad}</td>
                    <td style="padding: 12px; text-align: center; font-weight: bold; color: ${estadoColor}; font-size: 16px;">
                        ${kpiPorcentaje}%
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="color: ${estadoColor}; font-weight: bold;">
                            ${item.estado}
                        </span>
                    </td>
                    <td style="padding: 12px; text-align: center; color: #666;">
                        ${item.fecha}
                    </td>
                    ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') ? `
                    <td style="padding: 12px; text-align: center;">
                        <div class="action-buttons" style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="verEvaluacion('${item.entidadId}', '${item.tipo}')" 
                                    class="btn-action btn-view" 
                                    title="Ver evaluación">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${tienePermiso('editar') ? `
                            <button onclick="editarEvaluacion('${item.entidadId}', '${item.tipo}')" 
                                    class="btn-action btn-edit" 
                                    title="Editar evaluación">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${tienePermiso('eliminar') ? `
                            <button onclick="eliminarEvaluacion('${item.entidadId}', '${item.tipo}')" 
                                    class="btn-action btn-delete" 
                                    title="Eliminar evaluación">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                            <button onclick="verVideo('${item.entidadId}', '${item.tipo}')" 
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
    } else {
        html += `
            <div class="no-data">
                <i class="fas fa-chart-bar" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No hay datos disponibles</h3>
                <p>No se encontraron evaluaciones para ${window.mesSeleccionado} con sus permisos actuales.</p>
                ${tienePermiso('crear') ? '<button onclick="abrirModalNuevaEvaluacion()" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Evaluación</button>' : ''}
            </div>
        `;
    }
    
    // Agregar lista de entidades que necesitan atención
    const entidadesAtencion = evaluacionesFiltradas.filter(evaluacion => {
        const kpiPorcentaje = (evaluacion.kpi * 100);
        return kpiPorcentaje < 95;
    }).sort((a, b) => (a.kpi * 100) - (b.kpi * 100));

    if (entidadesAtencion.length > 0) {
        html += `
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px;">
                <h3 style="color: #dc3545; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🎯</span>
                    Entidades que Requieren Atención (${entidadesAtencion.length})
                </h3>
                <p style="color: #666; margin-bottom: 20px; font-style: italic;">
                    Las siguientes entidades necesitan seguimiento y planes de mejora para alcanzar los estándares de excelencia.
                </p>
                <div style="display: grid; gap: 10px;">
        `;
        
        entidadesAtencion.forEach((entidad) => {
            const kpiPorcentaje = (entidad.kpi * 100);
            const prioridad = kpiPorcentaje < 90 ? 'alta' : 'media';
            const colorFondo = prioridad === 'alta' ? '#ffebee' : '#fff8e1';
            const colorBorde = prioridad === 'alta' ? '#f44336' : '#ff9800';
            const iconoPrioridad = prioridad === 'alta' ? '🚨' : '⚠️';
            const textoPrioridad = prioridad === 'alta' ? 'Prioridad Alta' : 'Prioridad Media';

            html += `
                <div style="background: ${colorFondo}; border-left: 4px solid ${colorBorde}; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                            <span style="font-size: 16px;">${iconoPrioridad}</span>
                            <strong style="color: #333;">${entidad.entidad}</strong>
                            <span style="background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #666;">
                                ${entidad.tipo === 'sucursal' ? 'Sucursal' : 'Franquicia'}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            ${textoPrioridad} • KPI: <strong style="color: ${colorBorde};">${kpiPorcentaje.toFixed(1)}%</strong>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: ${colorBorde}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                            ${entidad.estado}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196f3;">
                    <small style="color: #1976d2;">
                        <strong>💡 Recomendación:</strong> Priorice las entidades con KPI < 90% para planes de acción inmediatos. 
                        Las entidades con KPI 90-94% pueden beneficiarse de capacitación adicional y seguimiento cercano.
                    </small>
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                <h3 style="color: #2e7d32; margin: 0 0 10px 0;">¡Excelente Desempeño!</h3>
                <p style="color: #388e3c; margin: 0; font-size: 16px;">
                    Todas las entidades evaluadas han alcanzado el nivel de excelencia (≥95%). 
                    ¡Felicitaciones por mantener los más altos estándares de calidad!
                </p>
            </div>
        `;
    }
    
    contentContainer.innerHTML = html;
}