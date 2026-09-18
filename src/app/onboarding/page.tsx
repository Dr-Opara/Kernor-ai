import Link from "next/link";

export default function OnboardingPage() {
  return (
    <main className="shell" style={{minHeight:"100vh",padding:"54px 0 80px"}}>
      <Link href="/" style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em"}}>Kernor</Link>
      <div style={{width:"min(720px,100%)",margin:"80px auto 0"}}>
        <div className="muted" style={{fontSize:14}}>Step 1 of 3</div>
        <h1 style={{fontSize:52,letterSpacing:"-0.05em",margin:"12px 0"}}>Start with your resume.</h1>
        <p className="muted" style={{fontSize:18,lineHeight:1.6,maxWidth:600}}>
          This becomes Kernor's source of truth. You will review everything we extract before it is used.
        </p>

        <div className="card" style={{padding:34,marginTop:34,borderStyle:"dashed",textAlign:"center"}}>
          <div style={{fontSize:34}}>↑</div>
          <h2 style={{fontSize:22,margin:"14px 0 7px"}}>Upload your resume</h2>
          <p className="muted" style={{margin:"0 0 22px"}}>PDF or DOCX · up to 10 MB</p>
          <button className="btn btn-secondary">Choose file</button>
        </div>

        <div className="card" style={{padding:24,marginTop:18}}>
          <h3 style={{margin:"0 0 16px"}}>What are you looking for?</h3>
          <div style={{display:"grid",gap:14}}>
            <input className="input" placeholder="Target role, e.g. GRC Manager" />
            <input className="input" placeholder="Location, e.g. Remote or Houston, TX" />
            <input className="input" placeholder="Minimum salary, optional" />
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:22}}>
          <Link className="btn btn-primary" href="/dashboard">Continue</Link>
        </div>
      </div>
    </main>
  );
}
