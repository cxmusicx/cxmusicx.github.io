import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,GoogleAuthProvider,signInWithPopup} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,updateDoc,addDoc,collection,getDocs,query,orderBy,limit,increment,arrayUnion,arrayRemove} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* Paste your Firebase web config here (Project settings > Your apps > Web). */
const cfg={
  apiKey:"AIzaSyADNNporzDNQxS2LHWEOUDG-pto6OvDY48",
  authDomain:"cxmusicx.firebaseapp.com",
  projectId:"cxmusicx",
  storageBucket:"cxmusicx.firebasestorage.app",
  messagingSenderId:"1021127536846",
  appId:"1:1021127536846:web:7938a2fb0bd8be79ff609f"
};

const on=!!cfg.apiKey;
let auth,db;
if(on){const app=initializeApp(cfg);auth=getAuth(app);db=getFirestore(app)}

const $=s=>document.querySelector(s);
const E=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const key=a=>a.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'x';
const okId=id=>/^[A-Za-z0-9_]+$/.test(id);
const I=()=>increment(1);
let me=null,U={},cur=null,plOpen=null;
const uref=()=>doc(db,'users',me.uid);

document.head.appendChild(E(`<style>
#panel{animation:pop .35s var(--ease)}
@keyframes pop{from{opacity:0;transform:translateY(8px)}}
@keyframes fade{from{opacity:0}}
@keyframes w{from{width:0}}
@keyframes sy{from{transform:scaleY(0)}}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:28px}
.tile{background:var(--bg);padding:16px}.tile b{display:block;font-size:28px;font-weight:600;letter-spacing:-.03em;margin-top:6px}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;margin-bottom:28px}
.rl{position:relative;display:flex;gap:12px;align-items:center;height:42px;padding:0 4px;border-bottom:1px solid var(--line)}
.rl.c{cursor:pointer;transition:background .15s}.rl.c:hover{background:var(--hover)}
.rk{font:11px var(--mono);color:var(--dim);width:22px}
.rn{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rv{font:12px var(--mono);color:var(--dim)}
.rl i{position:absolute;left:0;bottom:-1px;height:1px;background:var(--accent);animation:w .8s var(--ease)}
.ch{display:flex;gap:3px;align-items:flex-end;height:96px;margin-top:10px;border-bottom:1px solid var(--line)}
.ch div{flex:1;height:100%;display:flex;align-items:flex-end}
.ch i{display:block;width:100%;background:var(--accent);min-height:1px;transform-origin:bottom;animation:sy .6s var(--ease) backwards}
.cl{display:flex;gap:3px;margin-top:4px}.cl span{flex:1;text-align:center;font:9px var(--mono);color:var(--dim)}
.btn{padding:8px 12px;border:1px solid var(--line);border-radius:4px;transition:border-color .15s,background .15s}
.btn:hover{border-color:var(--dim)}.btn.p{background:var(--accent);border-color:var(--accent);color:#fff}
.field{display:block;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:9px 12px;color:var(--text);font:inherit;outline:0;margin-bottom:10px;transition:border-color .15s}
.field:focus{border-color:var(--accent)}
textarea.field{min-height:140px;resize:vertical;font:13px/1.5 var(--mono)}
.mask{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:40;display:grid;place-items:center;animation:fade .2s}
.modal{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:22px;width:min(440px,92vw);max-height:88vh;overflow:auto;animation:pop .3s var(--ease)}
.toast{position:fixed;left:0;right:0;margin:auto;width:max-content;bottom:96px;background:var(--text);color:var(--bg);padding:9px 14px;border-radius:4px;z-index:60;animation:pop .25s var(--ease)}
.plus{font-size:18px;color:var(--dim);opacity:.5;transition:opacity .15s,color .15s}.plus:hover{opacity:1;color:var(--text)}
#lyr{position:fixed;left:232px;right:0;top:0;bottom:76px;background:var(--bg);z-index:20;overflow-y:auto;padding:28px 32px;animation:pop .3s var(--ease)}
#lyr[hidden]{display:none}
#lyr .l{font-size:28px;font-weight:600;letter-spacing:-.03em;line-height:1.25;margin:0 0 14px;color:var(--dim);transition:color .25s}
#lyr .l.on{color:var(--text)}#lyr .l.plain{color:var(--text);font-size:20px;font-weight:500;margin-bottom:6px}
@media(max-width:760px){#lyr{left:0;bottom:120px;padding:20px 14px}#lyr .l{font-size:22px}nav button{padding:9px 2px;font-size:11px}}
</style>`));

