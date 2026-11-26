/* TEL × Supabase: sign-in screen + the data layer the app uses (records, live updates, who is signed in, downloads).
   All records sit in one table, tel.docs (TEL's own section of the database) (col, id, data). The database rules (supabase/schema.sql) decide who may read or change what. */
(function(){
"use strict";
const C=window.TEL_CONFIG||{};
const lang=()=>{ try{ return localStorage.getItem("tel_lang")||"vi"; }catch(e){ return "vi"; } };
const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
let sb=null, session=null, ME=null;
const waiters=[]; let readyVal=null;
function whenReady(){ return readyVal?Promise.resolve(readyVal):new Promise(r=>waiters.push(r)); }

/* ---------- sign-in screen ---------- */
const css=`#telAuth{position:fixed;inset:0;z-index:50;background:var(--bg,#F5F4F7);display:grid;place-items:center;padding:16px;overflow:auto}
#telAuth .box{width:100%;max-width:380px;background:var(--surface,#fff);border:1px solid var(--line,#DEDDE7);border-radius:14px;padding:22px;display:grid;gap:12px}
#telAuth h1{font-size:22px;margin:0}#telAuth .sub{margin:0}#telAuth .tabsA{display:flex;gap:6px;flex-wrap:wrap}
#telAuth .msg{font-size:14px;font-weight:600;border-radius:8px;padding:8px 12px;background:var(--warn-soft,#FBEBD3);color:var(--warn,#A9620A)}
#telAuth .msg.ok{background:var(--ok-soft,#DDF2E5);color:var(--ok,#1F7A4D)}`;
function authScreen(mode,note){ let el=document.getElementById("telAuth");
  if(!el){ const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st); el=document.createElement("div"); el.id="telAuth"; document.body.appendChild(el); }
  const tab=(m,t)=>`<button type="button" class="btn small${mode===m?"":" ghost"}" data-am="${m}">${t}</button>`;
  el.innerHTML=`<form class="box" id="telAuthForm" autocomplete="on">
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:start"><div><h1>TEL Điểm danh &amp; Lương</h1><p class="sub">The English Lovers · Nha Trang</p></div>
      <div class="lang" role="group" aria-label="Ngôn ngữ / Language" data-noi18n><button type="button" data-lang="vi" aria-pressed="${lang()!=="en"}">VI</button><button type="button" data-lang="en" aria-pressed="${lang()==="en"}">EN</button></div></div>
    ${mode==="newpass"?"":`<div class="tabsA">${tab("in","Đăng nhập")}${tab("up","Tạo tài khoản")}${tab("reset","Quên mật khẩu")}</div>`}
    ${mode==="up"?`<div class="field"><label for="au-name">Họ tên</label><input id="au-name" autocomplete="name" required></div>`:""}
    ${mode==="newpass"?"":`<div class="field"><label for="au-email">Email</label><input id="au-email" type="email" autocomplete="email" required></div>`}
    ${mode==="reset"?"":`<div class="field"><label for="au-pass">${mode==="newpass"?"Mật khẩu mới":"Mật khẩu"}</label><input id="au-pass" type="password" minlength="6" autocomplete="${mode==="in"?"current-password":"new-password"}" required></div>`}
    <button class="btn" type="submit">${{in:"Đăng nhập",up:"Tạo tài khoản",reset:"Gửi link đặt lại mật khẩu",newpass:"Lưu mật khẩu mới"}[mode]}</button>
    <div id="au-msg" class="msg"${note?"":" hidden"}>${note||""}</div>
    ${mode==="up"?`<p class="note" style="margin:0">Sau khi tạo tài khoản, báo CEO hoặc quản lý chọn vai trò cho bạn.</p>`:""}</form>`;
  el.hidden=false; el.dataset.mode=mode; }
function say(t,ok){ const m=document.getElementById("au-msg"); if(!m) return; m.hidden=false; m.className="msg"+(ok?" ok":""); m.textContent=t; }
const ERR={"Invalid login credentials":"Sai email hoặc mật khẩu.","Email not confirmed":"Email chưa được xác nhận. Mở email xác nhận rồi đăng nhập lại.","User already registered":"Email này đã có tài khoản. Hãy đăng nhập."};
document.addEventListener("click",e=>{ const b=e.target.closest("[data-am]"); if(b) authScreen(b.dataset.am); });
document.addEventListener("submit",async e=>{ if(e.target.id!=="telAuthForm") return; e.preventDefault(); const mode=document.getElementById("telAuth").dataset.mode, v=id=>(document.getElementById(id)||{}).value||"";
  const btn=e.target.querySelector("button[type=submit]"); btn.disabled=true;
  try{
    if(mode==="in"){ const {error}=await sb.auth.signInWithPassword({email:v("au-email").trim(),password:v("au-pass")}); if(error) throw error; location.reload(); return; }
    if(mode==="up"){ const {data,error}=await sb.auth.signUp({email:v("au-email").trim(),password:v("au-pass"),options:{data:{name:v("au-name").trim()},emailRedirectTo:location.origin}}); if(error) throw error;
      if(data.session){ location.reload(); return; } say("Đã tạo tài khoản. Mở email để xác nhận, rồi đăng nhập.",true); }
    if(mode==="reset"){ const {error}=await sb.auth.resetPasswordForEmail(v("au-email").trim(),{redirectTo:location.origin}); if(error) throw error; say("Đã gửi link đặt lại mật khẩu. Kiểm tra email.",true); }
    if(mode==="newpass"){ const {error}=await sb.auth.updateUser({password:v("au-pass")}); if(error) throw error; history.replaceState(null,"",location.pathname); location.reload(); return; }
  }catch(err){ say(ERR[err&&err.message]||("Không thực hiện được: "+(err&&err.message||""))); }
  btn.disabled=false; });

/* ---------- records ---------- */
const COLS={}, DOCSUBS={};
function col(c){ return COLS[c]||(COLS[c]={docs:new Map(),subs:[],loaded:false,loading:null,err:null}); }
function snap(c){ const m=col(c).docs; return {docs:[...m.entries()].map(([id,d])=>({id,data:()=>clone(d)}))}; }
let pend=new Set(), timer=null;
function notify(c){ pend.add(c); if(timer) return; timer=Promise.resolve().then(()=>{ const cs=[...pend]; pend.clear(); timer=null;
  cs.forEach(c=>{ const C=col(c); if(C.loaded) C.subs.forEach(f=>{ try{ f(snap(c)); }catch(e){ console.error(e); } }); Object.keys(DOCSUBS).forEach(k=>{ if(k.startsWith(c+"|")) DOCSUBS[k].forEach(f=>f()); }); }); }); }
async function loadCol(c){ const C=col(c); if(C.loaded) return; if(C.loading) return C.loading;
  C.loading=(async()=>{ let from=0; const all=[];
    for(;;){ const {data,error}=await sb.from("docs").select("id,data").eq("col",c).range(from,from+999); if(error) throw error; all.push(...data); if(data.length<1000) break; from+=1000; }
    all.forEach(r=>C.docs.set(r.id,r.data)); C.loaded=true; })();
  try{ await C.loading; } finally{ C.loading=null; } }
const deny=e=>({code:e&&(e.code==="42501"||/row-level security/i.test(e.message||""))?"not_granted":"unavailable",message:e&&e.message||"error"});
function split(p){ const a=p.split("/"); return [a.slice(0,-1).join("/"),a[a.length-1]]; }
function doc(p){ const [c,id]=split(p); return {
  async get(){ const {data,error}=await sb.from("docs").select("data").eq("col",c).eq("id",id).maybeSingle(); if(error) throw deny(error); return {exists:!!data,id,data:()=>clone(data&&data.data)}; },
  async set(d){ const {error}=await sb.from("docs").upsert({col:c,id,data:clone(d)}); if(error) throw deny(error); col(c).docs.set(id,clone(d)); notify(c); },
  async update(d){ let cur=col(c).docs.get(id); if(!cur){ const g=await this.get(); if(!g.exists) throw {code:"invalid_argument",message:"missing"}; cur=g.data(); }
    const o=clone(cur); Object.keys(d).forEach(k=>{ const v=d[k]; o[k]=(v&&typeof v==="object"&&!Array.isArray(v)&&o[k]&&typeof o[k]==="object")?Object.assign({},o[k],v):v; }); return this.set(o); },
  async delete(){ const {error}=await sb.from("docs").delete().eq("col",c).eq("id",id); if(error) throw deny(error); col(c).docs.delete(id); notify(c); },
  onSnapshot(f,e){ const k=c+"|"+id, run=()=>{ const d=col(c).docs.get(id); f({exists:d!==undefined,id,data:()=>clone(d)}); };
    (DOCSUBS[k]=DOCSUBS[k]||[]).push(run);
    (async()=>{ try{ if(!col(c).loaded){ const {data,error}=await sb.from("docs").select("data").eq("col",c).eq("id",id).maybeSingle(); if(error) throw error; if(data) col(c).docs.set(id,data.data); } run(); }catch(err){ e&&e(deny(err)); } })();
    return ()=>{ DOCSUBS[k]=(DOCSUBS[k]||[]).filter(x=>x!==run); }; } }; }
const db={doc,collection(c){ return {
  onSnapshot(f,e){ const C=col(c); C.subs.push(f); loadCol(c).then(()=>f(snap(c))).catch(err=>{ C.subs=C.subs.filter(x=>x!==f); e&&e(deny(err)); }); return ()=>{ C.subs=C.subs.filter(x=>x!==f); }; },
  doc:id=>doc(c+"/"+id),
  async add(d){ const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6); await doc(c+"/"+id).set(d); return doc(c+"/"+id); } }; }};
