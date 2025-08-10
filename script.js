// --- Datos base (sucursales, franquicias, parámetros) ---
const sucursales = [
    "altabrisa", "americas", "centro", "angeles", "galerias", "olmeca", "usuma",
    "pista", "guayabal", "crystal", "deportiva", "walmart-deportiva",
    "walmart-universidad", "walmart-carrizal", "movil-deportiva", "movil-la-venta"
];
const franquicias = [
    "via2", "citycenter", "cardenas", "paraiso", "dosbocas", "cumuapa", "cunduacan", "jalpa", "cd-carmen"
];
const parametros = [
    "jardineras_macetas", "puertas_vidrios", "musica_volumen", "banos_estado",
    "tableta", "atencion_mesa", "mesas_sillas_limpieza", "mesas_sillas_estado",
    "basura_estado", "piso_limpieza", "barra_limpieza", "clima_funcionando", "tiempo_fila"
];

// --- Generador de evaluaciones DEMO (pobla todos los parámetros actuales) ---
function generarEvaluacion(ids) {
    return ids.map(id => {
        let evaluacion = { id, nombre: id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) };
        // Usar window.parametros para poblar todos los parámetros
        (Array.isArray(window.parametros) ? window.parametros : []).forEach(p => evaluacion[p.id] = 100);
        return evaluacion;
    });
}

const evaluacionesSucursales = generarEvaluacion(sucursales);
const evaluacionesFranquicias = generarEvaluacion(franquicias);

// --- Meses disponibles (puedes extraerlos de video_links.js si lo deseas) ---
const mesesDisponibles = [
    "2025-07", "2025-08", "2025-09"
];

// --- Obtener mes actual en formato YYYY-MM ---
function obtenerMesActual() {
    const hoy = new Date();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    return `${hoy.getFullYear()}-${mes}`;
}

let mesSeleccionado = obtenerMesActual();
if (!mesesDisponibles.includes(mesSeleccionado)) {
    mesSeleccionado = mesesDisponibles[0]; // fallback a primer mes disponible si no hay datos del actual
}

// --- Mostrar nombre de mes en selector ---
function poblarSelectorMes() {
    const selector = document.getElementById('mes-selector');
    if (!selector) return;
    selector.innerHTML = '';
    const mesesNombres = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    mesesDisponibles.forEach(mes => {
        const [anio, mesNum] = mes.split('-');
        const nombreMes = mesesNombres[parseInt(mesNum, 10) - 1];
        const option = document.createElement('option');
        option.value = mes;
        option.textContent = `${nombreMes} ${anio}`;
        if (mes === mesSeleccionado) option.selected = true;
        selector.appendChild(option);
    });
    selector.onchange = e => {
        mesSeleccionado = e.target.value;
        renderDashboard();
        renderGraficas();
        // Aquí podrías refrescar matriz y gráficas si lo deseas
    };
}

// --- Dashboard (KPIs) ---
function renderDashboard() {
    // Verificar que el contenedor dashboard existe
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) {
        console.warn('No se encontró el contenedor #dashboard en el DOM.');
        return;
    }
    const totalSuc = window.sucursales.length;
    const totalFranq = window.franquicias.length;
    const promedioSuc = 100; // Demo
    const promedioFranq = 100; // Demo
    const sucursalDestacada = window.sucursales[0]?.nombre || '-';
    const franquiciaDestacada = window.franquicias[0]?.nombre || '-';

    dashboard.innerHTML = `
        <div class="mes-boton-container" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div class="mes-selector-container">
                <label for="mes-selector">Mes de evaluación:</label>
                <select id="mes-selector"></select>
            </div>
            <button id="btn-nueva-evaluacion" style="padding:8px 18px;background:#0077cc;color:#fff;border:none;border-radius:4px;font-size:16px;cursor:pointer;">Nueva evaluación</button>
        </div>
        <div class="kpi-box">
            <div class="kpi-title">Sucursales activas</div>
            <div class="kpi-value">${totalSuc}</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-title">Franquicias activas</div>
            <div class="kpi-value">${totalFranq}</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-title">Promedio sucursales</div>
            <div class="kpi-value">${promedioSuc}%</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-title">Promedio franquicias</div>
            <div class="kpi-value">${promedioFranq}%</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-title">Sucursal destacada</div>
            <div class="kpi-value" style="font-size:1.3em;">${sucursalDestacada}</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-title">Franquicia destacada</div>
            <div class="kpi-value" style="font-size:1.3em;">${franquiciaDestacada}</div>
        </div>
    `;
    poblarSelectorMes();
    const btn = document.getElementById('btn-nueva-evaluacion');
    if (btn) {
        btn.onclick = nuevaEvaluacion;
        console.log('Evento onclick asignado correctamente a btn-nueva-evaluacion');
    } else {
        console.warn('No se pudo asignar el evento: btn-nueva-evaluacion no existe');
    }
}

function nuevaEvaluacion() {
    document.getElementById('modal-nueva-evaluacion').style.display = 'flex';
    poblarSelectorEntidadEvaluacion();
    document.getElementById('parametros-evaluacion-container').innerHTML = '';
    document.getElementById('btn-guardar-evaluacion').style.display = 'none';
}

