// comparar_exportacion.mjs — Compara el Excel exportado en la reunión
// (docs/ponderancias-borrador-AAAAMMDD.xlsx) contra la versión guardada en
// Firestore (configuracion/ponderanciasKPI2). Deben coincidir celda a celda.
//
// Uso: FB_PASS=xxx node comparar_exportacion.mjs [ruta.xlsx]

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const xlsxPath = path.join(DIR, process.argv[2] || 'docs/ponderancias-borrador-20260923.xlsx');

// Catálogo para mapear nombre → paramId
const ctx = { window: {}, document: { addEventListener() {}, getElementById() { return null } }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, 'data/parametros.js'), 'utf8'), ctx);
const catalogo = ctx.window.parametros;
const MODELOS = ['Cafetería', 'Express', 'Móvil'];

// Auth + lectura del doc
let pass = process.env.FB_PASS;
if (!pass) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    pass = await new Promise(r => rl.question('Contraseña Firebase: ', r));
    rl.close();
}
const app = initializeApp(firebaseConfig);
await signInWithEmailAndPassword(getAuth(app), process.env.FB_EMAIL || 'unknownshoppersmx@gmail.com', pass);
const snap = await getDoc(doc(getFirestore(app), 'configuracion', 'ponderanciasKPI2'));
if (!snap.exists()) { console.log('No hay config guardada.'); process.exit(1); }
const versiones = snap.data().versiones || [];
const ultima = versiones[versiones.length - 1];
console.log(`Versión en Firestore: "${ultima.nombre}" (vigente ${ultima.vigenteDesde})`);
console.log(`Excel: ${path.basename(xlsxPath)}\n`);

// Leer el xlsx
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(xlsxPath);
const ws = wb.getWorksheet('Ponderancias') || wb.worksheets[0];

// Encabezado en fila 4: Categoría, Parámetro, Cafetería, Express, Móvil
let difs = 0, celdas = 0, omitidos = [];
ws.eachRow((row, n) => {
    if (n <= 4) return;
    const nombre = String(row.getCell(2).value || '').trim();
    if (!nombre || nombre === 'TOTAL si todo cumple') return;
    const p = catalogo.find(x => x.nombre === nombre);
    if (!p) { omitidos.push(nombre); return; }
    MODELOS.forEach((m, i) => {
        const vx = Number(row.getCell(3 + i).value) || 0;
        const vf = Number(((ultima.pesos || {})[m] || {})[p.id]) || 0;
        celdas++;
        if (vx !== vf) {
            difs++;
            console.log(`  ✗ ${nombre} [${m}]: Excel=${vx} vs Firestore=${vf}`);
        }
    });
});

console.log(`\nComparación: ${celdas} celdas de ponderancia revisadas.`);
console.log(difs === 0
    ? '✔ COINCIDE — el Excel de la reunión es idéntico a lo guardado en Firestore.'
    : `✗ ${difs} diferencias encontradas.`);
if (omitidos.length) console.log('Parámetros del Excel sin match en catálogo:', omitidos.join(', '));
process.exit(difs === 0 ? 0 : 1);
