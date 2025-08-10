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

// === INICIALIZACIÓN DE DATOS DE EJEMPLO PARA JUNIO Y JULIO ===
function inicializarDatosEjemploEvaluaciones() {
    // Espera a que todo esté cargado
    if (!window.sucursales || !window.franquicias || !window.parametros || !window.parametrosExcluidosPorSucursal || !window.parametrosExcluidosPorFranquicia) {
        setTimeout(inicializarDatosEjemploEvaluaciones, 100);
        return;
    }
    if (!window.evaluaciones) window.evaluaciones = { sucursales: {}, franquicias: {} };

    function getParametrosValidos(entidadId, tipo) {
        let excluidos = [];
        if (tipo === 'sucursal') {
            excluidos = window.parametrosExcluidosPorSucursal[entidadId] || [];
        }
        if (tipo === 'franquicia') {
            excluidos = window.parametrosExcluidosPorFranquicia[entidadId] || [];
        }
        // Compara por nombre de parámetro
        return (window.parametros || []).filter(p => !excluidos.includes(p.nombre));
    }

    function generarEvaluacion(entidadId, tipo) {
        const params = getParametrosValidos(entidadId, tipo);
        const evaluacion = { id: entidadId };
        params.forEach(param => {
            // Simula cumplimiento aleatorio (85% de los parámetros marcados)
            evaluacion[param.id] = Math.random() < 0.85 ? param.peso : 0;
        });
        return evaluacion;
    }

    const mesesEjemplo = ['2024-06', '2024-07'];

    // Sucursales
    window.sucursales.forEach(suc => {
        const sucId = suc.id;
        if (!window.evaluaciones.sucursales[sucId]) window.evaluaciones.sucursales[sucId] = {};
        mesesEjemplo.forEach(mes => {
            window.evaluaciones.sucursales[sucId][mes] = generarEvaluacion(sucId, 'sucursal');
        });
    });

    // Franquicias
    window.franquicias.forEach(franq => {
        const franqId = franq.id;
        if (!window.evaluaciones.franquicias[franqId]) window.evaluaciones.franquicias[franqId] = {};
        mesesEjemplo.forEach(mes => {
            window.evaluaciones.franquicias[franqId][mes] = generarEvaluacion(franqId, 'franquicia');
        });
    });

    console.log('Datos de ejemplo de evaluaciones para junio y julio generados.');
}

inicializarDatosEjemploEvaluaciones();

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
    const parametrosFiltrados = (window.parametros || []).filter(p => !excluidos.includes(p.nombre));
    
    // Agrupar parámetros por categoría
    const parametrosPorCategoria = {};
    parametrosFiltrados.forEach(param => {
        if (!parametrosPorCategoria[param.categoria]) {
            parametrosPorCategoria[param.categoria] = [];
        }
        parametrosPorCategoria[param.categoria].push(param);
    });
    
    // Generar HTML para los parámetros agrupados por categoría
    let html = '<h4 style="margin-bottom:10px;">Parámetros de evaluación:</h4><div class="parametros-scroll">';
    
    // Generar campos para cada categoría y sus parámetros
    Object.keys(parametrosPorCategoria).forEach(categoria => {
        html += `
        <div class="categoria-container" style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h3 style="margin:0;">${categoria}</h3>
                <button type="button" class="btn-seleccionar-todo" data-categoria="${categoria}" 
                    style="background-color:#4CAF50;color:white;border:none;padding:5px 10px;cursor:pointer;border-radius:4px;"
                    onclick="seleccionarTodosCategoria(this)">
                    Seleccionar todos
                </button>
            </div>`;
        
        parametrosPorCategoria[categoria].forEach(param => {
            html += `
            <div class="parametro-item" style="margin-bottom:16px;">
                <div style="display:flex;align-items:center;">
                    <input type="checkbox" 
                           class="parametro-checkbox"
                           id="param-${param.id}" 
                           name="param-${param.id}" 
                           data-param-id="${param.id}" 
                           data-peso="${param.peso}" 
                           data-tipo="${param.tipo}"
                           style="margin-right:8px;"
                           onchange="actualizarValorParametro(this)">
                    <label for="param-${param.id}" title="${param.descripcion || ''}" style="font-weight:bold;">
                        ${param.nombre} ${param.tipo === 'binario' ? '' : `(${param.peso} pts)`}
                    </label>
                </div>
                <input type="hidden" id="valor-param-${param.id}" value="0">
            </div>`;
        });
        
        html += `</div>`; // Cierre de categoria-container
    });
    
    html += `</div>`; // Cierre de parametros-scroll
    
    // Agregar campo para observaciones
    html += `
    <div style="margin:20px 0;">
        <label for="observaciones-evaluacion" style="display:block;margin-bottom:8px;font-weight:bold;">Observaciones:</label>
        <textarea id="observaciones-evaluacion" style="width:100%;min-height:80px;padding:8px;"
            placeholder="Ingrese aquí sus observaciones sobre esta evaluación..."></textarea>
    </div>`;
    
    // Actualizar el contenedor de parámetros
    const container = document.getElementById('parametros-evaluacion-container');
    container.innerHTML = html;
    
    // Mostrar el botón de guardar
    const btnGuardar = document.getElementById('btn-guardar-evaluacion');
    btnGuardar.style.display = 'inline-block';
    
    // Configurar el manejador de eventos para el botón de guardar
    btnGuardar.onclick = function() {
        // Obtener el tipo y ID de la entidad seleccionada
        const selectEntidad = document.getElementById('select-entidad-evaluacion');
        const valorSeleccionado = selectEntidad.value;
        if (!valorSeleccionado) {
            alert('Por favor selecciona una entidad primero');
            return;
        }
        
        // Determinar si es sucursal o franquicia
        let tipoEntidad, entidadId;
        if (valorSeleccionado.startsWith('sucursal-')) {
            tipoEntidad = 'sucursales';
            entidadId = valorSeleccionado.replace('sucursal-', '');
        } else {
            tipoEntidad = 'franquicias';
            entidadId = valorSeleccionado.replace('franquicia-', '');
        }
        
        // Crear el objeto de evaluación
        const evaluacion = {
            fecha: new Date().toISOString(),
            observaciones: document.getElementById('observaciones-evaluacion').value || ''
        };
        
        // Recopilar valores de todos los parámetros
        const parametrosInputs = document.querySelectorAll('#parametros-evaluacion-container input[type="hidden"]');
        parametrosInputs.forEach(input => {
            const paramId = input.id.replace('valor-param-', '');
            evaluacion[paramId] = parseInt(input.value) || 0;
        });
        
        // Inicializar la estructura si no existe
        if (!window.evaluaciones[window.mesSeleccionado]) {
            window.evaluaciones[window.mesSeleccionado] = { sucursales: {}, franquicias: {} };
        }
        if (!window.evaluaciones[window.mesSeleccionado][tipoEntidad]) {
            window.evaluaciones[window.mesSeleccionado][tipoEntidad] = {};
        }
        
        // Guardar la evaluación
        window.evaluaciones[window.mesSeleccionado][tipoEntidad][entidadId] = evaluacion;
        
        // Cerrar el modal
        document.getElementById('modal-nueva-evaluacion').style.display = 'none';
        
        // Actualizar las vistas
        actualizarPuntos();
        renderDashboard();
        renderMatrizUnificada();
        renderGraficas();
        renderEvaluaciones();
        
        alert('Evaluación guardada correctamente.');
    };
    
    // Actualizar el total de puntos
    actualizarTotalPuntosEvaluacion();
}

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