function cerrarModalEvaluacion() {
    document.getElementById('modal-nueva-evaluacion').style.display = 'none';
}

// Llenar selector de sucursal/franquicia
function poblarSelectorEntidadEvaluacion() {
    const selector = document.getElementById('select-entidad-evaluacion');
    if (!selector) return;
    selector.innerHTML = '<option value="">Selecciona una opción</option>';
    window.sucursales.forEach(s => {
        selector.innerHTML += `<option value="sucursal-${s.id}">Sucursal - ${s.nombre}</option>`;
    });
    window.franquicias.forEach(f => {
        selector.innerHTML += `<option value="franquicia-${f.id}">Franquicia - ${f.nombre}</option>`;
    });
    selector.onchange = function(e) {
        const val = e.target.value;
        if (val) {
            let entidad, tipo;
            if (val.startsWith('sucursal-')) {
                tipo = 'sucursal';
                entidad = window.sucursales.find(s => 'sucursal-' + s.id === val);
            } else {
                tipo = 'franquicia';
                entidad = window.franquicias.find(f => 'franquicia-' + f.id === val);
            }
            poblarParametrosEvaluacion(entidad.id);
        } else {
            document.getElementById('parametros-evaluacion-container').innerHTML = '';
            document.getElementById('total-puntos-evaluacion').textContent = 'Total de puntos: 0';
            document.getElementById('btn-guardar-evaluacion').style.display = 'none';
        }
    };
}

// Mostrar parámetros filtrados según selección
function mostrarParametrosEvaluacion() {
    const val = document.getElementById('select-entidad-evaluacion').value;
    if (!val) {
        document.getElementById('parametros-evaluacion-container').innerHTML = '';
        document.getElementById('btn-guardar-evaluacion').style.display = 'none';
        return;
    }
    let entidad, tipo;
    if (val.startsWith('sucursal-')) {
        tipo = 'sucursal';
        entidad = window.sucursales.find(s => 'sucursal-' + s.id === val);
    } else {
        tipo = 'franquicia';
        entidad = window.franquicias.find(f => 'franquicia-' + f.id === val);
    }
    poblarParametrosEvaluacion(entidad.id);
}

function poblarParametrosEvaluacion(entidadId) {
    // Obtener parámetros excluidos para la entidad
    const excluidos = (window.parametrosExcluidosPorSucursal && window.parametrosExcluidosPorSucursal[entidadId]) || [];
    // Filtrar parámetros según exclusión
    const parametros = (window.definirParametros || window.parametros || []).filter(p => !excluidos.includes(p.nombre));
    let html = '<h4>Parámetros de evaluación:</h4><ul>';
    parametros.forEach((p, i) => {
        html += `<li>
          <label>
            <span style='color:#888;font-weight:400;margin-right:8px;'>${i + 1}.</span>
            <input type="checkbox" class="parametro-checkbox" data-peso="${p.peso}" name="parametro-evaluacion" value="${p.nombre}" checked>
            ${p.nombre} <span style='color:#0077cc;font-size:0.97em;font-weight:500;'>(+${p.peso})</span>
          </label>
        </li>`;
    });
    html += '</ul>';
    document.getElementById('parametros-evaluacion-container').innerHTML = html;
    document.getElementById('btn-guardar-evaluacion').style.display = 'inline-block';
    actualizarTotalPuntosEvaluacion();
    // Asignar eventos para actualizar el total en tiempo real
    document.querySelectorAll('.parametro-checkbox').forEach(cb => {
        cb.addEventListener('change', actualizarTotalPuntosEvaluacion);
    });
}

function actualizarTotalPuntosEvaluacion() {
    let total = 0;
    document.querySelectorAll('.parametro-checkbox:checked').forEach(cb => {
        total += parseInt(cb.getAttribute('data-peso')) || 0;
    });
    document.getElementById('total-puntos-evaluacion').textContent = `Total de puntos: ${total}`;
}

// Función para manejar los cambios en los checkboxes de parámetros
function actualizarValorParametro(checkbox) {
    const paramId = checkbox.getAttribute('data-param-id');
    const peso = parseInt(checkbox.getAttribute('data-peso'));
    const isChecked = checkbox.checked;
    const hiddenInput = document.getElementById(`valor-param-${paramId}`);
    
    // Asignar el valor según si está marcado o no
    const valor = isChecked ? peso : 0;
    
    // Actualizar el valor del input oculto
    hiddenInput.value = valor;
    
    // Actualizar el total de puntos en tiempo real
    actualizarTotalPuntosEvaluacion();
}

// --- Navegación de tabs ---
document.addEventListener('DOMContentLoaded', function() {
    renderDashboard();

    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.tab-section');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            sections.forEach(sec => sec.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.dataset.section).style.display = 'block';
            if (btn.dataset.section === 'graficas') renderGrafica();
            if (btn.dataset.section === 'evaluaciones') renderEvaluaciones();
            if (btn.dataset.section === 'matriz') renderMatriz();
            if (btn.dataset.section === 'dashboard') renderDashboard();
        });
    });
    tabs[0].classList.add('active'); // Por defecto dashboard
    sections[0].style.display = 'block'; // Asegura que el dashboard se muestre al inicio
});

