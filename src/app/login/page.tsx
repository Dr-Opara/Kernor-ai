import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="shell" style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"50px 0"}}>
      <div style={{width:"min(430px,100%)"}}>
        <Link href="/" style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em"}}>Kernor</Link>
        <div style={{marginTop:60}}>
          <h1 style={{fontSize:42,letterSpacing:"-0.045em",marginBottom:10}}>Welcome back.</h1>
          <p className="muted" style={{marginBottom:30}}>Pick up where you left off.</p>
          <div className="card" style={{padding:24}}>
            <label style={{display:"grid",gap:8,fontSize:14,fontWeight:650}}>
              Email
              <input className="input" type="email" placeholder="you@example.com" />
            </label>
            <label style={{display:"grid",gap:8,fontSize:14,fontWeight:650,marginTop:18}}>
              Password
              <input className="input" type="password" placeholder="••••••••" />
            </label>
            <Link className="btn btn-primary" href="/dashboard" style={{width:"100%",marginTop:22}}>Sign in</Link>
          </div>
          <p className="muted" style={{textAlign:"center",fontSize:14,marginTop:18}}>New to Kernor? <Link href="/onboarding" style={{color:"var(--text)",fontWeight:700}}>Get started</Link></p>
        </div>
      </div>
    </main>
  );
}