// Función para seleccionar/deseleccionar todos los parámetros de una categoría
function seleccionarTodosCategoria(btnElement) {
    // Obtener la categoría desde el atributo data
    const categoria = btnElement.getAttribute('data-categoria');
    
    // Encontrar el contenedor de la categoría
    const categoriaContainer = btnElement.closest('.categoria-container');
    
    if (!categoriaContainer) {
        console.error('No se pudo encontrar el contenedor de la categoría');
        return;
    }
    
    // Obtener todos los checkboxes de parámetros dentro de esta categoría
    const checkboxes = categoriaContainer.querySelectorAll('input[type="checkbox"][data-param-id]');
    
    if (checkboxes.length === 0) {
        console.warn('No se encontraron checkboxes de parámetros en esta categoría');
        return;
    }
    
    // Determinar si vamos a marcar o desmarcar todos
    // Si hay al menos un checkbox desmarcado, entonces marcaremos todos
    // Si todos están marcados, entonces desmarcaremos todos
    const hayDesmarcados = Array.from(checkboxes).some(cb => !cb.checked);
    
    // Cambiar el texto del botón según la acción
    const nuevoTexto = hayDesmarcados ? 'Desmarcar todos' : 'Seleccionar todos';
    btnElement.textContent = nuevoTexto;
    
    // Actualizar todos los checkboxes
    checkboxes.forEach(checkbox => {
        // Solo actualizar si el estado va a cambiar
        if (checkbox.checked !== hayDesmarcados) {
            checkbox.checked = hayDesmarcados;
            
            // Actualizar el valor oculto correspondiente
            const paramId = checkbox.getAttribute('data-param-id');
            const hiddenInput = document.getElementById(`valor-param-${paramId}`);
            if (hiddenInput) {
                hiddenInput.value = hayDesmarcados ? checkbox.getAttribute('data-peso') : 0;
            }
            
            // Disparar manualmente el evento change para actualizar los valores
            const event = new Event('change');
            checkbox.dispatchEvent(event);
        }
    });
    
    // Actualizar el total de puntos
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
            if (btn.dataset.section === 'matriz') renderMatrizUnificada();
            if (btn.dataset.section === 'dashboard') renderDashboard();
        });
    });
    tabs[0].classList.add('active'); // Por defecto dashboard
    sections[0].style.display = 'block'; // Asegura que el dashboard se muestre al inicio
});

