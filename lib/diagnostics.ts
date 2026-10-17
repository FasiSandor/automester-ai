export type Severity = "stop" | "urgent" | "caution" | "information";
export type Fault = { code:string; title:string; summary:string; checks:string[]; severity:Severity; source:string };
const GENERIC:Record<string,Fault> = {
 P0300:{code:"P0300",title:"Véletlenszerű/többhengeres égéskimaradás",summary:"A vezérlő több hengernél vagy véletlenszerűen égéskimaradást érzékel.",checks:["Motorhiba-jelző villog-e?","Gyújtógyertyák, trafók és csatlakozók állapota","Üzemanyagellátás és fals levegő","Kompresszió és más mechanikai okok"],severity:"urgent",source:"SAE/ISO generikus OBD-II értelmezés"},
 P0301:{code:"P0301",title:"1. henger égéskimaradása",summary:"Az 1. hengerben égéskimaradás észlelhető; önmagában nem bizonyít trafóhibát.",checks:["Villog-e a motorhiba-jelző?","Gyertya és trafó ellenőrzése","Befecskendezés és vezetékek","Kompresszióvizsgálat szükség szerint"],severity:"urgent",source:"SAE/ISO generikus OBD-II értelmezés"},
 P0302:{code:"P0302",title:"2. henger égéskimaradása",summary:"A 2. hengerben égéskimaradás észlelhető; a kiváltó okot mérni kell.",checks:["Villog-e a motorhiba-jelző?","Gyertya és trafó ellenőrzése","Befecskendező és vezetékezés","Kompresszióvizsgálat szükség szerint"],severity:"urgent",source:"SAE/ISO generikus OBD-II értelmezés"},
 P0420:{code:"P0420",title:"Katalizátor hatásfoka küszöb alatt (bank 1)",summary:"A katalizátor hatásfokát a rendszer alacsonynak érzékeli, de a hiba oka lehet más is.",checks:["Kipufogórendszer szivárgása","Oxigénérzékelők és keverékszabályzás","Égéskimaradás és üzemanyag-korrekciók","Katalizátor állapotának mérése"],severity:"caution",source:"SAE/ISO generikus OBD-II értelmezés"},
 P0171:{code:"P0171",title:"Túl szegény keverék (bank 1)",summary:"A vezérlő az 1. hengersornál szegény keveréket érzékel.",checks:["Szívóoldali fals levegő","MAF/MAP mérési adatok","Üzemanyagnyomás","Kipufogószivárgás"],severity:"caution",source:"SAE/ISO generikus OBD-II értelmezés"}
};
export function findFault(code:string):Fault|null { const c=code.trim().toUpperCase(); return GENERIC[c]??null; }
export function extractCodes(text:string):string[] { return [...new Set((text.toUpperCase().match(/\b[PCBU][0-3][0-9A-F]{3}\b/g)||[]))].slice(0,12); }
export function safetyWarning(text:string):string|null {
 const t=text.toLowerCase();
 if (/(fékhatás megszűnt|nincs fék|fékpedál beesik|füstöl a motortér|lángol|üzemanyag szivárog|benzinszag erős|olajnyomás piros|túlmelegedett a motor)/.test(t)) return "VESZÉLY: állj meg biztonságos helyen, állítsd le a motort, és kérj szaksegítséget. Ne folytasd az utat.";
 if (/(villog.*(check engine|motorhiba|motorkontroll)|motorhiba.*villog|check engine.*villog)/.test(t)) return "Villogó motorhiba-jelző esetén kerüld a további közlekedést; a súlyos égéskimaradás károsíthatja a katalizátort. Kérj szakmai segítséget.";
 return null;
}
export function localAdvice(message:string):string {
 const warning=safetyWarning(message);
 const codes=extractCodes(message);
 const found=codes.map(findFault).filter((x):x is Fault=>Boolean(x));
 let response=warning?warning+"\n\n":"";
 if(found.length) for (const f of found) response+=f.code+" — "+f.title+"\n"+f.summary+"\nElső ellenőrzések: "+f.checks.join("; ")+".\n\n";
 const unknown=codes.filter(c=>!findFault(c));
 if(unknown.length)response+="Nem azonosított kód(ok): "+unknown.join(", ")+". Ellenőrizd a gyártói leírást és a pontos járműadatokat.\n\n";
 response+="A diagnózis még nem bizonyított. Mi az autó pontos típusa, évjárata, motorkódja, és mikor jelentkezik a tünet? Világít vagy villog bármilyen figyelmeztető lámpa?";
 return response;
}