function toast(m){const t=E(`<div class="toast">${esc(m)}</div>`);document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
function modal(html,fn){const m=E(`<div class="mask"><div class="modal">${html}</div></div>`);m.onclick=e=>{if(e.target===m)m.remove()};document.body.appendChild(m);fn&&fn(m);return m}

/* ---------- panels ---------- */
const nav=$('#nav'),panel=E('<div id="panel" hidden></div>');
$('#main').insertBefore(panel,$('.head'));
const addBtn=E('<button class="add" style="display:block">Add song</button>');
$('header.top').appendChild(addBtn);addBtn.onclick=()=>songForm();
const views={stats:['Stats',vStats],leaders:['Leaders',vLeaders],lists:['Playlists',vLists],artists:['Artists',vArtists],acct:['Account',vAcct]};
Object.entries(views).forEach(([k,[n]])=>{const b=E(`<button data-k="${k}">${n}</button>`);b.onclick=e=>{e.stopPropagation();open(k)};nav.appendChild(b)});
nav.addEventListener('click',e=>{if(e.target.closest('[data-v]'))shut()});
panel.onclick=e=>{const r=e.target.closest('[data-t]');if(r){const i=tracks.findIndex(t=>t.id===r.dataset.t);if(i>=0)play(i)}};
async function open(k){
  cur=k;plOpen=null;
  nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  $('#q').style.display=$('#add').style.display='none';
  $('.head').style.display=$('#list').style.display='none';addBtn.style.display='none';
  $('#title').textContent=views[k][0];panel.hidden=false;panel.innerHTML='';
  await views[k][1](panel);
}
function shut(){cur=null;panel.hidden=true;$('.head').style.display='';$('#list').style.display='';addBtn.style.display='block'}
function need(p,msg){p.innerHTML=`<p class="empty" style="padding-left:0">${msg}</p><button class="btn" id="g">Account</button>`;$('#g').onclick=()=>open('acct')}
const R=(i,name,val,pct,id)=>`<div class="rl${id?' c':''}"${id?` data-t="${id}"`:''}><span class="rk">${String(i+1).padStart(2,'0')}</span><span class="rn">${esc(name)}</span><span class="rv">${val}</span><i style="width:${pct}%"></i></div>`;
const sec=(h,rows)=>`<div class="sec"><h3 class="label" style="margin-bottom:8px">${h}</h3>${rows.length?rows.join(''):'<p class="label" style="padding:12px 0">No data yet</p>'}</div>`;
const chart=(v,l)=>{const m=Math.max(1,...v);return `<div class="ch">${v.map((x,i)=>`<div title="${l[i]}: ${x}"><i style="height:${x/m*100}%;animation-delay:${i*20}ms"></i></div>`).join('')}</div><div class="cl">${l.map(x=>`<span>${x}</span>`).join('')}</div>`};

/* ---------- stats ---------- */
async function vStats(p){
  if(!me)return need(p,'Sign in to see your listening stats.');
  U=(await getDoc(uref())).data()||U;
  const ac=U.ac||{},tc=U.tc||{},an=U.an||{},days=U.days||{},hrs=U.hrs||{};
  const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
  const dk=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toLocaleDateString('en-CA')};
  let streak=0,n=days[dk(0)]?0:1;while(days[dk(n)]){streak++;n++}
  const d14=[...Array(14)].map((_,i)=>13-i).map(dk);
  const ta=top(ac,5),tt=top(tc,5).filter(([id])=>tracks.some(t=>t.id===id));
  p.innerHTML=`<div class="tiles">
    <div class="tile"><span class="label">Listens</span><b>${U.listens||0}</b></div>
    <div class="tile"><span class="label">Hours</span><b>${((U.secs||0)/3600).toFixed(1)}</b></div>
    <div class="tile"><span class="label">Artists</span><b>${Object.keys(ac).length}</b></div>
    <div class="tile"><span class="label">Day streak</span><b>${streak}</b></div></div>
    <div class="cols">${sec('Top artists',ta.map(([k,v],i)=>R(i,an[k]||k,v,v/ta[0][1]*100)))}
    ${sec('Top tracks',tt.map(([id,v],i)=>{const t=tracks.find(x=>x.id===id);return R(i,t.t+', '+t.a,v,v/tt[0][1]*100,id)}))}</div>
    <div class="cols"><div><h3 class="label">Last 14 days</h3>${chart(d14.map(d=>days[d]||0),d14.map(d=>d.slice(8)))}</div>
    <div><h3 class="label">By hour</h3>${chart([...Array(24)].map((_,h)=>hrs[h]||0),[...Array(24)].map((_,h)=>h%6?'':h))}</div></div>`;
}

