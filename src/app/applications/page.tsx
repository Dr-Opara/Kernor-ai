import Link from "next/link";

const rows=[
["Centene","Senior Compliance Analyst","Interview"],
["Microsoft","GRC Manager","Applied"],
["AWS","Security Manager","Waiting"],
["CrowdStrike","GRC Lead","Review resume"],
];

export default function ApplicationsPage(){
  return <main className="shell" style={{padding:"54px 0 90px"}}>
    <Link href="/dashboard" style={{fontSize:22,fontWeight:800,letterSpacing:"-0.04em"}}>Kernor</Link>
    <div style={{marginTop:60,display:"flex",justifyContent:"space-between",alignItems:"end"}}>
      <div><h1 style={{fontSize:46,letterSpacing:"-0.05em",margin:0}}>Applications</h1><p className="muted">Everything you have in motion.</p></div>
      <button className="btn btn-primary">Find jobs</button>
    </div>
    <div className="card" style={{marginTop:28,overflow:"hidden"}}>
      {rows.map((r,i)=><div key={r[0]} style={{display:"grid",gridTemplateColumns:"1fr 1.6fr auto",gap:18,padding:22,borderTop:i?"1px solid var(--line)":"none",alignItems:"center"}}>
        <strong>{r[0]}</strong><span className="muted">{r[1]}</span><span style={{fontSize:13,fontWeight:700}}>{r[2]}</span>
      </div>)}
    </div>
  </main>
}