/** Offline fallback: combines recent user context instead of asking the same generic question repeatedly. */
export function contextualAdvice(message: string, history: {role:"user"|"assistant";content:string}[] = [], vehicle = ""): string {
 const previous = history.filter(item=>item.role==="user").map(item=>item.content).slice(-6);
 const context = [...previous,vehicle,message].join(" ").toLocaleLowerCase("hu-HU");
 const incoming = message.toLocaleLowerCase("hu-HU");
 const faultCodes = extractCodes([...previous,message].join(" "));
 const currentCodes = extractCodes(message);
 const warning = safetyWarning(message) || safetyWarning(previous.join(" "));
 if (currentCodes.length) return localAdvice(message);
 if (/ajt[oó]|z[aá]r|zsan[eé]r|ajt[oó]hat[aá]rol[oó]/i.test(context) &&
     /(akad|szorul|nehezen|k[oö]nnyen|becsuk|nyit|lötyög|mozog|megmozd|hirtelen)/i.test(context)) {
   const make = /ford\s+focus/i.test(context) ? "A 2011-es Ford Focusnál" : "Az ajtónál";
   const checks = [
    make+" az, hogy az ajtó előbb akadt, majd hirtelen szokatlanul könnyen mozgott, utalhat az ajtóhatároló sérülésére vagy rögzítésének lazulására. Ez még nem bizonyított diagnózis.",
    "Elsőként álló autónál nézd meg az ajtó és a karosszéria közötti ajtóhatároló kart, a csavarokat, illetve a zsanérok környékét. Van-e lelazult alkatrész, törés, ferdeség vagy szokatlan hang?",
    "Óvatosan ellenőrizd, hogy az ajtó becsukva megbízhatóan reteszelődik-e. Ha lötyög, megereszkedett, nem zár biztosan, vagy valamelyik rögzítés sérült, ne használd az autót a javításig.",
    "Egy célzott kérdés: nyitáskor az ajtó már nem áll meg a megszokott köztes pozíciókban, és könnyen továbbcsapódik? Vagy maga a zár akad?"
   ];
   return (warning?warning+"\n\n":"")+checks.join("\n\n");
 }
 if (/(korm[aá]ny|hang|z[oö]rg|s[ií]pol)/i.test(context) && /20\s*(km\/h|km\/ora|km\/óra|kmh)|husz\s*(km|kilom[eé]ter)/i.test(context)) {
   return (warning?warning+"\n\n":"")+"A leírásod alapján a hang következetesen körülbelül 20 km/h-nál jelentkezik, nem egy általános kormányzaj. Ez felvethet sebességküszöbhöz kötött elektronikus jelzést vagy zár/aktuátor működést is, de mechanikai ok sem zárható ki.\n\n1. Figyeld meg, a hang egyetlen rövid kattanás/csipogás, vagy addig tart, amíg 20 km/h-val haladsz.\n2. Figyeld meg, ugyanott szól-e újra, amikor lassítás után ismét eléred a 20 km/h-t.\n3. Ellenőrizd a műszerfalon a jelzéseket és az ajtók biztonságos záródását, de menet közben ne szerelj vagy keresd kézzel a hang forrását.\n\nEgy fontos kérdés: egyszeri kattanás, csipogás vagy folyamatos súrlódó/zörgő hang hallatszik?\n\nAz élő AI jelenleg nem elérhető, ez korlátozott tartalék-válasz.";
 }
 if (/f[eé]k|korm[aá]ny|fut[oó]m[uű]|akku|ind[ií]t|h[uű]t[oő]|motor|v[aá]lt[oó]/i.test(context)) {
   return (warning?warning+"\n\n":"")+"A leírt tünetet vettem alapul, de egyetlen leírásból nem lehet biztos alkatrészhibát megállapítani. Írd meg, hogy álló helyzetben vagy menet közben jelentkezik-e, illetve hallasz-e rendellenes hangot. Ezek alapján célzott ellenőrzési sorrendet adok.\n\nJelenleg szabályalapú segítség működik, nem élő AI-elemzés.";
 }
 if (faultCodes.length) {
   return "Korábban említett OBD-kódok: "+faultCodes.join(", ")+".\n\n"+localAdvice(message);
 }
 return (warning?warning+"\n\n":"")+"A korábbi üzeneteidet is figyelembe vettem. A tünet okának szűkítéséhez írd le, pontosan melyik alkatrész viselkedése változott meg, mikor tapasztalod, és jár-e szokatlan hanggal vagy figyelmeztető jelzéssel.\n\nEz egy korlátozott, szabályalapú diagnosztika; az AI-elemzés még nincs bekapcsolva.";
}
