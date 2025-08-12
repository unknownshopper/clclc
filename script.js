// ===== SISTEMA DE AUTENTICACIÓN Y CONTROL DE ACCESO =====
let usuarioActual = null;

// Función para iniciar sesión
function iniciarSesion() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorDiv = document.getElementById('loginError');
    
    // Limpiar errores previos
    errorDiv.style.display = 'none';
    
    if (!email || !password) {
        mostrarErrorLogin('Por favor, complete todos los campos');
        return;
    }
    
    // Buscar usuario en la base de datos
    const usuario = window.usuarios.find(u => u.email === email && u.password === password);
    
    if (usuario) {
        usuarioActual = usuario;
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        
        // Ocultar modal de login
        document.getElementById('loginModal').style.display = 'none';
        document.body.classList.remove('logged-out');
        
        // Mostrar información del usuario
        mostrarInfoUsuario();
        
        // Aplicar restricciones basadas en rol
        aplicarRestriccionesPorRol();
        
        // Recargar dashboard con datos filtrados
        cambiarVista('dashboard');
        
        console.log(`Usuario ${usuario.nombre} (${usuario.rol}) ha iniciado sesión`);
    } else {
        mostrarErrorLogin('Email o contraseña incorrectos');
    }
}

// Función para mostrar error de login
function mostrarErrorLogin(mensaje) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
}

// Función para mostrar información del usuario
function mostrarInfoUsuario() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    userName.textContent = usuarioActual.nombre;
    userRole.textContent = usuarioActual.rol;
    userInfo.style.display = 'flex';
}

// Función para cerrar sesión
function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('usuarioActual');
    
    // Ocultar información del usuario
    document.getElementById('userInfo').style.display = 'none';
    
    // Mostrar modal de login
    document.getElementById('loginModal').style.display = 'block';
    document.body.classList.add('logged-out');
    
    // Limpiar campos de login
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
    
    console.log('Sesión cerrada');
}

// Función para verificar si el usuario está autenticado
function verificarAutenticacion() {
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    
    if (usuarioGuardado) {
        usuarioActual = JSON.parse(usuarioGuardado);
        document.getElementById('loginModal').style.display = 'none';
        document.body.classList.remove('logged-out');
        mostrarInfoUsuario();
        aplicarRestriccionesPorRol();
        cambiarVista('dashboard');
        return true;
    } else {
        document.getElementById('loginModal').style.display = 'block';
        document.body.classList.add('logged-out');
        return false;
    }
}

// Event listener para Enter en el formulario de login
document.addEventListener('DOMContentLoaded', function() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                iniciarSesion();
            }
        });
    }
});

// Variables globales
window.mesSeleccionado = '';
window.vistaActual = 'dashboard';
window.evaluaciones = {
    sucursales: {},
    franquicias: {}
};

// Función para obtener el mes anterior
function obtenerMesAnterior() {
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const año = mesAnterior.getFullYear();
    const mes = (mesAnterior.getMonth() + 1).toString().padStart(2, '0');
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
    
    // Aplicar exclusiones si existen
    if (window.parametrosExcluidosPorSucursal && tipo === 'sucursal' && window.parametrosExcluidosPorSucursal[entidadId]) {
        const excluidos = window.parametrosExcluidosPorSucursal[entidadId];
        parametrosAplicables = parametrosAplicables.filter(p => !excluidos.includes(p.nombre));
    }
    
    if (window.parametrosExcluidosPorFranquicia && tipo === 'franquicia' && window.parametrosExcluidosPorFranquicia[entidadId]) {
        const excluidos = window.parametrosExcluidosPorFranquicia[entidadId];
        parametrosAplicables = parametrosAplicables.filter(p => !excluidos.includes(p.nombre));
    }
    
    // Filtrar parámetros que aplican a la entidad
    if (tipo === 'sucursal') {
        parametrosAplicables = parametrosAplicables.filter(p => 
            p.aplicaATodas || (p.sucursalesEspecificas && p.sucursalesEspecificas.includes(entidadId))
        );
    }
    
    const puntajeMaximo = parametrosAplicables.reduce((total, param) => total + param.peso, 0);
    let puntajeObtenido = 0;
    
    parametrosAplicables.forEach(param => {
        if (evaluacion[param.id] !== undefined) {
            puntajeObtenido += parseInt(evaluacion[param.id]) || 0;
        }
    });
    
    return puntajeMaximo > 0 ? Math.round((puntajeObtenido / puntajeMaximo) * 100) : 0;
}

