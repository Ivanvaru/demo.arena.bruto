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
    <img className="fighter-skin" src="/characters/skin-principal.png" alt="" draggable={false}/>
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