// --- Matriz de evaluación (dinámica: muestra TODOS los parámetros definidos) ---
function renderMatriz() {
    const todosLosParametros = Array.isArray(window.parametros) ? window.parametros : [];

    // --- Sucursales ---
    let html = `<h2>Matriz de Evaluación (Sucursales)</h2><table><thead><tr><th>Parámetro</th>`;
    sucursales.forEach(s => html += `<th>${s.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</th>`);
    html += `</tr></thead><tbody>`;
    todosLosParametros.forEach(param => {
        html += `<tr><td>${param.nombre}</td>`;
        sucursales.forEach(suc => {
            const excluidos = window.obtenerParametrosExcluidos ? window.obtenerParametrosExcluidos(suc) : [];
            if (excluidos.includes(param.nombre)) {
                html += `<td style="background-color: #222; color: #fff">&nbsp;</td>`;
            } else {
                const evalSuc = evaluacionesSucursales.find(e => e.id === suc);
                const calif = evalSuc ? evalSuc[param.id] ?? null : null;
                const valor = calif !== null ? Math.round((calif / 100) * (param.peso || 1)) : '-';
                html += `<td>${valor}</td>`;
            }
        });
        html += `</tr>`;
    });
    // Fila de suma y porcentaje
    html += `<tr style='font-weight:bold;background:#eef'><td>Total obtenido</td>`;
    sucursales.forEach(suc => {
        const excluidos = window.obtenerParametrosExcluidos ? window.obtenerParametrosExcluidos(suc) : [];
        const evalSuc = evaluacionesSucursales.find(e => e.id === suc);
        let suma = 0, max = 0;
        todosLosParametros.forEach(param => {
            if (!excluidos.includes(param.nombre)) {
                const calif = evalSuc ? evalSuc[param.id] ?? null : null;
                suma += calif !== null ? Math.round((calif / 100) * (param.peso || 1)) : 0;
                max += (param.peso || 1);
            }
        });
        html += `<td>${suma}</td>`;
    });
    html += `</tr><tr style='font-weight:bold;background:#eef'><td>% logrado</td>`;
    sucursales.forEach(suc => {
        const excluidos = window.obtenerParametrosExcluidos ? window.obtenerParametrosExcluidos(suc) : [];
        const evalSuc = evaluacionesSucursales.find(e => e.id === suc);
        let suma = 0, max = 0;
        todosLosParametros.forEach(param => {
            if (!excluidos.includes(param.nombre)) {
                const calif = evalSuc ? evalSuc[param.id] ?? null : null;
                suma += calif !== null ? Math.round((calif / 100) * (param.peso || 1)) : 0;
                max += (param.peso || 1);
            }
        });
        html += `<td>${max > 0 ? ((suma / max) * 100).toFixed(1) + '%' : '-'}</td>`;
    });
    html += `</tr></tbody></table>`;

    // --- Franquicias ---
    html += `<h2 style='margin-top:2em'>Matriz de Evaluación (Franquicias)</h2><table><thead><tr><th>Parámetro</th>`;
    franquicias.forEach(f => html += `<th>${f.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</th>`);
    html += `</tr></thead><tbody>`;
    todosLosParametros.forEach(param => {
        html += `<tr><td>${param.nombre}</td>`;
        franquicias.forEach(franq => {
            const excluidos = window.obtenerParametrosExcluidosFranquicia ? window.obtenerParametrosExcluidosFranquicia(franq) : [];
            if (excluidos.includes(param.nombre)) {
                html += `<td style="background-color: #222; color: #fff">&nbsp;</td>`;
            } else {
                const evalFranq = evaluacionesFranquicias.find(e => e.id === franq);
                const calif = evalFranq ? evalFranq[param.id] ?? null : null;
                const valor = calif !== null ? Math.round((calif / 100) * (param.peso || 1)) : '-';
                html += `<td>${valor}</td>`;
            }
        });
        html += `</tr>`;
    });
    // Fila de suma y porcentaje
    html += `<tr style='font-weight:bold;background:#eef'><td>Total obtenido</td>`;
    franquicias.forEach(franq => {
        const excluidos = window.obtenerParametrosExcluidosFranquicia ? window.obtenerParametrosExcluidosFranquicia(franq) : [];
        const evalFranq = evaluacionesFranquicias.find(e => e.id === franq);
        let suma = 0, max = 0;
        todosLosParametros.forEach(param => {
            if (!excluidos.includes(param.nombre)) {
                const calif = evalFranq ? evalFranq[param.id] ?? null : null;
                suma += calif !== null ? Math.round((calif / 100) * (param.peso || 1)) : 0;
                max += (param.peso || 1);
            }
        });
        html += `<td>${suma}</td>`;
    });
    html += `</tr><tr style='font-weight:bold;background:#eef'><td>% logrado</td>`;
    franquicias.forEach(franq => {
        const excluidos = window.obtenerParametrosExcluidosFranquicia ? window.obtenerParametrosExcluidosFranquicia(franq) : [];
        const evalFranq = evaluacionesFranquicias.find(e => e.id === franq);
        let suma = 0, max = 0;
        todosLosParametros.forEach(param => {
            if (!excluidos.includes(param.nombre)) {
                const calif = evalFranq ? evalFranq[param.id] ?? null : null;
                suma += calif !== null ? Math.round((calif / 100) * (param.peso || 1)) : 0;
                max += (param.peso || 1);
            }
        });
        html += `<td>${max > 0 ? ((suma / max) * 100).toFixed(1) + '%' : '-'}</td>`;
    });
    html += `</tr></tbody></table>`;

    document.getElementById('matriz').innerHTML = html;
}

