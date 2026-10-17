import { NextResponse } from 'next/server';
import { owner } from '@/lib/auth/server';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
 const id = await owner();
 if (!id) return NextResponse.json({error:'Unauthorized'}, {status:401,headers:{'Cache-Control':'no-store'}});
 try {
   const sql = db();
   await sql`SELECT 1`;
   return NextResponse.json({auth:'ok',database:'ok'},{headers:{'Cache-Control':'no-store'}});
 } catch {
   return NextResponse.json({auth:'ok',database:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