/* ---------- leaders ---------- */
async function vLeaders(p){
  if(!on)return need(p,'Firebase is not set up yet.');
  const q=c=>getDocs(query(collection(db,c),orderBy('listens','desc'),limit(10))).then(s=>s.docs.map(d=>({id:d.id,...d.data()})));
  const [a,t,u]=await Promise.all([q('artists'),q('trackStats'),q('profiles')]);
  const rows=(l,f,c)=>l.map((x,i)=>R(i,f(x),x.listens,x.listens/l[0].listens*100,c&&x.id));
  p.innerHTML=`<div class="cols">${sec('Top artists',rows(a,x=>x.name))}${sec('Top tracks',rows(t,x=>x.t+', '+x.a,1))}${sec('Top listeners',rows(u,x=>x.username||'anon'))}</div>`;
}

/* ---------- artists ---------- */
async function vArtists(p){
  const info={};if(on)(await getDocs(collection(db,'artists'))).forEach(d=>info[d.id]=d.data());
  const map={};tracks.forEach(t=>{const k=key(t.a);(map[k]??={name:t.a,n:0}).n++});
  const fol=U.following||[];
  const arr=Object.entries(map).sort((a,b)=>(fol.includes(b[0])-fol.includes(a[0]))||a[1].name.localeCompare(b[1].name));
  p.innerHTML='';
  arr.forEach(([k,a])=>{
    const f=fol.includes(k),i=info[k]||{};
    const r=E(`<div class="rl"><span class="rn">${esc(a.name)}</span><span class="rv">${a.n} tracks, ${i.followers||0} followers, ${i.listens||0} listens</span><button class="btn">${f?'Following':'Follow'}</button></div>`);
    r.querySelector('button').onclick=async()=>{
      if(!me){toast('Sign in to follow artists');return open('acct')}
      const was=(U.following||[]).includes(k);
      await updateDoc(uref(),{following:was?arrayRemove(k):arrayUnion(k)});
      await setDoc(doc(db,'artists',k),{name:a.name,followers:increment(was?-1:1)},{merge:true});
      U.following=was?(U.following||[]).filter(x=>x!==k):[...(U.following||[]),k];
      vArtists(p);
    };
    p.appendChild(r);
  });
}

