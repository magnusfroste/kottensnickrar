/* Kotten snickrar – såga rätt längd. Statisk app, inga beroenden.
   Tränar MA.1-3.3.3 (mätning av längd med vanliga måttenheter) och MA.1-3.1.8
   (rimlighetsbedömning). Allt ritas i kod: vägg, bräda och linjal i SVG, Kotten i
   SVG/DOM, ljud i WebAudio + talsyntes. Uppgiftsgeneratorn är en ren funktion som
   verify.mjs kontrollerar. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. Ren uppgiftsgenerator                                            *
   *    Öppningen börjar alltid vid linjalens 0. Brädan börjar vid        *
   *    `start` cm, så rätt sågställe är start + öppningens bredd.        *
   *    Nivå 3 förskjuter brädans kant så att nollpunkten inte samman-    *
   *    faller med brädans ände.                                          *
   * ------------------------------------------------------------------ */
  var MAXCM = 14;

  function heltal(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function uppgift(niva) {
    var start, gap;
    if (niva <= 1) { start = 0; gap = heltal(3, 7); }
    else if (niva === 2) { start = 0; gap = heltal(8, 12); }
    else { start = heltal(2, 3); gap = heltal(3, 6); }
    var ratt = start + gap;
    var kandidater = [ratt - 1, ratt + 1, ratt - 2, ratt + 2];
    var alt = [ratt], i;
    for (i = 0; i < kandidater.length && alt.length < 3; i++) {
      var k = kandidater[i];
      if (k < 1 || k > MAXCM) continue;
      if (alt.indexOf(k) >= 0) continue;
      if (Math.abs(k - ratt) < 2) continue;          /* minst 2 cm mellan brickorna */
      alt.push(k);
    }
    /* säkerhetsnät: fyll på med grannar om något silades bort */
    for (i = 1; i <= MAXCM && alt.length < 3; i++) {
      if (i !== ratt && alt.indexOf(i) < 0) alt.push(i);
    }
    alt.sort(function (a, b) { return a - b; });
    return {
      start: start, gap: gap, ratt: ratt, alternativ: alt,
      svar: alt.indexOf(ratt), niva: niva
    };
  }

  /* ------------------------------------------------------------------ *
   * 2. Kotten (egen SV G-figur, fem uttryck – samma som i familjen)      *
   * ------------------------------------------------------------------ */
  function kottenSvg(uttryck, klass) {
    var F = "#b07d4b", M = "#8a5f36", O = "#2b2118", mun, ogen = "", extra = "";
    if (uttryck === "hejar") { mun = '<path d="M22 36 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    else if (uttryck === "firar") {
      mun = '<path d="M21 34 q9 12 18 0" fill="#fff"/><path d="M21 34 q9 12 18 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
      extra = '<path d="M10 12 l3 6M50 12 l-3 6M30 6 v5" stroke="#e8a33d" stroke-width="2.2" stroke-linecap="round" fill="none"/>';
    }
    else if (uttryck === "tanker") { mun = '<path d="M24 37 h11" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>'; ogen = '<circle cx="46" cy="24" r="4" fill="none" stroke="' + M + '" stroke-width="1.6" opacity=".5"/>'; }
    else if (uttryck === "funderar") { mun = '<path d="M22 38 q8 -6 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    else { mun = '<path d="M22 34 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    var oga = '<circle cx="23" cy="24" r="5.2" fill="#fff"/><circle cx="37" cy="24" r="5.2" fill="#fff"/>' +
      '<circle cx="24" cy="24.6" r="2.5" fill="' + O + '"/><circle cx="36" cy="24.6" r="2.5" fill="' + O + '"/>';
    return '<svg class="' + (klass || "kotten-svg") + '" viewBox="0 0 60 60" aria-hidden="true">' + extra +
      '<path d="M30 6 q9 4 12 12 q9 12 4 24 q-4 12 -16 14 q-12 -2 -16 -14 q-5 -12 4 -24 q3 -8 12 -12z" fill="' + F + '"/>' +
      '<path d="M19 20 q11 -5 22 0M16 30 q14 -5 28 0M16 40 q14 -4 28 0" stroke="' + M + '" stroke-width="1.7" fill="none" opacity=".85" stroke-linecap="round"/>' +
      oga + ogen + mun + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * 3. Ljud (WebAudio + talsyntes, skapas vid första gesten)            *
   * ------------------------------------------------------------------ */
  var ac = null, ljudPa = true;
  function ljud(frekvens, längd, typ) {
    if (!ljudPa) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = typ || "sine"; o.frequency.value = frekvens;
      g.gain.value = 0.001; o.connect(g); g.connect(ac.destination);
      var t = ac.currentTime;
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + längd);
      o.start(t); o.stop(t + längd + 0.02);
    } catch (e) { }
  }
  function sag(text) {
    if (!ljudPa) return;
          try { if (window.__rost && window.__rost(text, true)) return; } catch (e) { }
        console.warn('saknar mp3:', text);
  }
  function spar(namn, värde) { try { if (window.skolappar && window.skolappar.event) window.skolappar.event(namn, värde); } catch (e) { } }

  /* ------------------------------------------------------------------ *
   * 4. Ritningen                                                        *
   * ------------------------------------------------------------------ */
  var X0 = 84, CM = 88, WALL_Y = 40, WALL_H = 260, SHELF_Y = 210;
  /* Hur många centimeter linjalen visar per nivå. En smal skärm ska inte behöva
     visa 14 cm när uppgiften bara kräver 9 – då blir centimetrarna läsbara. */
  var SPAN = { 1: 9, 2: 14, 3: 10 };
  var SPANN = 9;
  var PY = 360, PH = 90, RY = 450;
  var RUNDA = 8;
  var S = {
    skärm: "start", niva: 1, runda: 1, item: 0, svarRätt: 0, stjärnor: 0,
    felförsök: 0, p: null, klar: false
  };

  function esc(s) { return String(s); }
  function x(cm) { return X0 + cm * CM; }
  function cmText(v) { return String(v); }

  function trad(y, h) {
    return '<rect x="' + x(0) + '" y="' + y + '" width="' + (SPANN * CM) + '" height="' + h +
      '" rx="6" fill="var(--trä)" opacity=".9"/>';
  }

  function VBW() { return X0 + SPANN * CM + 40; }

  function ritaScen() {
    var p = S.p, el = document.getElementById("scen"), h = [];
    SPANN = SPAN[p.niva] || 14;
    if (p.ratt + 1 > SPANN) SPANN = Math.min(MAXCM, p.ratt + 1);
    el.setAttribute("viewBox", "0 0 " + VBW() + " 560");
    var gapHöger = x(p.gap);

    /* himmel/bakgrund */
    h.push('<rect x="0" y="0" width="' + VBW() + '" height="560" fill="var(--papper)"/>');

    /* väggen med öppningen */
    h.push('<rect x="20" y="' + WALL_Y + '" width="' + (X0 - 20) + '" height="' + WALL_H + '" rx="8" fill="var(--trä-mörk)"/>');
    h.push('<rect x="' + gapHöger + '" y="' + WALL_Y + '" width="' + (VBW() - 20 - gapHöger) + '" height="' + WALL_H + '" rx="8" fill="var(--trä-mörk)"/>');
    /* plank-rader på väggen, avkortade vid öppningen */
    var rad, ry, i, xx;
    for (rad = 0; rad < 3; rad++) {
      ry = WALL_Y + 22 + rad * 66;
      h.push('<rect x="30" y="' + ry + '" width="' + (X0 - 40) + '" height="38" rx="5" fill="var(--trä)" opacity=".75"/>');
      if (gapHöger + 10 < VBW() - 30)
        h.push('<rect x="' + (gapHöger + 10) + '" y="' + ry + '" width="' + (VBW() - 30 - gapHöger - 10) + '" height="38" rx="5" fill="var(--trä)" opacity=".75"/>');
    }
    /* öppningen: streckad kant + pulserande inre markering */
    h.push('<rect x="' + x(0) + '" y="' + WALL_Y + '" width="' + (p.gap * CM) + '" height="' + WALL_H +
      '" rx="6" fill="#fff" opacity=".55"/>');
    h.push('<rect class="öppning-aktiv" x="' + (x(0) + 4) + '" y="' + (WALL_Y + 4) + '" width="' + (p.gap * CM - 8) +
      '" height="' + (WALL_H - 8) + '" rx="5" fill="none" stroke="var(--stjärna)" stroke-width="4" stroke-dasharray="16 12"/>');

    /* lodrät hjälplinje från öppningens vänsterkant ner till linjalens 0 */
    h.push('<line x1="' + x(0) + '" y1="' + (WALL_Y + WALL_H) + '" x2="' + x(0) + '" y2="' + PY +
      '" stroke="var(--accent)" stroke-width="3" stroke-dasharray="10 12" opacity=".45"/>');

    /* brädan på bänken */
    var px = x(p.start), pw = (SPANN - p.start) * CM;
    h.push('<rect x="' + px + '" y="' + PY + '" width="' + pw + '" height="' + PH + '" rx="8" fill="var(--trä)"/>');
    h.push('<rect x="' + px + '" y="' + PY + '" width="' + pw + '" height="' + (PH / 2) + '" rx="8" fill="var(--trä-mörk)" opacity=".18"/>');
    for (i = 0; i < 4; i++) {
      h.push('<line x1="' + (px + 6) + '" y1="' + (PY + 16 + i * 19) + '" x2="' + (px + pw - 6) + '" y2="' + (PY + 16 + i * 19) +
        '" stroke="var(--trä-mörk)" stroke-width="3" opacity=".45" stroke-linecap="round"/>');
    }
    /* brädans vänsterkant markerad: härifrån mäts längden */
    h.push('<line x1="' + px + '" y1="' + (PY - 16) + '" x2="' + px + '" y2="' + (PY + PH + 10) +
      '" stroke="var(--accent)" stroke-width="6" stroke-linecap="round"/>');

    /* linjalen */
    h.push('<rect x="' + x(0) + '" y="' + RY + '" width="' + (SPANN * CM) + '" height="66" rx="8" fill="#fff" stroke="var(--linje)" stroke-width="3"/>');
    for (i = 0; i <= SPANN; i++) {
      xx = x(i);
      h.push('<line x1="' + xx + '" y1="' + RY + '" x2="' + xx + '" y2="' + (RY + (i % 5 === 0 ? 34 : 24)) +
        '" stroke="var(--bläck)" stroke-width="' + (i % 5 === 0 ? 5 : 3) + '" stroke-linecap="round"/>');
      h.push('<text x="' + xx + '" y="' + (RY + 62) + '" text-anchor="middle" font-size="36" font-weight="700" fill="var(--bläck)">' + i + '</text>');
    }
    /* halvcentimeterstreck */
    for (i = 0; i < SPANN; i++) {
      xx = x(i) + CM / 2;
      h.push('<line x1="' + xx + '" y1="' + RY + '" x2="' + xx + '" y2="' + (RY + 16) + '" stroke="var(--bläck)" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>');
    }

    /* mäthjälp: öppningens bredd lagd mot linjalen (syns när barnet trycker ?) */
    h.push('<rect class="mått-hjälp" id="matt" x="' + x(0) + '" y="' + RY + '" width="' + (p.gap * CM) +
      '" height="34" rx="4" fill="var(--stjärna)"/>');

    el.innerHTML = h.join("");
  }

  function laggHyllan() {
    var p = S.p, el = document.getElementById("scen");
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "stycke");
    g.innerHTML = '<rect x="' + x(p.start) + '" y="' + PY + '" width="' + (p.gap * CM) + '" height="' + PH +
      '" rx="8" fill="var(--trä)"/>' +
      '<rect x="' + x(p.start) + '" y="' + PY + '" width="' + (p.gap * CM) + '" height="' + (PH / 2) +
      '" rx="8" fill="var(--trä-mörk)" opacity=".18"/>' +
      '<rect x="' + x(p.start) + '" y="' + PY + '" width="' + (p.gap * CM) + '" height="' + PH +
      '" rx="8" fill="none" stroke="var(--accent)" stroke-width="5"/>';
    el.appendChild(g);
    /* två frames så att övergången startar */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        g.style.transform = "translate(" + (-p.start * CM) + "px," + (SHELF_Y - PY) + "px)";
      });
    });
  }

  function visaSågstreck(cm) {
    var el = document.getElementById("scen");
    var l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("class", "såg");
    l.setAttribute("x1", x(cm)); l.setAttribute("y1", PY - 14);
    l.setAttribute("x2", x(cm)); l.setAttribute("y2", PY + PH + 8);
    el.appendChild(l);
    setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, 900);
  }

  function visaProvbit(cm) {
    /* Fel svar: lägg en genomskinlig bit med den valda längden i öppningen så att
       barnet ser hur långt den når – för kort eller för lång, utan att läsa. */
    var el = document.getElementById("scen");
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "provbit");
    g.innerHTML = '<rect x="' + x(0) + '" y="' + SHELF_Y + '" width="' + (cm * CM) + '" height="' + PH +
      '" rx="6" fill="rgba(201,80,63,.18)" stroke="var(--fel)" stroke-width="5" stroke-dasharray="14 10"/>' +
      '<line x1="' + x(cm) + '" y1="' + (SHELF_Y - 18) + '" x2="' + x(cm) + '" y2="' + (SHELF_Y + PH + 18) +
      '" stroke="var(--fel)" stroke-width="6" stroke-linecap="round"/>';
    el.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 1400);
  }

  function ritaBrickor() {
    document.getElementById("val").innerHTML = S.p.alternativ.map(function (v, i) {
      return '<button class="bricka" data-i="' + i + '" aria-label="såga vid ' + v + ' centimeter">' +
        '<span class="tal">' + v + '</span><span class="enhet">cm</span></button>';
    }).join("");
  }

  function ritaPrickar() {
    var h = "", i;
    for (i = 0; i < RUNDA; i++) h += '<i class="' + (i < S.item ? "klar" : "") + '"></i>';
    document.getElementById("prickar").innerHTML = h;
  }
  function ritaStjärnor() {
    document.getElementById("stjarnor").textContent = "★".repeat(Math.min(S.stjärnor, 12)) + (S.stjärnor > 12 ? "+" : "");
  }
  function kottenByt(uttryck) {
    var el = document.getElementById("kotten");
    if (!el) return;
    el.innerHTML = kottenSvg(uttryck, "kotten-svg");
  }

  /* ------------------------------------------------------------------ *
   * 5. Spelflöde                                                       *
   * ------------------------------------------------------------------ */
  var idleTimer = null;
  function startIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (S.skärm === "spel" && !S.klar && S.felförsök === 0) {
        var r = document.querySelector('.bricka[data-i="' + S.p.svar + '"]');
        if (r) r.classList.add("visa");
        sag("Titta på linjalen. Hur många centimeter är öppningen?");
        spar("hint");
      }
    }, 11000);
  }

  function nyUppgift() {
    S.p = uppgift(S.niva);
    S.klar = false; S.felförsök = 0;
    ritaScen(); ritaBrickor(); ritaPrickar();
    var m = document.getElementById("matt"); if (m) m.classList.remove("syns");
    startIdle();
  }

  function valj(i) {
    if (S.skärm !== "spel" || S.klar) return;
    clearTimeout(idleTimer);
    var p = S.p, b = document.querySelector('.bricka[data-i="' + i + '"]');
    if (i === p.svar) {
      S.klar = true; S.item++; S.svarRätt++; S.stjärnor++;
      if (b) b.classList.add("rätt");
      ritaPrickar(); ritaStjärnor();
      laggHyllan();
      ljud(520, 0.12, "square");
      setTimeout(function () { ljud(780, 0.14, "sine"); }, 130);
      setTimeout(function () { ljud(1040, 0.18, "sine"); }, 260);
      sag("Rätt! Hyllan passar.");
      kottenByt("firar");
      setTimeout(function () {
        kottenByt("glad");
        if (S.item >= RUNDA) rundaKlar();
        else nyUppgift();
      }, 1000);
    } else {
      S.felförsök++;
      var valt = p.alternativ[i];
      visaSågstreck(valt); visaProvbit(valt);
      ljud(220, 0.16, "triangle");
      setTimeout(function () { ljud(170, 0.18, "triangle"); }, 150);
      if (b) { b.classList.add("fel"); setTimeout(function () { b.classList.remove("fel"); }, 420); }
      kottenByt("funderar");
      sag(valt < p.ratt ? "För kort. Bit blir inte lika bred som öppningen." : "För lång. Bit blir bredare än öppningen.");
      spar("hint");
      if (S.felförsök >= 2) {
        var r = document.querySelector('.bricka[data-i="' + p.svar + '"]');
        if (r) r.classList.add("visa");
        var m = document.getElementById("matt");
        if (m) m.classList.add("syns");
        setTimeout(function () { sag("Titta på den som lyser. Den passar."); }, 1400);
      } else {
        startIdle();
      }
    }
  }

  function rundaKlar() {
    S.skärm = "överlägg";
    var procent = Math.round(100 * S.svarRätt / RUNDA);
    spar("round_done", procent);
    sag("Rundan är klar. " + S.svarRätt + " av " + RUNDA + " rätt.");
    var stegUpp = S.svarRätt >= 6 && S.niva < 3;
    visaOverlay(S.svarRätt >= 6 ? "firar" : "hejar", "Rundan är klar!",
      S.svarRätt + " av " + RUNDA + " rätt. " + S.stjärnor + " stjärnor totalt." +
      (stegUpp ? " Nu blir det svårare!" : ""),
      "En runda till →", function () {
        if (stegUpp) { S.niva++; spar("level", S.niva); }
        S.runda++; startaRunda(S.niva);
      }, true);
  }

  function visaOverlay(uttryck, titel, text, knapptext, vidare, medNiva) {
    var ov = document.getElementById("overlay");
    document.getElementById("ov-bild").innerHTML = kottenSvg(uttryck, "ov-kotten");
    document.getElementById("ov-titel").textContent = titel;
    document.getElementById("ov-text").textContent = text;
    var b = document.getElementById("ov-nasta");
    b.textContent = knapptext;
    b.onclick = function () { ov.hidden = true; vidare(); };
    var n = document.getElementById("ov-niva");
    n.hidden = !medNiva;
    n.onclick = function () { ov.hidden = true; S.niva = S.niva >= 3 ? 1 : S.niva + 1; S.runda++; startaRunda(S.niva); };
    ov.hidden = false;
  }

  function startaRunda(niva) {
    S.niva = niva; S.skärm = "spel"; S.item = 0; S.svarRätt = 0; S.felförsök = 0;
    document.getElementById("startskarm").hidden = true;
    document.getElementById("spel").hidden = false;
    document.getElementById("overlay").hidden = true;
    ritaStjärnor(); nyUppgift(); kottenByt("glad");
    spar("round_start"); spar("level", niva);
    if (niva === 1) sag("Mät öppningen med linjalen och såga brädan så att den passar.");
    else if (niva === 2) sag("Nu är öppningarna längre. Läs på linjalen var du ska såga.");
    else sag("Brädan börjar inte vid noll. Räkna från brädans kant.");
  }

  function tipsa() {
    if (S.skärm !== "spel" || S.klar) return;
    var m = document.getElementById("matt");
    if (m) m.classList.add("syns");
    var r = document.querySelector('.bricka[data-i="' + S.p.svar + '"]');
    if (r) r.classList.add("visa");
    sag(S.p.start > 0 ? "Räkna från brädans kant, inte från linjalens noll." :
      "Öppningens bredd är markerad på linjalen. Såga där den slutar.");
    spar("hint"); kottenByt("tanker");
  }

  /* ------------------------------------------------------------------ *
   * 6. Händelser och start                                             *
   * ------------------------------------------------------------------ */
  function ritaLjudIkon() {
    document.getElementById("ljudikon").innerHTML = ljudPa
      ? '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 8a5 5 0 0 1 0 8"/>'
      : '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 9l5 6M20 9l-5 6"/>';
  }

  function bind() {
    document.getElementById("val").addEventListener("click", function (e) {
      var b = e.target.closest(".bricka");
      if (b) valj(Number(b.dataset.i));
    });
    document.getElementById("spela").addEventListener("click", function () { ljud(600, 0.1); startaRunda(1); });
    document.getElementById("hjalp").addEventListener("click", tipsa);
    document.getElementById("ljud").addEventListener("click", function () {
      ljudPa = !ljudPa;
      if (!ljudPa && window.__rostStopp) window.__rostStopp();
      ritaLjudIkon(); spar("sound_off");
    });
    document.addEventListener("keydown", function (e) {
      if (S.skärm !== "spel") return;
      if (e.key === "1" || e.key === "ArrowLeft") valj(0);
      if (e.key === "2" || e.key === "ArrowDown") valj(1);
      if (e.key === "3" || e.key === "ArrowRight") valj(2);
      if (e.key === "h" || e.key === "?") tipsa();
    });
    window.addEventListener("resize", function () { if (S.p) ritaScen(); });
  }

  function init() {
    bind(); ritaLjudIkon(); ritaStjärnor(); ritaPrickar();
    document.getElementById("kotten-hud").innerHTML = kottenSvg("glad", "kotten-hud");
    var k = document.getElementById("kotten");
    if (k) k.innerHTML = kottenSvg("glad", "kotten-svg");
    window.__game = {
      S: S, uppgift: uppgift, valj: valj, startaRunda: startaRunda, nyUppgift: nyUppgift,
      tipsa: tipsa, ritaScen: ritaScen, MAXCM: MAXCM
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();