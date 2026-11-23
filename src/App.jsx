import React, { useEffect, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, BarChart3, BookOpen, CalendarDays, Camera,
  Check, ChevronLeft, ChevronRight, Droplets, Flame, Heart, Home, Info,
  Leaf, Minus, Moon, Plus, RotateCcw, ScanLine, Search, Settings2, Sparkles,
  Sun, Target, Trash2, UtensilsCrossed, Wheat, X
} from 'lucide-react';

const KEY = 'glowbite-v1';
const goalsDefault = { calories: 2100, protein: 125, carbs: 235, fat: 70, water: 2200 };
const meals = [
  { name: 'Breakfast', emoji: '🍳', sub: 'A bright beginning', hue: 'peach' },
  { name: 'Lunch', emoji: '🥑', sub: 'Midday goodness', hue: 'mint' },
  { name: 'Dinner', emoji: '🌙', sub: 'Evening nourishment', hue: 'purple' },
  { name: 'Snacks', emoji: '🍓', sub: 'Little happy bites', hue: 'pink' }
];
const foods = [
  ['yogurt','Greek yogurt bowl','Berries & crunchy granola','🥣',310,24,36,8,'1 bowl'],
  ['toast','Avocado toast','Whole-grain toast & avocado','🥑',265,8,29,13,'1 slice'],
  ['oats','Overnight oats','Oats, oat milk & chia','🥣',325,13,48,9,'1 jar'],
  ['eggs','Scrambled eggs','Two large eggs','🍳',185,13,2,14,'2 eggs'],
  ['smoothie','Berry protein smoothie','Berries, banana & protein','🫐',295,26,37,5,'1 glass'],
  ['chicken','Grilled chicken bowl','Chicken, rice & vegetables','🍗',485,42,49,12,'1 bowl'],
  ['salad','Rainbow salad','Chickpeas, greens & vinaigrette','🥗',340,13,37,16,'1 bowl'],
  ['wrap','Turkey avocado wrap','Whole-wheat tortilla','🌯',420,32,38,16,'1 wrap'],
  ['sushi','Salmon sushi','Salmon & rice rolls','🍣',360,23,51,7,'8 pieces'],
  ['rice','Brown rice','Cooked whole-grain rice','🍚',215,5,45,2,'1 cup'],
  ['salmon','Salmon & roasted veggies','Salmon, broccoli & carrots','🐟',525,44,28,26,'1 plate'],
  ['pasta','Pesto pasta','Basil pesto & parmesan','🍝',535,19,65,22,'1 plate'],
  ['tacos','Steak tacos','Steak, tortillas & salsa','🌮',470,34,42,19,'3 tacos'],
  ['tofu','Tofu stir-fry','Crispy tofu & vegetables','🥦',390,25,34,17,'1 bowl'],
  ['apple','Fresh apple','Medium apple','🍎',95,0,25,0,'1 apple'],
  ['banana','Fresh banana','Medium banana','🍌',105,1,27,0,'1 banana'],
  ['almonds','Almonds','Raw or roasted','🥜',164,6,6,14,'28 g'],
  ['berries','Mixed berries','Strawberries & blueberries','🍓',70,1,17,0,'1 cup'],
  ['chocolate','Dark chocolate','70% cocoa','🍫',170,2,13,12,'30 g'],
  ['latte','Oat milk latte','Espresso & oat milk','☕',140,3,17,6,'12 fl oz']
].map(([id,name,detail,emoji,calories,protein,carbs,fat,serving]) => ({id,name,detail,emoji,calories,protein,carbs,fat,serving}));
const format = value => Math.round(Number(value) || 0).toLocaleString();
const pad = n => String(n).padStart(2,'0');
const keyOf = d => [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const dateOf = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d); };
const moveDate = (key,delta) => { const d=dateOf(key); d.setDate(d.getDate()+delta); return keyOf(d); };
const dateText = (key,opts) => dateOf(key).toLocaleDateString('en-US',opts);
const total = (arr,field) => arr.reduce((t,x)=>t+(Number(x[field])||0),0);
const fraction = (a,b) => Math.max(0, Math.min(1, (Number(a)||0)/(Number(b)||1)));
const uid = () => Math.random().toString(36).slice(2)+Date.now().toString(36);
function seed() {
  const today = keyOf(new Date());
  const entries=[];
  const sets = [[0,5,10,17],[2,7,11,14],[3,6,12,15],[1,8,13,18],[4,5,10,16],[0,7,12,17],[2,6,11,15]];
  sets.forEach((group,offset) => group.forEach((idx,slot)=>{
    const f=foods[idx];
    entries.push({id:'sample-'+offset+'-'+slot,foodId:f.id,date:moveDate(today,-offset),
      meal:meals[slot].name,quantity:1,calories:f.calories,protein:f.protein,carbs:f.carbs,fat:f.fat, demo:true});
  }));
  return {entries,water:[{id:'sample-water',date:today,amount:1250,demo:true}],custom:[],
    favorites:['yogurt','tacos','smoothie'], goals:{...goalsDefault},name:'',theme:'dark',preview:true};
}
function load() {
  try { const saved=JSON.parse(localStorage.getItem(KEY)); if(saved && Array.isArray(saved.entries) && Array.isArray(saved.water)) return {...seed(),...saved,goals:{...goalsDefault,...saved.goals}}; }
  catch(error) { /* In private browsing, in-memory state still works. */ }
  return seed();
}
function Ring({value,max}) {
  const radius=83, circumference=2*Math.PI*radius;
  return <div className="ring">
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <circle className="ring-track" cx="100" cy="100" r={radius} />
      <circle className="ring-progress" cx="100" cy="100" r={radius}
        strokeDasharray={circumference} strokeDashoffset={circumference*(1-fraction(value,max))}/>
    </svg>
    <div className="ring-label"><span>CALORIES EATEN</span><strong>{format(value)}</strong><small>kcal</small></div>
  </div>;
}
function App() {
  const [db,setDb]=useState(load);
  const [tab,setTab]=useState('home');
  const [day,setDay]=useState(()=>keyOf(new Date()));
  const [modal,setModal]=useState('');
  const [meal,setMeal]=useState('Breakfast');
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState('All');
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(null);
  const [quantity,setQuantity]=useState(1);
  const [notice,setNotice]=useState('');
  const [waterAmount,setWaterAmount]=useState('250');
  const [custom,setCustom]=useState({name:'',serving:'1 serving',calories:'',protein:'',carbs:'',fat:''});
  const today=keyOf(new Date());
  const allFoods=[...foods,...db.custom];
  const entries=db.entries.filter(e=>e.date===day);
  const consumed={calories:total(entries,'calories'),protein:total(entries,'protein'),carbs:total(entries,'carbs'),fat:total(entries,'fat')};
  const water=total(db.water.filter(w=>w.date===day),'amount');
  const left=Math.max(0,db.goals.calories-consumed.calories);
  const metrics=[
    {label:'Protein',key:'protein',color:'violet',icon:Activity},
    {label:'Carbs',key:'carbs',color:'gold',icon:Wheat},
    {label:'Fat',key:'fat',color:'coral',icon:Droplets}
  ];
  const week=Array.from({length:7},(_,i)=>{
    const date=moveDate(today,i-6);
    return {date,calories:total(db.entries.filter(e=>e.date===date),'calories')};
  });
  const avg=Math.round(total(week,'calories')/7);
  useEffect(()=>{try {localStorage.setItem(KEY,JSON.stringify(db));}catch(error){}},[db]);
  useEffect(()=>{document.documentElement.dataset.theme=db.theme;},[db.theme]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),2700);return ()=>clearTimeout(t);},[notice]);
  function openAdd(category='Breakfast'){setMeal(category);setSearch('');setFilter('All');setEditing(null);setSelected(null);setQuantity(1);setModal('add');}
  function close(){setModal('');setEditing(null);setSelected(null);}
  function select(food){setSelected(food);setQuantity(1);setEditing(null);setModal('portion');}
  function edit(entry){
    const food=allFoods.find(f=>f.id===entry.foodId);
    if(!food)return;
    setSelected(food);setMeal(entry.meal);setQuantity(entry.quantity);setEditing(entry);setModal('portion');
  }
  function saveFood(){
    const q=Number(quantity);
    if(!selected || !Number.isFinite(q) || q<=0 || q>100){setNotice('Choose a valid serving amount');return;}
    const next={id:editing?editing.id:uid(),foodId:selected.id,meal,date:editing?editing.date:day,
      quantity:q,calories:Math.round(selected.calories*q),protein:Math.round(selected.protein*q*10)/10,
      carbs:Math.round(selected.carbs*q*10)/10,fat:Math.round(selected.fat*q*10)/10};
    setDb(old=>({...old,entries:editing?old.entries.map(e=>e.id===editing.id?next:e):[...old.entries,next]}));
    setNotice(editing?'Food updated ✓':'Added to '+meal.toLowerCase()+' ✓');close();
  }
  function deleteFood(){
    if(!editing)return;
    setDb(old=>({...old,entries:old.entries.filter(e=>e.id!==editing.id)}));
    setNotice('Entry removed');close();
  }
  function addWater(value){
    const n=Number(value);
    if(!Number.isFinite(n)||n<=0||n>5000){setNotice('Enter 1–5000 ml');return;}
    setDb(old=>({...old,water:[...old.water,{id:uid(),date:day,amount:Math.round(n)}]}));
    setNotice('Water logged 💧');
  }
  function undoWater(){
    const list=db.water.filter(w=>w.date===day);
    if(!list.length){setNotice('No water entry to undo');return;}
    const id=list[list.length-1].id;
    setDb(old=>({...old,water:old.water.filter(w=>w.id!==id)}));
    setNotice('Last water entry removed');
  }
  function makeCustom(event){
    event.preventDefault();
    if(!custom.name.trim()||['calories','protein','carbs','fat'].some(k=>custom[k]===''||!Number.isFinite(Number(custom[k]))||Number(custom[k])<0)){
      setNotice('Enter a name and valid nutrition values');return;
    }
    const food={id:uid(),name:custom.name.trim(),detail:'Your custom food',emoji:'🍽️',serving:custom.serving||'1 serving',
      calories:Number(custom.calories),protein:Number(custom.protein),carbs:Number(custom.carbs),fat:Number(custom.fat)};
    setDb(old=>({...old,custom:[...old.custom,food]}));setCustom({name:'',serving:'1 serving',calories:'',protein:'',carbs:'',fat:''});select(food);
  }
  function toggleFavorite(id){setDb(old=>({...old,favorites:old.favorites.includes(id)?old.favorites.filter(x=>x!==id):[...old.favorites,id]}));}
  function updateGoal(key,value){
    if(value==='' )return;
    const n=Number(value);
    if(Number.isFinite(n)&&n>0&&n<=50000)setDb(old=>({...old,goals:{...old.goals,[key]:n}}));
  }
  function clearDemo(){
    setDb(old=>({...old,entries:old.entries.filter(e=>!e.demo),water:old.water.filter(w=>!w.demo),preview:false}));
    setNotice('Sample entries cleared');
  }
  function exportData(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='glowbite-'+today+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function mealCard(m){
    const rows=entries.filter(e=>e.meal===m.name);
    return <section key={m.name} className={'meal-card hue-'+m.hue}>
      <div className="meal-head"><span className="meal-emoji">{m.emoji}</span><div className="meal-name"><h3>{m.name}</h3><p>{rows.length?rows.length+' logged':'Add something delicious'}</p></div>
        <div className="meal-cal"><strong>{format(total(rows,'calories'))}</strong><small>kcal</small></div>
        <button className="icon-round" aria-label={'Add '+m.name} onClick={()=>openAdd(m.name)}><Plus size={18}/></button></div>
      {rows.length>0?<div className="meal-rows">{rows.map(e=>{
        const f=allFoods.find(x=>x.id===e.foodId);return <button className="food-entry" key={e.id} onClick={()=>edit(e)}>
          <span className="entry-emoji">{f?.emoji||'🍽️'}</span><span className="entry-info"><b>{f?.name||'Food'}</b><small>{e.quantity} × {f?.serving||'serving'}</small></span><strong>{format(e.calories)} <small>kcal</small></strong></button>;
      })}</div>:<button className="empty-food" onClick={()=>openAdd(m.name)}><Plus size={15}/> Log {m.name.toLowerCase()}</button>}
    </section>;
  }
  function DateStrip(){
    return <div className="date-strip">{Array.from({length:7},(_,i)=>{
      const date=moveDate(day,i-3);return <button key={date} className={'date-chip '+(date===day?'active':'')} onClick={()=>setDay(date)}
        aria-label={dateText(date,{weekday:'long',month:'long',day:'numeric'})} aria-pressed={date===day}>
        <small>{dateText(date,{weekday:'short'})}</small><strong>{dateOf(date).getDate()}</strong>
        <i className={db.entries.some(e=>e.date===date)?'has-food':''}/></button>;
    })}</div>;
  }
  const head=<header className="header"><div className="logo"><span className="logo-mark"><Leaf size={22}/></span>Glow<strong>Bite</strong><b>.</b></div>
    <button className="profile-chip" onClick={()=>setTab('profile')} aria-label="Open your profile"><span>✦</span></button></header>;
  const home=<div className="page">
    <div className="welcome"><div className="eyebrow">✦ YOUR DAILY GLOW</div><h1>{new Date().getHours()<12?'Good morning':new Date().getHours()<17?'Good afternoon':'Good evening'} <span>✨</span></h1><p>A little nourishment goes a long way.</p></div>
    {db.preview&&<div className="demo-banner"><Info size={16}/><span>Preview data is showing.</span><button onClick={clearDemo}>Clear demo</button></div>}
    <DateStrip/>
    <section className="calorie-hero"><div className="hero-aurora"/><div className="hero-title"><span><Flame size={16}/> DAILY CALORIES</span><span className="goal-tag"><Target size={13}/>{format(db.goals.calories)} goal</span></div>
      <div className="hero-center"><Ring value={consumed.calories} max={db.goals.calories}/><div className="hero-right"><small>Keep glowing</small><strong>{format(left)}</strong><span>kcal remaining</span><div className="hero-note"><Sparkles size={15}/>{consumed.calories?'You’re doing great!':'A fresh start!'}</div></div></div>
      <div className="hero-footer"><span><i/>{Math.round(fraction(consumed.calories,db.goals.calories)*100)}% of your goal</span><span>{day===today?'Today':dateText(day,{month:'short',day:'numeric'})}</span></div></section>
    <div className="section-title"><div><small>THE GOOD STUFF</small><h2>Macro balance</h2></div><button onClick={()=>setTab('insights')}>Insights <ArrowRight size={16}/></button></div>
    <div className="macro-grid">{metrics.map(m=><article className={'macro-card hue-'+m.color} key={m.key}><span className="macro-icon"><m.icon size={18}/></span><small>{m.label}</small><div className="macro-value">{format(consumed[m.key])}<span>/{format(db.goals[m.key])}g</span></div><div className="track"><i style={{width:(fraction(consumed[m.key],db.goals[m.key])*100)+'%'}}/></div></article>)}</div>
    <div className="section-title"><div><small>ONE TAP AWAY</small><h2>Quick actions</h2></div></div>
    <div className="quick-grid"><button className="quick-card quick-green" onClick={()=>openAdd()}><span><Plus size={23}/></span><div><strong>Add food</strong><small>Log a meal</small></div><ArrowRight size={16}/></button>
      <button className="quick-card quick-purple" onClick={()=>setNotice('Barcode scanning is coming later')}><span><ScanLine size={22}/></span><div><strong>Scan food</strong><small>Coming soon</small></div><ArrowRight size={16}/></button></div>
    <section className="water-card"><span className="water-glass"><i style={{height:(fraction(water,db.goals.water)*100)+'%'}}/><Droplets size={28}/></span>
      <div className="water-text"><small>STAY REFRESHED 💧</small><h3>Water tracker</h3><p><b>{(water/1000).toFixed(2)} L</b> of {(db.goals.water/1000).toFixed(1)} L goal</p><div className="track"><i style={{width:(fraction(water,db.goals.water)*100)+'%'}}/></div></div>
      <button onClick={()=>addWater(250)} aria-label="Add 250 milliliters of water"><Plus size={22}/></button></section>
    <div className="section-title"><div><small>WHAT'S ON THE MENU?</small><h2>Today's meals</h2></div><button onClick={()=>setTab('diary')}>Diary <ArrowRight size={16}/></button></div>
    <div className="meal-list">{meals.map(mealCard)}</div><div className="closing-line"><Heart size={14}/> Progress, not perfection. Every bite counts.</div></div>;
  const diary=<div className="page"><div className="page-heading"><small>📔 YOUR FOOD STORY</small><h1>Food diary <span>✦</span></h1><p>A cozy little record of what fuels you.</p></div>
    <div className="date-navigator"><button onClick={()=>setDay(moveDate(day,-1))} aria-label="Previous day"><ChevronLeft size={20}/></button><span><CalendarDays size={17}/>{dateText(day,{weekday:'short',month:'long',day:'numeric'})}</span><button onClick={()=>setDay(moveDate(day,1))} aria-label="Next day"><ChevronRight size={20}/></button></div>
    <div className="diary-summary"><div><small>CALORIES LOGGED</small><strong>{format(consumed.calories)} <span>kcal</span></strong></div><span className="pill">{Math.round(fraction(consumed.calories,db.goals.calories)*100)}% of goal</span></div>
    <div className="diary-mini-macros">{metrics.map(m=><div className={'hue-'+m.color} key={m.key}><small>{m.label}</small><strong>{format(consumed[m.key])}g</strong></div>)}</div>
    <div className="meal-list">{meals.map(mealCard)}</div><button className="cta-full" onClick={()=>openAdd()}><Plus size={19}/> Log something delicious</button>
    <section className="water-diary"><div className="water-diary-head"><h3><Droplets size={20}/> Water & hydration</h3><span>{format(water)} / {format(db.goals.water)} ml</span></div>
      <div className="track"><i style={{width:(fraction(water,db.goals.water)*100)+'%'}}/></div><div className="water-shortcuts">
        {[150,250,500].map(n=><button key={n} onClick={()=>addWater(n)}>+ {n} ml</button>)}<button aria-label="Undo last water log" onClick={undoWater}><RotateCcw size={17}/></button></div>
      <div className="custom-water"><label htmlFor="water-input">Custom amount (ml)</label><input id="water-input" inputMode="numeric" type="number" min="1" max="5000" value={waterAmount} onChange={e=>setWaterAmount(e.target.value)}/><button onClick={()=>addWater(waterAmount)}>Add</button></div>
    </section></div>;
  const chartMax=Math.max(db.goals.calories,...week.map(d=>d.calories),1);
  const macroEnergy=consumed.protein*4+consumed.carbs*4+consumed.fat*9;
  const proteinPct=macroEnergy?consumed.protein*4/macroEnergy*100:0;
  const carbsPct=macroEnergy?(consumed.protein*4+consumed.carbs*4)/macroEnergy*100:0;
  const insights=<div className="page"><div className="page-heading"><small>✨ SEE YOUR PROGRESS</small><h1>Your insights <span>🌈</span></h1><p>Little patterns. Lovely progress.</p></div>
    <div className="stat-grid"><article className="stat-card"><span>✨</span><small>Daily average</small><strong>{format(avg)}</strong><p>kcal / day</p></article><article className="stat-card"><span>🌟</span><small>Days logged</small><strong>{week.filter(d=>d.calories>0).length} <em>/ 7</em></strong><p>this week</p></article></div>
    <section className="insight-panel"><div className="section-title compact"><div><small>LAST 7 DAYS</small><h2>Calorie rhythm</h2></div><span className="pill">Weekly</span></div>
      <div className="bar-chart" aria-label="Calories logged during the last seven days" role="img">{week.map((d,i)=><div className="bar-item" key={d.date}><small>{d.calories?Math.round(d.calories/100)/10+'k':'0'}</small><div className="bar-base"><i className={i===6?'today':''} style={{height:Math.max(2,d.calories/chartMax*100)+'%'}}/></div><b>{dateText(d.date,{weekday:'short'}).slice(0,1)}</b></div>)}</div><p className="chart-caption">Only logged foods count toward these totals.</p></section>
    <section className="insight-panel"><div className="section-title compact"><div><small>SELECTED DAY</small><h2>Macro harmony</h2></div></div>
      <div className="donut-layout"><div className="donut" style={{background:macroEnergy?'conic-gradient(#ae8cff 0% '+proteinPct+'%, #ffe58f '+proteinPct+'% '+carbsPct+'%, #ff789b '+carbsPct+'% 100%)':'conic-gradient(#343853 0% 100%)'}}><div><span>Energy</span><strong>{format(consumed.calories)}</strong><small>kcal</small></div></div><div className="donut-legend">{metrics.map(m=><div className={'hue-'+m.color} key={m.key}><i/><span>{m.label}</span><strong>{format(consumed[m.key])}g</strong></div>)}</div></div></section>
    <section className="insight-panel"><div className="section-title compact"><div><small>GOAL CHECK-IN</small><h2>Macro progress</h2></div><Target size={22} className="muted-icon"/></div>
      {metrics.map(m=><div className={'goal-progress hue-'+m.color} key={m.key}><div><span>{m.label}</span><strong>{Math.round(fraction(consumed[m.key],db.goals[m.key])*100)}%</strong></div><div className="track"><i style={{width:(fraction(consumed[m.key],db.goals[m.key])*100)+'%'}}/></div></div>)}</section>
    <p className="hint"><Info size={15}/> Nutrition values are illustrative estimates; check packaging or other trusted sources for accuracy.</p></div>;
  const profile=<div className="page"><div className="page-heading"><small>⚙️ MAKE IT YOURS</small><h1>Your space <span>💜</span></h1><p>A little room for your kind of glow.</p></div>
    <section className="profile-card"><span className="profile-avatar"><Leaf size={32}/></span><div><small>WELCOME TO GLOWBITE</small><h2>{db.name||'Lovely human'} ✨</h2><p>Your cozy nutrition companion</p></div></section>
    <section className="settings-panel"><h2><Settings2 size={20}/> Preferences</h2><label htmlFor="username">Display name</label>
      <input id="username" value={db.name} placeholder="What should we call you?" maxLength={32} onChange={e=>setDb(old=>({...old,name:e.target.value}))}/>
      <label>Appearance</label><div className="theme-options"><button className={db.theme==='dark'?'chosen':''} onClick={()=>setDb(old=>({...old,theme:'dark'}))}><Moon size={18}/> Midnight neon</button>
        <button className={db.theme==='light'?'chosen':''} onClick={()=>setDb(old=>({...old,theme:'light'}))}><Sun size={18}/> Pastel light</button></div></section>
    <section className="settings-panel"><h2><Target size={20}/> Daily goals</h2><p className="settings-sub">Personalize your daily targets.</p><div className="goal-fields">
      {Object.entries(db.goals).map(([k,v])=><label className="goal-field" key={k}><span>{k==='water'?'Water (ml)':k==='calories'?'Calories (kcal)':k[0].toUpperCase()+k.slice(1)+' (g)'}</span><input type="number" min="1" max="50000" value={v} onChange={e=>updateGoal(k,e.target.value)}/></label>)}</div></section>
    <section className="settings-panel"><h2><BookOpen size={20}/> Your data</h2><p className="settings-sub">Logs are stored locally on this device, not in an online account.</p>
      <div className="settings-actions"><button onClick={exportData}>Export data (JSON) <ArrowRight size={16}/></button><button onClick={clearDemo}>Clear sample entries <Trash2 size={16}/></button></div></section>
    <div className="closing-line"><Heart size={14}/> Nourishment looks different for everyone.</div></div>;
  const results=allFoods.filter(f=>filter==='Favorites'?db.favorites.includes(f.id):(filter==='All'||f.name.toLowerCase().includes(filter.toLowerCase())||f.detail.toLowerCase().includes(filter.toLowerCase())))
    .filter(f=>(f.name+' '+f.detail).toLowerCase().includes(search.trim().toLowerCase()));
  const sheet=modal&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}><div className="sheet" role="dialog" aria-modal="true" aria-label="Food logging">
    <div className="sheet-handle"/><div className="sheet-title"><div><small>✦ A LITTLE NOURISHMENT</small><h2>{modal==='add'?'Add something delicious':modal==='portion'?(editing?'Edit entry':'One more delicious bite'): 'Create a food'}</h2></div><button onClick={close} aria-label="Close dialog"><X size={22}/></button></div>
    {modal==='add'&&<><div className="search-box"><Search size={19}/><input autoFocus aria-label="Search food" placeholder="Search foods, ingredients..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="filter-list">{['All','Favorites','Breakfast','Lunch','Dinner','Snacks'].map(f=><button key={f} onClick={()=>setFilter(f)} className={filter===f?'active':''}>{f}</button>)}</div>
      <div className="meal-selector"><label htmlFor="meal-select">Add to</label><select id="meal-select" value={meal} onChange={e=>setMeal(e.target.value)}>{meals.map(m=><option key={m.name}>{m.name}</option>)}</select></div>
      <div className="food-picker">{results.map(f=><div className="food-option" key={f.id}><button className="favorite-button" aria-label={db.favorites.includes(f.id)?'Remove favorite':'Add favorite'} onClick={()=>toggleFavorite(f.id)}><Heart size={19} fill={db.favorites.includes(f.id)?'currentColor':'none'}/></button>
        <button className="food-option-main" onClick={()=>select(f)}><span className="food-option-emoji">{f.emoji}</span><span><b>{f.name}</b><small>{f.detail} · {f.serving}</small></span><strong>{format(f.calories)}<small> kcal</small></strong><Plus size={17}/></button></div>)}
        {results.length===0&&<div className="nothing-found">🍓 No matching foods yet. Try a custom food below.</div>}</div>
      <button className="create-custom" onClick={()=>setModal('custom')}><Plus size={18}/> Create a custom food</button>
      <div className="not-ready"><button onClick={()=>setNotice('Barcode scanning is planned for a future update')}><ScanLine size={17}/> Barcode · soon</button><button onClick={()=>setNotice('Photo recognition is planned for a future update')}><Camera size={17}/> Photo · soon</button></div></>}
    {modal==='portion'&&selected&&<div className="portion-body"><div className="portion-feature"><span>{selected.emoji}</span><h3>{selected.name}</h3><p>{selected.detail}</p><small>{selected.serving} per serving</small></div>
      <div className="serving-counter"><span>How many servings?</span><div><button aria-label="Reduce serving" onClick={()=>setQuantity(q=>Math.max(0.25,Math.round((Number(q)-0.25)*100)/100))}><Minus size={19}/></button>
      <input aria-label="Serving quantity" type="number" min="0.25" max="100" step="0.25" value={quantity} onChange={e=>setQuantity(e.target.value)}/>
      <button aria-label="Increase serving" onClick={()=>setQuantity(q=>Math.min(100,Number(q)+0.25))}><Plus size={19}/></button></div></div>
      <div className="portion-stats">{[['Calories','calories','kcal'],['Protein','protein','g'],['Carbs','carbs','g'],['Fat','fat','g']].map(([label,k,u])=><div key={k}><small>{label}</small><strong>{format(selected[k]*Number(quantity))}<span>{u}</span></strong></div>)}</div>
      <div className="meal-selector"><label htmlFor="portion-meal">Meal</label><select id="portion-meal" value={meal} onChange={e=>setMeal(e.target.value)}>{meals.map(m=><option key={m.name}>{m.name}</option>)}</select></div>
      <button className="cta-full" onClick={saveFood}><Check size={19}/>{editing?'Save changes':'Add to diary'}</button>
      {editing&&<button className="delete-entry" onClick={deleteFood}><Trash2 size={17}/> Remove this entry</button>}
      <button className="back-link" onClick={()=>{setEditing(null);setModal('add');}}><ArrowLeft size={15}/> Back to food search</button></div>}
    {modal==='custom'&&<form className="custom-form" onSubmit={makeCustom}><label>Food name<input required maxLength={80} placeholder="E.g. Homemade smoothie" value={custom.name} onChange={e=>setCustom(old=>({...old,name:e.target.value}))}/></label>
      <label>Serving description<input placeholder="E.g. 1 cup" value={custom.serving} onChange={e=>setCustom(old=>({...old,serving:e.target.value}))}/></label>
      <div className="custom-nutrients">{['calories','protein','carbs','fat'].map(k=><label key={k}>{k[0].toUpperCase()+k.slice(1)} ({k==='calories'?'kcal':'g'})<input required min="0" step="any" type="number" inputMode="decimal" placeholder="0" value={custom[k]} onChange={e=>setCustom(old=>({...old,[k]:e.target.value}))}/></label>)}</div>
      <p className="hint">Enter nutrition for one serving. Your custom food stays in your library.</p><button type="submit" className="cta-full"><Plus size={18}/> Save custom food</button></form>}
  </div></div>;
  return <div className="app-shell">{head}<main>{tab==='home'?home:tab==='diary'?diary:tab==='insights'?insights:profile}</main>
    <nav className="bottom-nav" aria-label="Main navigation"><button onClick={()=>setTab('home')} className={tab==='home'?'active':''}><Home size={21}/><span>Home</span></button>
      <button onClick={()=>setTab('diary')} className={tab==='diary'?'active':''}><BookOpen size={21}/><span>Diary</span></button>
      <button className="nav-add" aria-label="Add food" onClick={()=>openAdd()}><Plus size={29}/></button>
      <button onClick={()=>setTab('insights')} className={tab==='insights'?'active':''}><BarChart3 size={21}/><span>Insights</span></button>
      <button onClick={()=>setTab('profile')} className={tab==='profile'?'active':''}><Settings2 size={21}/><span>Profile</span></button></nav>
    {notice&&<div role="status" className="toast"><Check size={17}/>{notice}</div>}{sheet}
  </div>;
}
export default App;
