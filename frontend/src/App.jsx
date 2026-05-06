import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search, Upload, Download, Edit2, Clock, X, Check, Monitor,
  Plus, BarChart2, Trash2, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown, Printer, Layers, Tag, Activity,
  Columns, Eye, EyeOff
} from "lucide-react";

// In production (Render), VITE_API_URL env var is set to the backend service URL
// Locally it falls back to localhost:8000
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const READONLY = new Set(["id","created_at","updated_at","computer_name","timestamp"]);

function useDebounce(val, delay=350) {
  const [deb,setDeb]=useState(val);
  useEffect(()=>{const t=setTimeout(()=>setDeb(val),delay);return()=>clearTimeout(t);},[val,delay]);
  return deb;
}

const C={
  bg:"#070b14", surface:"#0c1120", surfaceAlt:"#080d1a",
  border:"#1a2540", borderHi:"#2a3f6a",
  textPrimary:"#f1f5f9", textSecondary:"#c8d6e5",
  textMuted:"#8fa8c8", textFaint:"#5a7a9a",
  blue:"#3b82f6", green:"#34d399", purple:"#a78bfa", amber:"#fbbf24", red:"#f87171",
};

function CellValue({fieldName,value}){
  const v=(value||"").toString().trim();
  if(!v)return<span style={{color:C.textFaint}}>—</span>;
  const f=fieldName.toLowerCase();
  if((f.includes("sr")&&f.includes("no"))||f==="sr_no")
    return<span style={{color:C.blue,fontWeight:700,fontFamily:"monospace",fontSize:13}}>{v}</span>;
  if(f==="section")
    return<span style={{background:"#1a2f5c",color:"#93c5fd",padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:700}}>{v}</span>;
  if(f==="ram")
    return<span style={{background:"#072414",color:"#4ade80",padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:700,border:"1px solid #0f4a28"}}>{v}</span>;
  if(f==="ups")
    return v.toLowerCase()==="yes"
      ?<span style={{color:"#4ade80",fontWeight:700,fontSize:12}}>{"✓ Yes"}</span>
      :<span style={{color:C.textMuted,fontSize:12}}>{v}</span>;
  if(f.includes("sno")||f.includes("serial")||f.includes("s_no"))
    return<span style={{fontFamily:"monospace",color:C.textMuted,fontSize:12}}>{v}</span>;
  return<span style={{color:C.textSecondary,fontSize:13}}>{v}</span>;
}

