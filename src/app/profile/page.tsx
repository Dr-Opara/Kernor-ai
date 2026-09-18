import Link from "next/link";

export default function ProfilePage(){
  return <main className="shell" style={{padding:"54px 0 90px"}}>
    <Link href="/dashboard" style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em"}}>Kernor</Link>
    <div style={{width:"min(760px,100%)",margin:"60px auto 0"}}>
      <h1 style={{fontSize:46,letterSpacing:"-0.05em",marginBottom:10}}>Profile</h1>
      <p className="muted">The verified information Kernor uses on your behalf.</p>
      <div className="card" style={{padding:26,marginTop:28}}>
        <div style={{display:"grid",gap:18}}>
          <label style={{display:"grid",gap:8,fontWeight:650,fontSize:14}}>Target role<input className="input" defaultValue="Senior GRC / Cybersecurity Manager" /></label>
          <label style={{display:"grid",gap:8,fontWeight:650,fontSize:14}}>Work preference<input className="input" defaultValue="Remote" /></label>
          <label style={{display:"grid",gap:8,fontWeight:650,fontSize:14}}>Location<input className="input" defaultValue="Texas" /></label>
        </div>
        <button className="btn btn-primary" style={{marginTop:22}}>Save changes</button>
      </div>
    </div>
  </main>
}
