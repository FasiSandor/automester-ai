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
