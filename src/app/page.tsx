import Link from "next/link";

function Logo() {
  return <Link href="/" style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em"}}>Odysseus</Link>;
}

export default function Home() {
  return (
    <main>
      <header className="shell" style={{height:76,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <Logo />
        <nav style={{display:"flex",gap:10,alignItems:"center"}}>
          <Link className="btn btn-secondary" href="/login">Sign in</Link>
          <Link className="btn btn-primary" href="/onboarding">Get started</Link>
        </nav>
      </header>

      <section className="shell" style={{padding:"110px 0 90px",display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:70,alignItems:"center"}}>
        <div>
          <div className="badge">A calmer way to move your career forward</div>
          <h1 style={{fontSize:"clamp(54px,8vw,92px)",lineHeight:.95,letterSpacing:"-0.065em",margin:"26px 0 28px",maxWidth:780}}>
            Your next move, handled.
          </h1>
          <p className="muted" style={{fontSize:21,lineHeight:1.55,maxWidth:620,marginBottom:32}}>
            Odysseus finds strong-fit roles, tailors your resume, applies after your approval, tracks every application, and stays with you through the interview.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <Link className="btn btn-primary" href="/onboarding">Start with your resume</Link>
            <Link className="btn btn-secondary" href="/dashboard">View dashboard</Link>
          </div>
          <p className="muted" style={{fontSize:14,marginTop:18}}>$1 per successful application · $19.99 per live interview · no subscription</p>
        </div>

        <div className="card" style={{padding:26,boxShadow:"0 24px 70px rgba(20,20,20,.07)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div>
              <div className="muted" style={{fontSize:13}}>Recommended for you</div>
              <div style={{fontSize:20,fontWeight:750,marginTop:5}}>Senior GRC Manager</div>
              <div className="muted" style={{marginTop:4}}>Aperture Systems · Remote</div>
            </div>
            <div style={{fontSize:28,fontWeight:800}}>94%</div>
          </div>
          <div style={{display:"grid",gap:10}}>
            {["Experience","Cybersecurity & GRC","Certifications","Remote preference"].map((item)=>
              <div key={item} style={{display:"flex",justifyContent:"space-between",padding:"14px 0",borderTop:"1px solid var(--line)"}}>
                <span>{item}</span><span style={{color:"var(--accent)",fontWeight:700}}>Strong</span>
              </div>
            )}
          </div>
          <div style={{marginTop:22,padding:18,borderRadius:14,background:"#f5f5f2"}}>
            <strong>Your resume can be stronger for this role.</strong>
            <p className="muted" style={{margin:"7px 0 0",fontSize:14}}>Odysseus found 7 improvements based on your verified experience.</p>
          </div>
        </div>
      </section>

      <section className="shell" style={{padding:"30px 0 110px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <p className="muted" style={{fontSize:14,fontWeight:700,textTransform:"uppercase",letterSpacing:".12em"}}>One simple flow</p>
          <h2 style={{fontSize:42,letterSpacing:"-0.04em",margin:"10px 0"}}>Find → Review → Apply → Interview</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {[
            ["01","Find","Odysseus surfaces the roles worth your attention."],
            ["02","Review","See your match and approve tailored resume changes."],
            ["03","Apply","Odysseus handles the application after you approve it."],
            ["04","Interview","Your submitted resume and job context follow you into the interview."]
          ].map(([n,t,d])=>(
            <div className="card" key={n} style={{padding:24}}>
              <div className="muted" style={{fontSize:13}}>{n}</div>
              <h3 style={{fontSize:22,margin:"28px 0 8px"}}>{t}</h3>
              <p className="muted" style={{lineHeight:1.55,margin:0}}>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