// --- Gráfica de resultados ---
let grafica;
function renderGrafica() {
    const ctx = document.getElementById('graficaResultados').getContext('2d');

    // Unir nombres de sucursales y franquicias
    const labels = [
        ...sucursales.map(s => s.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())),
        ...franquicias.map(f => f.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()))
    ];

    // Demo: todos al 100%. Debes poner aquí los valores reales si los tienes
    const data = [
        ...sucursales.map(() => 100),
        ...franquicias.map(() => 100)
    ];

    // Colores: sucursales azul, franquicias naranja
    const backgroundColor = [
        ...sucursales.map(() => '#0077cc99'),
        ...franquicias.map(() => '#ff990099')
    ];

    if (grafica) grafica.destroy();
    grafica = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Promedio de Evaluación (%)',
                data,
                backgroundColor
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const idx = context.dataIndex;
                            const tipo = idx < sucursales.length ? 'Sucursal' : 'Franquicia';
                            return `${tipo}: ${labels[idx]} - ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

function renderEvaluaciones() {
    let evaluacionesList = [];
    
    // Combinar sucursales y franquicias activas
    window.sucursales.filter(s => s.activa).forEach(sucursal => {
        evaluacionesList.push({
            id: sucursal.id,
            nombre: sucursal.nombre,
            modelo: sucursal.modelo,
            tipo: 'Sucursal'
        });
    });
    
    window.franquicias.filter(f => f.activa).forEach(franquicia => {
        evaluacionesList.push({
            id: franquicia.id,
            nombre: franquicia.nombre,
            modelo: franquicia.modelo,
            tipo: 'Franquicia'
        });
    });
    
    // Ordenar por nombre
    evaluacionesList.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Generar tabla HTML
    let html = `
    <table class="evaluaciones-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Modelo</th>
                <th>/Kpis</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    // Generar filas de la tabla
    evaluacionesList.forEach(entidad => {
        const tipoLower = entidad.tipo.toLowerCase();
        const mes = window.mesSeleccionado;
        
        // Calcular porcentaje de KPI logrado
        let porcentajeKpi = '';
        let claseKpi = '';
        
        if (window.evaluaciones && 
            window.evaluaciones[tipoLower + 's'] && 
            window.evaluaciones[tipoLower + 's'][entidad.id] && 
            window.evaluaciones[tipoLower + 's'][entidad.id][mes]) {
            
            // Obtener la evaluación
            const evaluacion = window.evaluaciones[tipoLower + 's'][entidad.id][mes];
            
            // Calcular puntos obtenidos
            let puntosObtenidos = 0;
            let puntosMaximos = 0;
            
            // Obtener parámetros excluidos para esta entidad
            const parametrosExcluidos = tipoLower === 'sucursal' 
                ? obtenerParametrosExcluidosPorSucursal(entidad.id) 
                : obtenerParametrosExcluidosPorFranquicia(entidad.id);
                
            // Calcular puntos basados en los parámetros que aplican (no excluidos)
            window.parametros.forEach(param => {
                if (!parametrosExcluidos.includes(param.nombre)) {
                    puntosMaximos += param.peso;
                    if (evaluacion[param.id]) {
                        puntosObtenidos += evaluacion[param.id];
                    }
                }
            });
            
            // Calcular porcentaje
            const porcentaje = puntosMaximos > 0 ? Math.round((puntosObtenidos / puntosMaximos) * 100) : 0;
            porcentajeKpi = `${porcentaje}%`;
            
            // Asignar clase según el porcentaje
            if (porcentaje >= 80) {
                claseKpi = 'kpi-alto';
            } else if (porcentaje >= 60) {
                claseKpi = 'kpi-medio';
            } else {
                claseKpi = 'kpi-bajo';
            }
        } else {
            porcentajeKpi = 'N/A';
            claseKpi = 'kpi-na';
        }
        
        html += `
        <tr>
            <td>${entidad.id}</td>
            <td>${entidad.nombre}</td>
            <td>${entidad.tipo}</td>
            <td>${entidad.modelo || '-'}</td>
            <td class="${claseKpi}">${porcentajeKpi}</td>
            <td>
                <button class="btn-ver-video" data-id="${entidad.id}" data-tipo="${entidad.tipo}">Ver video</button>
                <button class="btn-editar" data-id="${entidad.id}" data-tipo="${entidad.tipo}">Editar</button>
                <button class="btn-destruir" data-id="${entidad.id}" data-tipo="${entidad.tipo}">Destruir</button>
            </td>
        </tr>
        `;
    });
    
    html += `
        </tbody>
    </table>
    `;
    
    // Actualizar el contenido
    document.getElementById('evaluaciones').innerHTML = html;
    
    // Asignar event listeners a los botones
    document.querySelectorAll('.btn-ver-video').forEach(btn => {
        btn.onclick = e => verVideo(btn.getAttribute('data-id'), btn.getAttribute('data-tipo'));
    });
    
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.onclick = e => editarEvaluacion(btn.getAttribute('data-id'), btn.getAttribute('data-tipo'));
    });
    
    document.querySelectorAll('.btn-destruir').forEach(btn => {
        btn.onclick = e => destruirEvaluacion(btn.getAttribute('data-id'), btn.getAttribute('data-tipo'));
    });
}