/* ---------- playlists ---------- */
const savePl=()=>updateDoc(uref(),{playlists:U.playlists});
function vLists(p){
  if(!me)return need(p,'Sign in to make playlists.');
  const pls=U.playlists||[];
  const pl=plOpen&&pls.find(x=>x.id===plOpen);
  if(pl){
    p.innerHTML=`<div style="display:flex;gap:8px;margin-bottom:16px"><button class="btn" id="bk">Back</button><button class="btn" id="dl">Delete playlist</button></div><h3 style="margin-bottom:10px">${esc(pl.name)}</h3>`;
    pl.t.forEach((id,i)=>{
      const t=tracks.find(x=>x.id===id);if(!t)return;
      const r=E(`<div class="rl c"><span class="rk">${String(i+1).padStart(2,'0')}</span><span class="rn">${esc(t.t)} <span style="color:var(--dim)">${esc(t.a)}</span></span><button class="rv">Remove</button></div>`);
      r.onclick=e=>{if(e.target.closest('button')){pl.t=pl.t.filter(x=>x!==id);savePl().then(()=>vLists(p));return}play(tracks.indexOf(t))};
      p.appendChild(r);
    });
    if(!pl.t.length)p.insertAdjacentHTML('beforeend','<p class="empty" style="padding-left:0">Empty. Use + on any track.</p>');
    $('#bk').onclick=()=>{plOpen=null;vLists(p)};
    $('#dl').onclick=async()=>{U.playlists=pls.filter(x=>x!==pl);await savePl();plOpen=null;vLists(p)};
    return;
  }
  p.innerHTML='<input class="field" id="np" placeholder="New playlist name, press Enter" style="max-width:320px">';
  pls.forEach(x=>{const r=E(`<div class="rl c"><span class="rn">${esc(x.name)}</span><span class="rv">${x.t.length} tracks</span></div>`);r.onclick=()=>{plOpen=x.id;vLists(p)};p.appendChild(r)});
  $('#np').onkeydown=async e=>{if(e.key!=='Enter'||!e.target.value.trim())return;(U.playlists??=[]).push({id:'p'+Date.now(),name:e.target.value.trim(),t:[]});await savePl();vLists(p)};
}
window.cxAdd=t=>{
  if(!me){toast('Sign in to use playlists');return open('acct')}
  if(!okId(t.id))return toast('Local files cannot be added');
  const m=modal('<h3 style="margin-bottom:12px">Add to playlist</h3><div id="pk"></div><input class="field" id="np2" placeholder="New playlist, press Enter" style="margin-top:14px">');
  const draw=()=>{
    const pk=m.querySelector('#pk');pk.innerHTML='';
    (U.playlists||[]).forEach(pl=>{
      const r=E(`<div class="rl c"><span class="rn">${esc(pl.name)}</span><span class="rv">${pl.t.includes(t.id)?'Added':''}</span></div>`);
      r.onclick=async()=>{pl.t=pl.t.includes(t.id)?pl.t.filter(x=>x!==t.id):[...pl.t,t.id];await savePl();draw()};
      pk.appendChild(r);
    });
    if(!(U.playlists||[]).length)pk.innerHTML='<p class="label">No playlists yet.</p>';
  };
  draw();
  m.querySelector('#np2').onkeydown=async e=>{if(e.key!=='Enter'||!e.target.value.trim())return;(U.playlists??=[]).push({id:'p'+Date.now(),name:e.target.value.trim(),t:[t.id]});await savePl();e.target.value='';draw()};
};
window.cxSaveLikes=()=>{if(me)updateDoc(uref(),{liked:[...liked]}).catch(()=>{})};

