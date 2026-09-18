import Link from "next/link";

export default function InterviewsPage(){
  return <main className="shell" style={{padding:"54px 0 90px"}}>
    <Link href="/dashboard" style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em"}}>Kernor</Link>
    <div style={{width:"min(760px,100%)",margin:"70px auto 0"}}>
      <div className="muted" style={{fontSize:14}}>Upcoming interview</div>
      <h1 style={{fontSize:46,letterSpacing:"-0.05em",margin:"10px 0 6px"}}>Senior Compliance Analyst</h1>
      <p className="muted" style={{fontSize:18}}>Centene · Thursday at 2:00 PM · Microsoft Teams</p>
      <div className="card" style={{padding:28,marginTop:30}}>
        <h2 style={{marginTop:0}}>Your interview workspace is ready.</h2>
        <div style={{display:"grid",gap:12,margin:"24px 0"}}>
          {["Submitted resume","Job description","Candidate profile","Application history"].map(x=><div key={x} style={{display:"flex",justifyContent:"space-between",padding:"13px 0",borderTop:"1px solid var(--line)"}}><span>{x}</span><span style={{color:"var(--accent)",fontWeight:700}}>Ready</span></div>)}
        </div>
        <div style={{padding:20,borderRadius:14,background:"#f5f5f2",marginBottom:20}}>
          <strong>Kernor Live · $19.99</strong>
          <p className="muted" style={{margin:"7px 0 0",lineHeight:1.5}}>Activate when your interview begins. Your pass is only used when the live assistant starts.</p>
        </div>
        <button className="btn btn-primary" style={{width:"100%"}}>Set up interview</button>
      </div>
    </div>
  </main>
}
