import { NextResponse } from "next/server";
import { z } from "zod";
import { localAdvice, safetyWarning } from "@/lib/diagnostics";
const Input=z.object({message:z.string().min(2).max(4000),vehicle:z.string().max(500).optional(),history:z.array(z.object({role:z.enum(["user","assistant"]),content:z.string().max(4000)})).max(12).optional()});
export async function POST(req:Request) {
 let json:unknown;
 try { json=await req.json(); } catch {return NextResponse.json({error:"Érvénytelen kérés."},{status:400});}
 const parsed=Input.safeParse(json);
 if(!parsed.success) return NextResponse.json({error:"Érvénytelen bemenet."},{status:400});
 const {message,vehicle,history=[]}=parsed.data;
 const danger=safetyWarning(message);
 const key=process.env.AI_API_KEY;
 if(!key) return NextResponse.json({reply:localAdvice(message),mode:"rules",warning:danger});
 try {
  const url=(process.env.AI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"")+"/chat/completions";
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),18000);
  let upstream:Response;
  try { upstream=await fetch(url,{method:"POST",signal:controller.signal,headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.AI_MODEL||"gpt-4.1-mini",temperature:0.2,max_tokens:850,messages:[{role:"system",content:"Magyar nyelvű, biztonságközpontú autódiagnosztikai segéd vagy. Különítsd el a tényeket, hipotéziseket és ellenőrzési lépéseket. Nem állíthatod hogy alkatrész biztosan hibás mérés nélkül. Ne találj ki hibakód-definíciókat, cikkszámokat, árakat vagy kompatibilitást. Veszélyes fék, kormány, füst, túlmelegedés vagy villogó motorhiba-jelző esetén előbb figyelmeztess a közlekedés elkerülésére. Rövid, célzott kérdéseket tegyél fel."},...history,{role:"user",content:"Jármű: "+(vehicle||"nincs megadva")+"\nTünet vagy kód: "+message}]})});} finally {clearTimeout(timeout);}
  if(!upstream.ok) throw new Error("AI unavailable");
  const body=await upstream.json();
  const reply=body?.choices?.[0]?.message?.content;
  if(typeof reply!=="string"||!reply.trim()) throw new Error("Empty reply");
  return NextResponse.json({reply:danger?danger+"\n\n"+reply:reply,mode:"ai",warning:danger});
 } catch { return NextResponse.json({reply:localAdvice(message),mode:"rules-fallback",warning:danger}); }
}