function live(){ sb.channel("tel-docs").on("postgres_changes",{event:"*",schema:"tel",table:"docs"},p=>{
    if(p.eventType==="DELETE"){ const o=p.old||{}; if(o.col&&COLS[o.col]&&COLS[o.col].docs.has(o.id)){ COLS[o.col].docs.delete(o.id); notify(o.col); } return; }
    const n=p.new||{}; if(!n.col||!COLS[n.col]) return; COLS[n.col].docs.set(n.id,n.data); notify(n.col); })
  .subscribe(st=>{ const s=document.getElementById("status"); if(s&&st==="CHANNEL_ERROR") s.textContent="Mất kết nối trực tiếp – tải lại trang"; }); }

/* ---------- who is signed in ---------- */
const user={ me:async()=>ME, id:async()=>ME.id,
  profiles:async ids=>{ await loadCol("names").catch(()=>{}); const o={}; ids.forEach(i=>{ const n=col("names").docs.get(i)||{}; o[i]={id:i,name:n.name||n.email||"",email:n.email||null,avatarUrl:"",color:"#888",isMe:i===ME.id,guest:false}; }); return o; },
  isOwner:()=>!!(ME&&ME.isOwner), canEdit:()=>true };
const downloads={ save:async x=>{ const blob=x.data instanceof Blob?x.data:new Blob([x.data]); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=x.filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },3000); return {status:"saved"}; } };
window.claude={use:n=>n==="db"||n==="user"||n==="downloads"?whenReady().then(()=>({db,user,downloads})[n]):Promise.resolve(null)};
window.TELbackup=async()=>{ const all=[]; let from=0;
  for(;;){ const {data,error}=await sb.from("docs").select("col,id,data,updated_at").order("col").order("id").range(from,from+999); if(error) throw error; all.push(...data); if(data.length<1000) break; from+=1000; }
  const d=new Date(), p=n=>String(n).padStart(2,"0"), name=`TEL-sao-luu-${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}.json`;
  await downloads.save({filename:name,data:JSON.stringify({app:"tel",format:"tel-docs-v1",exportedAt:d.toISOString(),by:ME&&ME.email,count:all.length,rows:all})}); return all.length; };
