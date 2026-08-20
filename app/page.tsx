"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Fighter={name:string;title:string;hp:number;min:number;max:number;stat:string;variant:"ragnar"|"brakka"};
const INITIAL:Fighter[]=[
  {name:"Ragnar",title:"El Rompemuros",hp:100,min:9,max:18,stat:"Fuerza 12",variant:"ragnar"},
  {name:"Brakka",title:"La Centella",hp:100,min:8,max:20,stat:"Agilidad 14",variant:"brakka"},
];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

function Brute({side,variant,attacking,hit,defeated}:{side:"left"|"right";variant:"ragnar"|"brakka";attacking:boolean;hit:boolean;defeated:boolean}){
  return <div className={`fighter ${side} ${variant} ${attacking?"attack":""} ${hit?"hit":""} ${defeated?"defeated":""}`} aria-hidden="true">
    <div className="fighter-aura"/><div className="shadow"/>
    <svg className="brute-rig" viewBox="0 0 240 360" role="presentation">
      <defs>
        <linearGradient id={`skin-${side}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd08a"/><stop offset=".58" stopColor="#f3a85f"/><stop offset="1" stopColor="#c8753f"/></linearGradient>
        <linearGradient id={`cloth-${side}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--cloth-light)"/><stop offset="1" stopColor="var(--cloth)"/></linearGradient>
      </defs>
      <g className="rig-root">
        <g className="limb leg leg-back">
          <path className="skin" d="M126 210 C145 207 158 220 157 248 L154 294 C153 314 143 329 125 327 C111 325 107 313 111 294 L114 247 C113 228 114 215 126 210Z"/>
          <g className="joint foot foot-back"><path className="skin" d="M112 300 C122 295 146 298 158 310 C168 320 175 326 184 330 C193 334 192 348 178 351 L127 350 C111 349 102 341 105 329Z"/><path className="detail" d="M151 331q18 9 31 5M137 334q8 8 16 13"/></g>
        </g>
        <g className="limb arm arm-back-rig">
          <path className="skin" d="M151 137 C166 132 178 142 182 158 L190 209 C193 222 185 231 174 231 C163 231 158 223 157 211 L153 174 C143 155 142 144 151 137Z"/>
          <g className="joint forearm"><path className="skin" d="M176 207 C190 203 199 211 203 226 L213 259 C219 276 208 290 194 287 C183 285 180 275 178 262 L168 229 C164 218 167 210 176 207Z"/>
            <g className="joint fist"><path className="skin" d="M189 264 C197 254 215 256 222 267 L231 282 C238 296 228 312 214 313 L195 306 C184 301 179 288 184 278Z"/><path className="detail" d="M203 274q10 5 15 14M195 283q10 4 15 15"/></g>
          </g>
        </g>
        <g className="limb leg leg-front">
          <path className="skin" d="M91 210 C109 207 122 219 121 247 L116 295 C116 315 105 329 87 327 C73 325 69 313 73 294 L77 247 C76 228 79 215 91 210Z"/>
          <g className="joint foot"><path className="skin" d="M75 298 C86 295 107 299 114 313 L116 335 C114 347 104 353 91 352 L52 351 C39 348 38 336 45 327 L64 305Z"/><path className="detail" d="M53 333q19 6 35 5M67 327q8 7 13 20"/></g>
        </g>
        <g className="torso-rig">
          <path className="skin" d="M76 125 C90 115 105 115 120 121 C137 113 156 116 166 129 C176 146 174 172 166 194 L159 220 C144 231 96 231 79 219 L70 190 C61 163 62 140 76 125Z"/>
          <path className="shade" d="M78 154 C90 168 92 192 84 215 L100 224 L91 184 C90 163 87 145 78 138Z"/>
          <path className="detail" d="M88 148q15 14 31 4M151 147q-12 14-28 5M119 167q-4 32 2 40"/>
          <path className="briefs" d="M78 210 Q120 220 161 210 L158 248 Q120 260 80 247Z" fill={`url(#cloth-${side})`}/>
          <path className="detail" d="M80 218q41 10 79 0M120 220v30"/>
          <g className="joint head-rig">
            <path className="neck skin" d="M98 119 L99 99 L143 99 L143 121 Q121 137 98 119Z"/>
            <path className="shade" d="M100 102q20 17 43 9v13q-23 13-44-4Z"/>
            <path className="skin head-shape" d="M62 31 C76 7 111 -3 145 8 C181 20 199 48 194 82 C191 106 176 124 151 135 C125 146 91 137 74 119 C58 103 50 78 54 56 C46 49 48 38 62 31Z"/>
            <path className="detail" d="M63 65q-18-8-21 11q0 20 20 22q-10-5-6-16q5-10 14 1M157 92q7-8 14 0M147 111q15-5 27 0"/>
          </g>
        </g>
        <g className="limb arm arm-front-rig">
          <path className="skin" d="M70 137 C55 132 43 142 39 158 L31 209 C28 222 36 231 47 231 C58 231 63 223 64 211 L68 174 C78 155 79 144 70 137Z"/>
          <g className="joint forearm"><path className="skin" d="M45 207 C31 203 22 211 18 226 L8 259 C2 276 13 290 27 287 C38 285 41 275 43 262 L53 229 C57 218 54 210 45 207Z"/>
            <g className="joint fist"><path className="skin" d="M32 264 C24 254 6 256-1 267 L-10 282 C-17 296-7 312 7 313 L26 306 C37 301 42 288 37 278Z"/><path className="detail" d="M18 274q-10 5-15 14M26 283q-10 4-15 15"/></g>
          </g>
        </g>
      </g>
    </svg>
  </div>;
}