function Toast({toasts}){
  return(
    <div style={{position:"fixed",bottom:28,right:28,zIndex:9999,display:"flex",flexDirection:"column",gap:10}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:t.type==="error"?"#7f1d1d":t.type==="warn"?"#78350f":"#064e3b",
          borderLeft:`4px solid ${t.type==="error"?C.red:t.type==="warn"?C.amber:C.green}`,
          color:C.textPrimary,padding:"14px 20px",borderRadius:10,fontSize:14,fontWeight:500,
          boxShadow:"0 8px 30px rgba(0,0,0,0.5)",minWidth:300,animation:"slideIn .3s ease",
          display:"flex",alignItems:"center",gap:12}}>
          <span style={{color:t.type==="error"?C.red:t.type==="warn"?C.amber:C.green}}>
            {t.type==="error"?<X size={16}/>:t.type==="warn"?"⚠":<Check size={16}/>}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Pagination({page,totalPages,onPageChange}){
  if(totalPages<=1)return null;
  const getPages=()=>{
    if(totalPages<=7)return Array.from({length:totalPages},(_,i)=>i+1);
    const p=[1];
    if(page>3)p.push("...");
    for(let i=Math.max(2,page-1);i<=Math.min(totalPages-1,page+1);i++)p.push(i);
    if(page<totalPages-2)p.push("...");
    p.push(totalPages);
    return p;
  };
  const btn=(active,disabled)=>({minWidth:36,height:36,borderRadius:8,border:"none",
    cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:600,padding:"0 10px",
    background:active?C.blue:"#111827",color:active?"#fff":disabled?"#1e2d4a":C.textMuted,
    opacity:disabled?0.5:1,display:"flex",alignItems:"center",justifyContent:"center"});
  return(
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      <button onClick={()=>onPageChange(page-1)} disabled={page===1} style={btn(false,page===1)}><ChevronLeft size={14}/></button>
      {getPages().map((p,i)=>
        p==="..."?<span key={`e${i}`} style={{color:C.textFaint,padding:"0 6px"}}>…</span>
        :<button key={p} onClick={()=>onPageChange(p)} style={btn(p===page,false)}>{p}</button>
      )}
      <button onClick={()=>onPageChange(page+1)} disabled={page===totalPages} style={btn(false,page===totalPages)}><ChevronRight size={14}/></button>
    </div>
  );
}

function ConfirmDialog({title,message,danger,onConfirm,onCancel,confirmText="Confirm"}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(6px)",
      zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,borderRadius:16,padding:32,maxWidth:440,width:"100%",
        border:`1px solid ${danger?"#7f1d1d":C.border}`,boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        <div style={{fontSize:20,fontWeight:700,color:danger?C.red:C.textPrimary,marginBottom:12}}>{title}</div>
        <div style={{color:C.textSecondary,fontSize:14,lineHeight:1.7,marginBottom:28}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{padding:"10px 22px",borderRadius:9,border:`1px solid ${C.border}`,
            background:"transparent",color:C.textMuted,cursor:"pointer",fontSize:14}}>Cancel</button>
          <button onClick={onConfirm} style={{padding:"10px 22px",borderRadius:9,border:"none",cursor:"pointer",
            background:danger?"#dc2626":C.blue,color:"#fff",fontSize:14,fontWeight:700}}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function ImportDialog({file,onReplace,onAppend,onCancel}){
  const [sheets,setSheets]=useState([]);
  const [selectedSheet,setSelectedSheet]=useState("");
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState("");
  useEffect(()=>{
    const fd=new FormData(); fd.append("file",file);
    fetch(`${API}/sheets`,{method:"POST",body:fd})
      .then(async r=>{
        if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.detail||"Could not read file");}
        return r.json();
      })
      .then(d=>{
        const all=d.sheets||[];
        // Separate sheets with data from empty ones
        const withData=all.filter(s=>s.rows>0);
        const selectable=withData.length>0?withData:all; // if all empty, still show them
        setSheets(all);
        if(withData.length>0){
          const biggest=withData.reduce((a,b)=>b.rows>a.rows?b:a);
          setSelectedSheet(biggest.name);
        }
        setLoading(false);
      }).catch(e=>{setLoadError(e.message||"Failed to read file");setLoading(false);});
  },[file]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",
      zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,borderRadius:18,padding:36,maxWidth:500,width:"100%",
        border:`1px solid ${C.borderHi}`,boxShadow:"0 30px 70px rgba(0,0,0,0.8)"}}>
        <div style={{fontSize:22,fontWeight:800,color:C.textPrimary,marginBottom:8}}>Import Excel</div>
        <div style={{color:C.textMuted,fontSize:13,marginBottom:20}}>
          File: <span style={{color:"#60a5fa",fontWeight:600}}>{file.name}</span>
        </div>

        {/* Sheet Selector */}
        <div style={{marginBottom:20}}>
          <div style={{color:C.textFaint,fontSize:11,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>
            Select Sheet to Import
          </div>
          {loading?(
            <div style={{color:C.textMuted,fontSize:13,padding:12}}>Reading sheets…</div>
          ):loadError?(
            <div style={{color:C.red,fontSize:13,padding:"10px 14px",background:"#2a1010",borderRadius:9,border:"1px solid #7f1d1d"}}>
              ⚠ {loadError}
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
              {sheets.map(s=>{
                const isEmpty=s.rows===0;
                const isSel=selectedSheet===s.name;
                return(
                  <label key={s.name} onClick={()=>!isEmpty&&setSelectedSheet(s.name)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                      borderRadius:9,border:`1.5px solid ${isSel?C.blue:isEmpty?"#1a2030":C.border}`,
                      background:isSel?"#0d1f3a":C.surfaceAlt,
                      cursor:isEmpty?"not-allowed":"pointer",opacity:isEmpty?0.45:1,transition:"all .15s"}}>
                    <input type="radio" name="sheet" value={s.name} checked={isSel} onChange={()=>{}}
                      disabled={isEmpty} style={{accentColor:C.blue}}/>
                    <span style={{color:isSel?"#93c5fd":isEmpty?C.textFaint:C.textSecondary,fontWeight:600,fontSize:13,flex:1}}>{s.name}</span>
                    <span style={{color:isEmpty?C.textFaint:C.textMuted,fontSize:12}}>
                      {isEmpty?"empty":`${s.rows} rows`}
                    </span>
                  </label>
                );
              })}
              {sheets.length===0&&<div style={{color:C.textFaint,fontSize:13,padding:"8px 0"}}>No sheets found in this file.</div>}
            </div>
          )}
        </div>

        {!loadError&&(
          <>
            <div style={{color:C.textSecondary,fontSize:13,marginBottom:12,padding:14,background:C.surfaceAlt,borderRadius:10,border:`1px solid ${C.border}`}}>
              How do you want to import?
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>onReplace(selectedSheet)} disabled={!selectedSheet} style={{padding:"13px 20px",borderRadius:10,
                border:"1px solid #7f1d1d",background:"#2a1010",color:C.red,cursor:selectedSheet?"pointer":"not-allowed",
                fontSize:14,fontWeight:700,textAlign:"left",opacity:selectedSheet?1:0.45}}>
                Replace — Clear existing data, import fresh
              </button>
              <button onClick={()=>onAppend(selectedSheet)} disabled={!selectedSheet} style={{padding:"13px 20px",borderRadius:10,
                border:`1px solid ${C.borderHi}`,background:"linear-gradient(135deg,#1a2f5c,#0f1d3a)",color:"#93c5fd",
                cursor:selectedSheet?"pointer":"not-allowed",fontSize:14,fontWeight:700,textAlign:"left",opacity:selectedSheet?1:0.45}}>
                Append — Add to existing data
              </button>
            </div>
          </>
        )}
        <button onClick={onCancel} style={{padding:"11px 20px",borderRadius:10,border:`1px solid ${C.border}`,
          background:"transparent",color:C.textMuted,cursor:"pointer",fontSize:14,marginTop:12,width:"100%"}}>Cancel</button>
      </div>
    </div>
  );
}

