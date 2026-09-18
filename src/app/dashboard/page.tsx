import Link from "next/link";

const applications = [
  { company:"Centene", role:"Senior Compliance Analyst", status:"Interview", tone:"#eaf4ef" },
  { company:"Microsoft", role:"GRC Manager", status:"Applied", tone:"#f3f3ef" },
  { company:"AWS", role:"Security Manager", status:"Waiting", tone:"#f3f3ef" },
  { company:"CrowdStrike", role:"GRC Lead", status:"Review resume", tone:"#fff6e8" },
];

export default function DashboardPage() {
  return (
    <main>
      <header style={{height:74,borderBottom:"1px solid var(--line)",background:"rgba(247,247,245,.94)"}}>
        <div className="shell" style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Link href="/" style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em"}}>Kernor</Link>
          <nav style={{display:"flex",gap:28,fontSize:14,fontWeight:650}}>
            <Link href="/dashboard">Home</Link>
            <Link href="/applications">Applications</Link>
            <Link href="/interviews">Interviews</Link>
            <Link href="/profile">Profile</Link>
          </nav>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span className="muted" style={{fontSize:14}}>25 credits</span>
            <div style={{width:34,height:34,borderRadius:"50%",background:"#deded8",display:"grid",placeItems:"center",fontSize:13,fontWeight:800}}>EO</div>
          </div>
        </div>
      </header>

      <section className="shell" style={{padding:"64px 0 90px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:24,alignItems:"end"}}>
          <div>
            <div className="muted" style={{fontSize:14}}>Thursday, September 17</div>
            <h1 style={{fontSize:46,letterSpacing:"-0.05em",margin:"8px 0 0"}}>Good evening, Emmanuel.</h1>
            <p className="muted" style={{fontSize:18,marginTop:12}}>Here's what needs your attention.</p>
          </div>
          <button className="btn btn-primary">Find jobs</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1.25fr .75fr",gap:18,marginTop:38}}>
          <div className="card" style={{padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div className="muted" style={{fontSize:13}}>Recommended for you</div>
                <h2 style={{fontSize:28,letterSpacing:"-0.025em",margin:"8px 0 4px"}}>Senior GRC Manager</h2>
                <div className="muted">Aperture Systems · Remote</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:32,fontWeight:800}}>94%</div>
                <div className="muted" style={{fontSize:12}}>match</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,margin:"26px 0"}}>
              {["Experience","GRC skills","Certifications","Remote preference"].map(x=><div key={x} style={{padding:14,borderRadius:12,background:"#f5f5f2",fontSize:14}}>✓ {x}</div>)}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,borderTop:"1px solid var(--line)"}}>
              <span className="muted">7 resume improvements available</span>
              <button className="btn btn-primary">View match</button>
            </div>
          </div>

          <div className="card" style={{padding:28}}>
            <div className="muted" style={{fontSize:13}}>Upcoming interview</div>
            <h2 style={{fontSize:24,margin:"10px 0 4px"}}>Senior Compliance Analyst</h2>
            <div className="muted">Centene</div>
            <div style={{margin:"28px 0",display:"grid",gap:10,fontSize:14}}>
              <div>Thursday · 2:00 PM</div>
              <div>Microsoft Teams</div>
              <div style={{color:"var(--accent)",fontWeight:700}}>Workspace ready ✓</div>
            </div>
            <Link href="/interviews" className="btn btn-secondary" style={{width:"100%"}}>Open interview</Link>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"0.72fr 1.28fr",gap:18,marginTop:18}}>
          <div className="card" style={{padding:26}}>
            <div className="muted" style={{fontSize:13}}>Today</div>
            <div style={{display:"grid",gap:20,marginTop:20}}>
              <div><strong>3</strong><div className="muted" style={{fontSize:14,marginTop:3}}>new strong matches</div></div>
              <div><strong>2</strong><div className="muted" style={{fontSize:14,marginTop:3}}>applications submitted</div></div>
              <div><strong>1</strong><div className="muted" style={{fontSize:14,marginTop:3}}>action needed</div></div>
            </div>
          </div>

          <div className="card" style={{padding:26}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h2 style={{fontSize:20,margin:0}}>Applications</h2>
              <Link className="muted" href="/applications" style={{fontSize:14}}>View all</Link>
            </div>
            {applications.map((a)=>(
              <div key={a.company} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"center",padding:"16px 0",borderTop:"1px solid var(--line)"}}>
                <div><strong>{a.company}</strong><div className="muted" style={{fontSize:14,marginTop:4}}>{a.role}</div></div>
                <span style={{fontSize:13,fontWeight:700,background:a.tone,padding:"7px 10px",borderRadius:999}}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