// Funciones demo para los botones
function verVideo(id, tipo) { 
    const mes = window.mesSeleccionado;
    const tipoEntidad = tipo === 'Sucursal' ? 'sucursales' : 'franquicias';
    
    if (window.videoLinks && window.videoLinks[mes] && window.videoLinks[mes][tipoEntidad] && window.videoLinks[mes][tipoEntidad][id]) {
        const videoUrl = window.videoLinks[mes][tipoEntidad][id];
        window.open(videoUrl, '_blank');
    } else {
        alert(`No hay video disponible para ${tipo} ${id} en el mes ${mes}`);
    }
}
function editarEvaluacion(id, tipo) {
    const mes = window.mesSeleccionado;
    const entidad = tipo === 'Sucursal' 
        ? window.sucursales.find(s => s.id === id)
        : window.franquicias.find(f => f.id === id);
    
    if (!entidad) {
        alert(`No se encontró la ${tipo.toLowerCase()} con ID ${id}`);
        return;
    }
    
    // Obtener los parámetros excluidos para esta entidad
    const parametrosExcluidos = tipo === 'Sucursal' 
        ? obtenerParametrosExcluidosPorSucursal(id) 
        : obtenerParametrosExcluidosPorFranquicia(id);
    
    // Obtener evaluación actual o crear una nueva si no existe
    let evaluacion = window.evaluaciones?.[mes]?.[tipo.toLowerCase() + 's']?.[id];
    
    if (!evaluacion) {
        // Si no existe una evaluación, generar una nueva con valores iniciales
        evaluacion = generarEvaluacionVacia(id, tipo);
        
        // Asegurar que existan las estructuras necesarias
        if (!window.evaluaciones) window.evaluaciones = {};
        if (!window.evaluaciones[mes]) window.evaluaciones[mes] = {};
        if (!window.evaluaciones[mes][tipo.toLowerCase() + 's']) window.evaluaciones[mes][tipo.toLowerCase() + 's'] = {};
    }
    
    // Usar el modal existente
    const modal = document.getElementById('modal-nueva-evaluacion');
    if (!modal) {
        alert("Error: No se encontró el modal para editar la evaluación");
        return;
    }
    
    // Actualizar el título del modal
    const h2 = modal.querySelector('h2');
    if (h2) {
        h2.textContent = `Editar evaluación de ${entidad.nombre}`;
    }
    
    // Obtener el contenedor de parámetros
    const parametrosContainer = document.getElementById('parametros-evaluacion-container');
    if (!parametrosContainer) {
        alert("Error: No se encontró el contenedor de parámetros");
        return;
    }
    
    // Preseleccionar la entidad en el dropdown y deshabilitarlo (es edición, no debería cambiarse)
    const selectEntidad = document.getElementById('select-entidad-evaluacion');
    if (selectEntidad) {
        // Buscar o crear la opción para esta entidad
        let opcionEntidad = Array.from(selectEntidad.options).find(opt => 
            opt.value === `${tipo.toLowerCase()}-${id}`
        );
        
        if (!opcionEntidad) {
            opcionEntidad = new Option(`${entidad.nombre} (${tipo})`, `${tipo.toLowerCase()}-${id}`);
            selectEntidad.add(opcionEntidad);
        }
        
        // Seleccionar la opción y deshabilitar el select
        selectEntidad.value = `${tipo.toLowerCase()}-${id}`;
        selectEntidad.disabled = true;
    }
    
    // Generar HTML para cada parámetro de evaluación, agrupado por categoría
    let parametrosHTML = '';
    
    // Agrupar parámetros por categoría
    const parametrosPorCategoria = {};
    window.parametros.forEach(param => {
        // Verificar si el parámetro no está excluido para esta entidad
        if (!parametrosExcluidos.includes(param.nombre)) {
            if (!parametrosPorCategoria[param.categoria]) {
                parametrosPorCategoria[param.categoria] = [];
            }
            parametrosPorCategoria[param.categoria].push(param);
        }
    });
    
    // Generar campos para cada categoría y sus parámetros
    Object.keys(parametrosPorCategoria).forEach(categoria => {
        parametrosHTML += `
        <div class="categoria-container" style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h3 style="margin:0;">${categoria}</h3>
                <button type="button" class="btn-seleccionar-todo" data-categoria="${categoria}" 
                    style="background-color:#4CAF50;color:white;border:none;padding:5px 10px;cursor:pointer;border-radius:4px;"
                    onclick="seleccionarTodosCategoria(this)">
                    Seleccionar todos
                </button>
            </div>
        `;
        
        parametrosPorCategoria[categoria].forEach(param => {
            const valorActual = evaluacion[param.id] !== undefined ? evaluacion[param.id] : 0;
            const isChecked = valorActual > 0 ? 'checked' : '';
            
            parametrosHTML += `
            <div class="parametro-item" style="margin-bottom:16px;">
                <div style="display:flex;align-items:center;">
                    <input type="checkbox" id="param-${param.id}" name="param-${param.id}" 
                        data-param-id="${param.id}" data-peso="${param.peso}" data-tipo="${param.tipo}" 
                        ${isChecked} style="margin-right:8px;" 
                        onchange="actualizarValorParametro(this)">
                    <label for="param-${param.id}" title="${param.descripcion}" style="font-weight:bold;">
                        ${param.nombre} ${param.tipo === 'binario' ? '' : `(${param.peso} pts)`}
                    </label>
                </div>`;
            
            // Input oculto para almacenar el valor real
            parametrosHTML += `<input type="hidden" id="valor-param-${param.id}" value="${valorActual}">`;
            
            parametrosHTML += `</div>`;
        });
        
        parametrosHTML += `</div>`;
    });
    
    // Agregar campo para observaciones
    parametrosHTML += `
    <div style="margin:20px 0;">
        <label for="observaciones-evaluacion" style="display:block;margin-bottom:8px;font-weight:bold;">Observaciones:</label>
        <textarea id="observaciones-evaluacion" style="width:100%;min-height:80px;padding:8px;"
            placeholder="Ingrese aquí sus observaciones sobre esta evaluación...">${evaluacion.observaciones || ''}</textarea>
    </div>`;
    
    // Actualizar el contenedor de parámetros
    parametrosContainer.innerHTML = parametrosHTML;
    
    // Obtener el botón de guardar y hacerlo visible
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    if (btnGuardar) {
        btnGuardar.style.display = 'block';
        
        // Remover listener previo si existe
        const nuevoBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(nuevoBtn, btnGuardar);
        
        // Asignar nuevo listener para guardar la evaluación
        nuevoBtn.onclick = function() {
            // Recopilar valores de todos los parámetros
            const parametrosInputs = parametrosContainer.querySelectorAll('input, select');
            const evaluacionActualizada = { ...evaluacion };
            
            parametrosInputs.forEach(input => {
                const paramId = input.id.replace('param-', '');
                evaluacionActualizada[paramId] = parseInt(input.value);
            });
            
            // Guardar la evaluación actualizada
            const tipoEntidad = tipo.toLowerCase() + 's';
            window.evaluaciones[mes][tipoEntidad][id] = evaluacionActualizada;
            
            // Cerrar el modal
            modal.style.display = 'none';
            selectEntidad.disabled = false; // Restaurar el estado del select
            
            // Actualizar vistas
            actualizarPuntos();
            renderDashboard();
            renderMatriz();
            renderGraficas();
            renderEvaluaciones();
            
            alert(`Evaluación de ${entidad.nombre} actualizada correctamente.`);
        };
    }
    
    // Actualizar la visualización de puntos totales
    actualizarTotalPuntosEvaluacion();
    
    // Mostrar el modal
    modal.style.display = 'flex';
}

