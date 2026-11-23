import React,{useEffect,useState,useRef} from 'react';
import {Activity,ArrowLeft,ArrowRight,BookOpen,Camera,Check,ChevronRight,CloudDownload,Download,Flame,Heart,ImagePlus,Info,Leaf,Minus,Moon,Palette,Plus,RotateCcw,ScanLine,Search,Settings2,SlidersHorizontal,Sun,Trash2,Upload,UserRound,Water,Weight,X} from 'lucide-react';
import { capturePhoto,fileToPhoto,lookupBarcode,scanBarcode,searchOnline } from './foodServices.js';

const clean = s => String(s||'').trim();
const uid = () => 'food-'+Math.random().toString(36).slice(2)+Date.now().toString(36);
const fmt = n => Math.round(Number(n)||0).toLocaleString();
const foodBlank=()=>({id:'',name:'',detail:'',emoji:'🍽️',serving:'1 serving',code:'',calories:'',protein:'',carbs:'',fat:'',imageUrl:'',picture:'',source:'Custom'});
function formFrom(food,photo){return {...foodBlank(),...food,picture:photo||''};}
const COLORS=[['mint','Neon mint','#54f5c5'],['violet','Electric lavender','#ae8cff'],['coral','Bubblegum coral','#ff789b'],['cyan','Soft cyan','#66dcff']];
const BANNERS=[['aurora','Aurora glow','✦'],['stars','Midnight stars','✨'],['sunset','Sunset bloom','🌸']];
const mealNames=['Breakfast','Lunch','Dinner','Snacks'];
const numberField=(n)=>Number(n)>=0&&Number.isFinite(Number(n));
export function FoodThumb({food,photos,className='food-photo',emoji}){
  const image=food&&(photos?.[food.id]||food.imageUrl);
  return <span className={className}>{image?<img src={image} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/>:<span>{emoji||food?.emoji||'🍽️'}</span>}</span>;
}
function FoodFields({draft,setDraft}){
  const field=(key,placeholder,type='text')=><label key={key}><span>{key[0].toUpperCase()+key.slice(1)} {key==='calories'?'(kcal)': ['protein','carbs','fat'].includes(key)?'(g)':''}</span><input required={['name','calories','protein','carbs','fat'].includes(key)} type={type} min={type==='number'?0:undefined} step={type==='number'?'any':undefined} value={draft[key]??''} placeholder={placeholder} onChange={e=>setDraft(old=>({...old,[key]:e.target.value}))}/></label>;
  return <div className="editor-fields">{field('name','e.g. Homemade tacos')}{field('detail','Brand, ingredients, or notes')}{field('serving','e.g. 100 g or 1 bowl')}{field('code','Barcode (optional)')}
    <div className="editor-nutrients">{field('calories','0','number')}{field('protein','0','number')}{field('carbs','0','number')}{field('fat','0','number')}</div></div>;
}
function FoodEditor({item,photos,onSave,onCancel,toast}){
  const [draft,setDraft]=useState(()=>formFrom(item,item?photos?.[item.id]:''));
  const [busy,setBusy]=useState(false);
  const [code,setCode]=useState(item?.code||'');
  const [lookupBusy,setLookupBusy]=useState(false);
  const inputRef=useRef(null);
  useEffect(()=>{setDraft(formFrom(item,item?photos?.[item.id]:''));setCode(item?.code||'');},[item?.id]);
  const setImage=async(kind,file)=>{
    try{
      setBusy(true);
      const pic=kind==='upload'?await fileToPhoto(file):await capturePhoto(kind);
      setDraft(old=>({...old,picture:pic}));
    }catch(e){if(!/cancel/i.test(String(e.message)))toast('Photo: '+e.message);}
    finally{setBusy(false);if(inputRef.current)inputRef.current.value='';}
  };
  const lookup=async()=>{
    if(!code.trim())return toast('Enter a barcode');
    setLookupBusy(true);
    try{
      const result=await lookupBarcode(code);
      if(result.found){setDraft(old=>({...old,...result.food,id:old.id||result.food.id,picture:old.picture||''}));toast('Nutrition found — review before saving');}
      else{setDraft(old=>({...old,code}));toast('Not listed yet; enter values manually');}
    }catch(e){toast('Lookup failed: '+e.message);}
    finally{setLookupBusy(false);}
  };
  const submit=async event=>{
    event.preventDefault();
    if(!clean(draft.name))return toast('Food needs a name');
    if(!['calories','protein','carbs','fat'].every(k=>numberField(draft[k])))return toast('Enter valid nutrient values');
    try{
      setBusy(true);const food={...draft,id:draft.id||uid(),
        name:clean(draft.name),detail:clean(draft.detail),serving:clean(draft.serving)||'1 serving',
        code:clean(draft.code),calories:Number(draft.calories),protein:Number(draft.protein),
        carbs:Number(draft.carbs),fat:Number(draft.fat),picture:undefined};
      await onSave(food,draft.picture);onCancel();
    }catch(e){toast('Could not save food: '+e.message);}
    finally{setBusy(false);}
  };
  return <div className="editor-form"><div className="library-topline"><button onClick={onCancel}><ArrowLeft size={18}/> Back</button><span>{item?.id?'Edit food':'Create food'}</span></div>
    <div className="photo-editor"><FoodThumb food={{...draft,imageUrl:draft.picture||draft.imageUrl}} photos={{}} className="photo-editor-preview"/>
      <div><h3>Give this food a face 📸</h3><p>Take a photo or upload a picture of the item.</p><div className="photo-actions">
      <button type="button" disabled={busy} onClick={()=>setImage('camera')}><Camera size={15}/> Camera</button>
      <button type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><ImagePlus size={15}/> Upload</button>
      {draft.picture&&<button type="button" onClick={()=>setDraft(old=>({...old,picture:'',imageUrl:''}))}><X size={15}/> Remove</button>}
      <input ref={inputRef} type="file" hidden accept="image/*" onChange={e=>e.target.files?.[0]&&setImage('upload',e.target.files[0])}/></div></div></div>
    <div className="barcode-editor"><div><ScanLine size={18}/><span>Barcode nutrition lookup</span></div>
      <div className="barcode-editor-row"><input aria-label="Barcode" value={code} inputMode="numeric" placeholder="Type barcode number" onChange={e=>setCode(e.target.value)}/><button type="button" disabled={lookupBusy} onClick={lookup}>{lookupBusy?'Searching…':'Look up'}</button></div></div>
    <form onSubmit={submit}><FoodFields draft={draft} setDraft={setDraft}/><p className="hint">Nutrition should describe one listed serving. Imported values may be missing or incorrect; review them before saving.</p>
      <button className="cta-full" type="submit" disabled={busy}><Check size={19}/>{busy?'Saving…':'Save food to library'}</button></form></div>;
}
export function FoodManager({foods,custom,photos,hidden,onSave,onDelete,onRestore,onBack,toast}){
  const [query,setQuery]=useState('');
  const [edit,setEdit]=useState(undefined);
  const [showHidden,setShowHidden]=useState(false);
  const [busy,setBusy]=useState(false);
  const [online,setOnline]=useState([]);
  const [onlineError,setOnlineError]=useState('');
  const search=async()=>{
    if(query.trim().length<2)return toast('Search needs two or more characters');
    setBusy(true);setOnlineError('');
    try{setOnline(await searchOnline(query));}
    catch(e){setOnlineError(e.message);setOnline([]);}
    finally{setBusy(false);}
  };
  if(edit!==undefined)return <div className="page"><div className="page-heading"><small>🥑 YOUR COLLECTION</small><h1>{edit?.id?'Edit a food':'New food'} <span>✦</span></h1></div>
    <FoodEditor key={edit?.id||'new'} item={edit} photos={photos} onSave={async(food,pic)=>{await onSave(food,pic);toast('Food saved to your library ✓');}}
      onCancel={()=>setEdit(undefined)} toast={toast}/></div>;
  const matches=foods.filter(f=>(f.name+' '+f.detail).toLowerCase().includes(query.toLowerCase()));
  return <div className="page"><div className="page-heading"><small>🍓 YOUR PERSONAL PANTRY</small><h1>Food library <span>🫧</span></h1><p>Edit, organize, and create foods whenever you like.</p></div>
    <div className="library-actions"><button className="cta-full" onClick={()=>setEdit(null)}><Plus size={18}/> Create new food</button>
      <button onClick={onBack} aria-label="Back to profile"><ArrowLeft size={18}/></button></div>
    <div className="search-box library-search"><Search size={18}/><input aria-label="Find foods in library" placeholder="Find an item in your library" value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className="library-subheading"><h3>{matches.length} foods in your library</h3><small>Tap any food to edit its details</small></div>
    <div className="library-list">{matches.map(food=><div className="library-row" key={food.id}><FoodThumb food={food} photos={photos}/><div className="library-row-copy"><strong>{food.name}</strong><small>{food.serving} · {fmt(food.calories)} kcal</small><small>{custom.some(f=>f.id===food.id)?'Saved/custom food':'Starter food'}</small></div>
      <button onClick={()=>setEdit(food)} aria-label={'Edit '+food.name}><SlidersHorizontal size={18}/></button>
      <button className="delete-tiny" onClick={()=>{if(window.confirm('Remove "'+food.name+'" from your library? Existing diary entries will be kept.'))onDelete(food);}} aria-label={'Delete '+food.name}><Trash2 size={17}/></button></div>)}
      {matches.length===0&&<p className="nothing-found">No matches yet. Create one or try online search.</p>}</div>
    {hidden.length>0&&<div className="hidden-foods"><button onClick={()=>setShowHidden(x=>!x)}>{showHidden?'Hide':'Show'} hidden starter foods ({hidden.length})</button>
      {showHidden&&hidden.map(id=><button key={id} onClick={()=>onRestore(id)}>Restore {id}</button>)}</div>}
    <section className="online-box"><div className="section-title"><div><small>OPTIONAL · INTERNET REQUIRED</small><h2>Discover more foods</h2></div></div>
      <p>Find packaged foods and nutritional information from Open Food Facts.</p>
      <button className="cta-full" disabled={busy} onClick={search}><Search size={17}/>{busy?'Searching…':'Search the food database'}</button>
      {onlineError&&<p className="lookup-error">{onlineError}</p>}
      {online.map(f=><button className="remote-result" key={f.id} onClick={()=>setEdit(f)}><FoodThumb food={f}/><span><strong>{f.name}</strong><small>{f.detail} · {fmt(f.calories)} kcal / {f.serving}</small></span><Plus size={18}/></button>)}
    </section><p className="source-note">Food data & images: Open Food Facts contributors · ODbL / CC BY-SA · <a href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer">openfoodfacts.org</a></p></div>;
}
export function BatchPicker({foods,photos,meal,setMeal,onDone,onEdit,toast}){
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState('library');
  const [selected,setSelected]=useState([]);
  const [remote,setRemote]=useState([]);
  const [busy,setBusy]=useState(false);
  const [barcode,setBarcode]=useState('');
  const [status,setStatus]=useState('');
  const favorites=foods.filter(f=>f.isFavorite);
  const filtered=(mode==='favorites'?favorites:mode==='online'?remote:foods)
    .filter(f=>(f.name+' '+f.detail).toLowerCase().includes(mode==='online'?'':query.toLowerCase()));
  const toggle=(food)=>setSelected(old=>old.some(x=>x.id===food.id)?old.filter(x=>x.id!==food.id):[...old,{id:food.id,food,quantity:1}]);
  const changeQty=(id,delta)=>setSelected(old=>old.map(s=>s.id===id?{...s,quantity:Math.max(.25,Math.round((s.quantity+delta)*100)/100)}:s));
  const lookup=async(value)=>{
    if(!String(value).trim())return toast('Enter or scan a barcode');
    setBusy(true);setStatus('');
    try{
      const r=await lookupBarcode(value);
      if(r.found){setSelected(old=>old.some(x=>x.id===r.food.id)?old:[...old,{id:r.food.id,food:r.food,quantity:1}]);setStatus(r.food.name+' found and selected.');}
      else{setStatus('Not found in the database. You can create it manually.');setBarcode(value);}
    }catch(e){setStatus('Lookup failed: '+e.message);}
    finally{setBusy(false);}
  };
  const scan=async()=>{
    setBusy(true);setStatus('');
    try{
      const scanned=await scanBarcode();
      if(scanned){setBarcode(scanned);await lookup(scanned);}
      else setStatus('Scan cancelled — you can type a barcode instead.');
    }catch(e){setStatus('Scanner unavailable: '+e.message+'. Enter the barcode manually.');}
    finally{setBusy(false);}
  };
  const doSearch=async(e)=>{
    e?.preventDefault();
    if(query.trim().length<2)return toast('Type at least two characters');
    setBusy(true);setStatus('');
    try{const results=await searchOnline(query);setRemote(results);setMode('online');setStatus(results.length?'Results from Open Food Facts':'Nothing found. Try another name.');}
    catch(e){setStatus('Online search failed: '+e.message);}
    finally{setBusy(false);}
  };
  return <div className="batch-picker">
    <div className="batch-controls"><label htmlFor="picker-meal">Add foods to</label><select id="picker-meal" value={meal} onChange={e=>setMeal(e.target.value)}>{mealNames.map(m=><option key={m}>{m}</option>)}</select></div>
    <div className="search-box"><Search size={19}/><input aria-label="Search foods" placeholder="Search food by name…" value={query} onChange={e=>{setQuery(e.target.value);if(mode==='online')setMode('library');}} onKeyDown={e=>e.key==='Enter'&&doSearch(e)}/></div>
    <div className="picker-tabs"><button className={mode==='library'?'active':''} onClick={()=>setMode('library')}>My foods</button><button className={mode==='favorites'?'active':''} onClick={()=>setMode('favorites')}>Favorites</button>
      <button className={mode==='online'?'active':''} onClick={()=>setMode('online')}>Online</button></div>
    <div className="picker-tools"><button onClick={doSearch} disabled={busy}><CloudDownload size={15}/> {busy?'Searching…':'Find online'}</button>
      <button onClick={scan} disabled={busy}><ScanLine size={15}/> Scan barcode</button></div>
    <div className="barcode-entry"><input aria-label="Enter barcode" inputMode="numeric" placeholder="Or enter a barcode number" value={barcode} onChange={e=>setBarcode(e.target.value)}/><button disabled={busy} onClick={()=>lookup(barcode)}>Look up</button></div>
    {status&&<p className="scan-status">{status}{status.startsWith('Not found')&&<button onClick={()=>onEdit({code:barcode})}>Create this food</button>}</p>}
    <div className="multi-food-list">{filtered.map(food=>{
      const s=selected.find(x=>x.id===food.id);
      return <div className={'multi-food-row '+(s?'checked':'')} key={food.id}>
        <button className="multi-food-main" onClick={()=>toggle(food)} aria-pressed={!!s}><FoodThumb food={food} photos={photos}/>
          <span><b>{food.name}</b><small>{food.detail} · {fmt(food.calories)} kcal</small></span><i className="select-dot">{s?<Check size={15}/>:<Plus size={15}/>}</i></button>
        {s&&<div className="multi-quantity"><button onClick={()=>changeQty(food.id,-.25)} aria-label={'Reduce '+food.name+' servings'}><Minus size={14}/></button><span>{s.quantity} × {food.serving}</span>
          <button onClick={()=>changeQty(food.id,.25)} aria-label={'Increase '+food.name+' servings'}><Plus size={14}/></button></div>}
      </div>;
    })}
      {filtered.length===0&&<div className="nothing-found">No foods here yet. Search online or create a food.</div>}</div>
    <button className="create-custom" onClick={()=>onEdit(null)}><Plus size={18}/> Create a custom food with a photo</button>
    <div className="batch-footer"><span><strong>{selected.length}</strong> items selected</span><button disabled={!selected.length} onClick={()=>onDone(selected,meal)}><Check size={17}/> Done · Add {selected.length}</button></div>
    <p className="source-note">Online results: Open Food Facts · Nutrition may be incomplete. Review before saving.</p>
  </div>;
}
export function ProfileView({db,setDb,onLibrary}){
  const p=db.profile||{};
  const goals=db.goals||{};
  const change=(key,val)=>setDb(old=>({...old,profile:{...old.profile,[key]:val}}));
  const goal=(key,val)=>{const n=Number(val);if(val!==''&&Number.isFinite(n)&&n>0&&n<50000)setDb(old=>({...old,goals:{...old.goals,[key]:n}}));};
  return <div className="page"><div className="page-heading"><small>🌷 YOUR WELLNESS SPACE</small><h1>My profile <span>💜</span></h1><p>Goals and measurements that make sense for you.</p></div>
    <section className="profile-card"><span className="profile-avatar"><UserRound size={32}/></span><div><small>GLOWBITE COMPANION</small><h2>{db.name||'Lovely human'} ✨</h2><p>Your journey, your pace.</p></div></section>
    <section className="settings-panel"><h2><UserRound size={20}/> About you</h2><label htmlFor="profile-name">Your display name</label>
      <input id="profile-name" value={db.name||''} placeholder="A name you like" maxLength={32} onChange={e=>setDb(old=>({...old,name:e.target.value}))}/>
      <div className="goal-fields"><label className="goal-field"><span>Current weight</span><input type="number" min="0" step=".1" placeholder="Optional" value={p.weight||''} onChange={e=>change('weight',e.target.value)}/></label>
        <label className="goal-field"><span>Unit</span><select value={p.weightUnit||'lb'} onChange={e=>change('weightUnit',e.target.value)}><option value="lb">lb</option><option value="kg">kg</option></select></label></div></section>
    <section className="settings-panel"><h2><Activity size={20}/> My daily targets</h2><p className="settings-sub">Flexible goals, editable at any time.</p>
      <div className="goal-fields">{[['calories','Calorie intake (kcal)'],['water','Water intake (ml)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([k,label])=>
        <label className="goal-field" key={k}><span>{label}</span><input type="number" min="1" max="50000" value={goals[k]||''} onChange={e=>goal(k,e.target.value)}/></label>)}
        <label className="goal-field"><span>Calories burned goal (kcal)</span><input type="number" min="0" max="50000" placeholder="Optional" value={p.caloriesBurnedGoal??''} onChange={e=>change('caloriesBurnedGoal',e.target.value)}/></label></div>
      <p className="hint"><Info size={15}/> Calories burned is a personal target for now; automatic activity tracking is not yet available.</p></section>
    <button className="feature-link" onClick={onLibrary}><span><BookOpen size={22}/></span><div><strong>My food library</strong><small>Add, edit, delete foods and manage pictures</small></div><ChevronRight size={20}/></button>
    <div className="closing-line"><Heart size={14}/> You're more than your numbers.</div>
  </div>;
}
export function SettingsView({db,setDb,onBack,onExport,onImport,onReset,onClearDemo,toast}){
  const input=useRef(null);
  const pref=db.preferences||{};
  const setPref=(key,val)=>setDb(old=>({...old,preferences:{...old.preferences,[key]:val}}));
  return <div className="page"><div className="library-topline"><button onClick={onBack}><ArrowLeft size={18}/> Back</button></div>
    <div className="page-heading"><small>⚙️ THE LITTLE DETAILS</small><h1>Settings <span>✨</span></h1><p>Give GlowBite your own personality.</p></div>
    <section className="settings-panel"><h2><Palette size={20}/> Appearance</h2>
      <label>Display mode</label><div className="theme-options"><button className={db.theme==='dark'?'chosen':''} onClick={()=>setDb(old=>({...old,theme:'dark'}))}><Moon size={18}/> Midnight neon</button>
      <button className={db.theme==='light'?'chosen':''} onClick={()=>setDb(old=>({...old,theme:'light'}))}><Sun size={18}/> Pastel light</button></div>
      <label className="settings-label">Accent color</label><div className="accent-swatches">{COLORS.map(([key,label,color])=><button key={key} title={label} aria-label={label} aria-pressed={(pref.accent||'mint')===key} className={(pref.accent||'mint')===key?'selected':''}
        style={{'--swatch':color}} onClick={()=>setPref('accent',key)}><span style={{background:color}}/>{(pref.accent||'mint')===key&&<Check size={14}/>}</button>)}</div>
      <label className="settings-label">Dashboard banner</label><div className="banner-options">{BANNERS.map(([id,title,emoji])=><button key={id} className={'banner-option banner-'+id+' '+((pref.banner||'aurora')===id?'chosen':'')} onClick={()=>setPref('banner',id)}><span>{emoji}</span><small>{title}</small></button>)}</div>
      <label className="settings-label" htmlFor="greeting-text">Home page subtitle</label><input id="greeting-text" maxLength={75} value={pref.greeting??'A little nourishment goes a long way.'} onChange={e=>setPref('greeting',e.target.value)} placeholder="Write a little encouragement…"/>
      <button className="small-reset" onClick={()=>setDb(old=>({...old,preferences:{accent:'mint',banner:'aurora',greeting:'A little nourishment goes a long way.'},theme:'dark'}))}><RotateCcw size={15}/> Reset appearance</button>
    </section>
    <section className="settings-panel"><h2><Download size={20}/> Backups & data</h2><p className="settings-sub">Data stays on this device. Export includes saved food pictures and your profile.</p>
      <div className="settings-actions"><button onClick={onExport}><Download size={16}/> Export full backup <ArrowRight size={16}/></button>
      <button onClick={()=>input.current?.click()}><Upload size={16}/> Import saved backup <ArrowRight size={16}/></button>
      <button onClick={onClearDemo}><Trash2 size={16}/> Clear preview/sample data <ChevronRight size={16}/></button>
      <button className="danger-action" onClick={onReset}><Trash2 size={16}/> Reset all personal data <ChevronRight size={16}/></button></div>
      <input ref={input} hidden type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(file)await onImport(file);e.target.value='';}}/>
      <p className="hint"><Info size={15}/> Import replaces your current profile and diary. Export first if you want a backup.</p></section>
    <p className="source-note">Nutrition data and images provided by Open Food Facts contributors (ODbL / CC BY-SA). No food-search account or API key required.</p>
  </div>;
}
