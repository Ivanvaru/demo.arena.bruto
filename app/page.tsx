"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Fighter = { name:string; hp:number; min:number; max:number };
const INITIAL:Fighter[] = [{name:"Ragnar",hp:100,min:9,max:18},{name:"Brakka",hp:100,min:8,max:20}];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

function Brute({side,variant,attacking,hit}:{side:"left"|"right";variant:"ragnar"|"brakka";attacking:boolean;hit:boolean}){
  return <div className={`fighter ${side} ${variant} ${attacking?"attack":""} ${hit?"hit":""}`} aria-hidden="true">
    <div className="shadow"/><div className="body"><div className="hair"/><div className="head"><i/><b/><span className="nose"/><span className="beard"/></div><div className="torso"><i/><span className="chest-mark"/></div><div className="arm back"/><div className="arm front"><i className="club weapon"/></div><div className="leg back"/><div className="leg front"/></div>
  </div>;
}

export default function Home(){
  const [fighters,setFighters]=useState(INITIAL); const [active,setActive]=useState<number|null>(null);
  const [hit,setHit]=useState<number|null>(null); const [running,setRunning]=useState(false);
  const [winner,setWinner]=useState<string|null>(null); const [message,setMessage]=useState("Preparando el combate…");
  const run=useRef(0);
  const fight=useCallback(async()=>{
    const id=++run.current; let current=INITIAL.map(x=>({...x})); setFighters(current);setWinner(null);setRunning(true);setActive(null);setHit(null);setMessage("¡Que empiece el combate!");await wait(700);
    let attacker=Math.random()<.5?0:1;
    while(current[0].hp>0&&current[1].hp>0&&run.current===id){
      const defender=attacker?0:1, source=current[attacker], damage=Math.floor(Math.random()*(source.max-source.min+1))+source.min;
      setActive(attacker);setMessage(`${source.name} ataca…`);await wait(430);if(run.current!==id)return;
      current=current.map((x,i)=>i===defender?{...x,hp:Math.max(0,x.hp-damage)}:x);setFighters(current);setHit(defender);setMessage(`¡${damage} puntos de daño!`);await wait(560);setHit(null);setActive(null);if(current[defender].hp<=0)break;attacker=defender;await wait(180);
    }
    if(run.current!==id)return;const champion=current[0].hp>0?current[0].name:current[1].name;setWinner(champion);setMessage(`¡${champion} gana el combate!`);setRunning(false);
  },[]);
  useEffect(()=>{fight();return()=>{run.current+=1}},[fight]);
  return <main>
    <header><div className="brand">AB</div><div><small>DEMO PRIVADA</small><h1>Arena de Brutos</h1></div><span className="live"><i/> EN DIRECTO</span></header>
    <section className="shell"><div className="intro"><small>COMBATE DE EXHIBICIÓN</small><h2>{winner?"Tenemos un vencedor":"Dos entran. Solo uno sale."}</h2></div>
      <div className="arena"><div className="sun"/><div className="cloud c1"/><div className="cloud c2"/><div className="mountains"/><div className="crowd"/>
        <div className="hud hleft"><strong>{fighters[0].name}</strong><small>EL IMPARABLE</small><div className="health"><span style={{width:`${fighters[0].hp}%`}}/><b>{fighters[0].hp}</b></div></div>
        <div className="hud hright"><strong>{fighters[1].name}</strong><small>LA BESTIA</small><div className="health"><b>{fighters[1].hp}</b><span className="red" style={{width:`${fighters[1].hp}%`}}/></div></div><div className="vs">VS</div>
        <div className="stage"><Brute side="left" variant="ragnar" attacking={active===0} hit={hit===0}/><Brute side="right" variant="brakka" attacking={active===1} hit={hit===1}/></div><div className="floor"/>
      </div><div className="status" aria-live="polite"><p>{message}</p><button onClick={fight} disabled={running}>{running?"Combate en curso":"Repetir combate"}</button></div>
    </section><footer>Prototipo jugable · Sin registro · Resultados aleatorios</footer>
  </main>;
}