/* ---------- account ---------- */
function vAcct(p){
  if(!on){p.innerHTML='<p class="empty" style="padding-left:0">Firebase is not set up yet. Paste your config at the top of cloud.js.</p>';return}
  if(me){p.innerHTML=`<div class="rl"><span class="rn">Signed in as <b>${esc(U.username||me.email.split('@')[0])}</b></span><button class="btn" id="so">Sign out</button></div>`;$('#so').onclick=()=>signOut(auth);return}
  p.innerHTML=`<div style="max-width:320px"><input class="field" id="un" placeholder="Username" autocomplete="username"><input class="field" id="pw" type="password" placeholder="Password" autocomplete="current-password"><p id="er" class="label" style="color:var(--accent);min-height:18px;margin-bottom:10px"></p><button class="btn p" id="si">Sign in</button> <button class="btn" id="su">Create account</button><div class="label" style="margin:18px 0 10px">or</div><button class="btn" id="gg">Continue with Google</button></div>`;
  const go=async up=>{
    const u=$('#un').value.trim(),pw=$('#pw').value,er=m=>$('#er').textContent=m;
    if(!/^[a-z0-9_]{3,20}$/i.test(u))return er('Username: 3 to 20 letters, numbers or _');
    if(pw.length<6)return er('Password needs 6+ characters');
    try{
      const email=u.toLowerCase()+'@cxmusic.app';
      if(up){
        const c=await createUserWithEmailAndPassword(auth,email,pw);
        await setDoc(doc(db,'users',c.user.uid),{username:u,liked:[...liked],following:[],playlists:[],listens:0,secs:0});
        await setDoc(doc(db,'profiles',c.user.uid),{username:u,listens:0});
        await loadUser();
      }else await signInWithEmailAndPassword(auth,email,pw);
    }catch(x){er({'auth/email-already-in-use':'Username taken','auth/invalid-credential':'Wrong username or password','auth/weak-password':'Password too weak'}[x.code]||x.message)}
  };
  $('#si').onclick=()=>go(0);$('#su').onclick=()=>go(1);
  $('#gg').onclick=async()=>{
    try{
      const c=await signInWithPopup(auth,new GoogleAuthProvider());
      const ref=doc(db,'users',c.user.uid);
      if(!(await getDoc(ref)).exists()){
        const name=(c.user.displayName||c.user.email.split('@')[0]).replace(/[^a-z0-9_]/gi,'').slice(0,20)||'listener';
        await setDoc(ref,{username:name,liked:[...liked],following:[],playlists:[],listens:0,secs:0});
        await setDoc(doc(db,'profiles',c.user.uid),{username:name,listens:0});
      }
      await loadUser();
    }catch(x){if(x.code!=='auth/popup-closed-by-user'&&x.code!=='auth/cancelled-popup-request')$('#er').textContent=x.message}
  };
}
async function loadUser(){
  if(!me){U={};$('.foot').textContent='guest'}
  else{
    const s=await getDoc(uref());U=s.exists()?s.data():{};
    if(s.exists()){liked.clear();(U.liked||[]).forEach(x=>liked.add(x));$('.foot').textContent=U.username}
  }
  render();if(cur)open(cur);
}

/* ---------- songs ---------- */
const pal=['#ff3b30','#4d7cff','#ffd23d','#f4f4f2','#ff7ac8','#b8b8b3'];
async function loadSongs(){
  (await getDocs(collection(db,'songs'))).forEach(d=>{
    if(tracks.some(t=>t.id===d.id))return;
    const x=d.data();
    tracks.push({id:d.id,t:x.t,a:x.a,al:x.al||'Single',src:x.src,d:x.d||0,lyrics:x.lyrics||'',fs:1,c:[pal[[...x.t].reduce((s,c)=>s+c.charCodeAt(0),0)%pal.length],'#151516']});
  });
  render();
}
const meta=src=>new Promise(r=>{const a=new Audio();a.preload='metadata';a.src=src;a.onloadedmetadata=()=>r(Math.round(a.duration)||0);a.onerror=()=>r(0);setTimeout(()=>r(0),4000)});
function songForm(t){
  if(!on){toast('Set up Firebase first');return}
  if(!me){toast('Sign in to add songs');return open('acct')}
  const m=modal(`<h3 style="margin-bottom:14px">${t?'Lyrics':'Add song'}</h3>`+(t?'':`<input class="field" id="s1" placeholder="Title"><input class="field" id="s2" placeholder="Artist"><input class="field" id="s3" placeholder="Album (optional)"><input class="field" id="s4" placeholder="Audio path or URL, e.g. music/song.mp3">`)+`<textarea class="field" id="s5" placeholder="Lyrics. Plain text, or LRC lines like [01:23.40] text for synced lyrics"></textarea><button class="btn p" id="sv">Save</button> <button class="btn" id="cn">Cancel</button>`);
  if(t)m.querySelector('#s5').value=t.lyrics||'';
  const f=s=>m.querySelector(s);
  f('#cn').onclick=()=>m.remove();
  f('#sv').onclick=async()=>{
    const lyr=f('#s5').value;
    try{
      if(t){await updateDoc(doc(db,'songs',t.id),{lyrics:lyr});t.lyrics=lyr}
      else{
        const x={t:f('#s1').value.trim(),a:f('#s2').value.trim(),al:f('#s3').value.trim()||'Single',src:f('#s4').value.trim(),lyrics:lyr,by:me.uid,ts:Date.now()};
        if(!x.t||!x.a||!x.src)return toast('Title, artist and audio are required');
        x.d=await meta(x.src);await addDoc(collection(db,'songs'),x);await loadSongs();
      }
      m.remove();toast('Saved');lyShow();
    }catch(e){toast(e.message)}
  };
}