function FighterCard({fighter,side}:{fighter:Fighter;side:"left"|"right"}){
  return <div className={`fighter-card card-${side}`}>
    <div className="portrait-token"><span>{fighter.variant==="ragnar"?"⚒":"⚡"}</span></div>
    <div className="fighter-info"><small>{fighter.title}</small><strong>{fighter.name}</strong><div className="health-track"><span className={`health-fill ${fighter.variant}`} style={{width:`${fighter.hp}%`}}/></div><div className="health-meta"><b>{fighter.hp} PV</b><em>{fighter.stat}</em></div></div>
  </div>;
}

export default function Home(){
  const [fighters,setFighters]=useState(INITIAL);const [active,setActive]=useState<number|null>(null);const [hit,setHit]=useState<number|null>(null);const [running,setRunning]=useState(false);const [winner,setWinner]=useState<string|null>(null);const [message,setMessage]=useState("Los brutos ocupan sus posiciones");const [damage,setDamage]=useState<number|null>(null);const [round,setRound]=useState(0);const run=useRef(0);
  const fight=useCallback(async()=>{
    const id=++run.current;let current=INITIAL.map(x=>({...x}));setFighters(current);setWinner(null);setRunning(true);setActive(null);setHit(null);setDamage(null);setRound(0);setMessage("¡Que ruja la arena!");await wait(850);let attacker=Math.random()<.5?0:1;let turn=0;
    while(current[0].hp>0&&current[1].hp>0&&run.current===id){const defender=attacker?0:1,source=current[attacker],amount=Math.floor(Math.random()*(source.max-source.min+1))+source.min;turn+=1;setRound(turn);setActive(attacker);setMessage(`${source.name} prepara su ataque`);await wait(430);if(run.current!==id)return;current=current.map((x,i)=>i===defender?{...x,hp:Math.max(0,x.hp-amount)}:x);setFighters(current);setHit(defender);setDamage(amount);setMessage(`${source.name} golpea con fuerza`);await wait(620);setHit(null);setDamage(null);setActive(null);if(current[defender].hp<=0)break;attacker=defender;await wait(180)}
    if(run.current!==id)return;const champion=current[0].hp>0?current[0].name:current[1].name;setWinner(champion);setMessage(`¡${champion} domina la arena!`);setRunning(false);
  },[]);
  useEffect(()=>{fight();return()=>{run.current+=1}},[fight]);
  return <main>
    <header className="topbar"><a className="brand" href="#arena" aria-label="Arena de Brutos"><span>AB</span><div><small>COMBATES AUTOMÁTICOS</small><h1>Arena de Brutos</h1></div></a><div className="top-actions"><span className="season">TEMPORADA I</span><span className="live"><i/> EN DIRECTO</span></div></header>
    <section className="hero" id="arena"><div className="eyebrow"><span/>COMBATE DE EXHIBICIÓN<span/></div><h2>{winner?`${winner} es el vencedor`:"Dos brutos. Un solo vencedor."}</h2><p>La suerte elige el golpe. La arena recuerda al campeón.</p></section>
    <section className="battle-wrap">
      <div className="battle-frame"><div className="frame-rivets"><i/><i/><i/><i/></div>
        <div className="sky"><div className="sun"/><div className="cloud cloud-a"/><div className="cloud cloud-b"/><div className="mountains"/></div>
        <div className="banners"><span>AB</span><span>AB</span><span>AB</span><span>AB</span><span>AB</span></div><div className="crowd"/>
        <div className="cards-row"><FighterCard fighter={fighters[0]} side="left"/><div className="versus"><small>RONDA</small><strong>{round||"—"}</strong><b>VS</b></div><FighterCard fighter={fighters[1]} side="right"/></div>
        <div className="stage"><Brute side="left" variant="ragnar" attacking={active===0} hit={hit===0} defeated={fighters[0].hp===0}/><div className={`impact ${hit!==null?"show":""}`}><span>{damage}</span><i>¡PUM!</i></div><Brute side="right" variant="brakka" attacking={active===1} hit={hit===1} defeated={fighters[1].hp===0}/></div>
        <div className="floor"><div className="arena-mark">AB</div><i/><i/><i/></div>
      </div>
      <div className="commentary"><div className="announcer"><span>📣</span><div><small>EL HERALDO DE LA ARENA</small><strong aria-live="polite">{message}</strong></div></div><button onClick={fight} disabled={running}><span>{running?"⚔":"↻"}</span>{running?"Combate en curso":"Repetir combate"}</button></div>
    </section>
    <section className="feature-strip"><div><b>⚔</b><span><strong>Combate automático</strong><small>Cada duelo es diferente</small></span></div><div><b>◆</b><span><strong>Estadísticas únicas</strong><small>Fuerza contra agilidad</small></span></div><div><b>★</b><span><strong>Victoria aleatoria</strong><small>La arena decide</small></span></div></section>
    <footer><span>ARENA DE BRUTOS · PROTOTIPO JUGABLE</span><b>Hecho para la gloria</b><span>SIN REGISTRO · SIN PAGOS</span></footer>
  </main>;
}
