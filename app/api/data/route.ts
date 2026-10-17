import {NextResponse} from "next/server";
import {z} from "zod";
import {owner} from "@/lib/auth/server";
import {db} from "@/lib/db";
export const runtime="nodejs";
const vehicle=z.object({id:z.string().uuid().optional(),brand:z.string().min(1).max(80),model:z.string().min(1).max(80),year:z.string().max(5),engine:z.string().max(100),km:z.string().max(12)});
const repair=z.object({id:z.string().uuid().optional(),vehicleId:z.string().uuid(),description:z.string().min(1).max(1000),date:z.string().max(10),km:z.string().max(12),cost:z.string().max(14)});
function toInteger(s:string){if(!s.trim())return null;const x=Number(s);return Number.isSafeInteger(x)&&x>=0?x:null;}
export async function GET(){
 const id=await owner();if(!id)return NextResponse.json({error:"Hozzáférés megtagadva"},{status:401});
 try{const sql=db();const [vehicles,repairs,sessions]=await Promise.all([
 sql`SELECT id,brand,model,COALESCE(model_year::text,'') AS year,COALESCE(engine,'') AS engine,COALESCE(mileage::text,'') AS km FROM vehicles WHERE owner_id=${id} ORDER BY created_at`,
 sql`SELECT id,vehicle_id AS "vehicleId",description,COALESCE(completed_on::text,'') AS date,COALESCE(mileage::text,'') AS km,COALESCE(amount_huf::text,'') AS cost FROM repairs WHERE owner_id=${id} ORDER BY created_at DESC`,
 sql`SELECT id,title,vehicle_id AS "vehicleId",created_at AS "createdAt" FROM diagnostic_sessions WHERE owner_id=${id} ORDER BY created_at DESC LIMIT 100`
 ]);return NextResponse.json({vehicles,repairs,sessions,entries:[]});}
 catch{return NextResponse.json({error:"Adatbázishiba"},{status:503});}
}
export async function POST(request:Request){
 const id=await owner();if(!id)return NextResponse.json({error:"Hozzáférés megtagadva"},{status:401});
 const payload=await request.json().catch(()=>null);
 const action=payload?.action;
 const sql=db();
 try{
 if(action==="addVehicle"){const v=vehicle.parse(payload.value);if((v.year.trim()&&toInteger(v.year)===null)||(v.km.trim()&&toInteger(v.km)===null))return NextResponse.json({error:"Hibás évjárat vagy kilométerállás."},{status:400});const rows=await sql`INSERT INTO vehicles(owner_id,brand,model,model_year,engine,mileage) VALUES(${id},${v.brand},${v.model},${toInteger(v.year)},${v.engine},${toInteger(v.km)}) RETURNING id`;return NextResponse.json({id:rows[0].id});}
 if(action==="updateVehicle"){const vid=z.string().uuid().parse(payload.id);const v=vehicle.parse(payload.value);const yr=toInteger(v.year),km=toInteger(v.km);if((v.year.trim()&&yr===null)||(v.km.trim()&&km===null))return NextResponse.json({error:"Az évjárat és kilométerállás csak érvényes, nem negatív egész szám lehet."},{status:400});const changed=await sql`UPDATE vehicles SET brand=${v.brand.trim()},model=${v.model.trim()},model_year=${yr},engine=${v.engine.trim()},mileage=${km} WHERE id=${vid} AND owner_id=${id} RETURNING id`;if(!changed.length)return NextResponse.json({error:"Az autó nem található."},{status:404});return NextResponse.json({ok:true});}
 if(action==="deleteVehicle"){const vid=z.string().uuid().parse(payload.id);await sql`DELETE FROM vehicles WHERE owner_id=${id} AND id=${vid}`;return NextResponse.json({ok:true});}
 if(action==="addRepair"){const r=repair.parse(payload.value);const owns=await sql`SELECT id FROM vehicles WHERE owner_id=${id} AND id=${r.vehicleId}`;if(!owns.length)return NextResponse.json({error:"Nincs hozzáférés ehhez az autóhoz"},{status:403});
 if((r.km.trim()&&toInteger(r.km)===null)||(r.cost.trim()&&(!Number.isFinite(Number(r.cost))||Number(r.cost)<0)))return NextResponse.json({error:"Hibás kilométerállás vagy költség."},{status:400});
 const rows=await sql`INSERT INTO repairs(owner_id,vehicle_id,description,completed_on,mileage,amount_huf) VALUES(${id},${r.vehicleId},${r.description},${r.date||null},${toInteger(r.km)},${r.cost.trim()?Number(r.cost):null}) RETURNING id`;return NextResponse.json({id:rows[0].id});}
 if(action==="deleteRepair"){const rid=z.string().uuid().parse(payload.id);await sql`DELETE FROM repairs WHERE owner_id=${id} AND id=${rid}`;return NextResponse.json({ok:true});}
 if(action==="getSessionMessages"){const sid=z.string().uuid().parse(payload.id);const messages=await sql`SELECT m.role,m.content,m.response_mode AS mode,m.created_at AS at FROM diagnostic_messages m JOIN diagnostic_sessions s ON s.id=m.session_id WHERE s.owner_id=${id} AND s.id=${sid} ORDER BY m.created_at,m.id LIMIT 200`;return NextResponse.json({entries:messages});}
 if(action==="createSession"){const title=z.string().trim().max(110).optional().parse(payload?.value?.title)||"Új hibakeresés";const vehicleId=payload?.value?.vehicleId ? z.string().uuid().parse(payload.value.vehicleId):null;if(vehicleId){const owns=await sql`SELECT id FROM vehicles WHERE owner_id=${id} AND id=${vehicleId}`;if(!owns.length)return NextResponse.json({error:"Az autó nem található."},{status:403});}const rows=await sql`INSERT INTO diagnostic_sessions(owner_id,title,vehicle_id) VALUES(${id},${title},${vehicleId}) RETURNING id,title,vehicle_id AS "vehicleId",created_at AS "createdAt"`;return NextResponse.json({session:rows[0]});}
 if(action==="renameSession"){const sid=z.string().uuid().parse(payload.id);const title=z.string().trim().min(1).max(110).parse(payload?.value?.title);const changed=await sql`UPDATE diagnostic_sessions SET title=${title} WHERE owner_id=${id} AND id=${sid} RETURNING id`;if(!changed.length)return NextResponse.json({error:"Beszélgetés nem található."},{status:404});return NextResponse.json({ok:true});}
 if(action==="deleteSession"){const sid=z.string().uuid().parse(payload.id);await sql`DELETE FROM diagnostic_sessions WHERE id=${sid} AND owner_id=${id}`;return NextResponse.json({ok:true});}
 if(action==="clearMessages"){return NextResponse.json({error:"Használd az egyes beszélgetések törlését."},{status:400});}
 return NextResponse.json({error:"Ismeretlen művelet"},{status:400});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Érvénytelen adat"},{status:400});return NextResponse.json({error:"Mentési hiba"},{status:503});}
}
