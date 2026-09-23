// validar_config.mjs — Lee configuracion/ponderanciasKPI2 de Firestore,
// aplica la configuración a la lógica real (utils.js) y reporta el estado
// efectivo: versiones guardadas, y por entidad los parámetros que cuentan
// con su ponderancia vigente. Genera validacion_config.csv.
//
// Uso: node validar_config.mjs   (pedirá correo/contraseña de Firebase)

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';
import fs from 'node:fs';
import vm from 'node:vm';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));

// ===== 1. Cargar catálogo y lógica real en sandbox =====
const ctx = {
    window: {}, console,
    document: { addEventListener() {}, getElementById() { return null }, querySelector() { return null } }
};
vm.createContext(ctx);
for (const f of ['data/parametros.js', 'data/parametros_excluidos.js', 'data/sucursales.js', 'data/franquicias.js', 'utils.js']) {
    vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f });
}
const W = ctx.window;
const catalogo = W.parametros;
const kpi2 = W.kpi2Utils;
const norm = s => String(s || '').toLowerCase().replace(/[-_]/g, '');

// ===== 2. Autenticarse y leer Firestore =====
const email = process.env.FB_EMAIL || 'unknownshoppersmx@gmail.com';
let pass = process.env.FB_PASS;
if (!pass) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    pass = await new Promise(r => rl.question('Contraseña Firebase: ', r));
    rl.close();
}

const app = initializeApp(firebaseConfig);
await signInWithEmailAndPassword(getAuth(app), email, pass);
const snap = await getDoc(doc(getFirestore(app), 'configuracion', 'ponderanciasKPI2'));

if (!snap.exists()) {
    console.log('\nNo existe configuracion/ponderanciasKPI2 — se usa la ponderancia base del código.');
    process.exit(0);
}
const cfg = snap.data();
console.log('\n===== Documento configuracion/ponderanciasKPI2 =====');
console.log('Versiones de ponderancia guardadas:');
(cfg.versiones || []).forEach(v => console.log(`  - ${v.nombre || '(sin nombre)'} | vigente desde ${v.vigenteDesde} | ${Object.keys(v.pesos || {}).length} modelos`));
const apl = cfg.aplicabilidad || {};
console.log(`Aplicabilidad remota: ${Object.keys(apl.sucursales || {}).length} sucursales · ${Object.keys(apl.franquicias || {}).length} franquicias`);

// ===== 3. Diff de pesos: cada versión guardada vs. base del código =====
const MODELOS = ['Cafetería', 'Express', 'Móvil'];
const base = kpi2.listarVersionesPonderancia()[0].pesos;
(cfg.versiones || []).forEach(v => {
    console.log(`\n===== Pesos de "${v.nombre}" (desde ${v.vigenteDesde}) que difieren de la base =====`);
    let difs = 0;
    MODELOS.forEach(m => {
        const tabla = (v.pesos || {})[m] || {};
        catalogo.forEach(p => {
            const vb = (base[m] || {})[p.id] ?? Number(p.peso) ?? 0;
            const vn = tabla[p.id] ?? Number(p.peso) ?? 0;
            if (vb !== vn) {
                difs++;
                console.log(`  ${p.nombre.padEnd(32)} ${m.padEnd(9)} base=${vb} → guardado=${vn}`);
            }
        });
    });
    if (!difs) console.log('  (idéntica a la base)');
});

// ===== 4. Diff de aplicabilidad: remota vs. listas del catálogo + exclusiones =====
const ctxBase = {
    window: {}, console,
    document: { addEventListener() {}, getElementById() { return null }, querySelector() { return null } }
};
vm.createContext(ctxBase);
for (const f of ['data/parametros.js', 'data/parametros_excluidos.js', 'data/sucursales.js', 'data/franquicias.js', 'utils.js']) {
    vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctxBase, { filename: f });
}
const WB = ctxBase.window;

console.log('\n===== Aplicabilidad remota que difiere del default del código =====');
let difsApl = 0;
[['sucursal', 'sucursales', W.sucursales || []], ['franquicia', 'franquicias', W.franquicias || []]].forEach(([tipo, grupo, ents]) => {
    ents.filter(e => e.activa).forEach(e => {
        const remoto = new Set(((apl[grupo] || {})[e.id] || []).map(norm));
        const defecto = new Set([
            ...(WB.obtenerIdsParametrosExcluidos(e.id, tipo) || []),
            ...catalogo.filter(p => !WB.parametroAplicaAEntidad(p, tipo, e.id)).map(p => norm(p.id))
        ]);
        const quitados = [...defecto].filter(x => !remoto.has(x));
        const agregados = [...remoto].filter(x => !defecto.has(x));
        if (quitados.length || agregados.length) {
            difsApl++;
            const nombre = id => (catalogo.find(p => norm(p.id) === id) || {}).nombre || id;
            console.log(`  ${e.nombre}:`);
            quitados.forEach(id => console.log(`    + ahora aplica: ${nombre(id)}`));
            agregados.forEach(id => console.log(`    - ahora excluido: ${nombre(id)}`));
        }
    });
});
if (!difsApl) console.log('  (idéntica al default)');

// ===== 5. Aplicar la config a la lógica real =====
kpi2.aplicarConfiguracionKPI2(cfg);

const mesActual = new Date().toISOString().slice(0, 7);
const meses = [mesActual, '2026-10']; // actual + octubre (vigencia del ajuste)

console.log('\n===== Estado efectivo por entidad =====');
const entidades = [
    ...(W.sucursales || []).filter(e => e.activa).map(e => ({ ...e, tipo: 'sucursal' })),
    ...(W.franquicias || []).filter(e => e.activa).map(e => ({ ...e, tipo: 'franquicia' }))
];

const lineas = ['tipo,entidad,modelo,mes,parametro,categoria,peso_kpi2'];
for (const e of entidades) {
    const modelo = kpi2.getModeloEntidad(e.id, e.tipo) || '—';
    const excl = new Set((W.obtenerIdsParametrosExcluidos(e.id, e.tipo) || []));
    for (const mes of meses) {
        const vigentes = catalogo.filter(p => !p.vigenteDesde || mes >= p.vigenteDesde);
        const aplican = vigentes.filter(p =>
            W.parametroAplicaAEntidad(p, e.tipo, e.id) && !excl.has(norm(p.id)));
        const max = aplican.reduce((s, p) => s + kpi2.getPesoKPI2(p.id, p.peso, modelo, mes), 0);
        console.log(`  ${e.nombre.padEnd(22)} ${String(modelo).padEnd(9)} ${mes}: ${String(aplican.length).padStart(2)} par · máx ${String(max).padStart(3)}`);
        aplican.forEach(p => {
            lineas.push([e.tipo, e.id, modelo, mes, `"${p.nombre}"`, p.categoriaId || '',
                kpi2.getPesoKPI2(p.id, p.peso, modelo, mes)].join(','));
        });
    }
}

const csvPath = path.join(DIR, 'validacion_config.csv');
fs.writeFileSync(csvPath, '﻿' + lineas.join('\n'));
console.log(`\nDetalle completo por parámetro → ${csvPath}`);
process.exit(0);