// --- Matriz de evaluación (dinámica: muestra TODOS los parámetros definidos) ---
function renderMatrizUnificada() {
    const todosLosParametros = Array.isArray(window.parametros) ? window.parametros : [];
    const sucursalesList = Array.isArray(window.sucursales) ? window.sucursales : [];
    const franquiciasList = Array.isArray(window.franquicias) ? window.franquicias : [];
    const evaluacionesSuc = Array.isArray(window.evaluacionesSucursales) ? window.evaluacionesSucursales : [];
    const evaluacionesFranq = Array.isArray(window.evaluacionesFranquicias) ? window.evaluacionesFranquicias : [];

    // Soportar tanto array de strings como de objetos
    function getId(obj) {
        return typeof obj === "string" ? obj : (obj.id || obj.nombre || "");
    }
    function getNombre(obj) {
        let nombre = typeof obj === "string" ? obj : (obj.nombre || obj.id || "");
        return nombre.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }

    const labels = [
        ...sucursalesList.map(s => ({ id: getId(s), nombre: getNombre(s), tipo: 'Sucursal' })),
        ...franquiciasList.map(f => ({ id: getId(f), nombre: getNombre(f), tipo: 'Franquicia' }))
    ];

    // Unifica nombres para columnas
    let html = '<table class="matriz"><thead><tr>';
    html += '<th>Parámetro</th>';
    labels.forEach(l => html += `<th>${l.nombre}</th>`);
    html += '</tr></thead><tbody>';

    todosLosParametros.forEach(param => {
        html += `<tr><td>${param.nombre}</td>`;
        labels.forEach(l => {
            // Determina si está excluido
            let excluido = false;
            if (l.tipo === 'Sucursal' && typeof window.obtenerParametrosExcluidos === 'function') {
                const excl = window.obtenerParametrosExcluidos(l.id) || [];
                excluido = excl.includes(param.nombre);
            }
            if (l.tipo === 'Franquicia' && typeof window.obtenerParametrosExcluidosFranquicia === 'function') {
                const excl = window.obtenerParametrosExcluidosFranquicia(l.id) || [];
                excluido = excl.includes(param.nombre);
            }
            if (excluido) {
                html += '<td class="excluido"></td>';
                return;
            }
         // Busca evaluación real por MES desde window.evaluaciones
let calif = null;
const mes = window.mesSeleccionado;
if (l.tipo === 'Sucursal') {
    const evalSuc = window.evaluaciones?.sucursales?.[l.id]?.[mes] || {};
    calif = evalSuc[param.id];
} else {
    const evalFranq = window.evaluaciones?.franquicias?.[l.id]?.[mes] || {};
    calif = evalFranq[param.id];
}
html += `<td>${calif !== null && calif !== undefined ? calif : '-'}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('tabla-matriz-container').innerHTML = html;
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

    parametrosHTML += `<h4 style="margin-bottom:10px;">Parámetros</h4><div class="parametros-scroll">`;
    
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
            renderMatrizUnificada();
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
            renderMatrizUnificada();
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
    
    if (!categoriaContainer) {
        console.error('No se pudo encontrar el contenedor de la categoría');
        return;
    }
    
    // Obtener todos los checkboxes de parámetros dentro de esta categoría
    const checkboxes = categoriaContainer.querySelectorAll('input[type="checkbox"][data-param-id]');
    
    if (checkboxes.length === 0) {
        console.warn('No se encontraron checkboxes de parámetros en esta categoría');
        return;
    }
    
    // Determinar si vamos a marcar o desmarcar todos
    // Si hay al menos un checkbox desmarcado, entonces marcaremos todos
    // Si todos están marcados, entonces desmarcaremos todos
    const hayDesmarcados = Array.from(checkboxes).some(cb => !cb.checked);
    
    // Cambiar el texto del botón según la acción
    const nuevoTexto = hayDesmarcados ? 'Desmarcar todos' : 'Seleccionar todos';
    btnElement.textContent = nuevoTexto;
    
    // Actualizar todos los checkboxes
    checkboxes.forEach(checkbox => {
        // Solo actualizar si el estado va a cambiar
        if (checkbox.checked !== hayDesmarcados) {
            checkbox.checked = hayDesmarcados;
            
            // Actualizar el valor oculto correspondiente
            const paramId = checkbox.getAttribute('data-param-id');
            const hiddenInput = document.getElementById(`valor-param-${paramId}`);
            if (hiddenInput) {
                hiddenInput.value = hayDesmarcados ? checkbox.getAttribute('data-peso') : 0;
            }
            
            // Disparar manualmente el evento change para actualizar los valores
            const event = new Event('change');
            checkbox.dispatchEvent(event);
        }
    });
    
    // Actualizar el total de puntos
    actualizarTotalPuntosEvaluacion();
}

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
        renderMatrizUnificada();
        renderGraficas();
        renderEvaluaciones();
    } catch (error) {
        console.error("Error al actualizar visualizaciones:", error);
    }
}

inicializarDatosEvaluaciones();
