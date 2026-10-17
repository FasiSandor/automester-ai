"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
export default function Login(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[signup,setSignup]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");
 try {
 const result=signup?await authClient.signUp.email({email,password,name:name||"AutoMester"}):await authClient.signIn.email({email,password});
 if(result.error)throw new Error(result.error.message||"Bejelentkezési hiba");
 window.location.assign("/");
 }catch(err){setError(err instanceof Error?err.message:"Bejelentkezési hiba");}finally{setBusy(false);}
 }
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20}}><form onSubmit={submit} className="panel" style={{maxWidth:420,width:"100%"}}><h1>AutoMester AI</h1><p className="muted">Privát garázs · Neon Auth</p>{signup&&<label>Név<input value={name} onChange={e=>setName(e.target.value)} required/></label>}<label>E-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Jelszó<input type="password" minLength={8} autoComplete={signup?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p className="error">{error}</p>}<button className="primary" style={{width:"100%"}} disabled={busy}>{busy?"Folyamatban...":signup?"Fiók létrehozása":"Belépés"}</button><button type="button" className="ghost" style={{marginTop:15,width:"100%"}} onClick={()=>setSignup(v=>!v)}>{signup?"Van már fiókom":"Első bejelentkezés / regisztráció"}</button><p className="muted">Az alkalmazáshoz csak az engedélyezett tulajdonosi e-mail kap hozzáférést.</p></form></main>;
}
