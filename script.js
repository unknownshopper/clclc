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
    // Obtiene el mes seleccionado (puedes ajustar si tienes datos históricos)
    const mes = window.mesSeleccionado;
    // Combina sucursales y franquicias activas
    const lista = [
        ...window.sucursales.filter(s => s.activa).map(s => ({
            nombre: s.nombre,
            tipo: 'Sucursal',
            modelo: s.modelo,
            id: s.id
        })),
        ...window.franquicias.filter(f => f.activa).map(f => ({
            nombre: f.nombre,
            tipo: 'Franquicia',
            modelo: f.modelo,
            id: f.id
        }))
    ];

    let html = `<h2>Evaluaciones de ${document.getElementById('mes-selector').selectedOptions[0].textContent}</h2>`;
    html += `<table><thead>
        <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Modelo</th>
            <th>Acciones</th>
        </tr>
    </thead><tbody>`;

    lista.forEach(item => {
        html += `<tr>
            <td>${item.nombre}</td>
            <td>${item.tipo}</td>
            <td>${item.modelo}</td>
            <td>
                <button>Ver video</button>
                <button>Editar</button>
                <button>Destruir</button>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    document.getElementById('evaluaciones').innerHTML = html;
}

// Funciones demo para los botones
function verVideo(id) { alert('Ver video de ' + id); }
function editarEvaluacion(id) { alert('Editar evaluación de ' + id); }
function destruirEvaluacion(id) { alert('Destruir evaluación de ' + id); }