window.TELuserId=()=>ME&&ME.id;
window.TELsignOut=async()=>{ try{ await sb.auth.signOut(); }catch(e){} location.reload(); };

/* ---------- start ---------- */
async function start(){
  if(!window.supabase||!C.url||!C.anonKey||/YOUR_/.test(C.url+C.anonKey)){ authScreen("in","Chưa cấu hình máy chủ. Mở file config.js và điền địa chỉ + khoá Supabase."); return; }
  sb=window.supabase.createClient(C.url,C.anonKey,{db:{schema:"tel"},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let recovery=/type=recovery/.test(location.hash);
  sb.auth.onAuthStateChange(ev=>{ if(ev==="PASSWORD_RECOVERY"){ recovery=true; authScreen("newpass","Nhập mật khẩu mới cho tài khoản của bạn."); } if(ev==="SIGNED_OUT"&&readyVal) location.reload(); });
  const {data}=await sb.auth.getSession(); session=data.session;
  if(recovery&&session){ authScreen("newpass","Nhập mật khẩu mới cho tài khoản của bạn."); return; }
  if(!session){ authScreen("in"); return; }
  const u=session.user; let info=null;
  try{ const r=await sb.rpc("app_info"); if(r.error) throw r.error; info=r.data; }catch(e){ info=null; }
  if(!info||info.app!=="tel"){ authScreen("in","Không tìm thấy dữ liệu TEL ở máy chủ này (kiểm tra config.js và mục Exposed schemas). App dừng lại để không ghi nhầm chỗ."); const b=document.querySelector("#telAuthForm button[type=submit]"); if(b) b.disabled=true; return; }
  const owner=!!info.is_owner;
  ME={id:u.id,name:(u.user_metadata&&u.user_metadata.name)||u.email,email:u.email,isOwner:owner,canEdit:true,avatarUrl:"",color:"#B0365A"};
  try{ await sb.from("docs").upsert({col:"names",id:u.id,data:{name:ME.name,email:u.email}}); }catch(e){}
  live(); readyVal=true; waiters.splice(0).forEach(r=>r());
  const so=document.getElementById("telSignOut"); if(so){ so.hidden=false; so.title=u.email; }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
