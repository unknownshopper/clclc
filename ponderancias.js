// ponderancias.js — Panel de configuración KPI2 (solo admin)
// - Ponderancias por modelo, versionadas por mes de vigencia (Firestore: configuracion/ponderanciasKPI2)
// - Aplicabilidad de parámetros por entidad (sucursales y franquicias)
// - Simulador de impacto sobre las evaluaciones del mes seleccionado

(function () {
    const MODELOS = ['Cafetería', 'Express', 'Móvil'];
    let draft = null;

    // Propuestas predefinidas de ponderancia. Cada entrada es paramId → peso
    // (número = igual en los 3 modelos; {Cafetería,Express,Móvil} = por modelo).
    // Solo se lista lo que cambia respecto a la vigente; lo demás conserva su peso.
    const PROPUESTAS = [
        {
            id: 'comercial',
            titulo: 'Impulso comercial',
            desc: 'Concentra el puntaje en conversión y lealtad: App, venta cruzada, promociones, producto del mes y existencia. Reduce el peso de instalaciones.',
            pesos: {
                app_cabana: 8,
                venta_cruzada: 7,
                existencia: 6,
                producto_mes: 5,
                mencion_promociones: 5,
                pin_personalizador: 4,
                entrega_ticket: 4,
                conocimiento_productos: 3,
                atencion_mesa: 3,
                presentacion_cafe: { 'Cafetería': 3, 'Express': 2, 'Móvil': 2 },
                presentacion_alimento: { 'Cafetería': 3, 'Express': 2, 'Móvil': 2 },
                presentacion_vaso: 1,
                panera_estado: 1,
                letrero_anuncio: 1,
                jardineras_macetas: 1,
                iluminacion: 1,
                puertas_vidrios: 1,
                musica_volumen: 1,
                area_mostrador: 1,
                mesas_sillas_limpieza: 1,
                piso_limpieza: 1,
                banos_estado: 3,
                basura_estado: 1,
                barra_limpieza: 1,
                clima_funcionando: 3,
                mesas_sillas_estado: 1
            }
        },
        {
            id: 'integral',
            titulo: 'Estándar integral (SERVQUAL)',
            desc: 'Distribución balanceada por dimensiones de calidad de servicio (tangibles, confiabilidad, respuesta, seguridad, empatía). Ningún parámetro domina el resultado.',
            pesos: {
                bienvenida_contacto_visual: 4,
                bienvenida_agradecimiento: 3,
                conocimiento_productos: 3,
                producto_mes: 2,
                venta_cruzada: 4,
                mencion_promociones: 2,
                app_cabana: 6,
                pin_personalizador: 2,
                atencion_mesa: 3,
                entrega_ticket: 3,
                tiempo_espera_atencion: 3,
                tiempo_fila: 3,
                tiempo_espera_cafe: 3,
                cantidad_colaboradores: 2,
                apariencia_personal: 3,
                tableta: 2,
                presentacion_vaso: 2,
                presentacion_cafe: 3,
                presentacion_alimento: 3,
                existencia: 5,
                panera_estado: 2,
                fachada_limpieza: 2,
                letrero_anuncio: 1,
                jardineras_macetas: 1,
                iluminacion: 2,
                puertas_vidrios: 2,
                musica_volumen: 2,
                area_mostrador: 2,
                mesas_sillas_limpieza: 2,
                piso_limpieza: 2,
                banos_estado: 3,
                basura_estado: 2,
                barra_limpieza: 2,
                clima_funcionando: 3,
                mesas_sillas_estado: 2
            }
        }
    ];

    function aplicarPropuesta(id) {
        const prop = PROPUESTAS.find(p => p.id === id);
        if (!prop) return;
        const d = asegurarDraft();
        Object.entries(prop.pesos).forEach(([paramId, val]) => {
            MODELOS.forEach(m => {
                d.pesos[m][paramId] = (typeof val === 'object' && val !== null)
                    ? (Number(val[m]) || 0)
                    : (Number(val) || 0);
            });
        });
        renderPonderancias();
        document.getElementById('ponderanciasContainer')?.scrollTo?.({ top: 0 });
    }

    // Restaura el borrador a la configuración vigente (pesos y aplicabilidad)
    function restaurarVigente() {
        const d = asegurarDraft();
        d.pesos = pesosVigentes();
        ['sucursal', 'franquicia'].forEach(tipo => {
            entidadesPorTipo(tipo).forEach(e => {
                d.excluidos[tipo][e.id] = estadoExcluidosActual(e.id, tipo);
            });
        });
        renderPonderancias();
    }

    const normId = (id) => String(id || '').toLowerCase().replace(/[-_]/g, '');

    function esAdmin() {
        return !!(window.usuarioActual && String(window.usuarioActual.rol || '').toLowerCase() === 'admin');
    }

    function puedeEscribir() {
        return esAdmin() && !!window.firebaseAdminAuthenticated;
    }

    function entidadesPorTipo(tipo) {
        const arr = tipo === 'sucursal' ? (window.sucursales || []) : (window.franquicias || []);
        return arr.filter(e => e && e.activa);
    }

    function catalogo() {
        return Array.isArray(window.parametros) ? window.parametros : [];
    }

    function catalogoVigente(mes) {
        return catalogo().filter(p => p && (!p.vigenteDesde || (mes && mes >= p.vigenteDesde)));
    }

    function categoriasOrdenadas() {
        const mapa = {};
        (window.categorias || []).forEach(c => { mapa[c.id] = c.nombre; });
        const usadas = [];
        catalogo().forEach(p => {
            const cid = p.categoriaId || 'otros';
            if (!usadas.includes(cid)) usadas.push(cid);
        });
        return usadas.map(cid => ({
            id: cid,
            nombre: mapa[cid] || (typeof getCategoriaName === 'function' ? getCategoriaName(cid) : cid)
        }));
    }

    // Conjunto efectivo actual de parámetros excluidos (ids normalizados).
    // Con override Firestore ya viene completo; sin override = exclusiones por
    // nombre + parámetros no aplicables por listas del catálogo.
    function estadoExcluidosActual(entidadId, tipo) {
        const set = new Set(
            (typeof window.obtenerIdsParametrosExcluidos === 'function'
                ? window.obtenerIdsParametrosExcluidos(entidadId, tipo)
                : [])
        );
        const hayOverride = typeof window.obtenerAplicabilidadOverride === 'function'
            && !!window.obtenerAplicabilidadOverride(entidadId, tipo);
        if (!hayOverride && typeof window.parametroAplicaAEntidad === 'function') {
            catalogo().forEach(p => {
                if (!window.parametroAplicaAEntidad(p, tipo, entidadId)) set.add(normId(p.id));
            });
        }
        return set;
    }

    function pesosVigentes() {
        const pesos = {};
        MODELOS.forEach(m => {
            pesos[m] = {};
            catalogo().forEach(p => {
                pesos[m][p.id] = window.kpi2Utils.getPesoKPI2(p.id, p.peso, m);
            });
        });
        return pesos;
    }

    function crearDraft() {
        const excluidos = { sucursal: {}, franquicia: {} };
        ['sucursal', 'franquicia'].forEach(tipo => {
            entidadesPorTipo(tipo).forEach(e => {
                excluidos[tipo][e.id] = estadoExcluidosActual(e.id, tipo);
            });
        });
        const d = {
            pesos: pesosVigentes(),
            excluidos,
            inicial: {
                pesos: pesosVigentes(),
                excluidos: JSON.parse(JSON.stringify(
                    Object.fromEntries(Object.entries(excluidos).map(([t, m]) =>
                        [t, Object.fromEntries(Object.entries(m).map(([eid, s]) => [eid, [...s]]))])
                    )
                ))
            },
            tocado: false,
            recuperadoEn: null
        };
        // Si hay un borrador guardado localmente (p.ej. se cerró la página sin
        // guardar), se recupera sobre la configuración vigente recién calculada.
        const guardado = cargarDraftLS();
        if (guardado) {
            d.pesos = guardado.pesos;
            d.excluidos = guardado.excluidos;
            d.recuperadoEn = guardado.guardadoEn;
        }
        return d;
    }

    function asegurarDraft() {
        if (!draft) draft = crearDraft();
        return draft;
    }

    // ===== Respaldo local del borrador (localStorage + exportar JSON) =====
    const LS_KEY = 'ponderanciasDraft_v1';

    function draftAJSON() {
        return {
            tipo: 'ponderanciasKPI2-borrador',
            exportadoEn: new Date().toISOString(),
            pesos: draft.pesos,
            excluidos: Object.fromEntries(Object.entries(draft.excluidos).map(([t, m]) =>
                [t, Object.fromEntries(Object.entries(m).map(([eid, s]) => [eid, [...s]]))]))
        };
    }

    function persistirDraft() {
        if (!draft) return;
        try {
            const c = contarCambios();
            if (c.pesos + c.aplica === 0) { limpiarDraftLS(); return; }
            const d = draftAJSON();
            d.guardadoEn = d.exportadoEn;
            localStorage.setItem(LS_KEY, JSON.stringify(d));
        } catch (e) { /* localStorage no disponible */ }
    }

    function limpiarDraftLS() {
        try { localStorage.removeItem(LS_KEY); } catch (e) {}
    }

    function cargarDraftLS() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            const d = JSON.parse(raw);
            if (!d || !d.pesos || !d.excluidos) return null;
            const excluidos = {};
            Object.entries(d.excluidos).forEach(([t, m]) => {
                excluidos[t] = {};
                Object.entries(m).forEach(([eid, arr]) => { excluidos[t][eid] = new Set(arr); });
            });
            return { pesos: d.pesos, excluidos, guardadoEn: d.guardadoEn || d.exportadoEn };
        } catch (e) { return null; }
    }

    function nombreArchivo(ext) {
        const f = new Date();
        return `ponderancias-borrador-${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}.${ext}`;
    }

    function descargar(blob, nombre) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Filas de la tabla de pesos con marca de cambio vs. vigente
    function filasPesos() {
        const filas = [];
        categoriasOrdenadas().forEach(cat => {
            catalogo().filter(p => (p.categoriaId || 'otros') === cat.id).forEach(p => {
                const pesos = {};
                MODELOS.forEach(m => { pesos[m] = Number(draft.pesos[m][p.id]) || 0; });
                filas.push({
                    cat: cat.nombre, id: p.id, nombre: p.nombre, pesos,
                    cambio: MODELOS.some(m => Number(draft.pesos[m][p.id]) !== Number(draft.inicial.pesos[m][p.id]))
                });
            });
        });
        return filas;
    }

    function totalModelo(m) {
        return catalogo().reduce((s, p) => s + (Number(draft.pesos[m][p.id]) || 0), 0);
    }

    function exportarJSON() {
        descargar(new Blob([JSON.stringify(draftAJSON(), null, 2)], { type: 'application/json' }), nombreArchivo('json'));
    }

    function exportarCSV() {
        const esc = s => `"${String(s).replace(/"/g, '""')}"`;
        let out = 'Categoría,Parámetro,Cafetería,Express,Móvil\n';
        filasPesos().forEach(f => {
            out += [esc(f.cat), esc(f.nombre), ...MODELOS.map(m => f.pesos[m])].join(',') + '\n';
        });
        out += `,TOTAL si todo cumple,${MODELOS.map(totalModelo).join(',')}\n`;
        descargar(new Blob(['﻿' + out], { type: 'text/csv;charset=utf-8' }), nombreArchivo('csv'));
    }

    async function exportarXLSX() {
        if (typeof ExcelJS === 'undefined') {
            alert('ExcelJS no está cargado.');
            return;
        }
        const mes = window.mesSeleccionado || obtenerMesActual();
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Ponderancias');
        ws.columns = [{ width: 30 }, { width: 36 }, { width: 12 }, { width: 12 }, { width: 12 }];
        ws.getCell('A1').value = 'Ponderancias — borrador de configuración';
        ws.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF0077CC' } };
        ws.getCell('A2').value = `Generado: ${new Date().toLocaleString('es-MX')} · Mes de referencia: ${formatearMesLegible(mes)} · Amarillo = cambio vs. vigente`;
        const hdr = ws.getRow(4);
        hdr.values = ['Categoría', 'Parámetro', ...MODELOS];
        hdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        hdr.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3E50' } }; });
        let r = 5;
        filasPesos().forEach(f => {
            const row = ws.getRow(r++);
            row.values = [f.cat, f.nombre, ...MODELOS.map(m => f.pesos[m])];
            if (f.cambio) {
                [3, 4, 5].forEach(c => {
                    row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
                });
            }
        });
        const tot = ws.getRow(r);
        tot.values = ['', 'TOTAL si todo cumple', ...MODELOS.map(totalModelo)];
        tot.font = { bold: true };

        [['sucursal', 'Aplicabilidad sucursales'], ['franquicia', 'Aplicabilidad franquicias']].forEach(([tipo, nombre]) => {
            const w = wb.addWorksheet(nombre);
            const ents = entidadesPorTipo(tipo);
            const plist = catalogoVigente(mes);
            w.getRow(1).values = ['Parámetro', ...ents.map(e => e.nombre)];
            w.getRow(1).font = { bold: true };
            w.getColumn(1).width = 34;
            plist.forEach((p, i) => {
                w.getRow(i + 2).values = [p.nombre, ...ents.map(e =>
                    draft.excluidos[tipo][e.id].has(normId(p.id)) ? '—' : '✓')];
            });
            const frow = w.getRow(plist.length + 2);
            frow.values = ['Máx. puntos', ...ents.map(e => maximoDraft(e.id, tipo, mes))];
            frow.font = { bold: true };
        });

        const buf = await wb.xlsx.writeBuffer();
        descargar(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo('xlsx'));
    }

    // PDF: abre una ventana con el documento formateado y dispara imprimir
    // (desde ahí se guarda como PDF con el diálogo del navegador).
    // Cada categoría es un bloque independiente que no se parte entre páginas.
    function exportarPDF() {
        const mes = window.mesSeleccionado || obtenerMesActual();
        const ahora = new Date();
        const logoUrl = `${location.origin}/logch.png`;
        const confidencial = 'DOCUMENTO CONFIDENCIAL — Uso exclusivo de la Dirección de Café La Cabaña. Contiene criterios internos de evaluación. Prohibida su reproducción o distribución fuera de la organización.';

        let html = `<html><head><title>Ponderancias — Café La Cabaña</title><style>
            @page { margin: 14mm 12mm 18mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; margin: 0; padding-bottom: 26mm; }
            .encabezado { display: flex; align-items: center; gap: 18px; border-bottom: 3px solid #0077cc; padding-bottom: 12px; margin-bottom: 10px; }
            .encabezado img { height: 62px; }
            .encabezado .tit { flex: 1; }
            .encabezado h1 { font-size: 19px; color: #2d3e50; margin: 0 0 2px; }
            .encabezado .sub { color: #0077cc; font-size: 12px; font-weight: bold; }
            .meta { display: flex; flex-wrap: wrap; gap: 6px 26px; color: #555; font-size: 10px; margin: 8px 0 12px; }
            .meta b { color: #2d3e50; }
            .aviso { background: #fdf3d7; border: 1px solid #e8c96a; border-radius: 6px; padding: 8px 12px; font-size: 9.5px; color: #7a5d00; text-align: center; margin-bottom: 14px; }
            .bloque { page-break-inside: avoid; break-inside: avoid; margin: 0 auto 16px; max-width: 150mm; }
            .bloque h2 { font-size: 12px; color: #2d3e50; margin: 0 0 5px; text-align: center; background: #eef4fb; border: 1px solid #d6e2ef; border-bottom: none; border-radius: 6px 6px 0 0; padding: 6px; }
            table { border-collapse: collapse; width: 100%; }
            thead { display: table-header-group; }
            th { background: #2d3e50; color: #fff; padding: 5px 6px; border: 1px solid #b9c4d0; font-size: 10px; }
            td { padding: 4px 6px; border: 1px solid #ddd; text-align: center; }
            td.l { text-align: left; }
            td.chg { background: #fff3cd; font-weight: bold; }
            tr.total td { background: #eef4fb; font-weight: bold; }
            .pie { position: fixed; bottom: 0; left: 0; right: 0; border-top: 2px solid #0077cc; background: #fff; padding: 6px 0; text-align: center; font-size: 9px; color: #666; }
            @media print { body { padding-bottom: 0; } }
        </style></head><body>`;

        html += `<div class="encabezado">
            <img src="${logoUrl}" alt="Café La Cabaña" onerror="this.style.display='none'">
            <div class="tit">
                <h1>Ponderancias de Evaluación</h1>
                <div class="sub">Propuesta de configuración — Sistema de Evaluaciones</div>
            </div>
        </div>
        <div class="meta">
            <span><b>Fecha de emisión:</b> ${ahora.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span><b>Hora:</b> ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
            <span><b>Mes de referencia:</b> ${formatearMesLegible(mes)}</span>
            <span><b>Elaboró:</b> ${(window.usuarioActual && window.usuarioActual.nombre) || 'Administrador'}</span>
            <span><b>Celdas amarillas:</b> cambios respecto a la ponderancia vigente</span>
        </div>
        <div class="aviso"><i class="fas fa-lock"></i> ${confidencial}</div>`;

        // Una tabla por categoría: cada bloque se mantiene intacto en la página
        categoriasOrdenadas().forEach(cat => {
            const plist = catalogo().filter(p => (p.categoriaId || 'otros') === cat.id);
            if (!plist.length) return;
            html += `<div class="bloque"><h2>${cat.nombre}</h2><table>
                <thead><tr><th style="text-align:left">Parámetro</th>${MODELOS.map(m => `<th>${m}</th>`).join('')}</tr></thead><tbody>`;
            plist.forEach(p => {
                html += `<tr><td class="l">${p.nombre}</td>${MODELOS.map(m => {
                    const v = Number(draft.pesos[m][p.id]) || 0;
                    const chg = v !== Number(draft.inicial.pesos[m][p.id]);
                    return `<td class="${chg ? 'chg' : ''}">${v}</td>`;
                }).join('')}</tr>`;
            });
            html += `</tbody></table></div>`;
        });

        html += `<div class="bloque"><h2>Resumen</h2><table><tbody>
            <tr class="total"><td class="l">Total de puntos si todo cumple</td>${MODELOS.map(m => `<td>${totalModelo(m)}</td>`).join('')}</tr>
            </tbody></table></div>`;

        html += `<div class="bloque"><h2>Parámetros aplicables por entidad — ${formatearMesLegible(mes)}</h2>
            <table><thead><tr><th style="text-align:left">Entidad</th><th>Tipo</th><th>Modelo</th><th>Parámetros</th><th>Máx. puntos</th></tr></thead><tbody>`;
        ['sucursal', 'franquicia'].forEach(tipo => {
            entidadesPorTipo(tipo).forEach(e => {
                html += `<tr><td class="l">${e.nombre}</td><td>${tipo}</td><td>${window.kpi2Utils.getModeloEntidad(e.id, tipo) || '—'}</td><td>${paramsAplicablesDraft(e.id, tipo, mes).length}</td><td>${maximoDraft(e.id, tipo, mes)}</td></tr>`;
            });
        });
        html += `</tbody></table></div>`;

        html += `<div class="pie">${confidencial}<br>Emitido el ${ahora.toLocaleString('es-MX')} — Café La Cabaña · Sistema de Evaluaciones</div>`;
        html += `</body></html>`;

        const w = window.open('', '_blank');
        if (!w) { alert('El navegador bloqueó la ventana. Permite ventanas emergentes.'); return; }
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 500);
    }

    function toggleExportMenu(ev) {
        ev.stopPropagation();
        const menu = document.getElementById('pondExportMenu');
        if (!menu) return;
        if (menu.classList.toggle('abierto')) {
            setTimeout(() => document.addEventListener('click', cerrarMenuExportar, { once: true }), 0);
        }
    }

    function cerrarMenuExportar() {
        const m = document.getElementById('pondExportMenu');
        if (m) m.classList.remove('abierto');
    }

    function exportar(formato) {
        asegurarDraft();
        cerrarMenuExportar();
        if (formato === 'xlsx') exportarXLSX();
        else if (formato === 'csv') exportarCSV();
        else if (formato === 'pdf') exportarPDF();
        else exportarJSON();
    }

    function importarBorrador(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const d = JSON.parse(reader.result);
                if (!d || d.tipo !== 'ponderanciasKPI2-borrador' || !d.pesos || !d.excluidos) {
                    alert('El archivo no es un borrador de ponderancias válido.');
                    return;
                }
                const base = asegurarDraft(); // conserva `inicial` (estado vigente)
                base.pesos = d.pesos;
                Object.entries(d.excluidos).forEach(([t, m]) => {
                    if (!base.excluidos[t]) base.excluidos[t] = {};
                    Object.entries(m).forEach(([eid, arr]) => { base.excluidos[t][eid] = new Set(arr); });
                });
                persistirDraft();
                renderPonderancias();
            } catch (e) {
                alert('No se pudo leer el archivo.');
            }
        };
        reader.readAsText(file);
    }

    function contarCambios() {
        if (!draft) return { pesos: 0, aplica: 0 };
        let pesos = 0;
        MODELOS.forEach(m => {
            catalogo().forEach(p => {
                if (Number(draft.pesos[m][p.id]) !== Number(draft.inicial.pesos[m][p.id])) pesos++;
            });
        });
        let aplica = 0;
        ['sucursal', 'franquicia'].forEach(tipo => {
            entidadesPorTipo(tipo).forEach(e => {
                const ahora = draft.excluidos[tipo][e.id] || new Set();
                const antes = new Set(draft.inicial.excluidos[tipo][e.id] || []);
                ahora.forEach(id => { if (!antes.has(id)) aplica++; });
                antes.forEach(id => { if (!ahora.has(id)) aplica++; });
            });
        });
        return { pesos, aplica };
    }

    function marcarCambio() {
        if (!draft) return;
        draft.tocado = true;
        persistirDraft();
        const c = contarCambios();
        const el = document.getElementById('pondResumenCambios');
        if (el) {
            el.textContent = (c.pesos + c.aplica) === 0
                ? 'Sin cambios pendientes'
                : `Cambios sin guardar: ${c.pesos} ponderaciones · ${c.aplica} aplicabilidad`;
            el.style.color = (c.pesos + c.aplica) === 0 ? '#6c757d' : '#b8860b';
        }
    }

    function setPeso(paramId, modelo, valor) {
        const d = asegurarDraft();
        const v = Math.max(0, Math.min(99, Number(valor) || 0));
        d.pesos[modelo][paramId] = v;
        const input = document.querySelector(`input[data-pond-peso="${paramId}"][data-pond-modelo="${modelo}"]`);
        if (input) {
            const cambio = v !== Number(d.inicial.pesos[modelo][paramId]);
            input.style.background = cambio ? '#fff3cd' : '';
            input.style.fontWeight = cambio ? '700' : '';
        }
        refrescarMaximos();
        marcarCambio();
    }

    function setAplica(tipo, entidadId, paramId, checked) {
        const d = asegurarDraft();
        const set = d.excluidos[tipo][entidadId];
        if (!set) return;
        if (checked) set.delete(normId(paramId));
        else set.add(normId(paramId));
        const celda = document.getElementById(`pond-ap-${tipo}-${entidadId}-${paramId}`);
        if (celda) {
            const antes = new Set(d.inicial.excluidos[tipo][entidadId] || []);
            const cambio = antes.has(normId(paramId)) !== set.has(normId(paramId));
            celda.parentElement.style.background = cambio ? '#fff3cd' : '';
        }
        refrescarTotalesEntidad(tipo, entidadId);
        refrescarMaximos();
        marcarCambio();
    }

    function paramsAplicablesDraft(entidadId, tipo, mes) {
        const excl = draft.excluidos[tipo][entidadId] || new Set();
        return catalogoVigente(mes).filter(p => !excl.has(normId(p.id)));
    }

    function maximoDraft(entidadId, tipo, mes) {
        const modelo = window.kpi2Utils.getModeloEntidad(entidadId, tipo);
        return paramsAplicablesDraft(entidadId, tipo, mes)
            .reduce((s, p) => s + (Number(draft.pesos[modelo] && draft.pesos[modelo][p.id]) || 0), 0);
    }

    function refrescarTotalesEntidad(tipo, entidadId) {
        const mes = window.mesSeleccionado || obtenerMesActual();
        const el = document.getElementById(`pond-tot-${tipo}-${entidadId}`);
        if (el) {
            el.textContent = `${paramsAplicablesDraft(entidadId, tipo, mes).length} par · máx ${maximoDraft(entidadId, tipo, mes)}`;
        }
    }

    function refrescarMaximos() {
        ['sucursal', 'franquicia'].forEach(tipo => {
            entidadesPorTipo(tipo).forEach(e => refrescarTotalesEntidad(tipo, e.id));
        });
        MODELOS.forEach(m => {
            const el = document.getElementById(`pond-total-${m}`);
            if (el) {
                el.innerHTML = `<strong>${catalogo().reduce((s, p) => s + (Number(draft.pesos[m][p.id]) || 0), 0)}</strong>`;
            }
        });
    }

    function obtenerMesSiguiente() {
        const ahora = new Date();
        const sig = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
        return `${sig.getFullYear()}-${String(sig.getMonth() + 1).padStart(2, '0')}`;
    }

    function renderPropuestas() {
        return `
            <div class="pond-propuestas">
                ${PROPUESTAS.map(prop => `
                    <div class="pond-propuesta">
                        <h4><i class="fas fa-lightbulb"></i> ${prop.titulo}</h4>
                        <p>${prop.desc}</p>
                        <button class="pond-btn-propuesta" onclick="window.ponderanciasUI.aplicarPropuesta('${prop.id}')">
                            <i class="fas fa-magic"></i> Aplicar a borrador
                        </button>
                    </div>
                `).join('')}
                <div class="pond-propuesta pond-propuesta-vigente">
                    <h4><i class="fas fa-history"></i> Configuración vigente</h4>
                    <p>Restaura el borrador a los valores actuales (ponderancias y aplicabilidad). Úsala para volver al punto de partida después de probar una propuesta.</p>
                    <button class="pond-btn-propuesta pond-btn-vigente" onclick="window.ponderanciasUI.restaurarVigente()">
                        <i class="fas fa-undo"></i> Restaurar vigente
                    </button>
                </div>
            </div>
            <p class="pond-nota" style="margin:-6px 0 14px 4px">Las propuestas llenan la tabla de abajo como borrador — puedes ajustar manualmente después de aplicar, y simular antes de guardar.</p>
        `;
    }

    function renderTablaPesos() {
        const vigente = window.kpi2Utils.listarVersionesPonderancia().slice(-1)[0];
        let html = `
            <div class="pond-card">
                <h3><i class="fas fa-balance-scale"></i> Ponderancias por modelo
                    <span class="pond-badge">Versión vigente: ${vigente ? (vigente.nombre || vigente.vigenteDesde) : 'Base'}</span>
                </h3>
                <p class="pond-nota">Peso de cada parámetro según el modelo de la entidad. Estas son las ponderancias oficiales. Los cambios se guardan como nueva versión con la vigencia elegida; meses anteriores conservan su ponderancia.</p>
                <div class="pond-table-wrap">
                    <table class="pond-table">
                        <thead>
                            <tr>
                                <th style="text-align:left">Parámetro</th>
                                ${MODELOS.map(m => `<th>${m}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
        `;
        let num = 0;
        categoriasOrdenadas().forEach(cat => {
            const params = catalogo().filter(p => (p.categoriaId || 'otros') === cat.id);
            if (!params.length) return;
            html += `<tr class="pond-cat"><td colspan="${1 + MODELOS.length}">${cat.nombre}</td></tr>`;
            params.forEach(p => {
                num++;
                html += `<tr>
                    <td style="text-align:left"><span class="pond-num">${num}</span> ${p.nombre}</td>
                    ${MODELOS.map(m => {
                        const dif = Number(draft.pesos[m][p.id]) !== Number(draft.inicial.pesos[m][p.id]);
                        return `<td><input type="number" min="0" max="99" step="1"
                        value="${Number(draft.pesos[m][p.id]) || 0}"
                        ${dif ? 'style="background:#fff3cd;font-weight:700"' : ''}
                        data-pond-peso="${p.id}" data-pond-modelo="${m}"
                        onchange="window.ponderanciasUI.setPeso('${p.id}','${m}',this.value)"></td>`;
                    }).join('')}
                </tr>`;
            });
        });
        html += `
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style="text-align:left"><strong>Total si todo cumple</strong></td>
                                ${MODELOS.map(m => `<td id="pond-total-${m}"><strong>${catalogo().reduce((s, p) => s + (Number(draft.pesos[m][p.id]) || 0), 0)}</strong></td>`).join('')}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        return html;
    }

    function renderMatrizAplicabilidad(tipo, titulo) {
        const entidades = entidadesPorTipo(tipo);
        const mes = window.mesSeleccionado || obtenerMesActual();
        let html = `
            <div class="pond-card">
                <h3><i class="fas fa-th"></i> ${titulo}</h3>
                <p class="pond-nota">☑ = el parámetro aplica y cuenta en el resultado de esa entidad. Al guardar, la configuración sustituye las exclusiones y listas del catálogo para todas las entidades.</p>
                <div class="pond-table-wrap">
                    <table class="pond-table pond-matriz">
                        <thead>
                            <tr>
                                <th class="pond-sticky" style="text-align:left">Parámetro</th>
                                ${entidades.map(e => `<th><span class="pond-vert">${e.nombre}</span></th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
        `;
        categoriasOrdenadas().forEach(cat => {
            const params = catalogoVigente(mes).filter(p => (p.categoriaId || 'otros') === cat.id);
            if (!params.length) return;
            html += `<tr class="pond-cat"><td class="pond-sticky" style="text-align:left">${cat.nombre}</td><td colspan="${entidades.length}"></td></tr>`;
            params.forEach(p => {
                html += `<tr><td class="pond-sticky" style="text-align:left">${p.nombre}</td>`;
                entidades.forEach(e => {
                    const aplica = !draft.excluidos[tipo][e.id].has(normId(p.id));
                    html += `<td><input type="checkbox" id="pond-ap-${tipo}-${e.id}-${p.id}" ${aplica ? 'checked' : ''}
                        onchange="window.ponderanciasUI.setAplica('${tipo}','${e.id}','${p.id}',this.checked)"></td>`;
                });
                html += `</tr>`;
            });
        });
        html += `
                        </tbody>
                        <tfoot>
                            <tr>
                                <td class="pond-sticky" style="text-align:left"><strong>Parámetros / Máx. puntos</strong></td>
                                ${entidades.map(e => `<td id="pond-tot-${tipo}-${e.id}" class="pond-tot"></td>`).join('')}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        return html;
    }

    function renderPonderancias() {
        const container = document.getElementById('ponderanciasContainer');
        if (!container) return;

        if (!esAdmin()) {
            container.innerHTML = `<div class="pond-card"><p class="pond-nota">Sección disponible solo para administradores.</p></div>`;
            return;
        }
        if (!window.kpi2Utils) {
            container.innerHTML = `<div class="pond-card"><p class="pond-nota">Módulo KPI2 no cargado.</p></div>`;
            return;
        }

        asegurarDraft();
        const mes = window.mesSeleccionado || obtenerMesActual();
        const versiones = window.kpi2Utils.listarVersionesPonderancia();
        const hayOverride = !!(window.kpi2ConfigOverrides && window.kpi2ConfigOverrides.aplicabilidad);

        container.innerHTML = `
            <div class="pond-wrap">
                <h2 class="pond-titulo">Ponderancias — Configuración</h2>
                <div class="pond-card">
                    <strong>Versiones guardadas:</strong> ${versiones.length - 1 > 0 ? versiones.slice(1).map(v => `${v.nombre || 'ajuste'} (desde ${v.vigenteDesde})`).join(', ') : 'ninguna — usando ponderancia base del código'}<br>
                    <strong>Aplicabilidad:</strong> ${hayOverride ? 'configuración remota activa' : 'listas del catálogo + parametros_excluidos.js'}<br>
                    <span id="pondResumenCambios">Sin cambios pendientes</span>
                    ${draft.recuperadoEn ? `<br><span class="pond-badge" style="background:#fff3cd;color:#856404"><i class="fas fa-history"></i> Borrador recuperado del guardado local (${new Date(draft.recuperadoEn).toLocaleString('es-MX')})</span>` : ''}
                    <p class="pond-nota" style="margin-top:10px">
                        <i class="fas fa-info-circle"></i> Las <strong>ponderancias</strong> entran en vigor desde el mes elegido al guardar y no alteran meses anteriores.
                        La <strong>aplicabilidad</strong> (qué parámetros cuenta cada entidad) se aplica de inmediato a todos los meses.
                        Si eliges un mes ya evaluado como vigencia, ese mes se recalcula con la nueva ponderancia.
                    </p>
                </div>
                ${renderPropuestas()}
                ${renderTablaPesos()}
                ${renderMatrizAplicabilidad('sucursal', 'Parámetros aplicables — Sucursales')}
                ${renderMatrizAplicabilidad('franquicia', 'Parámetros aplicables — Franquicias')}
                <div class="pond-card">
                    <h3><i class="fas fa-flask"></i> Simulador — impacto en ${formatearMesLegible(mes)}</h3>
                    <p class="pond-nota">Recalcula el resultado de las evaluaciones del mes seleccionado con los cambios sin guardar. No modifica datos.</p>
                    <button class="pond-btn-simular" onclick="window.ponderanciasUI.simular()"><i class="fas fa-play"></i> Simular con cambios actuales</button>
                    <div id="pondSimResultado" style="margin-top:14px"></div>
                </div>
                <div class="pond-card pond-guardar">
                    <h3><i class="fas fa-save"></i> Guardar configuración</h3>
                    <div class="pond-guardar-campos">
                        <label class="pond-campo">Vigencia de la nueva ponderancia
                            <input type="month" id="pondVigencia" value="${obtenerMesSiguiente()}">
                        </label>
                        <label class="pond-campo">Nombre del ajuste <span class="pond-tag">si se omite, se asigna folio automático</span>
                            <input type="text" id="pondMotivo" placeholder="Ej. Ajuste directivo oct-2026">
                        </label>
                    </div>
                    <div class="pond-guardar-btns">
                        <div class="pond-split">
                            <button class="pond-btn-exportar pond-split-main" onclick="window.ponderanciasUI.exportar('json')">
                                <i class="fas fa-download"></i> Exportar borrador
                            </button>
                            <button class="pond-btn-exportar pond-split-caret" onclick="window.ponderanciasUI.toggleExportMenu(event)" title="Elegir formato">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="pond-export-menu" id="pondExportMenu">
                                <button onclick="window.ponderanciasUI.exportar('json')"><i class="fas fa-file-code"></i> JSON — respaldo reimportable</button>
                                <button onclick="window.ponderanciasUI.exportar('xlsx')"><i class="fas fa-file-excel"></i> Excel — pesos + aplicabilidad</button>
                                <button onclick="window.ponderanciasUI.exportar('csv')"><i class="fas fa-file-csv"></i> CSV — solo ponderancias</button>
                                <button onclick="window.ponderanciasUI.exportar('pdf')"><i class="fas fa-file-pdf"></i> PDF — documento para imprimir</button>
                            </div>
                        </div>
                        <button class="pond-btn-guardar" onclick="window.ponderanciasUI.guardar()" ${puedeEscribir() ? '' : 'disabled title="Requiere sesión admin en Firebase"'}>
                            <i class="fas fa-save"></i> Guardar configuración
                        </button>
                        <button class="pond-btn-descartar" onclick="window.ponderanciasUI.descartar()">
                            <i class="fas fa-undo"></i> Descartar cambios
                        </button>
                        <button class="pond-btn-respaldo" onclick="document.getElementById('pondImportFile').click()">
                            <i class="fas fa-upload"></i> Importar borrador
                        </button>
                        <input type="file" id="pondImportFile" accept=".json" style="display:none" onchange="window.ponderanciasUI.importar(this.files[0]); this.value=''">
                    </div>
                    <p class="pond-nota" style="margin:12px 0 0 0"><i class="fas fa-shield-alt"></i> El borrador se respalda automáticamente en este navegador aunque se cierre la página — el archivo exportado es el respaldo definitivo por si algo falla al guardar.</p>
                </div>
            </div>
        `;
        refrescarMaximos();
        marcarCambio();
    }

    function maximoActual(entidadId, tipo, mes) {
        const modelo = window.kpi2Utils.getModeloEntidad(entidadId, tipo);
        const excl = estadoExcluidosActual(entidadId, tipo);
        return catalogoVigente(mes)
            .filter(p => !excl.has(normId(p.id)))
            .reduce((s, p) => s + (Number(window.kpi2Utils.getPesoKPI2(p.id, p.peso, modelo, mes)) || 0), 0);
    }

    function simular() {
        const host = document.getElementById('pondSimResultado');
        if (!host) return;
        const mes = window.mesSeleccionado || obtenerMesActual();
        const filas = [];

        ['sucursal', 'franquicia'].forEach(tipo => {
            const grupo = tipo === 'sucursal' ? 'sucursales' : 'franquicias';
            entidadesPorTipo(tipo).forEach(e => {
                const cont = window.evaluaciones && window.evaluaciones[grupo] && window.evaluaciones[grupo][e.id]
                    ? window.evaluaciones[grupo][e.id][mes] : null;
                const evKpi2 = cont
                    ? ((cont.modalidades && cont.modalidades.kpi2) || cont._kpi2 || (cont.parametros ? cont : null))
                    : null;
                if (!evKpi2) return;

                const actual = window.kpi2Utils.calcularDetalleKPI2(e.id, tipo, evKpi2);
                const excl = draft.excluidos[tipo][e.id];
                const sim = window.kpi2Utils.calcularDetalleKPI2(e.id, tipo, evKpi2, {
                    tablaPesos: draft.pesos,
                    esAplicable: (p) => !excl.has(normId(p.id))
                });
                filas.push({
                    nombre: e.nombre, tipo,
                    modelo: window.kpi2Utils.getModeloEntidad(e.id, tipo) || '—',
                    maxAct: maximoActual(e.id, tipo, mes),
                    maxSim: maximoDraft(e.id, tipo, mes),
                    kpiAct: actual ? actual.kpi : null,
                    kpiSim: sim ? sim.kpi : null
                });
            });
        });

        if (!filas.length) {
            host.innerHTML = `<p class="pond-nota">No hay evaluaciones KPI2 en ${formatearMesLegible(mes)} para simular.</p>`;
            return;
        }

        filas.sort((a, b) => ((a.kpiSim ?? 1) - (a.kpiAct ?? 1)) - ((b.kpiSim ?? 1) - (b.kpiAct ?? 1)));
        host.innerHTML = `
            <div class="pond-table-wrap">
                <table class="pond-table">
                    <thead><tr>
                        <th style="text-align:left">Entidad</th><th>Modelo</th>
                        <th>Máx. actual</th><th>Máx. simulado</th>
                        <th>KPI actual</th><th>KPI simulado</th><th>Δ</th>
                    </tr></thead>
                    <tbody>
                        ${filas.map(f => {
                            const d = (f.kpiSim != null && f.kpiAct != null) ? (f.kpiSim - f.kpiAct) * 100 : null;
                            const color = d == null ? '#999' : d > 0.05 ? '#28a745' : d < -0.05 ? '#dc3545' : '#6c757d';
                            return `<tr>
                                <td style="text-align:left">${f.nombre} <span class="pond-tag">${f.tipo}</span></td>
                                <td>${f.modelo}</td>
                                <td>${f.maxAct || '—'}</td><td>${f.maxSim}</td>
                                <td>${f.kpiAct != null ? (f.kpiAct * 100).toFixed(1) + '%' : '—'}</td>
                                <td><strong>${f.kpiSim != null ? (f.kpiSim * 100).toFixed(1) + '%' : '—'}</strong></td>
                                <td style="color:${color};font-weight:700">${d != null ? (d > 0 ? '+' : '') + d.toFixed(1) + ' pp' : '—'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function serializarAplicabilidad() {
        const aplicabilidad = { sucursales: {}, franquicias: {} };
        ['sucursal', 'franquicia'].forEach(tipo => {
            const grupo = tipo === 'sucursal' ? 'sucursales' : 'franquicias';
            entidadesPorTipo(tipo).forEach(e => {
                const set = draft.excluidos[tipo][e.id] || new Set();
                aplicabilidad[grupo][e.id] = catalogo()
                    .filter(p => set.has(normId(p.id)))
                    .map(p => p.id);
            });
        });
        return aplicabilidad;
    }

    async function guardar() {
        if (!puedeEscribir()) {
            alert('Se requiere sesión de administrador en Firebase para guardar.');
            return;
        }
        const vigencia = (document.getElementById('pondVigencia') || {}).value || obtenerMesSiguiente();
        const motivoInput = ((document.getElementById('pondMotivo') || {}).value || '').trim();
        // Si no se captura nombre, se asigna folio automático con fecha/hora
        const ahora = new Date();
        const folio = `AJ-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}${String(ahora.getSeconds()).padStart(2, '0')}`;
        const motivo = motivoInput || `Ajuste ${folio}`;

        const cambios = contarCambios();
        if (cambios.pesos === 0 && cambios.aplica === 0) {
            alert('No hay cambios que guardar.');
            return;
        }

        const versiones = window.kpi2Utils.listarVersionesPonderancia()
            .filter(v => v.vigenteDesde !== '0000-00')
            .map(v => ({ vigenteDesde: v.vigenteDesde, nombre: v.nombre, pesos: v.pesos }));

        let nota = [];
        if (cambios.pesos > 0) {
            const yaExiste = versiones.findIndex(v => v.vigenteDesde === vigencia);
            const nuevaVersion = {
                vigenteDesde: vigencia,
                nombre: motivo,
                pesos: JSON.parse(JSON.stringify(draft.pesos))
            };
            if (yaExiste >= 0) versiones[yaExiste] = nuevaVersion;
            else versiones.push(nuevaVersion);
            nota.push(`ponderancia vigente desde ${formatearMesLegible(vigencia)}`);
        }
        if (cambios.aplica > 0) nota.push('aplicabilidad actualizada (efecto inmediato)');

        if (!confirm(`Guardar configuración KPI2:\n- ${nota.join('\n- ')}\n\n¿Continuar?`)) return;

        try {
            const payload = { versiones, aplicabilidad: serializarAplicabilidad() };
            await window.firebaseDB.guardarPonderanciasKPI2(payload);
            window.kpi2Utils.aplicarConfiguracionKPI2(payload);
            draft = null;
            limpiarDraftLS();
            renderPonderancias();
            alert('Configuración guardada. Los cambios ya están activos en todos los cálculos.');
        } catch (e) {
            console.error(e);
            alert('Error al guardar la configuración. Revisa la consola.');
        }
    }

    function descartar() {
        draft = null;
        limpiarDraftLS();
        renderPonderancias();
    }

    window.ponderanciasUI = { setPeso, setAplica, aplicarPropuesta, restaurarVigente, simular, guardar, descartar, exportar, importar: importarBorrador, toggleExportMenu };
    window.renderPonderancias = renderPonderancias;
})();