// Función para generar datos de ejemplo
function generarDatosEjemplo() {
    const meses = [window.mesSeleccionado];
    
    // Generar evaluaciones para sucursales
    if (window.sucursales) {
        window.sucursales.filter(s => s.activa).forEach(sucursal => {
            if (!window.evaluaciones.sucursales[sucursal.id]) {
                window.evaluaciones.sucursales[sucursal.id] = {};
            }
            
            meses.forEach(mes => {
                if (!window.evaluaciones.sucursales[sucursal.id][mes]) {
                    const evaluacion = {};
                    let totalObtenido = 0;
                    let totalMaximo = 0;
                    
                    // Obtener parámetros aplicables para esta sucursal
                    let parametrosAplicables = window.parametros || [];
                    
                    // Aplicar exclusiones si existen
                    if (window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[sucursal.id]) {
                        const excluidos = window.parametrosExcluidosPorSucursal[sucursal.id];
                        parametrosAplicables = parametrosAplicables.filter(p => !excluidos.includes(p.nombre));
                    }
                    
                    // Filtrar parámetros que aplican a esta sucursal
                    parametrosAplicables = parametrosAplicables.filter(p => 
                        p.aplicaATodas || (p.sucursalesEspecificas && p.sucursalesEspecificas.includes(sucursal.id))
                    );
                    
                    parametrosAplicables.forEach(param => {
                        // Generar valores aleatorios basados en el peso del parámetro
                        const probabilidadCompleto = Math.max(0.6, 1 - (param.peso / 10));
                        if (Math.random() < probabilidadCompleto) {
                            evaluacion[param.id] = param.peso;
                            totalObtenido += param.peso;
                        } else {
                            const valorParcial = Math.floor(Math.random() * param.peso);
                            evaluacion[param.id] = valorParcial;
                            totalObtenido += valorParcial;
                        }
                        totalMaximo += param.peso;
                    });
                    
                    // Agregar campos requeridos para la tabla
                    evaluacion.totalObtenido = totalObtenido;
                    evaluacion.totalMaximo = totalMaximo;
                    evaluacion.kpi = totalMaximo > 0 ? (totalObtenido / totalMaximo) * 100 : 0;
                    evaluacion.estado = evaluacion.kpi >= 80 ? 'Excelente' : evaluacion.kpi >= 60 ? 'Bueno' : 'Necesita Mejora';
                    evaluacion.created_at = new Date();
                    evaluacion.fechaCreacion = new Date();
                    
                    window.evaluaciones.sucursales[sucursal.id][mes] = evaluacion;
                }
            });
        });
    }
    
    // Generar evaluaciones para franquicias
    if (window.franquicias) {
        window.franquicias.filter(f => f.activa).forEach(franquicia => {
            if (!window.evaluaciones.franquicias[franquicia.id]) {
                window.evaluaciones.franquicias[franquicia.id] = {};
            }
            
            meses.forEach(mes => {
                if (!window.evaluaciones.franquicias[franquicia.id][mes]) {
                    const evaluacion = {};
                    let totalObtenido = 0;
                    let totalMaximo = 0;
                    
                    // Obtener parámetros aplicables para esta franquicia
                    let parametrosAplicables = window.parametros || [];
                    
                    // Aplicar exclusiones si existen
                    if (window.parametrosExcluidosPorFranquicia && window.parametrosExcluidosPorFranquicia[franquicia.id]) {
                        const excluidos = window.parametrosExcluidosPorFranquicia[franquicia.id];
                        parametrosAplicables = parametrosAplicables.filter(p => !excluidos.includes(p.nombre));
                    }
                    
                    parametrosAplicables.forEach(param => {
                        const probabilidadCompleto = Math.max(0.6, 1 - (param.peso / 10));
                        if (Math.random() < probabilidadCompleto) {
                            evaluacion[param.id] = param.peso;
                            totalObtenido += param.peso;
                        } else {
                            const valorParcial = Math.floor(Math.random() * param.peso);
                            evaluacion[param.id] = valorParcial;
                            totalObtenido += valorParcial;
                        }
                        totalMaximo += param.peso;
                    });
                    
                    // Agregar campos requeridos para la tabla
                    evaluacion.totalObtenido = totalObtenido;
                    evaluacion.totalMaximo = totalMaximo;
                    evaluacion.kpi = totalMaximo > 0 ? (totalObtenido / totalMaximo) * 100 : 0;
                    evaluacion.estado = evaluacion.kpi >= 80 ? 'Excelente' : evaluacion.kpi >= 60 ? 'Bueno' : 'Necesita Mejora';
                    evaluacion.created_at = new Date();
                    evaluacion.fechaCreacion = new Date();
                    
                    window.evaluaciones.franquicias[franquicia.id][mes] = evaluacion;
                }
            });
        });
    }
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
    
    // Event listener para cambio de mes
    selector.addEventListener('change', function() {
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
        }
        
        // Siempre actualizar evaluaciones para que los datos estén listos
        renderEvaluaciones();
    });
}

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
    
    // Recopilar todos los KPIs de las evaluaciones filtradas
    let kpis = [];
    let totalEvaluaciones = evaluacionesFiltradas.length;
    
    evaluacionesFiltradas.forEach(eval => {
        if (eval.kpi !== undefined) {
            kpis.push(eval.kpi * 100); // Convertir a porcentaje
        }
    });
    
    // Calcular estadísticas
    const promedioKPI = kpis.length > 0 ? Math.round(kpis.reduce((a, b) => a + b, 0) / kpis.length) : 0;
    const alto = kpis.filter(k => k >= 80).length;
    const medio = kpis.filter(k => k >= 60 && k < 80).length;
    const bajo = kpis.filter(k => k < 60).length;
    
    html += `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; text-align: center;">
                <h3 style="margin: 0; font-size: 16px; opacity: 0.9;">Total Evaluaciones</h3>
                <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${totalEvaluaciones}</div>
                <small style="opacity: 0.8;">Completadas este mes</small>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white; text-align: center;">
                <h3 style="margin: 0; font-size: 16px; opacity: 0.9;">KPI Promedio</h3>
                <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${promedioKPI}%</div>
                <small style="opacity: 0.8;">Rendimiento general</small>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; text-align: center;">
                <h3 style="margin: 0; font-size: 16px; opacity: 0.9;">Entidades Evaluadas</h3>
                <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${totalEvaluaciones}</div>
                <small style="opacity: 0.8;">Con datos disponibles</small>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #28a745;">
                <h4 style="margin: 0; color: #155724;">Alto Rendimiento</h4>
                <div style="font-size: 24px; font-weight: bold; color: #155724;">${alto}</div>
                <small style="color: #155724;">≥ 80% de cumplimiento</small>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #ffc107;">
                <h4 style="margin: 0; color: #856404;">Rendimiento Medio</h4>
                <div style="font-size: 24px; font-weight: bold; color: #856404;">${medio}</div>
                <small style="color: #856404;">60% - 79% de cumplimiento</small>
            </div>
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545;">
                <h4 style="margin: 0; color: #721c24;">Necesita Mejora</h4>
                <div style="font-size: 24px; font-weight: bold; color: #721c24;">${bajo}</div>
                <small style="color: #721c24;">< 60% de cumplimiento</small>
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
                <h3 style="color: #0077cc; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-trophy" style="color: #ffd700;"></i> Top 10 Ranking
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">#</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Entidad</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Tipo</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">KPI</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        ranking.forEach((item, index) => {
            const kpiPorcentaje = ((item.kpi || 0) * 100).toFixed(1);
            const estadoColor = item.estado === 'Excelente' ? '#28a745' : 
                               item.estado === 'Bueno' ? '#ffc107' : '#dc3545';
            
            html += `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 12px;">${item.entidad}</td>
                    <td style="padding: 12px;">
                        <span style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${item.tipo}
                        </span>
                    </td>
                    <td style="padding: 12px; text-align: center; font-weight: bold;">${kpiPorcentaje}%</td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="color: ${estadoColor}; font-weight: bold;">
                            ${item.estado}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
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
    
    contentContainer.innerHTML = html;
    
    // Aplicar restricciones de rol después de renderizar
    aplicarRestriccionesPorRol();
}

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
                    <thead style="background: #0077cc; color: white;">
                        <tr>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Tipo</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Entidad</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">KPI</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Estado</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Fecha</th>
                            ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') ? '<th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Acciones</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        evaluacionesFiltradas.forEach((evaluacion, index) => {
            const kpiPorcentaje = ((evaluacion.kpi || 0) * 100).toFixed(1);
            const colorEstado = evaluacion.kpi >= 0.8 ? '#28a745' : evaluacion.kpi >= 0.6 ? '#ffc107' : '#dc3545';
            const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            
            // Formatear tipo para mostrar
            const tipoMostrar = evaluacion.tipo === 'sucursal' ? 'Sucursal' : 'Franquicia';
            
            html += `
                <tr style="background: ${bgColor};">
                    <td style="padding: 12px; border-bottom: 1px solid #ddd;">
                        <span style="background: ${evaluacion.tipo === 'sucursal' ? '#007bff' : '#6f42c1'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                            ${tipoMostrar}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; font-weight: 500;">
                        ${evaluacion.entidad}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: ${colorEstado}; font-size: 16px;">
                        ${kpiPorcentaje}%
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">
                        <span style="color: ${colorEstado}; font-weight: bold;">
                            ${evaluacion.estado}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; color: #666;">
                        ${evaluacion.fecha}
                    </td>
                    ${tienePermiso('ver') || tienePermiso('editar') || tienePermiso('eliminar') ? `
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
    aplicarRestriccionesPorRol();
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
        <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border: 1px solid #0077cc; border-radius: 5px; text-align: center;">
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
    const kpi = totalMaximo > 0 ? Math.round((totalObtenido / totalMaximo) * 100) : 0;
    
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
        estado: kpi >= 85 ? 'Excelente' : kpi >= 70 ? 'Bueno' : 'Necesita mejora'
    };
    
    try {
        // Guardar en Firebase
        if (window.firebaseDB) {
            const firebaseId = await window.firebaseDB.guardarEvaluacion(evaluacionData);
            evaluacionData.firebaseId = firebaseId;
            console.log('Evaluación guardada en Firebase exitosamente');
        }
        
        // Guardar también en almacenamiento local como respaldo
        if (tipo === 'sucursal') {
            if (!window.evaluaciones.sucursales[entidadId]) {
                window.evaluaciones.sucursales[entidadId] = {};
            }
            window.evaluaciones.sucursales[entidadId][window.mesSeleccionado] = evaluacion;
        } else if (tipo === 'franquicia') {
            if (!window.evaluaciones.franquicias[entidadId]) {
                window.evaluaciones.franquicias[entidadId] = {};
            }
            window.evaluaciones.franquicias[entidadId][window.mesSeleccionado] = evaluacion;
        }
        
        // Cerrar modal
        cerrarModalEvaluacion();
        
        // Actualizar vista actual
        if (window.vistaActual === 'dashboard') {
            renderDashboard();
        } else if (window.vistaActual === 'matriz') {
            renderMatriz();
        } else if (window.vistaActual === 'evaluaciones') {
            renderEvaluaciones();
        }
        
        // También actualizar la sección de evaluaciones para mostrar la nueva evaluación
        renderEvaluaciones();
        
        // Mostrar mensaje de éxito
        alert(`Evaluación guardada exitosamente para ${entidadInfo?.nombre} - ${formatearMesLegible(window.mesSeleccionado)}\nKPI: ${kpi}% (${evaluacionData.estado})`);
        
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

// Función para renderizar matriz
function renderMatriz() {
    console.log('Renderizando matriz para mes:', window.mesSeleccionado);
    
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
    
    // Crear tabla de matriz
    html += `
        <div style="overflow-x: auto;">
            <table class="matriz-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Entidad</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tipo</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">KPI General</th>
    `;
    
    // Agregar columnas para cada parámetro (primeros 5 para no sobrecargar)
    if (window.parametros) {
        window.parametros.slice(0, 5).forEach(param => {
            html += `<th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">${param.nombre}</th>`;
        });
    }
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Generar filas para cada entidad
    entidades.forEach(entidad => {
        const tipoLower = entidad.tipo.toLowerCase();
        const mes = window.mesSeleccionado;
        
        // Obtener evaluación
        const evaluacion = tipoLower === 'sucursal' ? 
            window.evaluaciones?.sucursales?.[entidad.id]?.[mes]
            : window.evaluaciones?.franquicias?.[entidad.id]?.[mes];
        
        let kpiGeneral = 'N/A';
        if (evaluacion && evaluacion.totalObtenido !== undefined && evaluacion.totalMaximo !== undefined) {
            const porcentaje = evaluacion.totalMaximo > 0 ? 
                Math.round((evaluacion.totalObtenido / evaluacion.totalMaximo) * 100) : 0;
            kpiGeneral = `${porcentaje}%`;
        }
        
        html += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${entidad.nombre}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${entidad.tipo}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${kpiGeneral}</td>
        `;
        
        // Mostrar estado de cada parámetro
        if (window.parametros) {
            window.parametros.slice(0, 5).forEach(param => {
                let estado = 'N/A';
                let color = '#999';
                
                if (evaluacion && evaluacion[param.id] !== undefined) {
                    const valor = parseInt(evaluacion[param.id]);
                    if (valor === param.peso) {
                        estado = '✓';
                        color = '#28a745';
                    } else if (valor > 0) {
                        estado = '◐';
                        color = '#ffc107';
                    } else {
                        estado = '✗';
                        color = '#dc3545';
                    }
                }
                
                html += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${color}; font-weight: bold;">${estado}</td>`;
            });
        }
        
        html += '</tr>';
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p><strong>Leyenda:</strong> ✓ = Completo | ◐ = Parcial | ✗ = No cumple | N/A = Sin evaluar</p>
        </div>
    `;
    
    document.getElementById('matriz').innerHTML = html;
}

// Función para renderizar gráficas
function renderGraficas() {
    console.log('Renderizando gráficas para mes:', window.mesSeleccionado);
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #0077cc; margin-bottom: 10px; text-align: center;">
                Gráficas de Rendimiento - ${formatearMesLegible(window.mesSeleccionado)}
            </h2>
            <p style="text-align: center; color: #666; margin-bottom: 20px;">
                Visualización de KPIs y tendencias
            </p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="text-align: center; margin-bottom: 15px;">KPIs por Entidad</h3>
                <canvas id="graficoKPIs" width="400" height="300"></canvas>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="text-align: center; margin-bottom: 15px;">Distribución de Rendimiento</h3>
                <canvas id="graficoDistribucion" width="400" height="300"></canvas>
            </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="text-align: center; margin-bottom: 15px;">Resumen Estadístico</h3>
            <div id="resumenEstadistico"></div>
        </div>
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
    
    // Obtener datos de KPIs
    let datosKPI = [];
    let entidades = [];
    
    // Recopilar datos de sucursales
    if (window.sucursales) {
        window.sucursales.filter(s => s.activa).forEach(sucursal => {
            const evaluacion = window.evaluaciones?.sucursales?.[sucursal.id]?.[window.mesSeleccionado];
            if (evaluacion && evaluacion.totalObtenido !== undefined && evaluacion.totalMaximo !== undefined) {
                const kpi = evaluacion.totalMaximo > 0 ? 
                    Math.round((evaluacion.totalObtenido / evaluacion.totalMaximo) * 100) : 0;
                datosKPI.push(kpi);
                entidades.push(sucursal.nombre);
            }
        });
    }
    
    // Recopilar datos de franquicias
    if (window.franquicias) {
        window.franquicias.filter(f => f.activa).forEach(franquicia => {
            const evaluacion = window.evaluaciones?.franquicias?.[franquicia.id]?.[window.mesSeleccionado];
            if (evaluacion && evaluacion.totalObtenido !== undefined && evaluacion.totalMaximo !== undefined) {
                const kpi = evaluacion.totalMaximo > 0 ? 
                    Math.round((evaluacion.totalObtenido / evaluacion.totalMaximo) * 100) : 0;
                datosKPI.push(kpi);
                entidades.push(franquicia.nombre);
            }
        });
    }
    
    // Dibujar gráfico de barras simple
    dibujarGraficoBarras(canvas1, entidades, datosKPI);
    
    // Dibujar gráfico de distribución
    dibujarGraficoDistribucion(canvas2, datosKPI);
}

// Función para dibujar gráfico de barras
function dibujarGraficoBarras(canvas, labels, data) {
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
        return;
    }
    
    const maxValue = Math.max(...data, 100);
    const barWidth = (width - 60) / data.length;
    const maxBarHeight = height - 60;
    
    // Dibujar barras
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * maxBarHeight;
        const x = 30 + index * barWidth;
        const y = height - 30 - barHeight;
        
        // Color según rendimiento
        let color = '#dc3545'; // Rojo para bajo
        if (value >= 80) color = '#28a745'; // Verde para alto
        else if (value >= 60) color = '#ffc107'; // Amarillo para medio
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 5, barHeight);
        
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
        return;
    }
    
    // Categorizar datos
    let alto = data.filter(d => d >= 80).length;
    let medio = data.filter(d => d >= 60 && d < 80).length;
    let bajo = data.filter(d => d < 60).length;
    
    const total = alto + medio + bajo;
    if (total === 0) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    // Dibujar sectores
    let startAngle = 0;
    
    // Alto (Verde)
    if (alto > 0) {
        const angle = (alto / total) * 2 * Math.PI;
        ctx.fillStyle = '#28a745';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fill();
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
    }
    
    // Leyenda
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#28a745';
    ctx.fillRect(20, height - 60, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText(`Alto (≥80%): ${alto}`, 40, height - 48);
    
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(20, height - 40, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText(`Medio (60-79%): ${medio}`, 40, height - 28);
    
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(20, height - 20, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText(`Bajo (<60%): ${bajo}`, 40, height - 8);
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
    const alto = kpis.filter(k => k >= 80).length;
    const medio = kpis.filter(k => k >= 60 && k < 80).length;
    const bajo = kpis.filter(k => k < 60).length;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h4 style="margin: 0; color: #0077cc;">Promedio General</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${promedio.toFixed(1)}%</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h4 style="margin: 0; color: #28a745;">Mejor Rendimiento</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${maximo}%</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h4 style="margin: 0; color: #dc3545;">Menor Rendimiento</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${minimo}%</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h4 style="margin: 0; color: #666;">Total Evaluadas</h4>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${kpis.length}</div>
            </div>
        </div>
        
        <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 5px;">
                <strong style="color: #155724;">Alto Rendimiento</strong><br>
                <span style="font-size: 18px;">${alto} entidades (≥80%)</span>
            </div>
            <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 5px;">
                <strong style="color: #856404;">Rendimiento Medio</strong><br>
                <span style="font-size: 18px;">${medio} entidades (60-79%)</span>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 5px;">
                <strong style="color: #721c24;">Bajo Rendimiento</strong><br>
                <span style="font-size: 18px;">${bajo} entidades (<60%)</span>
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
        window.evaluaciones = { sucursales: {}, franquicias: {} };
    }
    
    // Cargar evaluaciones desde Firebase primero
    if (window.firebaseDB) {
        try {
            console.log('Cargando evaluaciones desde Firebase...');
            await window.firebaseDB.cargarEvaluaciones();
            console.log('Evaluaciones cargadas desde Firebase exitosamente');
        } catch (error) {
            console.error('Error cargando desde Firebase:', error);
        }
    }
    
    // Generar datos de muestra solo si no hay datos en Firebase
    const evaluacionesExistentes = obtenerEvaluacionesDelMes(window.mesSeleccionado);
    if (evaluacionesExistentes.length === 0) {
        console.log('No hay evaluaciones en Firebase, generando datos de muestra...');
        generarDatosMuestra();
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
        aplicarRestriccionesPorRol();
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
                ${tienePermiso('editar') || tienePermiso('eliminar') ? `
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
    aplicarRestriccionesPorRol();
}

// Función para cargar entidades en el modal de evaluación
function cargarEntidadesEvaluacion() {
    const selectEntidad = document.getElementById('entidad-evaluacion');
    if (!selectEntidad) return;
    
    selectEntidad.innerHTML = '<option value="">Seleccione una entidad...</option>';
    
    if (!usuarioActual) {
        console.log('Usuario no autenticado, no se cargan entidades');
        return;
    }
    
    const rol = usuarioActual.rol;
    
    // Filtrar entidades según el rol del usuario
    if (rol === 'admin' || rol === 'dg') {
        // Admin y DG pueden ver sucursales
        if (window.sucursales) {
            window.sucursales.forEach(sucursal => {
                if (sucursal.activa) {
                    const option = document.createElement('option');
                    option.value = `sucursal-${sucursal.id}`;
                    option.textContent = `${sucursal.nombre} (Sucursal)`;
                    selectEntidad.appendChild(option);
                }
            });
        }
    }
    
    if (rol === 'admin' || rol === 'dg' || rol === 'franquicias') {
        // Admin, DG y Franquicias pueden ver franquicias
        if (window.franquicias) {
            window.franquicias.forEach(franquicia => {
                if (franquicia.activa) {
                    const option = document.createElement('option');
                    option.value = `franquicia-${franquicia.id}`;
                    option.textContent = `${franquicia.nombre} (Franquicia)`;
                    selectEntidad.appendChild(option);
                }
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
    console.log(`Ver evaluación: ${entidadId} (${tipo})`);
    
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
    const kpi = calcularPorcentajeEvaluacion(entidadId, tipo, evaluacion);
    const estado = kpi >= 80 ? 'Excelente' : kpi >= 60 ? 'Bueno' : 'Necesita Mejora';
    
    let detallesHtml = `
        <div class="modal" id="modalVerEvaluacion" style="display: block; z-index: 10001;">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2><i class="fas fa-eye"></i> Detalles de Evaluación</h2>
                    <button onclick="cerrarModalVerEvaluacion()" class="btn-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                            <h3>Información General</h3>
                            <p><strong>Entidad:</strong> ${entidad.nombre}</p>
                            <p><strong>Tipo:</strong> ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
                            <p><strong>Mes:</strong> ${formatearMesLegible(window.mesSeleccionado)}</p>
                            <p><strong>Fecha:</strong> ${evaluacion.fechaCreacion || 'N/A'}</p>
                        </div>
                        <div>
                            <h3>Resultados</h3>
                            <p><strong>KPI:</strong> <span style="color: ${kpi >= 80 ? '#28a745' : kpi >= 60 ? '#ffc107' : '#dc3545'}; font-weight: bold;">${kpi.toFixed(1)}%</span></p>
                            <p><strong>Estado:</strong> <span style="color: ${kpi >= 80 ? '#28a745' : kpi >= 60 ? '#ffc107' : '#dc3545'}; font-weight: bold;">${estado}</span></p>
                            <p><strong>Total Obtenido:</strong> ${evaluacion.totalObtenido || 0}</p>
                            <p><strong>Total Máximo:</strong> ${evaluacion.totalMaximo || 0}</p>
                        </div>
                    </div>
                    
                    <h3>Parámetros Evaluados</h3>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 8px; border: 1px solid #ddd;">Parámetro</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Valor</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Máximo</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    if (evaluacion.parametros) {
        Object.keys(evaluacion.parametros).forEach(parametroId => {
            const valor = evaluacion.parametros[parametroId];
            const parametro = window.parametros?.find(p => p.id === parametroId);
            const nombre = parametro ? parametro.nombre : parametroId;
            const maximo = parametro ? parametro.valor : 'N/A';
            
            detallesHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${nombre}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${valor}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${maximo}</td>
                </tr>
            `;
        });
    }
    
    detallesHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    ${tienePermiso('editar') ? `<button onclick="editarEvaluacion('${entidadId}', '${tipo}')" class="btn btn-primary"><i class="fas fa-edit"></i> Editar</button>` : ''}
                    <button onclick="cerrarModalVerEvaluacion()" class="btn btn-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', detallesHtml);
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
    const tipoEntidad = tipo === 'sucursal' ? 'sucursales' : 'franquicias';
    const evaluacionExistente = window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[window.mesSeleccionado];
    
    if (!evaluacionExistente) {
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
        datosOriginales: { ...evaluacionExistente },
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
    modalTitle.textContent = `Editar Evaluación - ${entidadInfo?.nombre || entidadId}`;
    
    // Cargar los parámetros para esta entidad específica
    const entidadValue = `${tipo}-${entidadId}`;
    cargarParametrosEvaluacion(entidadValue);
    
    // Esperar un poco para que se carguen los parámetros y luego pre-llenar los valores
    setTimeout(() => {
        precargarValoresEvaluacion(evaluacionExistente.parametros);
        
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
    const tipoEntidad = tipo === 'sucursal' ? 'sucursales' : 'franquicias';
    
    // Verificar si existe la evaluación
    const evaluacionExiste = window.evaluaciones?.[tipoEntidad]?.[entidadId]?.[window.mesSeleccionado];
    console.log(`Evaluación existe:`, evaluacionExiste);
    console.log(`Estructura evaluaciones:`, window.evaluaciones);
    
    if (!evaluacionExiste) {
        alert(`No se encontró la evaluación de ${nombreEntidad} para ${formatearMesLegible(window.mesSeleccionado)}`);
        return;
    }
    
    if (confirm(`¿Está seguro de que desea eliminar la evaluación de ${nombreEntidad} para ${formatearMesLegible(window.mesSeleccionado)}?`)) {
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
function verVideo(entidadId, tipo) {
    console.log(`Ver video: ${entidadId} (${tipo})`);
    
    const entidad = tipo === 'sucursal' ? 
        window.sucursales.find(s => s.id === entidadId)
        : window.franquicias.find(f => f.id === entidadId);
    
    const nombreEntidad = entidad ? entidad.nombre : entidadId;
    
    // Crear modal para mostrar video
    const videoHtml = `
        <div class="modal" id="modalVideo" style="display: block; z-index: 10001;">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2><i class="fas fa-video"></i> Video de Evaluación - ${nombreEntidad}</h2>
                    <button onclick="cerrarModalVideo()" class="btn-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 20px;">
                        <p style="margin-bottom: 20px; color: #666;">
                            Video de evaluación para <strong>${nombreEntidad}</strong> - ${formatearMesLegible(window.mesSeleccionado)}
                        </p>
                        
                        <!-- Placeholder para video - aquí podrías integrar con YouTube, Vimeo, etc. -->
                        <div style="background: #f8f9fa; border: 2px dashed #ddd; padding: 60px; border-radius: 8px; margin: 20px 0;">
                            <i class="fas fa-video" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                            <h3 style="color: #666; margin-bottom: 10px;">Video no disponible</h3>
                            <p style="color: #999;">
                                El video de evaluación para esta entidad aún no ha sido subido.<br>
                                <small>Entidad: ${entidadId} | Tipo: ${tipo} | Mes: ${window.mesSeleccionado}</small>
                            </p>
                            
                            ${tienePermiso('editar') ? `
                            <button onclick="subirVideo('${entidadId}', '${tipo}')" 
                                    style="background: #6f42c1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 15px;">
                                <i class="fas fa-upload"></i> Subir Video
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="cerrarModalVideo()" class="btn btn-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', videoHtml);
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
    return window.evaluaciones?.[tipo + 's']?.[entidadId]?.[mes];
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
                        estado: kpiPorcentaje >= 80 ? 'Excelente' : kpiPorcentaje >= 60 ? 'Bueno' : 'Necesita Mejora',
                        fecha: fechaFormateada,
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
                if (franquicia) {
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
                        entidad: franquicia.nombre,
                        entidadId: franquiciaId,
                        kpi: kpiPorcentaje / 100, // Guardar como decimal para consistencia
                        estado: kpiPorcentaje >= 80 ? 'Excelente' : kpiPorcentaje >= 60 ? 'Bueno' : 'Necesita Mejora',
                        fecha: fechaFormateada,
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

// ===== FUNCIONES DE CONTROL DE ACCESO POR ROL =====

// Función para aplicar restricciones basadas en el rol del usuario
function aplicarRestriccionesPorRol() {
    if (!usuarioActual) return;
    
    const rol = usuarioActual.rol;
    
    // Ocultar/mostrar botones según el rol
    const btnNuevaEvaluacion = document.querySelector('[onclick="abrirModalNuevaEvaluacion()"]');
    const botonesEditar = document.querySelectorAll('.btn-edit, .btn-editar');
    const botonesEliminar = document.querySelectorAll('.btn-delete, .btn-eliminar');
    
    if (rol === 'admin') {
        // Admin puede hacer todo
        if (btnNuevaEvaluacion) btnNuevaEvaluacion.style.display = 'inline-block';
        botonesEditar.forEach(btn => btn.style.display = 'inline-flex');
        botonesEliminar.forEach(btn => btn.style.display = 'inline-flex');
    } else {
        // Otros roles no pueden crear, editar o eliminar
        if (btnNuevaEvaluacion) btnNuevaEvaluacion.style.display = 'none';
        botonesEditar.forEach(btn => btn.style.display = 'none');
        botonesEliminar.forEach(btn => btn.style.display = 'none');
    }
    
    console.log(`Restricciones aplicadas para rol: ${rol}`);
    console.log(`Botones editar encontrados: ${botonesEditar.length}`);
    console.log(`Botones eliminar encontrados: ${botonesEliminar.length}`);
}

// Función para filtrar datos según el rol del usuario
function filtrarDatosPorRol(evaluaciones) {
    if (!usuarioActual) return [];
    
    const rol = usuarioActual.rol;
    
    switch (rol) {
        case 'admin':
            // Admin puede ver todo
            return evaluaciones;
            
        case 'gop':
            // Gop solo puede ver evaluaciones de GOP
            return evaluaciones.filter(eval => {
                return eval.tipo === 'gop' || 
                       (eval.entidadId && eval.entidadId.toLowerCase().includes('gop'));
            });
            
        case 'franquicias':
            // Franquicias solo puede ver evaluaciones de franquicias
            return evaluaciones.filter(eval => eval.tipo === 'franquicia');
            
        case 'dg':
            // DG puede ver sucursales y franquicias
            return evaluaciones.filter(eval => 
                eval.tipo === 'sucursal' || eval.tipo === 'franquicia'
            );
            
        default:
            return [];
    }
}

// Función para verificar permisos de acción
function tienePermiso(accion) {
    if (!usuarioActual) return false;
    
    const rol = usuarioActual.rol;
    
    switch (accion) {
        case 'crear':
        case 'editar':
        case 'eliminar':
            return rol === 'admin';
        case 'ver':
            return true; // Todos pueden ver (pero con filtros)
        default:
            return false;
    }
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
    
    console.log('=== FIN VALIDACIÓN ===');
}

// ===== FUNCIONES AUXILIARES PARA MANEJO DE DATOS =====
