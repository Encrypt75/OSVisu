import { useState, useCallback, useEffect, useRef } from "react";

// ─── PALETTE & GLOBAL STYLE ────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #080c14;
    --surface:  #0f1623;
    --card:     #131d2e;
    --border:   #1e2d44;
    --border2:  #2a3f5f;
    --text:     #e2e8f0;
    --muted:    #64748b;
    --muted2:   #94a3b8;
    --accent:   #818cf8;
    --accent2:  #a78bfa;
    --green:    #34d399;
    --red:      #f87171;
    --yellow:   #fbbf24;
    --mono:     'JetBrains Mono', monospace;
    --sans:     'Inter', system-ui, sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; }

  /* scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  /* number inputs: hide arrows */
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; appearance: textfield; }

  /* animations */
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.5; } }
  .fade-up { animation: fadeUp .35s ease both; }
`;

// ─── PROCESS COLORS ─────────────────────────────────────────────────────────
const COLORS = [
  "#818cf8","#a78bfa","#38bdf8","#34d399",
  "#fbbf24","#f472b6","#fb923c","#2dd4bf",
  "#c084fc","#67e8f9","#86efac","#fca5a5",
];
const colorFor = (id) => {
  const n = parseInt(String(id).replace(/\D/g,""),10)||0;
  return COLORS[(n-1) % COLORS.length];
};

// ─── CPU SCHEDULING ALGORITHMS ───────────────────────────────────────────────
function fcfs(processes) {
  const ordered = [...processes].sort((a,b)=>a.arrival-b.arrival||a._idx-b._idx);
  let time=0; const tl=[];
  for(const p of ordered){
    if(time<p.arrival) time=p.arrival;
    tl.push({pid:p.pid,start:time,end:time+p.burst});
    time+=p.burst;
  }
  return {timeline:tl,total_time:time};
}

function nonPreemptiveSJF(processes) {
  const jobs=processes.map(p=>({...p,done:false}));
  let time=0,completed=0,tl=[];
  while(completed<jobs.length){
    const ready=jobs.filter(j=>!j.done&&j.arrival<=time);
    if(!ready.length){time++;continue;}
    const pick=ready.reduce((a,b)=>a.burst<b.burst?a:b);
    tl.push({pid:pick.pid,start:time,end:time+pick.burst});
    time+=pick.burst; pick.done=true; completed++;
  }
  return {timeline:tl,total_time:time};
}

function preemptiveSJF(processes) {
  const jobs=processes.map(p=>({...p,remaining:p.burst}));
  let time=0,completed=0,tl=[],cur=null;
  while(completed<jobs.length){
    const ready=jobs.filter(j=>j.remaining>0&&j.arrival<=time);
    if(!ready.length){if(cur){tl.push({pid:cur.pid,start:cur.start,end:time});cur=null;}time++;continue;}
    const pick=ready.reduce((a,b)=>a.remaining<b.remaining?a:b);
    if(!cur||cur.pid!==pick.pid){
      if(cur)tl.push({pid:cur.pid,start:cur.start,end:time});
      cur={pid:pick.pid,start:time};
    }
    pick.remaining--;time++;
    if(pick.remaining===0){tl.push({pid:pick.pid,start:cur.start,end:time});cur=null;completed++;}
  }
  return {timeline:tl,total_time:time};
}

function nonPreemptivePriority(processes) {
  const jobs=processes.map(p=>({...p,done:false}));
  let time=0,completed=0,tl=[];
  while(completed<jobs.length){
    const ready=jobs.filter(j=>!j.done&&j.arrival<=time);
    if(!ready.length){time++;continue;}
    const pick=ready.reduce((a,b)=>a.priority<b.priority?a:b);
    tl.push({pid:pick.pid,start:time,end:time+pick.burst});
    time+=pick.burst; pick.done=true; completed++;
  }
  return {timeline:tl,total_time:time};
}

function preemptivePriority(processes) {
  const jobs=processes.map(p=>({...p,remaining:p.burst}));
  let time=0,completed=0,tl=[],cur=null;
  while(completed<jobs.length){
    const ready=jobs.filter(j=>j.remaining>0&&j.arrival<=time);
    if(!ready.length){if(cur){tl.push({pid:cur.pid,start:cur.start,end:time});cur=null;}time++;continue;}
    const pick=ready.reduce((a,b)=>a.priority<b.priority?a:b);
    if(!cur||cur.pid!==pick.pid){
      if(cur)tl.push({pid:cur.pid,start:cur.start,end:time});
      cur={pid:pick.pid,start:time};
    }
    pick.remaining--;time++;
    if(pick.remaining===0){tl.push({pid:pick.pid,start:cur.start,end:time});cur=null;completed++;}
  }
  return {timeline:tl,total_time:time};
}

function roundRobin(processes, quantum) {
  const q=parseInt(quantum)||1;
  const jobs=processes.map((p,i)=>({...p,remaining:p.burst,idx:i}));
  const sorted=[...jobs].sort((a,b)=>a.arrival-b.arrival);
  let time=0,tl=[],queue=[],visited=new Set(),i=0;
  while(true){
    while(i<sorted.length&&sorted[i].arrival<=time){queue.push(sorted[i]);visited.add(sorted[i].pid);i++;}
    if(!queue.length){
      if(jobs.every(j=>j.remaining<=0))break;
      time++;continue;
    }
    const job=queue.shift();
    const slice=Math.min(job.remaining,q);
    tl.push({pid:job.pid,start:time,end:time+slice});
    time+=slice; job.remaining-=slice;
    while(i<sorted.length&&sorted[i].arrival<=time){queue.push(sorted[i]);visited.add(sorted[i].pid);i++;}
    if(job.remaining>0)queue.push(job);
  }
  return {timeline:tl,total_time:time};
}

function computeStats(processes, timeline) {
  const map={};
  for(const p of processes) map[p.pid]={pid:p.pid,arrival:p.arrival,burst:p.burst,finish:0,waiting:0,turnaround:0};
  for(const seg of timeline) map[seg.pid].finish=Math.max(map[seg.pid].finish,seg.end);
  for(const p of processes){
    const s=map[p.pid];
    s.turnaround=s.finish-s.arrival;
    s.waiting=s.turnaround-s.burst;
  }
  return Object.values(map);
}

// ─── PAGE REPLACEMENT ALGORITHMS ────────────────────────────────────────────
function runFIFO(pages, frames) {
  let f=[],pointer=0,faults=0,hits=0,steps=[];
  for(const p of pages){
    if(f.includes(p)){hits++;steps.push({page:p,frames:[...f],fault:false});}
    else{
      faults++;
      if(f.length<frames){f=[...f,p];}
      else{const rep=f[pointer];f=[...f];f[pointer]=p;pointer=(pointer+1)%frames;}
      steps.push({page:p,frames:[...f],fault:true});
    }
  }
  return {steps,faults,hits};
}

function runLRU(pages, frames) {
  let f=[],recent={},faults=0,hits=0,steps=[];
  for(let t=0;t<pages.length;t++){
    const p=pages[t];
    if(f.includes(p)){hits++;recent[p]=t;steps.push({page:p,frames:[...f],fault:false});}
    else{
      faults++;
      if(f.length<frames){f=[...f,p];}
      else{const lru=f.reduce((a,b)=>(recent[a]??-1)<(recent[b]??-1)?a:b);f=f.map(x=>x===lru?p:x);}
      recent[p]=t;
      steps.push({page:p,frames:[...f],fault:true});
    }
  }
  return {steps,faults,hits};
}

// ─── DISK SCHEDULING ─────────────────────────────────────────────────────────
function diskFCFS(requests, head) {
  let cur=head,move=0,seq=[];
  for(const r of requests){move+=Math.abs(r-cur);seq.push(r);cur=r;}
  return {sequence:seq,total_movement:move};
}
function diskSSTF(requests, head) {
  let remaining=[...requests],cur=head,move=0,seq=[];
  while(remaining.length){
    const closest=remaining.reduce((a,b)=>Math.abs(a-cur)<=Math.abs(b-cur)?a:b);
    move+=Math.abs(closest-cur);seq.push(closest);cur=closest;
    remaining.splice(remaining.indexOf(closest),1);
  }
  return {sequence:seq,total_movement:move};
}

// ─── MEMORY MANAGEMENT ───────────────────────────────────────────────────────
function memoryFit(blocks, processes, strategy) {
  const free=[...blocks],allocation=Array(processes.length).fill(-1);
  for(let i=0;i<processes.length;i++){
    const size=processes[i];
    let idx=-1;
    if(strategy==="first"){idx=free.findIndex(b=>b>=size);}
    else if(strategy==="best"){let best=Infinity;free.forEach((b,j)=>{if(b>=size&&b<best){best=b;idx=j;}});}
    else if(strategy==="worst"){let worst=-1;free.forEach((b,j)=>{if(b>=size&&b>worst){worst=b;idx=j;}});}
    if(idx!==-1){allocation[i]=idx;free[idx]-=size;}
  }
  return {allocation,final_blocks:free};
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────
const styles = {
  app: { minHeight:"100vh", display:"flex", flexDirection:"column" },
  nav: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.9rem 2rem", background:"var(--surface)", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:10 },
  brand: { fontFamily:"var(--mono)", fontWeight:700, fontSize:"1rem", color:"var(--accent)", letterSpacing:"0.04em", cursor:"pointer" },
  navLinks: { display:"flex", gap:"1.5rem" },
  navLink: (active) => ({ cursor:"pointer", fontSize:"0.85rem", fontWeight:600, color:active?"var(--text)":"var(--muted)", borderBottom:active?"2px solid var(--accent)":"2px solid transparent", paddingBottom:"2px", transition:"all .15s" }),
  main: { flex:1, maxWidth:860, margin:"0 auto", padding:"2rem 1.5rem 4rem", width:"100%" },
  hero: { textAlign:"center", marginBottom:"2.5rem" },
  heroTitle: { fontFamily:"var(--mono)", fontSize:"clamp(1.5rem,4vw,2.25rem)", fontWeight:700, background:"linear-gradient(135deg,#e2e8f0,#818cf8,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", marginBottom:"0.6rem" },
  heroSub: { color:"var(--muted2)", fontSize:"0.95rem" },
  cards: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:"1rem" },
  homeCard: { background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:"1.5rem 1.25rem", cursor:"pointer", transition:"border-color .2s, transform .2s, box-shadow .2s", userSelect:"none" },
  homeCardH: { fontSize:"1.05rem", fontWeight:700, marginBottom:"0.4rem", color:"var(--text)" },
  homeCardSub: { fontSize:"0.8rem", color:"var(--muted)", lineHeight:1.5 },
  section: { marginBottom:"1.5rem" },
  card: { background:"var(--card)", border:"1px solid var(--border)", borderRadius:14, padding:"1.25rem", marginBottom:"1rem" },
  label: { fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--accent)", marginBottom:"0.75rem" },
  table: { width:"100%", borderCollapse:"separate", borderSpacing:"0 0.5rem" },
  th: { fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--muted)", textAlign:"left", padding:"0 0.5rem 0.25rem" },
  pill: (active) => ({ display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0.45rem 0.8rem", borderRadius:9999, border:`1px solid ${active?"var(--accent)":"var(--border)"}`, background:active?"rgba(129,140,248,.15)":"var(--surface)", color:active?"var(--accent)":"var(--muted2)", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", transition:"all .15s", width:"100%" }),
  input: { display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0.45rem 0.7rem", borderRadius:9999, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text)", fontSize:"0.9rem", fontFamily:"var(--mono)", outline:"none", width:"100%", textAlign:"center" },
  addBtn: { display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", width:"100%", marginTop:"0.75rem", padding:"0.7rem", borderRadius:9999, border:"1px dashed var(--border2)", background:"transparent", color:"var(--muted)", fontSize:"0.88rem", fontWeight:600, cursor:"pointer" },
  modeBtn: (active) => ({ flex:1, padding:"0.7rem 1rem", borderRadius:9999, border:`1px solid ${active?"var(--text)":"var(--border)"}`, background:active?"var(--text)":"transparent", color:active?"var(--bg)":"var(--muted)", fontSize:"0.9rem", fontWeight:700, cursor:"pointer", transition:"all .15s" }),
  runBtn: { padding:"0.75rem 2rem", borderRadius:9999, border:"none", background:"linear-gradient(135deg,var(--accent),var(--accent2))", color:"#fff", fontSize:"0.95rem", fontWeight:700, cursor:"pointer", fontFamily:"var(--mono)" },
  backBtn: { display:"inline-flex", alignItems:"center", gap:"0.4rem", color:"var(--muted2)", background:"none", border:"none", fontSize:"0.88rem", fontWeight:500, cursor:"pointer", marginBottom:"1.25rem" },
  pageTitle: { fontFamily:"var(--mono)", fontSize:"clamp(1.4rem,3vw,1.9rem)", fontWeight:700, color:"var(--text)", marginBottom:"0.5rem" },
  desc: { color:"var(--muted)", fontSize:"0.9rem", lineHeight:1.6, marginBottom:"1.75rem" },
  ganttWrap: { overflowX:"auto" },
  ganttBar: { display:"flex", height:52, borderRadius:10, overflow:"hidden", border:"1px solid var(--border)", minWidth:200 },
  ganttSeg: (w,bg) => ({ flex:w, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem", fontWeight:700, color:"#0a0e17", borderRight:"1px solid rgba(0,0,0,.15)", minWidth:2, fontFamily:"var(--mono)" }),
  timeAxis: { display:"flex", justifyContent:"space-between", marginTop:"0.45rem", fontSize:"0.7rem", color:"var(--muted)", fontFamily:"var(--mono)" },
  statsRow: { display:"flex", gap:"1rem", flexWrap:"wrap", marginTop:"1rem" },
  statBox: { flex:"1 1 120px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"0.75rem 1rem", textAlign:"center" },
  statVal: { fontFamily:"var(--mono)", fontSize:"1.35rem", fontWeight:700, color:"var(--accent)" },
  statLbl: { fontSize:"0.72rem", color:"var(--muted)", marginTop:"0.2rem" },
  tag: (fault) => ({ display:"inline-block", padding:"0.2rem 0.5rem", borderRadius:4, fontSize:"0.72rem", fontWeight:700, fontFamily:"var(--mono)", background:fault?"rgba(248,113,113,.15)":"rgba(52,211,153,.15)", color:fault?"var(--red)":"var(--green)" }),
  chip: (color) => ({ display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0.35rem 0.65rem", borderRadius:8, background:`${color}20`, color:color, fontSize:"0.85rem", fontWeight:700, fontFamily:"var(--mono)", minWidth:36, border:`1px solid ${color}40` }),
  empty: { color:"var(--muted)", textAlign:"center", padding:"1.5rem 0", fontSize:"0.9rem" },
  diskLine: { position:"relative", height:80, margin:"0.5rem 0" },
};

// ─── GANTT CHART ────────────────────────────────────────────────────────────
function GanttChart({ timeline, totalTime }) {
  if(!timeline||!timeline.length) return <p style={styles.empty}>Run the simulation to see the Gantt chart.</p>;
  const merged=[];
  for(const seg of timeline){
    const last=merged[merged.length-1];
    if(last&&last.pid===seg.pid&&last.end===seg.start) last.end=seg.end;
    else merged.push({...seg});
  }
  return (
    <div>
      <div style={styles.ganttWrap}>
        <div style={styles.ganttBar}>
          {merged.map((s,i)=>(
            <div key={i} style={{...styles.ganttSeg(s.end-s.start,colorFor(s.pid)),background:colorFor(s.pid)}} title={`${s.pid}: ${s.start}–${s.end}`}>
              {s.end-s.start>1?s.pid:""}
            </div>
          ))}
        </div>
      </div>
      <div style={styles.timeAxis}>
        {Array.from({length:totalTime+1},(_,i)=><span key={i}>{i}</span>)}
      </div>
    </div>
  );
}

// ─── STATS TABLE ─────────────────────────────────────────────────────────────
function StatsTable({ stats }) {
  if(!stats||!stats.length) return null;
  const avgWT=(stats.reduce((a,s)=>a+s.waiting,0)/stats.length).toFixed(2);
  const avgTT=(stats.reduce((a,s)=>a+s.turnaround,0)/stats.length).toFixed(2);
  return (
    <div>
      <div style={styles.statsRow}>
        <div style={styles.statBox}><div style={styles.statVal}>{avgWT}</div><div style={styles.statLbl}>Avg Wait</div></div>
        <div style={styles.statBox}><div style={styles.statVal}>{avgTT}</div><div style={styles.statLbl}>Avg Turnaround</div></div>
      </div>
      <table style={{...styles.table,marginTop:"1rem"}}>
        <thead><tr>
          {["Process","Arrival","Burst","Finish","Waiting","Turnaround"].map(h=><th key={h} style={styles.th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {stats.map(s=>(
            <tr key={s.pid}>
              {[s.pid,s.arrival,s.burst,s.finish,s.waiting,s.turnaround].map((v,i)=>(
                <td key={i} style={{padding:"0.3rem 0.5rem",fontSize:"0.88rem",fontFamily:"var(--mono)",color:i===0?"var(--accent2)":"var(--text)"}}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── PROCESS TABLE ───────────────────────────────────────────────────────────
function ProcessTable({ rows, setRows, showPriority=false, showQuantum=false, quantum, setQuantum }) {
  const update=(i,field,val)=>setRows(r=>r.map((row,j)=>j===i?{...row,[field]:Number(val)}:row));
  const addRow=()=>setRows(r=>[...r,{pid:`P${r.length+1}`,arrival:0,burst:1,priority:1,_idx:r.length}]);
  const removeRow=(i)=>setRows(r=>r.filter((_,j)=>j!==i).map((row,j)=>({...row,pid:`P${j+1}`,_idx:j})));
  return (
    <div style={styles.card}>
      <div style={styles.label}>Processes</div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>Process</th>
          <th style={styles.th}>Arrival</th>
          <th style={styles.th}>Burst</th>
          {showPriority&&<th style={styles.th}>Priority</th>}
          <th style={styles.th}></th>
        </tr></thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i}>
              <td style={{padding:"0 0.4rem"}}><span style={{...styles.pill(false),background:`${colorFor(row.pid)}20`,color:colorFor(row.pid),border:`1px solid ${colorFor(row.pid)}40`,cursor:"default"}}>{row.pid}</span></td>
              {["arrival","burst",...(showPriority?["priority"]:[])].map(field=>(
                <td key={field} style={{padding:"0 0.4rem"}}>
                  <input type="number" style={styles.input} value={row[field]} min={field==="arrival"?0:1} onChange={e=>update(i,field,e.target.value)} />
                </td>
              ))}
              <td style={{padding:"0 0.4rem"}}>
                <button onClick={()=>removeRow(i)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"1rem",padding:"0.3rem"}}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button style={styles.addBtn} onClick={addRow}>＋ Add Process</button>
      {showQuantum&&(
        <div style={{marginTop:"1rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <span style={{fontSize:"0.8rem",color:"var(--muted)",fontWeight:600}}>Time Quantum</span>
          <input type="number" style={{...styles.input,width:80}} value={quantum} min={1} onChange={e=>setQuantum(e.target.value)} />
        </div>
      )}
    </div>
  );
}

// ─── CPU SCHEDULING PAGE ──────────────────────────────────────────────────────
const CPU_ALGOS = [
  {key:"fcfs",label:"FCFS",desc:"First Come First Served"},
  {key:"sjf",label:"SJF",desc:"Shortest Job First"},
  {key:"ps",label:"Priority",desc:"Priority Scheduling"},
  {key:"rr",label:"Round Robin",desc:"Round Robin"},
];

function CPUPage({ onBack }) {
  const [algo, setAlgo] = useState("fcfs");
  const [preemptive, setPreemptive] = useState(false);
  const [rows, setRows] = useState([
    {pid:"P1",arrival:0,burst:5,priority:2,_idx:0},
    {pid:"P2",arrival:1,burst:3,priority:1,_idx:1},
    {pid:"P3",arrival:2,burst:8,priority:3,_idx:2},
  ]);
  const [quantum, setQuantum] = useState(2);
  const [result, setResult] = useState(null);

  const run = useCallback(()=>{
    const ps=rows.map(r=>({...r}));
    let res;
    if(algo==="fcfs") res=fcfs(ps);
    else if(algo==="sjf") res=preemptive?preemptiveSJF(ps):nonPreemptiveSJF(ps);
    else if(algo==="ps") res=preemptive?preemptivePriority(ps):nonPreemptivePriority(ps);
    else res=roundRobin(ps,quantum);
    setResult({...res,stats:computeStats(ps,res.timeline)});
  },[rows,algo,preemptive,quantum]);

  useEffect(()=>{ run(); },[algo,preemptive,rows,quantum]);

  const showPriority=algo==="ps";
  const showPreemptive=algo==="sjf"||algo==="ps";
  const showQuantum=algo==="rr";
  const curAlgo=CPU_ALGOS.find(a=>a.key===algo);

  return (
    <div className="fade-up">
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <h1 style={styles.pageTitle}>CPU Scheduling</h1>
      <p style={styles.desc}>Visualize how the CPU allocates time across processes using different scheduling strategies.</p>

      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"1.25rem"}}>
        {CPU_ALGOS.map(a=>(
          <button key={a.key} style={styles.pill(algo===a.key)} onClick={()=>{setAlgo(a.key);setPreemptive(false);}}>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {showPreemptive&&(
        <div style={{display:"flex",gap:"0.65rem",marginBottom:"1.25rem"}}>
          <button style={styles.modeBtn(!preemptive)} onClick={()=>setPreemptive(false)}>Non-Preemptive</button>
          <button style={styles.modeBtn(preemptive)} onClick={()=>setPreemptive(true)}>Preemptive</button>
        </div>
      )}

      <ProcessTable rows={rows} setRows={setRows} showPriority={showPriority} showQuantum={showQuantum} quantum={quantum} setQuantum={setQuantum} />

      <div style={styles.card}>
        <div style={styles.label}>Gantt Chart — {curAlgo?.desc}{showPreemptive?(preemptive?" (Preemptive)":" (Non-Preemptive)"):""}</div>
        <GanttChart timeline={result?.timeline} totalTime={result?.total_time} />
      </div>

      <div style={styles.card}>
        <div style={styles.label}>Statistics</div>
        <StatsTable stats={result?.stats} />
      </div>
    </div>
  );
}

// ─── PAGE REPLACEMENT PAGE ────────────────────────────────────────────────────
function PageReplacementPage({ onBack }) {
  const [algo, setAlgo] = useState("fifo");
  const [pageStr, setPageStr] = useState("7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1");
  const [frames, setFrames] = useState(3);
  const [result, setResult] = useState(null);

  useEffect(()=>{
    const pages=pageStr.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n));
    if(!pages.length||frames<1) return;
    let res;
    if(algo==="fifo") res=runFIFO(pages,frames);
    else res=runLRU(pages,frames);
    setResult({...res,pages});
  },[algo,pageStr,frames]);

  return (
    <div className="fade-up">
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <h1 style={styles.pageTitle}>Page Replacement</h1>
      <p style={styles.desc}>Simulate how the OS manages page frames in memory when a page fault occurs.</p>

      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[{k:"fifo",l:"FIFO"},{k:"lru",l:"LRU"}].map(a=>(
          <button key={a.k} style={styles.pill(algo===a.k)} onClick={()=>setAlgo(a.k)}>{a.l}</button>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.label}>Configuration</div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div>
            <div style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.35rem"}}>Reference String (space-separated)</div>
            <input style={{...styles.input,textAlign:"left",borderRadius:10,padding:"0.6rem 0.9rem",width:"100%"}} value={pageStr} onChange={e=>setPageStr(e.target.value)} placeholder="e.g. 7 0 1 2 0 3" />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>Number of Frames</span>
            <input type="number" style={{...styles.input,width:80}} value={frames} min={1} max={10} onChange={e=>setFrames(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {result&&(
        <>
          <div style={styles.statsRow}>
            <div style={styles.statBox}><div style={{...styles.statVal,color:"var(--red)"}}>{result.faults}</div><div style={styles.statLbl}>Page Faults</div></div>
            <div style={styles.statBox}><div style={{...styles.statVal,color:"var(--green)"}}>{result.hits}</div><div style={styles.statLbl}>Page Hits</div></div>
            <div style={styles.statBox}><div style={styles.statVal}>{(result.faults/result.pages.length*100).toFixed(1)}%</div><div style={styles.statLbl}>Fault Rate</div></div>
          </div>

          <div style={{...styles.card,marginTop:"1rem"}}>
            <div style={styles.label}>Step-by-Step</div>
            <div style={{overflowX:"auto"}}>
              <table style={{...styles.table,borderSpacing:"0 0.3rem",minWidth:520}}>
                <thead><tr>
                  <th style={styles.th}>Step</th>
                  <th style={styles.th}>Page</th>
                  <th style={styles.th}>Status</th>
                  {Array.from({length:frames},(_,i)=><th key={i} style={styles.th}>Frame {i+1}</th>)}
                </tr></thead>
                <tbody>
                  {result.steps.map((s,i)=>(
                    <tr key={i} style={{background:s.fault?"rgba(248,113,113,.05)":"rgba(52,211,153,.04)"}}>
                      <td style={{padding:"0.3rem 0.5rem",fontSize:"0.8rem",color:"var(--muted)",fontFamily:"var(--mono)"}}>{i+1}</td>
                      <td style={{padding:"0.3rem 0.5rem"}}><span style={styles.chip("#818cf8")}>{s.page}</span></td>
                      <td style={{padding:"0.3rem 0.5rem"}}><span style={styles.tag(s.fault)}>{s.fault?"FAULT":"HIT"}</span></td>
                      {Array.from({length:frames},(_,j)=>(
                        <td key={j} style={{padding:"0.3rem 0.5rem"}}>
                          {s.frames[j]!==undefined?<span style={styles.chip(colorFor(String(s.frames[j]+1)))}>{s.frames[j]}</span>:<span style={{color:"var(--border2)"}}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── DISK SCHEDULING PAGE ─────────────────────────────────────────────────────
function DiskPage({ onBack }) {
  const [algo, setAlgo] = useState("fcfs");
  const [reqStr, setReqStr] = useState("98 183 37 122 14 124 65 67");
  const [head, setHead] = useState(53);
  const [result, setResult] = useState(null);

  useEffect(()=>{
    const reqs=reqStr.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n));
    if(!reqs.length) return;
    const res=algo==="fcfs"?diskFCFS(reqs,head):diskSSTF(reqs,head);
    setResult({...res,reqs});
  },[algo,reqStr,head]);

  // SVG seek line chart
  const SeekChart=({sequence,initial})=>{
    const allPos=[initial,...sequence];
    const min=0,max=200,W=600,H=120,PAD=24;
    const x=(p)=>PAD+(p-min)/(max-min)*(W-PAD*2);
    const y=(i)=>PAD+i/(allPos.length-1||1)*(H-PAD*2);
    const pts=allPos.map((p,i)=>`${x(p)},${y(i)}`).join(" ");
    return(
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",overflow:"visible"}}>
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round"/>
        {allPos.map((p,i)=>(
          <circle key={i} cx={x(p)} cy={y(i)} r={i===0?5:3.5}
            fill={i===0?"var(--yellow)":"var(--accent2)"} stroke="var(--bg)" strokeWidth="1.5"/>
        ))}
        <line x1={x(min)} y1={PAD/2} x2={x(max)} y2={PAD/2} stroke="var(--border)" strokeWidth="1"/>
        {[0,50,100,150,200].map(v=>(
          <g key={v}>
            <line x1={x(v)} y1={PAD/2-4} x2={x(v)} y2={PAD/2+4} stroke="var(--border2)" strokeWidth="1"/>
            <text x={x(v)} y={PAD/2-8} textAnchor="middle" fill="var(--muted)" fontSize={9}>{v}</text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="fade-up">
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <h1 style={styles.pageTitle}>Disk Scheduling</h1>
      <p style={styles.desc}>Simulate how the disk arm services I/O requests, minimizing head movement.</p>

      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[{k:"fcfs",l:"FCFS"},{k:"sstf",l:"SSTF"}].map(a=>(
          <button key={a.k} style={styles.pill(algo===a.k)} onClick={()=>setAlgo(a.k)}>{a.l}</button>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.label}>Configuration</div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div>
            <div style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.35rem"}}>Request Queue (space-separated, 0–199)</div>
            <input style={{...styles.input,textAlign:"left",borderRadius:10,padding:"0.6rem 0.9rem",width:"100%"}} value={reqStr} onChange={e=>setReqStr(e.target.value)} />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>Initial Head Position</span>
            <input type="number" style={{...styles.input,width:80}} value={head} min={0} max={199} onChange={e=>setHead(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {result&&(
        <>
          <div style={styles.statsRow}>
            <div style={styles.statBox}><div style={styles.statVal}>{result.total_movement}</div><div style={styles.statLbl}>Total Head Movement</div></div>
            <div style={styles.statBox}><div style={styles.statVal}>{result.sequence.length}</div><div style={styles.statLbl}>Requests Served</div></div>
          </div>
          <div style={{...styles.card,marginTop:"1rem"}}>
            <div style={styles.label}>Seek Order</div>
            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"1rem"}}>
              <span style={styles.chip("#fbbf24")}>{head}</span>
              {result.sequence.map((r,i)=><span key={i} style={styles.chip("var(--accent2)")}>{r}</span>)}
            </div>
            <SeekChart sequence={result.sequence} initial={head}/>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MEMORY MANAGEMENT PAGE ───────────────────────────────────────────────────
function MemoryPage({ onBack }) {
  const [strategy, setStrategy] = useState("first");
  const [blockStr, setBlockStr] = useState("100 500 200 300 600");
  const [procStr, setProcStr] = useState("212 417 112 426");
  const [result, setResult] = useState(null);

  useEffect(()=>{
    const blocks=blockStr.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)&&n>0);
    const procs=procStr.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)&&n>0);
    if(!blocks.length||!procs.length) return;
    setResult({...memoryFit(blocks,procs,strategy),blocks,procs});
  },[strategy,blockStr,procStr]);

  const STRATS=[{k:"first",l:"First Fit"},{k:"best",l:"Best Fit"},{k:"worst",l:"Worst Fit"}];

  return (
    <div className="fade-up">
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <h1 style={styles.pageTitle}>Memory Management</h1>
      <p style={styles.desc}>Allocate processes to memory blocks using different fit strategies.</p>

      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"1.25rem"}}>
        {STRATS.map(s=><button key={s.k} style={styles.pill(strategy===s.k)} onClick={()=>setStrategy(s.k)}>{s.l}</button>)}
      </div>

      <div style={styles.card}>
        <div style={styles.label}>Configuration</div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div>
            <div style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.35rem"}}>Memory Blocks (KB, space-separated)</div>
            <input style={{...styles.input,textAlign:"left",borderRadius:10,padding:"0.6rem 0.9rem",width:"100%"}} value={blockStr} onChange={e=>setBlockStr(e.target.value)} />
          </div>
          <div>
            <div style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.35rem"}}>Process Sizes (KB, space-separated)</div>
            <input style={{...styles.input,textAlign:"left",borderRadius:10,padding:"0.6rem 0.9rem",width:"100%"}} value={procStr} onChange={e=>setProcStr(e.target.value)} />
          </div>
        </div>
      </div>

      {result&&(
        <div style={styles.card}>
          <div style={styles.label}>Allocation Result</div>
          <table style={{...styles.table,borderSpacing:"0 0.4rem"}}>
            <thead><tr>
              <th style={styles.th}>Process</th>
              <th style={styles.th}>Size (KB)</th>
              <th style={styles.th}>Block</th>
              <th style={styles.th}>Block Size</th>
              <th style={styles.th}>Status</th>
            </tr></thead>
            <tbody>
              {result.procs.map((size,i)=>{
                const blkIdx=result.allocation[i];
                const allocated=blkIdx!==-1;
                return(
                  <tr key={i} style={{background:allocated?"rgba(52,211,153,.04)":"rgba(248,113,113,.05)"}}>
                    <td style={{padding:"0.3rem 0.5rem"}}><span style={styles.chip(colorFor(String(i+1)))}>P{i+1}</span></td>
                    <td style={{padding:"0.3rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.88rem"}}>{size}</td>
                    <td style={{padding:"0.3rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.88rem",color:"var(--muted2)"}}>{allocated?`B${blkIdx+1}`:"—"}</td>
                    <td style={{padding:"0.3rem 0.5rem",fontFamily:"var(--mono)",fontSize:"0.88rem",color:"var(--muted2)"}}>{allocated?result.blocks[blkIdx]:"—"}</td>
                    <td style={{padding:"0.3rem 0.5rem"}}><span style={styles.tag(!allocated)}>{allocated?"Allocated":"Not Allocated"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{marginTop:"1.25rem"}}>
            <div style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.5rem",fontWeight:600}}>Memory Block Map (Remaining Free Space)</div>
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
              {result.final_blocks.map((b,i)=>(
                <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"0.5rem 0.75rem",minWidth:70,textAlign:"center"}}>
                  <div style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--text)"}}>{b} KB</div>
                  <div style={{fontSize:"0.7rem",color:"var(--muted)"}}>Block {i+1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HOME_CARDS = [
  { key:"cpu", title:"CPU Scheduling", sub:"FCFS · SJF · Priority · Round Robin", icon:"⚙️" },
  { key:"page", title:"Page Replacement", sub:"FIFO · LRU", icon:"📄" },
  { key:"disk", title:"Disk Scheduling", sub:"FCFS · SSTF", icon:"💿" },
  { key:"memory", title:"Memory Management", sub:"First Fit · Best Fit · Worst Fit", icon:"🧠" },
];

function HomePage({ setPage }) {
  return (
    <div className="fade-up">
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Operating System Visualizer</h1>
        <p style={styles.heroSub}>Interactive simulations for core OS scheduling and memory algorithms</p>
      </div>
      <div style={styles.cards}>
        {HOME_CARDS.map(c=>(
          <div key={c.key} style={styles.homeCard} onClick={()=>setPage(c.key)}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(129,140,248,.15)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
            <div style={{fontSize:"1.75rem",marginBottom:"0.75rem"}}>{c.icon}</div>
            <div style={styles.homeCardH}>{c.title}</div>
            <div style={styles.homeCardSub}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV_PAGES = [
  {key:"cpu",label:"CPU"},
  {key:"page",label:"Paging"},
  {key:"disk",label:"Disk"},
  {key:"memory",label:"Memory"},
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={styles.app}>
      <style>{CSS}</style>
      <nav style={styles.nav}>
        <span style={styles.brand} onClick={()=>setPage("home")}>OSVisu</span>
        <div style={styles.navLinks}>
          {NAV_PAGES.map(p=>(
            <span key={p.key} style={styles.navLink(page===p.key)} onClick={()=>setPage(p.key)}>{p.label}</span>
          ))}
        </div>
      </nav>
      <main style={styles.main}>
        {page==="home" && <HomePage setPage={setPage}/>}
        {page==="cpu" && <CPUPage onBack={()=>setPage("home")}/>}
        {page==="page" && <PageReplacementPage onBack={()=>setPage("home")}/>}
        {page==="disk" && <DiskPage onBack={()=>setPage("home")}/>}
        {page==="memory" && <MemoryPage onBack={()=>setPage("home")}/>}
      </main>
    </div>
  );
}

