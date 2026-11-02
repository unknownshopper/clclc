// crear_evals_octubre.mjs — Genera las evaluaciones KPI2 de franquicias para
// 2026-10 con todos los parámetros aplicables al 100% y el video fijo del mes,
// para que admin solo entre a ajustar puntuaciones.
//
// Uso: FB_PASS='tu_password' node crear_evals_octubre.mjs
//      (o sin FB_PASS, el script la pide por teclado)
//      FB_EMAIL se asume admin por defecto.
//      --dry   solo imprime lo que crearía, sin escribir.

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';
import { videoLinks } from './data/video_links.js';
import fs from 'node:fs';
import vm from 'node:vm';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MES = '2026-10';
const DRY = process.argv.includes('--dry');

// ===== 1. Catálogo + lógica real en sandbox =====
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

// ===== 2. Autenticación =====
const email = process.env.FB_EMAIL || 'unknownshoppersmx@gmail.com';
let pass = process.env.FB_PASS;
if (!pass) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    pass = await new Promise(r => rl.question('Contraseña Firebase: ', r));
    rl.close();
}

const app = initializeApp(firebaseConfig);
await signInWithEmailAndPassword(getAuth(app), email, pass);
const db = getFirestore(app);
console.log(`Autenticado como ${email}`);

// ===== 3. Aplicar configuración vigente (versiones + aplicabilidad remota) =====
const cfgSnap = await getDoc(doc(db, 'configuracion', 'ponderanciasKPI2'));
if (cfgSnap.exists() && typeof kpi2.aplicarConfiguracionKPI2 === 'function') {
    kpi2.aplicarConfiguracionKPI2(cfgSnap.data());
    console.log('Configuración remota aplicada (versiones de pesos + aplicabilidad).');
}

// ===== 4. Dedupe: evaluaciones KPI2 ya existentes del mes =====
const existentes = new Set();
const q = query(collection(db, 'evaluaciones'), where('mes', '==', MES), where('tipo', '==', 'franquicia'));
(await getDocs(q)).forEach(d => {
    const x = d.data();
    if (x.modalidad === 'kpi2') existentes.add(x.entidadId);
});
console.log(`Evaluaciones KPI2 existentes en ${MES}: ${existentes.size}`);

// ===== 5. Generar documentos =====
const links = videoLinks[MES] || {};
let creadas = 0, saltadas = 0;

for (const [entidadId, videoUrl] of Object.entries(links)) {
    const entidad = (W.franquicias || []).find(f => f.id === entidadId);
    if (!entidad) { console.log(`  ⚠ ${entidadId}: no existe en catálogo, saltada`); saltadas++; continue; }
    if (existentes.has(entidadId)) { console.log(`  = ${entidad.nombre}: ya existe, saltada`); saltadas++; continue; }

    // El arreglo viene del sandbox vm (otro realm): Firestore lo rechaza como
    // "custom Array object". Se copia a un Array normal del realm principal.
    const modelos = JSON.parse(JSON.stringify(W.getModelosEntidad(entidadId, 'franquicia')));
    const excluidos = W.obtenerIdsParametrosExcluidos(entidadId, 'franquicia');
    const aplicables = catalogo.filter(p =>
        p && !p.bono
        && W.parametroVigenteEnMes(p, MES)
        && !excluidos.includes(norm(p.id))
        && W.parametroAplicaAEntidad(p, 'franquicia', entidadId, modelos)
    );

    const parametros = {};
    aplicables.forEach(p => { parametros[p.id] = Number(p.peso) || 0; });

    const detalle = kpi2.calcularDetalleKPI2(entidadId, 'franquicia', { mes: MES, modelos, parametros });
    if (!detalle || !(detalle.totalMax > 0)) { console.log(`  ⚠ ${entidad.nombre}: sin parámetros aplicables, saltada`); saltadas++; continue; }

    const evaluacionData = {
        modalidad: 'kpi2',
        tipo: 'franquicia',
        entidadId,
        entidadNombre: entidad.nombre,
        mes: MES,
        modelos,
        parametros,
        observaciones: {},
        totalObtenido: detalle.totalObt,
        totalMaximo: detalle.totalMax,
        kpi: detalle.kpi,
        estado: (detalle.kpi * 100) >= 95 ? 'Excelente' : (detalle.kpi * 100) >= 90 ? 'Bueno' : 'Necesita mejora',
        estadoPublicacion: 'borrador',
        fechaPublicacion: null,
        videoUrl,
        videoUrlUpdatedAt: new Date(),
        fechaCreacion: new Date(),
        timestamp: Date.now()
    };

    console.log(`  ${DRY ? '[dry]' : '+'} ${entidad.nombre} [${modelos.join('+')}]: ${aplicables.length} par, ${detalle.totalObt}/${detalle.totalMax} = ${(detalle.kpi * 100).toFixed(1)}% · video ✓`);
    if (!DRY) {
        const ref = await addDoc(collection(db, 'evaluaciones'), evaluacionData);
        console.log(`      → doc ${ref.id}`);
    }
    creadas++;
}

console.log(`\nListo: ${creadas} ${DRY ? 'por crear' : 'creadas'}, ${saltadas} saltadas.${DRY ? ' (modo --dry, nada se escribió)' : ''}`);
process.exit(0);