// Función auxiliar para actualizar el total de puntos en la evaluación
function actualizarTotalPuntosEvaluacion() {
    const totalElement = document.getElementById('total-puntos-evaluacion');
    const parametrosInputs = document.querySelectorAll('#parametros-evaluacion-container input, #parametros-evaluacion-container select');
    
    let total = 0;
    parametrosInputs.forEach(input => {
        const valor = parseInt(input.value) || 0;
        const peso = parseInt(input.getAttribute('data-peso')) || 0;
        const tipo = input.getAttribute('data-tipo');
        
        // Para parámetros binarios, si es 1 (Sí) sumar el peso completo
        if (tipo === 'binario') {
            total += valor * peso;
        } else {
            // Para parámetros numéricos, sumar el valor directamente
            total += valor;
        }
    });
    
    if (totalElement) {
        totalElement.textContent = `Total de puntos: ${total}`;
    }
}

function destruirEvaluacion(id, tipo) {
    const mes = window.mesSeleccionado;
    const entidad = tipo === 'Sucursal' 
        ? window.sucursales.find(s => s.id === id)
        : window.franquicias.find(f => f.id === id);
    
    if (!entidad) {
        alert(`No se encontró la ${tipo.toLowerCase()} con ID ${id}`);
        return;
    }
    
    // Confirmar eliminación
    if (confirm(`¿Está seguro de eliminar la evaluación de ${entidad.nombre} para ${document.getElementById('mes-selector').selectedOptions[0].textContent}?`)) {
        const tipoEntidad = tipo.toLowerCase() + 's';
        
        // Verificar que existan las estructuras necesarias
        if (window.evaluaciones && 
            window.evaluaciones[mes] && 
            window.evaluaciones[mes][tipoEntidad] && 
            window.evaluaciones[mes][tipoEntidad][id]) {
            
            // Eliminar la evaluación
            delete window.evaluaciones[mes][tipoEntidad][id];
            
            // Actualizar vistas
            actualizarPuntos();
            renderDashboard();
            renderMatriz();
            renderGraficas();
            renderEvaluaciones();
            
            alert(`La evaluación de ${entidad.nombre} ha sido eliminada correctamente.`);
        } else {
            alert(`No existe una evaluación para ${entidad.nombre} en ${document.getElementById('mes-selector').selectedOptions[0].textContent}`);
        }
    }
}

