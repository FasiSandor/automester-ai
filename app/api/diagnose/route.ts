import { NextResponse } from "next/server";
import { z } from "zod";
import { owner } from "@/lib/auth/server";
import { db } from "@/lib/db";
export const runtime="nodejs";
import { contextualAdvice, safetyWarning } from "@/lib/diagnostics";
const Input=z.object({message:z.string().min(2).max(4000),vehicle:z.string().max(500).optional(),history:z.array(z.object({role:z.enum(["user","assistant"]),content:z.string().max(4000)})).max(12).optional()});
export async function POST(req:Request) {
 const userId=await owner();
 if(!userId)return NextResponse.json({error:"Hozzáférés megtagadva"},{status:401});
 let json:unknown;
 try { json=await req.json(); } catch {return NextResponse.json({error:"Érvénytelen kérés."},{status:400});}
 const parsed=Input.safeParse(json);
 if(!parsed.success) return NextResponse.json({error:"Érvénytelen bemenet."},{status:400});
 const {message,vehicle,history=[]}=parsed.data;
 const danger=safetyWarning(message);
 const key=process.env.AI_API_KEY;
 if (key) {
   try {
     const sql=db();
     const limit=await sql`INSERT INTO ai_daily_usage(owner_id,usage_date,requests)
       VALUES(${userId}, (now() AT TIME ZONE 'UTC')::date,1)
       ON CONFLICT(owner_id,usage_date) DO UPDATE SET requests=ai_daily_usage.requests+1
       WHERE ai_daily_usage.requests < 20 RETURNING requests`;
     if(!limit.length) return NextResponse.json({error:"A napi AI-keret elfogyott (20 kérés)."},{status:429});
   } catch {
     return NextResponse.json({error:"Az AI-korlát ellenőrzése nem sikerült."},{status:503});
   }
 }
 if(!key) { const reply=contextualAdvice(message,history,vehicle); await saveMessages(userId,message,reply,"rules"); return NextResponse.json({reply,mode:"rules",warning:danger}); }
 try {
  const url=(process.env.AI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"")+"/chat/completions";
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),18000);
  let upstream:Response;
  try { upstream=await fetch(url,{method:"POST",signal:controller.signal,headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.AI_MODEL||"gpt-4.1-mini",temperature:0.2,max_tokens:850,messages:[{role:"system",content:"Magyar nyelvű, biztonságközpontú autódiagnosztikai segéd vagy. Különítsd el a tényeket, hipotéziseket és ellenőrzési lépéseket. Nem állíthatod hogy alkatrész biztosan hibás mérés nélkül. Ne találj ki hibakód-definíciókat, cikkszámokat, árakat vagy kompatibilitást. Veszélyes fék, kormány, füst, túlmelegedés vagy villogó motorhiba-jelző esetén előbb figyelmeztess a közlekedés elkerülésére. Rövid, célzott kérdéseket tegyél fel."},...history,{role:"user",content:"Jármű: "+(vehicle||"nincs megadva")+"\nTünet vagy kód: "+message}]})});} finally {clearTimeout(timeout);}
  if(!upstream.ok) throw new Error("AI unavailable");
  const body=await upstream.json();
  const reply=body?.choices?.[0]?.message?.content;
  if(typeof reply!=="string"||!reply.trim()) throw new Error("Empty reply");
  const output=danger?danger+"\n\n"+reply:reply;
  await saveMessages(userId,message,output,"ai");
  return NextResponse.json({reply:output,mode:"ai",warning:danger});
 } catch { const reply=contextualAdvice(message,history,vehicle); await saveMessages(userId,message,reply,"rules-fallback"); return NextResponse.json({reply,mode:"rules-fallback",warning:danger}); }
}

async function saveMessages(userId:string, question:string, answer:string,mode:string){
 try {const sql=db();
  let sessions=await sql`SELECT id FROM diagnostic_sessions WHERE owner_id=${userId} ORDER BY created_at DESC LIMIT 1`;
  if(!sessions.length)sessions=await sql`INSERT INTO diagnostic_sessions(owner_id,title) VALUES(${userId},'Diagnosztika') RETURNING id`;
  const sessionId=sessions[0].id as string;
  await sql`INSERT INTO diagnostic_messages(session_id,role,content) VALUES(${sessionId},'user',${question})`;
  await sql`INSERT INTO diagnostic_messages(session_id,role,content,response_mode) VALUES(${sessionId},'assistant',${answer},${mode})`;
 }catch{ /* Do not leak database details to the client */ }
}
