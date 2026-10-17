"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

function validEmail(value: string) {
  const address = value.trim();
  const at = address.indexOf("@");
  return at > 0 && at === address.lastIndexOf("@") && address.indexOf(".", at + 2) > at + 1 && !address.includes(" ");
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signup, setSignup] = useState(false);
  const [verify, setVerify] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function otpRequest(path: string, body: Record<string, string>) {
    const response = await fetch("/api/auth/email-otp/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const result: { message?: string; error?: { message?: string } } = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error?.message || "A megerősítés nem sikerült. Próbáld újra.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      if (verify) {
        if (!validEmail(email)) throw new Error("Adj meg egy érvényes e-mail-címet.");
        if (!/^[0-9]{4,10}$/.test(otp.trim())) throw new Error("Írd be az e-mailben kapott ellenőrző kódot.");
        await otpRequest("verify-email", { email: email.trim(), otp: otp.trim() });
        setVerify(false); setSignup(false); setOtp(""); setNotice("E-mail-cím megerősítve! Most jelentkezz be a jelszavaddal.");
        return;
      }
      const result = signup
        ? await authClient.signUp.email({ email: email.trim(), password, name: name || "AutoMester" })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        const message = result.error.message || "Bejelentkezési hiba";
        if (!signup && /verif/i.test(message)) {
          setVerify(true);
          setNotice("Előbb erősítsd meg az e-mail-címedet a kapott kóddal.");
          return;
        }
        throw new Error(message);
      }
      if (signup) {
        setVerify(true);
        setNotice("Elküldtük a megerősítő kódot. Írd be alább; nem kell újra regisztrálnod.");
        return;
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba történt.");
    } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError(""); setNotice("");
    try {
      if (!validEmail(email)) throw new Error("Adj meg egy érvényes e-mail-címet.");
      await otpRequest("send-verification-otp", { email: email.trim(), type: "email-verification" });
      setNotice("Új kódot kértünk. Nézd meg az e-mail-fiókodat (a spam mappát is).");
    } catch (err) { setError(err instanceof Error ? err.message : "Nem sikerült új kódot kérni."); }
    finally { setBusy(false); }
  }

  return <main style={{ minHeight:"100vh", display:"grid", placeItems:"center", padding:20 }}>
    <form onSubmit={submit} className="panel" style={{ maxWidth:420, width:"100%" }}>
      <h1>AutoMester AI</h1><p className="muted">Privát garázs · Neon Auth</p>
      {verify ? <>
        <label>E-mail-cím
          <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail-címed" required />
        </label>
        <label>E-mailben kapott kód
          <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" value={otp}
            onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Ellenőrző kód" required />
        </label>
      </> : <>
        {signup && <label>Név<input value={name} onChange={e => setName(e.target.value)} required /></label>}
        <label>E-mail<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Jelszó<input type="password" minLength={8} autoComplete={signup ? "new-password" : "current-password"}
          value={password} onChange={e => setPassword(e.target.value)} required /></label>
      </>}
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p role="status" className="muted">{notice}</p>}
      <button className="primary" style={{ width:"100%" }} disabled={busy}>
        {busy ? "Folyamatban..." : verify ? "E-mail megerősítése" : signup ? "Fiók létrehozása" : "Belépés"}
      </button>
      {verify ? <>
        <button type="button" className="ghost" disabled={busy} style={{ marginTop:12, width:"100%" }} onClick={resend}>Új kód kérése</button>
        <button type="button" className="ghost" disabled={busy} style={{ marginTop:8, width:"100%" }}
          onClick={() => { setVerify(false); setSignup(false); setError(""); setNotice(""); }}>Vissza a bejelentkezéshez</button>
      </> : <>
        <button type="button" className="ghost" style={{ marginTop:15, width:"100%" }}
          onClick={() => { setSignup(v=>!v); setError(""); setNotice(""); }}>
          {signup ? "Van már fiókom" : "Első bejelentkezés / regisztráció"}
        </button>
        <button type="button" className="ghost" style={{ marginTop:8, width:"100%" }}
          onClick={() => { setVerify(true); setError(""); setNotice(""); }}>
          Már megkaptam az ellenőrző kódot
        </button>
      </>}
      <p className="muted">Az alkalmazáshoz csak az engedélyezett tulajdonosi e-mail kap hozzáférést.</p>
    </form>
  </main>;
}