function EditModal({system,columns,onClose,onSaved,addToast}){
  const [edits,setEdits]=useState({});
  const [saving,setSaving]=useState(false);
  const [history,setHistory]=useState([]);
  const editableCols=useMemo(()=>columns.filter(c=>!READONLY.has(c.field_name)),[columns]);
  const readonlyCols=useMemo(()=>columns.filter(c=>READONLY.has(c.field_name)&&system[c.field_name]),[columns,system]);
  const hasChanges=Object.keys(edits).length>0;
  const labelFor=(fn)=>columns.find(c=>c.field_name===fn)?.excel_header||fn;
  useEffect(()=>{
    fetch(`${API}/systems/${system.id}/history`).then(r=>r.json()).then(setHistory).catch(()=>{});
  },[system.id]);
  const handleSave=async()=>{
    setSaving(true);
    try{
      for(const[field,value]of Object.entries(edits)){
        await fetch(`${API}/systems/${system.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({field,value})});
      }
      addToast("Changes saved!","success");onSaved();onClose();
    }catch{addToast("Failed to save","error");}
    setSaving(false);
  };
  const nameCol=columns.find(c=>c.field_name.includes("model")||c.field_name.includes("make"));
  const firstCol=columns[0];
  const sectionCol=columns.find(c=>c.field_name.includes("section"));
  const roomCol=columns.find(c=>c.field_name.includes("room"));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0b1022",borderRadius:20,width:"100%",maxWidth:900,maxHeight:"93vh",
        overflow:"hidden",display:"flex",flexDirection:"column",border:`1px solid ${C.borderHi}`,boxShadow:"0 30px 80px rgba(0,0,0,0.7)"}}>
        <div style={{padding:"22px 28px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",
          gap:14,background:"linear-gradient(135deg,#0f1d3a,#0b1022)"}}>
          <div style={{background:"linear-gradient(135deg,#1e40af,#2563eb)",borderRadius:12,padding:"10px 11px",color:"#93c5fd"}}>
            <Monitor size={22}/>
          </div>
          <div style={{flex:1}}>
            <div style={{color:C.textPrimary,fontWeight:700,fontSize:17}}>{nameCol?(system[nameCol.field_name]||"System Details"):"System Details"}</div>
            <div style={{color:C.textMuted,fontSize:13,marginTop:3}}>
              {firstCol&&system[firstCol.field_name]&&<>{firstCol.excel_header} #{system[firstCol.field_name]} · </>}
              {sectionCol&&system[sectionCol.field_name]&&<>{system[sectionCol.field_name]} · </>}
              {roomCol&&system[roomCol.field_name]&&<>Room {system[roomCol.field_name]}</>}
            </div>
          </div>
          {hasChanges&&<span style={{background:"#1e3a5f",color:"#60a5fa",padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700}}>{Object.keys(edits).length} unsaved</span>}
          <button onClick={onClose} style={{background:"#1e2d4a",border:"none",color:C.textMuted,borderRadius:9,padding:9,cursor:"pointer",display:"flex"}}><X size={16}/></button>
        </div>
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <div style={{flex:1,padding:28,overflowY:"auto"}}>
            <div style={{color:C.textFaint,fontSize:11,fontWeight:700,letterSpacing:1.5,marginBottom:18,textTransform:"uppercase"}}>Editable Fields</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {editableCols.map(col=>{
                const current=edits[col.field_name]??system[col.field_name]??"";
                const changed=edits[col.field_name]!==undefined&&edits[col.field_name]!==system[col.field_name];
                return(
                  <div key={col.field_name}>
                    <label style={{color:changed?"#60a5fa":C.textFaint,fontSize:11,fontWeight:700,
                      display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>
                      {col.excel_header}{changed&&<span style={{color:C.amber}}> ◆</span>}
                    </label>
                    <input value={current} onChange={e=>setEdits(p=>({...p,[col.field_name]:e.target.value}))}
                      style={{width:"100%",padding:"10px 13px",borderRadius:9,fontSize:13,
                        background:changed?"#0a1e38":"#0f1829",border:`1.5px solid ${changed?C.blue:C.border}`,
                        color:C.textPrimary,outline:"none",boxSizing:"border-box",transition:"all .2s"}}/>
                  </div>
                );
              })}
            </div>
            {readonlyCols.length>0&&(
              <div style={{marginTop:22,padding:16,background:C.surfaceAlt,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{color:C.textFaint,fontSize:11,fontWeight:700,letterSpacing:1.5,marginBottom:12,textTransform:"uppercase"}}>Auto-collected (Read Only)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {readonlyCols.map(col=>(
                    <div key={col.field_name} style={{padding:"9px 13px",background:C.surface,borderRadius:8,border:`1px solid ${C.border}`}}>
                      <div style={{color:C.textFaint,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:5}}>{col.excel_header}</div>
                      <div style={{color:C.textMuted,fontSize:13}}>{system[col.field_name]||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{width:260,background:C.surfaceAlt,borderLeft:`1px solid ${C.border}`,padding:22,overflowY:"auto"}}>
            <div style={{color:C.textFaint,fontSize:11,fontWeight:700,letterSpacing:1.5,marginBottom:18,
              textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
              <Clock size={13}/> Change History
            </div>
            {history.length===0?(
              <div style={{textAlign:"center",marginTop:60}}>
                <div style={{color:C.border,fontSize:40,marginBottom:12}}>○</div>
                <div style={{color:C.textFaint,fontSize:13}}>No changes yet</div>
              </div>
            ):history.map(h=>(
              <div key={h.id} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
                <div style={{color:"#60a5fa",fontSize:12,fontWeight:600,marginBottom:6}}>{labelFor(h.field_name)}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{color:"#fca5a5",fontSize:11,background:"#2a1010",padding:"3px 8px",borderRadius:5}}>{h.old_value||"—"}</span>
                  <span style={{color:C.textFaint}}>→</span>
                  <span style={{color:"#6ee7b7",fontSize:11,background:"#0a2018",padding:"3px 8px",borderRadius:5}}>{h.new_value||"—"}</span>
                </div>
                <div style={{color:C.textFaint,fontSize:11}}>{new Date(h.changed_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"18px 28px",borderTop:`1px solid ${C.border}`,display:"flex",
          justifyContent:"space-between",alignItems:"center",background:C.surfaceAlt}}>
          <div style={{fontSize:13}}>
            {hasChanges?<span style={{color:C.amber}}>⚠ {Object.keys(edits).length} unsaved</span>:<span style={{color:C.textFaint}}>No changes</span>}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{padding:"10px 22px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,cursor:"pointer",fontSize:14}}>Cancel</button>
            <button onClick={handleSave} disabled={!hasChanges||saving} style={{padding:"10px 26px",borderRadius:9,border:"none",fontSize:14,fontWeight:700,
              cursor:hasChanges?"pointer":"not-allowed",background:hasChanges?"linear-gradient(135deg,#2563eb,#1d4ed8)":"#1a2540",
              color:hasChanges?"#fff":C.textFaint,display:"flex",alignItems:"center",gap:8,
              boxShadow:hasChanges?"0 4px 20px rgba(37,99,235,.4)":"none"}}>
              {saving?"Saving…":<><Check size={15}/> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddModal({columns,onClose,onSaved,addToast}){
  const [data,setData]=useState({});
  const [saving,setSaving]=useState(false);
  const editableCols=useMemo(()=>columns.filter(c=>!READONLY.has(c.field_name)),[columns]);
  const handleSave=async()=>{
    setSaving(true);
    try{
      const r=await fetch(`${API}/systems`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(r.ok){addToast("System added!","success");onSaved();onClose();}
      else addToast("Failed to add","error");
    }catch{addToast("Failed to add","error");}
    setSaving(false);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0b1022",borderRadius:20,width:"100%",maxWidth:740,maxHeight:"90vh",
        overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid #1e3a1e",boxShadow:"0 30px 80px rgba(0,0,0,0.7)"}}>
        <div style={{padding:"22px 28px",borderBottom:"1px solid #1e3a1e",display:"flex",alignItems:"center",gap:14,background:"linear-gradient(135deg,#071a07,#0b1022)"}}>
          <div style={{background:"linear-gradient(135deg,#15803d,#16a34a)",borderRadius:12,padding:"10px 11px",color:"#fff"}}><Plus size={22}/></div>
          <div style={{flex:1}}>
            <div style={{color:C.textPrimary,fontWeight:700,fontSize:17}}>Add New System</div>
            <div style={{color:C.textMuted,fontSize:13,marginTop:3}}>Enter system details manually</div>
          </div>
          <button onClick={onClose} style={{background:"#1a2540",border:"none",color:C.textMuted,borderRadius:9,padding:9,cursor:"pointer",display:"flex"}}><X size={16}/></button>
        </div>
        <div style={{padding:28,overflowY:"auto"}}>
          {editableCols.length===0
            ?<div style={{textAlign:"center",padding:40,color:C.textFaint}}>Import an Excel file first to define columns.</div>
            :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {editableCols.map(col=>(
                <div key={col.field_name}>
                  <label style={{color:C.textFaint,fontSize:11,fontWeight:700,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>{col.excel_header}</label>
                  <input value={data[col.field_name]||""} onChange={e=>setData(p=>({...p,[col.field_name]:e.target.value}))}
                    style={{width:"100%",padding:"10px 13px",borderRadius:9,fontSize:13,background:"#0f1829",
                      border:`1.5px solid ${C.border}`,color:C.textPrimary,outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>}
        </div>
        <div style={{padding:"18px 28px",borderTop:"1px solid #1e3a1e",display:"flex",justifyContent:"flex-end",gap:10,background:C.surfaceAlt}}>
          <button onClick={onClose} style={{padding:"10px 22px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,cursor:"pointer",fontSize:14}}>Cancel</button>
          <button onClick={handleSave} disabled={saving||editableCols.length===0} style={{padding:"10px 26px",borderRadius:9,border:"none",fontSize:14,fontWeight:700,cursor:"pointer",
            background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 15px rgba(22,163,74,.35)"}}>
            {saving?"Adding…":<><Plus size={15}/> Add System</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsView({stats,columns}){
  const fieldLabels=useMemo(()=>Object.fromEntries((columns||[]).map(c=>[c.field_name,c.excel_header])),[columns]);
  if(!stats)return<div style={{textAlign:"center",padding:80,color:C.textFaint}}>Loading stats…</div>;
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      {[
        {title:"Systems by Section",data:stats.by_section,keyField:"section",valField:"cnt",color:C.blue},
        {title:"Systems by Brand",data:stats.by_make,keyField:"system_make",valField:"cnt",color:C.purple},
      ].map(({title,data,keyField,valField,color})=>(
        <div key={title} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
          <div style={{color:C.textSecondary,fontWeight:700,fontSize:15,marginBottom:22}}>{title}</div>
          {!(data||[]).length?<div style={{color:C.textFaint,fontSize:13}}>No data yet</div>
          :(data||[]).map(item=>{
            const max=Math.max(...(data||[]).map(d=>d[valField]));
            return(
              <div key={item[keyField]} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{color:C.textSecondary,fontSize:13}}>{item[keyField]||"Unknown"}</span>
                  <span style={{color,fontWeight:700,fontSize:13,fontFamily:"monospace"}}>{item[valField]}</span>
                </div>
                <div style={{height:7,background:"#111827",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${max>0?(item[valField]/max)*100:0}%`,background:`linear-gradient(90deg,${color}80,${color})`,borderRadius:4}}/>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{gridColumn:"1/-1",background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:28}}>
        <div style={{color:C.textSecondary,fontWeight:700,fontSize:15,marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <Activity size={16}/> Recent Changes
        </div>
        {!(stats.recent_changes||[]).length?<div style={{color:C.textFaint,fontSize:13}}>No changes yet</div>
        :(stats.recent_changes||[]).map(h=>(
          <div key={h.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #0f1525",flexWrap:"wrap"}}>
            <div style={{color:C.textFaint,fontSize:12,minWidth:140,fontFamily:"monospace"}}>{new Date(h.changed_at).toLocaleString()}</div>
            <div style={{color:"#60a5fa",fontSize:13,fontWeight:600,minWidth:110}}>{fieldLabels[h.field_name]||h.field_name}</div>
            <span style={{color:"#fca5a5",fontSize:12,background:"#2a1010",padding:"3px 10px",borderRadius:6}}>{h.old_value||"—"}</span>
            <span style={{color:C.textFaint}}>→</span>
            <span style={{color:"#6ee7b7",fontSize:12,background:"#0a2018",padding:"3px 10px",borderRadius:6}}>{h.new_value||"—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App(){
  const [columns,setColumns]=useState([]);
  const [systems,setSystems]=useState([]);
  const [total,setTotal]=useState(0);
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(false);
  const [editTarget,setEditTarget]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [stats,setStats]=useState(null);
  const [modified,setModified]=useState(false);
  const [toasts,setToasts]=useState([]);
  const [uploading,setUploading]=useState(false);
  const [view,setView]=useState("table");
  const [importConfirm,setImportConfirm]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [clearAllConfirm,setClearAllConfirm]=useState(false);
  const [bulkDeleteConfirm,setBulkDeleteConfirm]=useState(false);
  const [sortBy,setSortBy]=useState("");
  const [sortDir,setSortDir]=useState("asc");
  const [filterSection,setFilterSection]=useState("");
  const [filterRoom,setFilterRoom]=useState("");
  const [filterSheet,setFilterSheet]=useState("");
  const [filterOptions,setFilterOptions]=useState({sections:[],rooms:[],sheets:[]});
  const [selected,setSelected]=useState(new Set());
  const [hiddenCols,setHiddenCols]=useState(()=>new Set(JSON.parse(localStorage.getItem("hiddenCols")||"[]")));
  const [activeSheetCols,setActiveSheetCols]=useState(null);
  const [showColPanel,setShowColPanel]=useState(false);
  const colPanelRef=useRef();
  const fileRef=useRef();
  const debSearch=useDebounce(search);
  const LIMIT=20;
  const editableCols=useMemo(()=>columns.filter(c=>!READONLY.has(c.field_name)),[columns]);
  const visibleCols=useMemo(()=>editableCols.filter(c=>{
    if(hiddenCols.has(c.field_name))return false;
    if(activeSheetCols&&!activeSheetCols.has(c.field_name))return false;
    return true;
  }),[editableCols,hiddenCols,activeSheetCols]);
  const toggleCol=(fn)=>setHiddenCols(prev=>{
    const n=new Set(prev);n.has(fn)?n.delete(fn):n.add(fn);
    localStorage.setItem("hiddenCols",JSON.stringify([...n]));return n;
  });
  const addToast=useCallback((msg,type="success")=>{
    const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
  },[]);
  const fetchColumns=useCallback(async()=>{try{const r=await fetch(`${API}/columns`);setColumns(await r.json());}catch{}},[]);
  const fetchSystems=useCallback(async()=>{
    setLoading(true);
    try{
      const p=new URLSearchParams({search:debSearch,page,limit:LIMIT,sort_by:sortBy,sort_dir:sortDir,section:filterSection,room_no:filterRoom,sheet:filterSheet});
      const r=await fetch(`${API}/systems?${p}`);const d=await r.json();
      setSystems(d.data);setTotal(d.total);setSelected(new Set());
    }catch{addToast("Cannot connect to backend. Is it running?","error");}
    setLoading(false);
  },[debSearch,page,sortBy,sortDir,filterSection,filterRoom,filterSheet,addToast]);
  const fetchStats=useCallback(async()=>{try{const r=await fetch(`${API}/stats`);setStats(await r.json());}catch{}},[]);
  const fetchFilterOptions=useCallback(async()=>{try{const r=await fetch(`${API}/filter-options`);setFilterOptions(await r.json());}catch{}},[]);
  useEffect(()=>{fetchColumns();},[fetchColumns]);
  useEffect(()=>{fetchSystems();},[fetchSystems]);
  useEffect(()=>{fetchStats();fetchFilterOptions();},[fetchStats,fetchFilterOptions]);
  useEffect(()=>{
    if(!showColPanel)return;
    const handler=(e)=>{if(colPanelRef.current&&!colPanelRef.current.contains(e.target))setShowColPanel(false);};
    document.addEventListener("mousedown",handler);return()=>document.removeEventListener("mousedown",handler);
  },[showColPanel]);
  useEffect(()=>{
    if(!filterSheet){setActiveSheetCols(null);return;}
    fetch(`${API}/active-columns?sheet=${encodeURIComponent(filterSheet)}`)
      .then(r=>r.json()).then(cols=>setActiveSheetCols(new Set(cols))).catch(()=>setActiveSheetCols(null));
  },[filterSheet]);
  useEffect(()=>{setPage(1);setSelected(new Set());},[debSearch,filterSection,filterRoom,filterSheet,sortBy,sortDir]);
  const handleFileSelect=(e)=>{const file=e.target.files[0];if(!file)return;setImportConfirm(file);e.target.value="";};
  const doImport=async(file,clearExisting,sheetName="")=>{
    setImportConfirm(null);setUploading(true);
    const fd=new FormData();fd.append("file",file);
    try{
      const r=await fetch(`${API}/upload?clear_existing=${clearExisting}&sheet_name=${encodeURIComponent(sheetName)}`,{method:"POST",body:fd});
      const d=await r.json();addToast(d.message,"success");
      await fetchColumns();fetchSystems();fetchStats();fetchFilterOptions();setModified(false);
    }catch{addToast("Upload failed","error");}
    setUploading(false);
  };
  const handleDownload=async()=>{
    const r=await fetch(`${API}/download`);const blob=await r.blob();
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`SystemInventory_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();URL.revokeObjectURL(url);setModified(false);addToast("Downloaded!","success");
  };
  const handleClearAll=async()=>{
    try{await fetch(`${API}/systems/all`,{method:"DELETE"});addToast("Cleared!","success");
      fetchSystems();fetchStats();fetchFilterOptions();fetchColumns();setModified(false);
      setHiddenCols(new Set());localStorage.removeItem("hiddenCols");
      setActiveSheetCols(null);setFilterSheet("");setFilterSection("");setFilterRoom("");}
    catch{addToast("Failed","error");}setClearAllConfirm(false);
  };
  const handleDelete=async(id)=>{
    try{await fetch(`${API}/systems/${id}`,{method:"DELETE"});addToast("Deleted","success");fetchSystems();fetchStats();setModified(true);}
    catch{addToast("Failed","error");}setDeleteConfirm(null);
  };
  const handleBulkDelete=async()=>{
    try{
      await fetch(`${API}/systems/bulk-delete`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:[...selected]})});
      addToast(`Deleted ${selected.size}`,"success");setSelected(new Set());fetchSystems();fetchStats();setModified(true);
    }catch{addToast("Failed","error");}setBulkDeleteConfirm(false);
  };
  const handleSort=(col)=>{if(sortBy===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(col);setSortDir("asc");}};
  const allSelected=systems.length>0&&systems.every(s=>selected.has(s.id));
  const toggleSelectAll=()=>{
    if(allSelected)setSelected(p=>{const n=new Set(p);systems.forEach(s=>n.delete(s.id));return n;});
    else setSelected(p=>{const n=new Set(p);systems.forEach(s=>n.add(s.id));return n;});
  };
  const toggleSelect=(id,e)=>{e.stopPropagation();setSelected(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});};
  const totalPages=Math.ceil(total/LIMIT);
  const SortIcon=({col})=>{
    if(sortBy!==col)return<ArrowUpDown size={12} style={{color:C.textFaint,opacity:.5}}/>;
    return sortDir==="asc"?<ArrowUp size={12} style={{color:C.blue}}/>:<ArrowDown size={12} style={{color:C.blue}}/>;
  };
  const statCards=[
    {label:"Total Systems",value:total,color:C.blue,bg:"#0d1d3a",icon:<Monitor size={28}/>},
    {label:"Sections",value:stats?.by_section?.length||0,color:C.purple,bg:"#190f3a",icon:<Layers size={28}/>},
    {label:"Brands",value:stats?.by_make?.length||0,color:C.amber,bg:"#271f00",icon:<Tag size={28}/>},
    {label:"Recent Changes",value:stats?.recent_changes?.length||0,color:C.green,bg:"#071f12",icon:<Activity size={28}/>},
  ];
  const selStyle={padding:"8px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,
    background:C.surface,color:C.textSecondary,fontSize:13,cursor:"pointer",outline:"none",fontFamily:"inherit"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',sans-serif",color:C.textPrimary}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#080d1a}
        ::-webkit-scrollbar-thumb{background:#1e2d4a;border-radius:4px}
        @keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.5)}50%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
        .row-tr{transition:background .12s}.row-tr:hover{background:#0d1a30!important;cursor:pointer}
        .row-tr.sel{background:#0a1928!important}
        .th-sort{cursor:pointer;user-select:none}.th-sort:hover{color:#93c5fd!important;background:rgba(37,99,235,0.06)!important}
        .nbtn:hover{filter:brightness(1.1);transform:translateY(-1px)}
        input:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
        .dbtn:hover{background:#3b1212!important}.ebtn:hover{background:#0d1f3a!important}
        @media print{nav,.noprint{display:none!important}body{background:#fff!important;color:#000!important}
          table{font-size:11px}th{background:#1a3a6a!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
          td{border-bottom:1px solid #ddd!important}}
      `}</style>
      <nav style={{background:"#080d1a",borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:62,
        display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 30px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:4}}>
          <div style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",borderRadius:10,padding:"8px 9px",color:"#fff",boxShadow:"0 4px 15px rgba(37,99,235,.4)"}}>
            <Monitor size={18}/>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:C.textPrimary,lineHeight:1.1}}>IT Inventory</div>
            <div style={{fontSize:10,color:C.textFaint}}>System Management</div>
          </div>
        </div>
        <div style={{display:"flex",background:"#0f1525",borderRadius:9,padding:3,border:`1px solid ${C.border}`}}>
          {[["table",<Monitor size={14}/>,"Table"],["stats",<BarChart2 size={14}/>,"Stats"]].map(([v,icon,label])=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"7px 16px",borderRadius:7,border:"none",cursor:"pointer",
              fontSize:13,fontWeight:600,background:view===v?"#1a2f5c":"transparent",
              color:view===v?"#60a5fa":C.textFaint,display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>setShowAdd(true)} className="nbtn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
          background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,
          transition:"all .2s",boxShadow:"0 4px 15px rgba(22,163,74,.3)"}}>
          <Plus size={14}/> Add System
        </button>
        <div style={{position:"relative"}} ref={colPanelRef}>
          <button onClick={()=>setShowColPanel(p=>!p)} className="nbtn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
            background:hiddenCols.size>0?"#1a2f5c":"#141928",border:`1px solid ${hiddenCols.size>0?C.blue:C.border}`,
            color:hiddenCols.size>0?"#60a5fa":C.textSecondary,cursor:"pointer",fontSize:13,fontWeight:500,transition:"all .2s"}}>
            <Columns size={14}/> Columns {(hiddenCols.size>0||(activeSheetCols&&editableCols.length>activeSheetCols.size))&&<span style={{background:C.blue,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{editableCols.length-visibleCols.length} hidden</span>}
          </button>
          {showColPanel&&(
            <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:"#0c1120",border:`1px solid ${C.borderHi}`,
              borderRadius:12,padding:14,zIndex:200,minWidth:240,maxHeight:360,overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.6)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{color:C.textFaint,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Show / Hide Columns</span>
                {hiddenCols.size>0&&<button onClick={()=>{setHiddenCols(new Set());localStorage.removeItem("hiddenCols");}}
                  style={{background:"transparent",border:"none",color:C.blue,cursor:"pointer",fontSize:11,fontWeight:700}}>Show All</button>}
              </div>
              {editableCols.map(col=>{
                const userHidden=hiddenCols.has(col.field_name);
                const sheetHidden=activeSheetCols&&!activeSheetCols.has(col.field_name);
                const hidden=userHidden||sheetHidden;
                return(
                  <div key={col.field_name} onClick={()=>!sheetHidden&&toggleCol(col.field_name)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,
                      cursor:sheetHidden?"default":"pointer",background:hidden?"transparent":"#0f1829",marginBottom:3,transition:"background .15s"}}
                    onMouseEnter={e=>{if(!sheetHidden)e.currentTarget.style.background="#111f3a";}}
                    onMouseLeave={e=>e.currentTarget.style.background=hidden?"transparent":"#0f1829"}>
                    <span style={{color:hidden?C.textFaint:C.green,display:"flex"}}>{hidden?<EyeOff size={14}/>:<Eye size={14}/>}</span>
                    <span style={{color:hidden?C.textFaint:C.textSecondary,fontSize:13,flex:1,textDecoration:userHidden?"line-through":"none"}}>{col.excel_header}</span>
                    {sheetHidden&&<span style={{fontSize:10,color:C.textFaint,background:"#0f1525",padding:"2px 6px",borderRadius:4,whiteSpace:"nowrap"}}>no data</span>}
                  </div>
                );
              })}
              {editableCols.length===0&&<div style={{color:C.textFaint,fontSize:13,padding:"8px 0"}}>No columns yet</div>}
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} style={{display:"none"}}/>
        <button onClick={()=>fileRef.current.click()} className="nbtn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
          background:"#141928",border:`1px solid ${C.border}`,color:C.textSecondary,cursor:"pointer",fontSize:13,fontWeight:500,transition:"all .2s"}}>
          <Upload size={14}/> {uploading?"Importing…":"Import Excel"}
        </button>
        <button onClick={handleDownload} className="nbtn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
          background:modified?"linear-gradient(135deg,#2563eb,#1d4ed8)":"#141928",border:modified?"none":`1px solid ${C.border}`,
          color:modified?"#fff":C.textMuted,cursor:"pointer",fontSize:13,fontWeight:600,transition:"all .2s",
          boxShadow:modified?"0 4px 20px rgba(37,99,235,.4)":"none",animation:modified?"pulse 2s infinite":"none"}}>
          <Download size={14}/> Export Excel {modified&&"✦"}
        </button>
        <button onClick={()=>window.print()} className="nbtn noprint" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,
          background:"#141928",border:`1px solid ${C.border}`,color:C.textMuted,cursor:"pointer",fontSize:13,transition:"all .2s"}}>
          <Printer size={14}/> Print
        </button>
        <div style={{width:1,height:28,background:C.border}}/>
        <button onClick={()=>setClearAllConfirm(true)} className="nbtn" style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,
          background:"transparent",border:"1px solid #7f1d1d",color:C.red,cursor:"pointer",fontSize:13,fontWeight:600,transition:"all .2s"}}>
          <Trash2 size={14}/> Clear All
        </button>
      </nav>
      <div style={{padding:"26px 24px"}}>
        {view==="stats"?<StatsView stats={stats} columns={columns}/>:(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:26}}>
              {statCards.map((s,i)=>(
                <div key={s.label} style={{background:s.bg,border:`1px solid ${s.color}25`,borderRadius:14,padding:"20px 22px",
                  animation:`fadeUp .35s ease ${i*.07}s both`,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:16,right:16,color:s.color,opacity:.15}}>{s.icon}</div>
                  <div style={{color:C.textFaint,fontSize:12,fontWeight:600,letterSpacing:.5,marginBottom:10}}>{s.label}</div>
                  <div style={{fontSize:38,fontWeight:800,color:s.color,fontFamily:"monospace",lineHeight:1}}>{s.value}</div>
                  <div style={{marginTop:14,height:3,background:"#1a2540",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.min(100,s.value*3+10)}%`,background:s.color,borderRadius:2,opacity:.4}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{position:"relative",flex:1,minWidth:280}}>
                <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.textFaint}}><Search size={16}/></div>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search across all columns…"
                  style={{width:"100%",padding:"11px 14px 11px 44px",borderRadius:10,background:C.surface,
                    border:`1.5px solid ${C.border}`,color:C.textPrimary,fontSize:14,outline:"none"}}/>
                {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  background:C.border,border:"none",color:C.textMuted,cursor:"pointer",borderRadius:6,padding:"4px 6px",display:"flex"}}>
                  <X size={13}/>
                </button>}
              </div>
              <select value={filterSheet} onChange={e=>setFilterSheet(e.target.value)}
                disabled={filterOptions.sheets.length===0}
                style={{...selStyle,
                  borderColor:filterSheet?C.blue:C.border,
                  color:filterSheet?"#60a5fa":filterOptions.sheets.length===0?C.textFaint:C.textSecondary,
                  background:filterSheet?"#0a1830":C.surface,
                  opacity:filterOptions.sheets.length===0?0.5:1,
                  cursor:filterOptions.sheets.length===0?"not-allowed":"pointer"}}>
                <option value="">{filterOptions.sheets.length===0?"No Sheets (Re-import)":"All Sheets"}</option>
                {filterOptions.sheets.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterSection} onChange={e=>setFilterSection(e.target.value)} style={selStyle}>
                <option value="">All Sections</option>
                {filterOptions.sections.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterRoom} onChange={e=>setFilterRoom(e.target.value)} style={selStyle}>
                <option value="">All Rooms</option>
                {filterOptions.rooms.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              {(filterSection||filterRoom||filterSheet)&&<button onClick={()=>{setFilterSection("");setFilterRoom("");setFilterSheet("");}} style={{
                padding:"8px 14px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",
                color:C.textMuted,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                <X size={13}/> Clear filters
              </button>}
            </div>
            {selected.size>0&&(
              <div style={{background:"#0f1f3a",border:`1px solid ${C.blue}44`,borderRadius:11,padding:"12px 18px",
                marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",animation:"fadeUp .2s ease"}}>
                <span style={{color:C.textSecondary,fontSize:14,fontWeight:600}}>
                  <span style={{color:C.blue,fontWeight:800}}>{selected.size}</span> selected
                </span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setSelected(new Set())} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,cursor:"pointer",fontSize:13}}>Deselect All</button>
                  <button onClick={()=>setBulkDeleteConfirm(true)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #7f1d1d",background:"#2a1010",color:C.red,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                    <Trash2 size={13}/> Delete {selected.size}
                  </button>
                </div>
              </div>
            )}
            <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 4px 30px rgba(0,0,0,0.3)"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{background:"linear-gradient(180deg,#0f1e3d 0%,#0a1628 100%)"}}>
                      <th style={{padding:"14px 14px",borderBottom:`2px solid ${C.blue}33`,width:44}}>
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{cursor:"pointer",accentColor:C.blue,width:15,height:15}}/>
                      </th>
                      {visibleCols.map(col=>(
                        <th key={col.field_name} className="th-sort" onClick={()=>handleSort(col.field_name)}
                          style={{padding:"14px 14px",textAlign:"left",
                            color:sortBy===col.field_name?"#93c5fd":"#cbd5e1",
                            fontWeight:700,fontSize:12,letterSpacing:.6,textTransform:"uppercase",
                            borderBottom:`2px solid ${sortBy===col.field_name?C.blue+"88":C.blue+"22"}`,
                            whiteSpace:"nowrap",minWidth:120,transition:"color .15s",
                            background:sortBy===col.field_name?"rgba(37,99,235,0.08)":"transparent"}}>
                          <span style={{display:"flex",alignItems:"center",gap:5}}>
                            {col.excel_header} <SortIcon col={col.field_name}/>
                          </span>
                        </th>
                      ))}
                      <th style={{padding:"14px 14px",borderBottom:`2px solid ${C.blue}22`,color:"#cbd5e1",fontWeight:700,fontSize:12,textTransform:"uppercase",minWidth:120}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading?(
                      <tr><td colSpan={visibleCols.length+2} style={{textAlign:"center",padding:70,color:C.textFaint}}>Loading…</td></tr>
                    ):systems.length===0?(
                      <tr><td colSpan={visibleCols.length+2} style={{textAlign:"center",padding:80}}>
                        <div style={{fontSize:40,marginBottom:14,opacity:.3}}>📦</div>
                        <div style={{fontSize:15,color:C.textSecondary,fontWeight:600,marginBottom:6}}>
                          {search||filterSection||filterRoom||filterSheet?"No results found":"No data yet"}
                        </div>
                        <div style={{fontSize:13,color:C.textMuted}}>
                          {search||filterSection||filterRoom||filterSheet?"Try adjusting your search or filters":"Import an Excel file or add a system manually"}
                        </div>
                      </td></tr>
                    ):systems.map((s,i)=>{
                      const isSel=selected.has(s.id);
                      return(
                        <tr key={s.id} className={`row-tr${isSel?" sel":""}`} onClick={()=>setEditTarget(s)}
                          style={{background:isSel?"#0a1928":i%2===0?C.surface:C.surfaceAlt,
                            borderBottom:"1px solid #0f1525",animation:`fadeUp .2s ease ${Math.min(i*.025,.25)}s both`}}>
                          <td style={{padding:"12px 14px"}} onClick={e=>toggleSelect(s.id,e)}>
                            <input type="checkbox" checked={isSel} onChange={()=>{}} style={{cursor:"pointer",accentColor:C.blue,width:15,height:15}}/>
                          </td>
                          {visibleCols.map(col=>(
                            <td key={col.field_name} style={{padding:"12px 14px",maxWidth:200}}>
                              <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                <CellValue fieldName={col.field_name} value={s[col.field_name]}/>
                              </div>
                            </td>
                          ))}
                          <td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
                            <div style={{display:"flex",gap:6}}>
                              <button className="ebtn" onClick={()=>setEditTarget(s)} style={{background:"#0d1e36",border:`1px solid ${C.borderHi}`,color:"#60a5fa",
                                borderRadius:8,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,transition:"all .15s"}}>
                                <Edit2 size={13}/> Edit
                              </button>
                              <button className="dbtn" onClick={()=>setDeleteConfirm(s.id)} style={{background:"#200f0f",border:"1px solid #7f1d1d",color:C.red,
                                borderRadius:8,padding:"7px 10px",cursor:"pointer",display:"flex",transition:"all .15s"}}>
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages>1&&(
                <div style={{padding:"15px 20px",borderTop:"1px solid #0f1525",display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surfaceAlt}}>
                  <div style={{color:C.textMuted,fontSize:13}}>
                    Showing <span style={{color:C.textSecondary,fontWeight:600}}>{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)}</span> of <span style={{color:C.textSecondary,fontWeight:600}}>{total}</span>
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage}/>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {importConfirm&&<ImportDialog file={importConfirm} onReplace={(sh)=>doImport(importConfirm,true,sh)} onAppend={(sh)=>doImport(importConfirm,false,sh)} onCancel={()=>setImportConfirm(null)}/>}
      {clearAllConfirm&&<ConfirmDialog title="Clear All Data?" message="Permanently delete ALL systems and change history." danger confirmText="Yes, Clear Everything" onConfirm={handleClearAll} onCancel={()=>setClearAllConfirm(false)}/>}
      {deleteConfirm&&<ConfirmDialog title="Delete System?" message="Permanently delete this system and its change history." danger confirmText="Yes, Delete" onConfirm={()=>handleDelete(deleteConfirm)} onCancel={()=>setDeleteConfirm(null)}/>}
      {bulkDeleteConfirm&&<ConfirmDialog title={`Delete ${selected.size} Systems?`} message={`Permanently delete ${selected.size} selected systems.`} danger confirmText={`Delete ${selected.size}`} onConfirm={handleBulkDelete} onCancel={()=>setBulkDeleteConfirm(false)}/>}
      {editTarget&&<EditModal system={editTarget} columns={columns} onClose={()=>setEditTarget(null)} onSaved={()=>{fetchSystems();fetchStats();setModified(true);}} addToast={addToast}/>}
      {showAdd&&<AddModal columns={columns} onClose={()=>setShowAdd(false)} onSaved={()=>{fetchSystems();fetchStats();fetchFilterOptions();setModified(true);}} addToast={addToast}/>}
      <Toast toasts={toasts}/>
    </div>
  );
}


