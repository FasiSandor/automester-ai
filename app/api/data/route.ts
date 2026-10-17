import {NextResponse} from "next/server";
import {z} from "zod";
import {owner} from "@/lib/auth/server";
import {db} from "@/lib/db";
export const runtime="nodejs";
const vehicle=z.object({id:z.string().uuid().optional(),brand:z.string().min(1).max(80),model:z.string().min(1).max(80),year:z.string().max(5),engine:z.string().max(100),km:z.string().max(12)});
const repair=z.object({id:z.string().uuid().optional(),vehicleId:z.string().uuid(),description:z.string().min(1).max(1000),date:z.string().max(10),km:z.string().max(12),cost:z.string().max(14)});
function toInteger(s:string){const x=Number(s);return Number.isInteger(x)&&x>=0?x:null;}
export async function GET(){
 const id=await owner();if(!id)return NextResponse.json({error:"Hozzáférés megtagadva"},{status:401});
 try{const sql=db();const [vehicles,repairs,sessions]=await Promise.all([
 sql`SELECT id,brand,model,COALESCE(model_year::text,'') AS year,COALESCE(engine,'') AS engine,COALESCE(mileage::text,'') AS km FROM vehicles WHERE owner_id=${id} ORDER BY created_at`,
 sql`SELECT id,vehicle_id AS "vehicleId",description,COALESCE(completed_on::text,'') AS date,COALESCE(mileage::text,'') AS km,COALESCE(amount_huf::text,'') AS cost FROM repairs WHERE owner_id=${id} ORDER BY created_at DESC`,
 sql`SELECT m.role,m.content,m.response_mode AS mode,m.created_at AS at FROM diagnostic_messages m JOIN diagnostic_sessions s ON s.id=m.session_id WHERE s.owner_id=${id} ORDER BY m.created_at,m.id LIMIT 200`
 ]);return NextResponse.json({vehicles,repairs,entries:sessions});}
 catch{return NextResponse.json({error:"Adatbázishiba"},{status:503});}
}
export async function POST(request:Request){
 const id=await owner();if(!id)return NextResponse.json({error:"Hozzáférés megtagadva"},{status:401});
 const payload=await request.json().catch(()=>null);
 const action=payload?.action;
 const sql=db();
 try{
 if(action==="addVehicle"){const v=vehicle.parse(payload.value);const rows=await sql`INSERT INTO vehicles(owner_id,brand,model,model_year,engine,mileage) VALUES(${id},${v.brand},${v.model},${toInteger(v.year)},${v.engine},${toInteger(v.km)}) RETURNING id`;return NextResponse.json({id:rows[0].id});}
 if(action==="deleteVehicle"){const vid=z.string().uuid().parse(payload.id);await sql`DELETE FROM vehicles WHERE owner_id=${id} AND id=${vid}`;return NextResponse.json({ok:true});}
 if(action==="addRepair"){const r=repair.parse(payload.value);const owns=await sql`SELECT id FROM vehicles WHERE owner_id=${id} AND id=${r.vehicleId}`;if(!owns.length)return NextResponse.json({error:"Nincs hozzáférés ehhez az autóhoz"},{status:403});
 const rows=await sql`INSERT INTO repairs(owner_id,vehicle_id,description,completed_on,mileage,amount_huf) VALUES(${id},${r.vehicleId},${r.description},${r.date||null},${toInteger(r.km)},${r.cost.trim()?Number(r.cost):null}) RETURNING id`;return NextResponse.json({id:rows[0].id});}
 if(action==="deleteRepair"){const rid=z.string().uuid().parse(payload.id);await sql`DELETE FROM repairs WHERE owner_id=${id} AND id=${rid}`;return NextResponse.json({ok:true});}
 if(action==="clearMessages"){await sql`DELETE FROM diagnostic_sessions WHERE owner_id=${id}`;return NextResponse.json({ok:true});}
 return NextResponse.json({error:"Ismeretlen művelet"},{status:400});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Érvénytelen adat"},{status:400});return NextResponse.json({error:"Mentési hiba"},{status:503});}
}