// Funciones para obtener parámetros excluidos por entidad
function obtenerParametrosExcluidosPorSucursal(sucursalId) {
    // Verificar si hay parámetros excluidos definidos para esta sucursal
    if (window.parametrosExcluidos && 
        window.parametrosExcluidos.sucursales && 
        window.parametrosExcluidos.sucursales[sucursalId]) {
        return window.parametrosExcluidos.sucursales[sucursalId];
    }
    // Si no hay parámetros excluidos, devolver array vacío
    return [];
}

function obtenerParametrosExcluidosPorFranquicia(franquiciaId) {
    // Verificar si hay parámetros excluidos definidos para esta franquicia
    if (window.parametrosExcluidos && 
        window.parametrosExcluidos.franquicias && 
        window.parametrosExcluidos.franquicias[franquiciaId]) {
        return window.parametrosExcluidos.franquicias[franquiciaId];
    }
    // Si no hay parámetros excluidos, devolver array vacío
    return [];
}

function generarEvaluacionVacia(id, tipo) {
    const evaluacion = { id };
    
    // Obtener parámetros excluidos para esta entidad
    const parametrosExcluidos = tipo === 'Sucursal' 
        ? obtenerParametrosExcluidosPorSucursal(id) 
        : obtenerParametrosExcluidosPorFranquicia(id);
    
    // Inicializar todos los parámetros aplicables con valor 0
    window.parametros.forEach(param => {
        if (!parametrosExcluidos.includes(param.nombre)) {
            evaluacion[param.id] = 0;
        }
    });
    
    return evaluacion;
}

// Función para seleccionar/deseleccionar todos los parámetros de una categoría
function seleccionarTodosCategoria(btnElement) {
    // Obtener la categoría desde el atributo data
    const categoria = btnElement.getAttribute('data-categoria');
    
    // Encontrar el contenedor de la categoría
    const categoriaContainer = btnElement.closest('.categoria-container');
    
    // Obtener todos los checkboxes dentro de esta categoría
    const checkboxes = categoriaContainer.querySelectorAll('input[type="checkbox"]');
    
    // Determinar si vamos a marcar o desmarcar todos
    // Si hay al menos un checkbox desmarcado, entonces marcaremos todos
    // Si todos están marcados, entonces desmarcaremos todos
    const hayDesmarcados = Array.from(checkboxes).some(cb => !cb.checked);
    
    // Cambiar el texto del botón según la acción
    if (hayDesmarcados) {
        btnElement.textContent = 'Desmarcar todos';
    } else {
        btnElement.textContent = 'Seleccionar todos';
    }
    
    // Actualizar todos los checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.checked = hayDesmarcados;
        
        // Disparar manualmente el evento change para actualizar los valores
        const event = new Event('change');
        checkbox.dispatchEvent(event);
    });
}

// Función para inicializar datos de evaluaciones
function inicializarDatosEvaluaciones() {
    // Crear la estructura de evaluaciones si no existe
    if (!window.evaluaciones) {
        window.evaluaciones = {};
    }
    
    // Asegurar que existan las estructuras para sucursales y franquicias
    if (!window.evaluaciones.sucursales) {
        window.evaluaciones.sucursales = {};
    }
    if (!window.evaluaciones.franquicias) {
        window.evaluaciones.franquicias = {};
    }
    
    // Verificar que existan las sucursales y franquicias
    if (!window.sucursales || !window.franquicias) {
        console.error("Datos de sucursales o franquicias no disponibles.");
        return;
    }
    
    // Array de meses del 2025
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    // Función auxiliar para crear evaluación 100% o 0%
    function crearEvaluacion(esCompleta) {
        const evaluacion = {};
        
        window.parametros.forEach(param => {
            // Si es evaluación completa (100%), asignar el peso máximo del parámetro
            // Si no, asignar 0
            evaluacion[param.id] = esCompleta ? param.peso : 0;
        });
        
        // Agregar observaciones genéricas
        evaluacion.observaciones = esCompleta ? 
            "Evaluación inicial completa automática" : 
            "Pendiente de evaluación";
            
        return evaluacion;
    }
    
    console.log("Iniciando población de datos...");
    
    try {
        // Popular datos para sucursales
        window.sucursales.filter(s => s.activa).forEach(sucursal => {
            // Verificar que la sucursal tenga un id
            if (!sucursal.id) {
                console.error("Sucursal sin ID:", sucursal);
                return;
            }
            
            // Crear el objeto para esta sucursal si no existe
            if (!window.evaluaciones.sucursales[sucursal.id]) {
                window.evaluaciones.sucursales[sucursal.id] = {};
            }
            
            // Obtener parámetros excluidos para esta sucursal
            const parametrosExcluidos = obtenerParametrosExcluidosPorSucursal(sucursal.id);
            
            // Popular datos para todos los meses
            meses.forEach((mes, index) => {
                // Para junio (5), julio (6) y agosto (7), evaluación al 100%
                const esCompleta = index >= 5 && index <= 7; 
                
                // Crear evaluación base (100% o 0%)
                const evaluacion = crearEvaluacion(esCompleta);
                
                // Aplicar exclusiones específicas de esta sucursal
                window.parametros.forEach(param => {
                    if (parametrosExcluidos.includes(param.nombre)) {
                        delete evaluacion[param.id];
                    }
                });
                
                // Asignar la evaluación
                window.evaluaciones.sucursales[sucursal.id][mes] = evaluacion;
            });
        });
        
        // Popular datos para franquicias
        window.franquicias.filter(f => f.activa).forEach(franquicia => {
            // Verificar que la franquicia tenga un id
            if (!franquicia.id) {
                console.error("Franquicia sin ID:", franquicia);
                return;
            }
            
            // Crear el objeto para esta franquicia si no existe
            if (!window.evaluaciones.franquicias[franquicia.id]) {
                window.evaluaciones.franquicias[franquicia.id] = {};
            }
            
            // Obtener parámetros excluidos para esta franquicia
            const parametrosExcluidos = obtenerParametrosExcluidosPorFranquicia(franquicia.id);
            
            // Popular datos para todos los meses
            meses.forEach((mes, index) => {
                // Para junio (5), julio (6) y agosto (7), evaluación al 100%
                const esCompleta = index >= 5 && index <= 7;
                
                // Crear evaluación base (100% o 0%)
                const evaluacion = crearEvaluacion(esCompleta);
                
                // Aplicar exclusiones específicas de esta franquicia
                window.parametros.forEach(param => {
                    if (parametrosExcluidos.includes(param.nombre)) {
                        delete evaluacion[param.id];
                    }
                });
                
                // Asignar la evaluación
                window.evaluaciones.franquicias[franquicia.id][mes] = evaluacion;
            });
        });
        
        console.log("Datos de evaluaciones inicializados:", window.evaluaciones);
    } catch (error) {
        console.error("Error al inicializar datos:", error);
    }
    
    // Actualizar visualizaciones
    try {
        actualizarPuntos();
        renderDashboard();
        renderMatriz();
        renderGraficas();
        renderEvaluaciones();
    } catch (error) {
        console.error("Error al actualizar visualizaciones:", error);
    }
}

