# KONCEPT – Kotten snickrar (slug: kottensnickrar)

## Mål (en sak per app)
Mäta längd med linjal. Barnet ser en öppning i en trävägg, läser av hur bred den är på
linjalen och väljer var brädan ska sågas. Rätt längd = hyllan glider in och passar exakt.
Ingen text i spelytan, ingen tidspress, fel svar kostar inget.

## Målgrupp och årskurs
Åk 1–3 (6–9 år), Lgr22 stadium 1–3. Barnet behöver inte kunna läsa: linjalens siffror,
tre stora såg-brickor och talad instruktion bär hela spelet.

## Kärnmekanik (touch först)
Nederst på skärmen ligger en bräda på ett arbetsbord med en linjal under, 0–14 cm.
Ovanför sitter väggen med den öppning som ska fyllas. Barnet pekar på en av tre brickor
(”såga vid 5”) och brädan kapas: stämmer längden glider biten in i öppningen och blir en
hylla; är den för kort eller för lång faller den ner med en dämpad duns och Kotten funderar
– ny chans direkt, utan straff.
– Nivå 1: brädan börjar vid 0, öppningen 3–7 cm, felvalen ±1 cm.
– Nivå 2: brädan börjar vid 0, öppningen 8–12 cm, felvalen ±1 och ±2 cm.
– Nivå 3: brädan börjar 2–3 cm in på linjalen (nollpunkten är förskjuten), så barnet måste
  räkna från brädans kant i stället för från linjalens 0.
Hjälpknappen ”Mät” lägger en genomskinlig kopia av öppningen mot linjalen så barnet kan läsa
av längden; efter två fel pulserar rätt bricka.

## 5-minuterssession
Åtta hyllor per runda, ca 3–5 minuter. Efter sista hyllan: resultatruta med stjärnor,
”en runda till” och ”byt nivå”. Minst sex rätt höjer nivån ett steg.

## Belöning barnet kan berätta om
Stjärnor i HUD:en, prickrad som fylls och en färdig hylla efter varje rätt svar.
Resultatrutan säger t.ex. ”7 av 8 rätt”.

## Vad barnet lär
Att mäta med linjal: lägga linjalens noll vid det ena hörnet, läsa av vid det andra och
minnas att en förskjuten nollpunkt kräver att man räknar från föremålets egen kant.
Barnet tränar också rimlighetsbedömning – en bit som är för kort syns direkt när den inte
når fram. Svårigheten stiger genom längre sträckor och en förskjuten nollpunkt, aldrig
genom kortare tid.

## Lgr22 (ordagrant ur Skolverket via katalogens curriculum-API)
- **MA.1-3.3.3** (primär): ”Jämförelser och uppskattningar av storheter. Mätning av längd, massa, volym och tid med vanliga nutida och äldre måttenheter.”
- **MA.1-3.1.8**: ”Rimlighetsbedömning vid uppskattningar och beräkningar.”

## Varför det funkar på iPad
Allt ritas i SVG/DOM, inga bildfiler, inga tredjepartsanrop. Tre stora brickor (≥ 88 px),
linjalen skalas efter skärmens bredd, och hela ytan ryms utan scroll i liggande och stående.
Ljud och uppläsning skapas i webbläsaren; en ljudknapp stänger av båda.

## TESTPLAN (mätbara krav)
1. Spelbart med bara fingret (`Input.dispatchTouchEvent`), en hel runda.
2. `scrollHeight-innerHeight == 0` och `scrollWidth-innerWidth == 0` i 1024×768, 768×1024,
   390×844 och 1440×900 – mätt efter att startskärmen stängts.
3. Ingen text i spelytan utöver linjalens siffror och brickornas tal (allt annat talat).
4. Fel svar kostar inget; rätt bricka pulserar efter två fel.
5. Ingen inloggning, reklam, länkar ut eller spårning utöver kodsnutten.
6. Korrekt data: `node verify.mjs` genererar 60 000 uppgifter och kräver att rätt svar alltid
   är öppningens längd räknad från brädans kant, att felvalen skiljer sig från rätt svar och
   från varandra, och att alla mått ryms på linjalen (0–14 cm).

## VALIDERING (utförd av byggagenten, eftersom delegate_task inte finns i cron-miljön)
(a) Spela 5 minuter frivilligt? Korta rundor, direkt fysisk återkoppling (biten passar eller
inte), belöning i varje rätt svar. Ja, med förbehållet att mätning är mindre lekfullt än
memoryspel – därför hyllan som synligt resultat.
(b) Verkligt kunskapskrav? Ja: mäta med linjal är explicit i MA.1-3.3.3 och förskjuten
nollpunkt är det vanligaste felet lärare ser i åk 2–3.
(c) Teknisk risk? Låg: ren DOM/SVG, en generator, inga fysikmotorer. Största risken är
linjalens läsbarhet i porträtt på mobil – hanterad med 14 cm skala och min 3 cm mellan
felvalen.
Beslut: GO.