/* ---------- lyrics ---------- */
const ly=E('<div id="lyr" hidden></div>');document.body.appendChild(ly);
const lb=E('<button aria-label="Lyrics"><svg viewBox="0 0 16 16"><path d="M2 3h12v2H2zM2 7h12v2H2zM2 11h8v2H2z"/></svg></button>');
$('.btns').appendChild(lb);
let L=[],LI=-1;
lb.onclick=()=>{ly.hidden=!ly.hidden;lb.style.color=ly.hidden?'':'var(--accent)';lyShow()};
function lyShow(){
  if(ly.hidden)return;
  const t=tracks[idx];
  if(!t){ly.innerHTML='<p class="empty" style="padding-left:0">Play something to see lyrics.</p>';return}
  const re=/^\s*\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/;
  L=(t.lyrics||'').split('\n').map(l=>{const m=re.exec(l);return m?{s:+m[1]*60+ +m[2],x:m[3]}:{s:null,x:l.trim()}});
  const sync=L.some(l=>l.s!==null);
  ly.innerHTML=`<div class="label" style="margin-bottom:22px">${esc(t.t)}, ${esc(t.a)}${t.fs?' <button class="btn" id="le" style="margin-left:12px">Edit lyrics</button>':''}</div>`+
    ((t.lyrics||'').trim()?L.map(l=>`<p class="l${sync?'':' plain'}">${esc(l.x)||'&nbsp;'}</p>`).join(''):'<p class="empty" style="padding-left:0">No lyrics for this track.</p>');
  LI=-1;const le=$('#le');if(le)le.onclick=()=>songForm(t);
}
(function lp(){
  if(!ly.hidden&&idx>=0&&L.some(l=>l.s!==null)){
    const p=pos();let i=-1;L.forEach((l,k)=>{if(l.s!==null&&l.s<=p)i=k});
    if(i!==LI){LI=i;const ps=ly.querySelectorAll('.l');ps.forEach((e,k)=>e.classList.toggle('on',k===i));ps[i]?.scrollIntoView({block:'center',behavior:'smooth'})}
  }
  requestAnimationFrame(lp);
})();

/* ---------- listen tracking ---------- */
let tsec=0,acc=0,counted=false;
document.addEventListener('cx:play',()=>{flush();tsec=0;counted=false;lyShow()});
setInterval(()=>{
  if(!me||!playing||idx<0)return;
  tsec++;acc++;
  if(tsec===30&&!counted){counted=true;count(tracks[idx])}
  if(acc>=30)flush();
},1000);
addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
function flush(){if(!me||!acc)return;updateDoc(uref(),{secs:increment(acc)}).catch(()=>{});acc=0}
function count(t){
  if(!okId(t.id))return;
  const k=key(t.a),d=new Date(),day=d.toLocaleDateString('en-CA');
  updateDoc(uref(),{listens:I(),['tc.'+t.id]:I(),['ac.'+k]:I(),['an.'+k]:t.a,['days.'+day]:I(),['hrs.'+d.getHours()]:I()}).catch(()=>{});
  setDoc(doc(db,'artists',k),{name:t.a,listens:I()},{merge:true}).catch(()=>{});
  setDoc(doc(db,'trackStats',t.id),{t:t.t,a:t.a,listens:I()},{merge:true}).catch(()=>{});
  setDoc(doc(db,'profiles',me.uid),{username:U.username||'',listens:I()},{merge:true}).catch(()=>{});
}

/* ---------- boot ---------- */
if(on){onAuthStateChanged(auth,u=>{me=u;loadUser()});loadSongs().catch(()=>{})}