inicializarDatosEvaluaciones();

// Función para renderizar las gráficas del dashboard
function renderGraficas() {
    console.log("Renderizando gráficas...");
    
    // Si no hay datos para renderizar, no continuamos
    if (!window.evaluaciones || !window.mesSeleccionado) {
        console.log("No hay datos de evaluaciones o mes seleccionado para renderizar gráficas");
        return;
    }
    
    try {
        // Aquí iría la lógica para generar gráficas
        // Por ahora solo es un placeholder hasta implementar la visualización completa
        console.log("Gráficas renderizadas correctamente para el mes:", window.mesSeleccionado);
    } catch (error) {
        console.error("Error al renderizar gráficas:", error);
    }
}

// Función para actualizar los puntos totales por entidad
function actualizarPuntos() {
    // Calcular puntos para sucursales
    window.sucursales.forEach(sucursal => {
        if (!sucursal.activa) return;
        
        const mes = window.mesSeleccionado;
        let puntos = 0;
        let puntosMaximos = 0;
        
        // Verificar si hay evaluación para esta sucursal en el mes seleccionado
        if (window.evaluaciones && 
            window.evaluaciones.sucursales && 
            window.evaluaciones.sucursales[sucursal.id] && 
            window.evaluaciones.sucursales[sucursal.id][mes]) {
            
            const evaluacion = window.evaluaciones.sucursales[sucursal.id][mes];
            const parametrosExcluidos = obtenerParametrosExcluidosPorSucursal(sucursal.id);
            
            // Calcular puntos obtenidos y máximos
            window.parametros.forEach(param => {
                if (!parametrosExcluidos.includes(param.nombre)) {
                    puntosMaximos += param.peso;
                    puntos += evaluacion[param.id] || 0;
                }
            });
        }
        
        // Guardar puntos y porcentaje
        sucursal.puntos = puntos;
        sucursal.porcentaje = puntosMaximos > 0 ? Math.round((puntos / puntosMaximos) * 100) : 0;
    });
    
    // Calcular puntos para franquicias
    window.franquicias.forEach(franquicia => {
        if (!franquicia.activa) return;
        
        const mes = window.mesSeleccionado;
        let puntos = 0;
        let puntosMaximos = 0;
        
        // Verificar si hay evaluación para esta franquicia en el mes seleccionado
        if (window.evaluaciones && 
            window.evaluaciones.franquicias && 
            window.evaluaciones.franquicias[franquicia.id] && 
            window.evaluaciones.franquicias[franquicia.id][mes]) {
            
            const evaluacion = window.evaluaciones.franquicias[franquicia.id][mes];
            const parametrosExcluidos = obtenerParametrosExcluidosPorFranquicia(franquicia.id);
            
            // Calcular puntos obtenidos y máximos
            window.parametros.forEach(param => {
                if (!parametrosExcluidos.includes(param.nombre)) {
                    puntosMaximos += param.peso;
                    puntos += evaluacion[param.id] || 0;
                }
            });
        }
        
        // Guardar puntos y porcentaje
        franquicia.puntos = puntos;
        franquicia.porcentaje = puntosMaximos > 0 ? Math.round((puntos / puntosMaximos) * 100) : 0;
    });
}
