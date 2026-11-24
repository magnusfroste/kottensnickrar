// Kontrollerar uppgiftsgeneratorn i public/app.js:
//  – rätt svar är alltid öppningens bredd räknad från brädans kant (start + gap),
//  – felvalen skiljer sig från rätt svar och från varandra, minst 2 cm ifrån,
//  – alla mått ryms på linjalen 0–14 cm och brädan räcker till sågstället,
//  – nivåerna har de bredder och nollpunkter som konceptet säger.
//   node verify.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./public/app.js", import.meta.url), "utf8");
const start = src.indexOf("var MAXCM = 14;");
const end = src.indexOf("* 2. Kotten");
if (start < 0 || end < 0) throw new Error("hittar inte den rena generatorn i app.js");
const ren = src.slice(start, src.lastIndexOf("/*", end));
const G = eval("(function(){" + ren + "\nreturn {uppgift:uppgift, MAXCM:MAXCM};})()");

let seed = 20261124;
Math.random = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

let fel = 0;
const antal = { 1: 0, 2: 0, 3: 0 };
const kolla = (c, m, p) => { if (!c) { fel++; if (fel <= 25) console.log("FEL", m, JSON.stringify(p)); } };

for (const niva of [1, 2, 3]) {
  for (let k = 0; k < 20000; k++) {
    const p = G.uppgift(niva);
    antal[niva]++;
    const rätt = p.start + p.gap;
    kolla(Array.isArray(p.alternativ) && p.alternativ.length === 3, "fel antal brickor", p);
    kolla(p.svar >= 0 && p.svar <= 2, "svar utanför 0–2", p.svar);
    kolla(p.alternativ[p.svar] === rätt, "rätt bricka är inte start+gap", p);
    kolla(p.alternativ.filter(v => v === rätt).length === 1, "rätt svar förekommer flera gånger", p);
    kolla(p.alternativ.every(v => Number.isInteger(v) && v >= 1 && v <= G.MAXCM), "bricka utanför linjalen", p);
    kolla(rätt <= G.MAXCM, "rätt sågställe utanför linjalen", p);
    kolla(p.alternativ.every((v, i, a) => a.every((w, j) => i === j || Math.abs(v - w) >= 2)), "två brickor ligger för nära", p);
    kolla(new Set(p.alternativ).size === 3, "dubbla brickor", p);
    if (niva === 1) { kolla(p.start === 0, "nivå 1 ska börja vid 0", p); kolla(p.gap >= 3 && p.gap <= 7, "nivå 1 bredd", p); }
    if (niva === 2) { kolla(p.start === 0, "nivå 2 ska börja vid 0", p); kolla(p.gap >= 8 && p.gap <= 12, "nivå 2 bredd", p); }
    if (niva === 3) { kolla(p.start >= 2, "nivå 3 ska ha förskjuten nollpunkt", p); kolla(p.gap >= 3 && p.gap <= 6, "nivå 3 bredd", p); }
    kolla(p.niva === niva, "fel nivå", p.niva);
  }
}

console.log(`\n${antal[1] + antal[2] + antal[3]} uppgifter (nivå 1: ${antal[1]}, 2: ${antal[2]}, 3: ${antal[3]}). ${fel} fel.`);
process.exit(fel ? 1 : 0);