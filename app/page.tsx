"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Fighter={name:string;title:string;hp:number;min:number;max:number;stat:string;variant:"ragnar"|"brakka"};
type AttackKind="punch"|"kick";
const INITIAL:Fighter[]=[
  {name:"Ragnar",title:"El Rompemuros",hp:100,min:9,max:18,stat:"Fuerza 12",variant:"ragnar"},
  {name:"Brakka",title:"La Centella",hp:100,min:8,max:20,stat:"Agilidad 14",variant:"brakka"},
];
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

type RigMotion="punch"|"kick"|"hit"|"defeat";
const motion=(node:Element|null,frames:Keyframe[],duration:number,fill:FillMode="none")=>node?.animate(frames,{duration,easing:"linear",fill});

function playRigMotion(svg:SVGSVGElement,kind:RigMotion){
  const q=(selector:string)=>svg.querySelector(selector);
  const run=(selector:string,frames:Keyframe[],duration:number,fill:FillMode="none")=>motion(q(selector),frames,duration,fill);
  const smooth=(transform:string,offset:number,easing="cubic-bezier(.22,.72,.24,1)")=>({transform,offset,easing});
  if(kind==="punch") return [
    run(".rig-body",[smooth("translate(0,0) rotate(0deg)",0),smooth("translate(-10px,3px) rotate(2deg)",.18),smooth("translate(26px,-3px) rotate(-2deg)",.42),smooth("translate(76px,-5px) rotate(-4deg)",.58,"cubic-bezier(.1,.9,.2,1)"),smooth("translate(58px,-2px) rotate(-2deg)",.72),smooth("translate(0,0) rotate(0deg)",1,"cubic-bezier(.3,0,.4,1)")],680),
    run(".torso-svg",[smooth("rotate(0deg)",0),smooth("rotate(7deg)",.2),smooth("rotate(-11deg)",.58),smooth("rotate(-5deg)",.72),smooth("rotate(0deg)",1)],680),
    run(".cabeza-svg",[smooth("rotate(0deg)",0),smooth("rotate(-2deg)",.2),smooth("rotate(7deg) translateY(4px)",.58),smooth("rotate(2deg)",.78),smooth("rotate(0deg)",1)],680),
    run(".arm-left",[smooth("rotate(0deg)",0),smooth("rotate(25deg) translate(-8px,5px)",.2),smooth("rotate(-30deg) translate(20px,-8px)",.42),smooth("rotate(-78deg) translate(54px,-18px)",.58,"cubic-bezier(.08,.9,.16,1)"),smooth("rotate(-58deg) translate(42px,-12px)",.7),smooth("rotate(0deg)",1)],680),
    run(".arm-left .antebrazo-izq",[smooth("rotate(10deg)",0),smooth("rotate(32deg)",.2),smooth("rotate(-28deg) translate(16px,-8px)",.42),smooth("rotate(-72deg) translate(74px,-40px)",.58),smooth("rotate(-48deg) translate(48px,-24px)",.7),smooth("rotate(0deg)",1)],680),
    run(".arm-left .mano-izq",[smooth("rotate(0deg)",0),smooth("rotate(-14deg) translate(25px,-12px) scale(1.04)",.58),smooth("rotate(-8deg) translate(14px,-6px)",.72),smooth("rotate(0deg)",1)],680),
    run(".arm-right",[smooth("rotate(0deg)",0),smooth("rotate(18deg) translate(-8px,-9px)",.32),smooth("rotate(24deg) translate(-10px,-13px)",.62),smooth("rotate(0deg)",1)],680),
    run(".leg-left",[smooth("rotate(0deg)",0),smooth("rotate(-6deg) translate(18px,0)",.58),smooth("rotate(0deg)",1)],680),
    run(".leg-right",[smooth("rotate(0deg)",0),smooth("rotate(8deg) translate(-9px,3px)",.58),smooth("rotate(0deg)",1)],680)
  ];
  if(kind==="kick") return [
    run(".rig-body",[smooth("translate(0,0) rotate(0deg)",0),smooth("translate(-16px,-3px) rotate(2deg)",.16),smooth("translate(8px,-17px) rotate(5deg)",.34),smooth("translate(38px,-31px) rotate(8deg)",.56),smooth("translate(24px,-18px) rotate(5deg)",.72),smooth("translate(0,0) rotate(0deg)",1)],820),
    run(".torso-svg",[smooth("rotate(0deg)",0),smooth("rotate(-7deg)",.2),smooth("rotate(14deg) translate(-10px,-4px)",.52),smooth("rotate(9deg)",.7),smooth("rotate(0deg)",1)],820),
    run(".cabeza-svg",[smooth("rotate(0deg)",0),smooth("rotate(4deg)",.2),smooth("rotate(-10deg) translate(-5px,-2px)",.52),smooth("rotate(-4deg)",.72),smooth("rotate(0deg)",1)],820),
    run(".leg-left",[smooth("rotate(0deg)",0),smooth("rotate(-18deg) translate(12px,-14px)",.22),smooth("rotate(-48deg) translate(43px,-48px)",.38),smooth("rotate(-82deg) translate(98px,-77px)",.56,"cubic-bezier(.08,.9,.18,1)"),smooth("rotate(-60deg) translate(66px,-54px)",.68),smooth("rotate(-18deg) translate(14px,-12px)",.84),smooth("rotate(0deg)",1)],820),
    run(".leg-left .pierna-izq",[smooth("rotate(0deg)",0),smooth("rotate(42deg) translate(-18px,-5px)",.3),smooth("rotate(-18deg) translate(38px,-35px)",.43),smooth("rotate(-76deg) translate(105px,-75px)",.56),smooth("rotate(-44deg) translate(65px,-48px)",.7),smooth("rotate(18deg)",.84),smooth("rotate(0deg)",1)],820),
    run(".leg-left .pie-izq",[smooth("rotate(0deg)",0),smooth("rotate(-18deg)",.38),smooth("rotate(16deg) translate(50px,-25px)",.56),smooth("rotate(8deg)",.72),smooth("rotate(0deg)",1)],820),
    run(".leg-right",[smooth("rotate(0deg)",0),smooth("rotate(7deg) translate(-14px,5px) scaleY(.98)",.35),smooth("rotate(10deg) translate(-17px,7px) scaleY(.96)",.58),smooth("rotate(0deg)",1)],820),
    run(".arm-left",[smooth("rotate(0deg)",0),smooth("rotate(30deg) translate(-7px,-12px)",.46),smooth("rotate(20deg)",.7),smooth("rotate(0deg)",1)],820),
    run(".arm-right",[smooth("rotate(0deg)",0),smooth("rotate(-27deg) translate(9px,-8px)",.46),smooth("rotate(-16deg)",.7),smooth("rotate(0deg)",1)],820)
  ];
  if(kind==="hit") return [
    run(".rig-body",[smooth("translate(0,0) rotate(0deg)",0),smooth("translate(-34px,-4px) rotate(9deg)",.2,"cubic-bezier(.1,.9,.2,1)"),smooth("translate(12px,1px) rotate(-3deg)",.48),smooth("translate(-5px,0) rotate(1deg)",.72),smooth("translate(0,0) rotate(0deg)",1)],430),
    run(".cabeza-svg",[smooth("rotate(0deg)",0),smooth("rotate(21deg) translate(12px,-8px)",.2),smooth("rotate(-6deg)",.5),smooth("rotate(0deg)",1)],430),
    run(".arm-left",[smooth("rotate(0deg)",0),smooth("rotate(13deg)",.25),smooth("rotate(0deg)",1)],430),
    run(".arm-right",[smooth("rotate(0deg)",0),smooth("rotate(-13deg)",.25),smooth("rotate(0deg)",1)],430)
  ];
  return [
    run(".rig-body",[smooth("translate(0,0) rotate(0deg)",0),smooth("translate(-15px,-5px) rotate(5deg)",.18),smooth("translate(-68px,110px) rotate(-38deg)",.55),smooth("translate(-115px,310px) rotate(-82deg)",.82),smooth("translate(-122px,338px) rotate(-88deg)",1,"cubic-bezier(.2,.8,.2,1)")],850,"forwards"),
    run(".arm-left",[smooth("rotate(0deg)",0),smooth("rotate(38deg)",.55),smooth("rotate(62deg)",1)],850,"forwards"),
    run(".arm-right",[smooth("rotate(0deg)",0),smooth("rotate(-32deg)",.55),smooth("rotate(-48deg)",1)],850,"forwards"),
    run(".cabeza-svg",[smooth("rotate(0deg)",0),smooth("rotate(18deg)",.5),smooth("rotate(32deg)",1)],850,"forwards")
  ];
}

function Brute({side,variant,attacking,attackKind,hit,defeated}:{side:"left"|"right";variant:"ragnar"|"brakka";attacking:boolean;attackKind:AttackKind|null;hit:boolean;defeated:boolean}){
  const rigRef=useRef<SVGSVGElement>(null);
  useEffect(()=>{const svg=rigRef.current;if(!svg)return;const idle=[
    motion(svg.querySelector(".rig-body"),[{transform:"translateY(0) rotate(-.3deg)"},{transform:"translateY(-5px) rotate(.35deg)"},{transform:"translateY(0) rotate(-.3deg)"}],2100),
    motion(svg.querySelector(".torso-svg"),[{transform:"scaleY(1)"},{transform:"scaleY(1.012) translateY(-2px)"},{transform:"scaleY(1)"}],2100),
    motion(svg.querySelector(".cabeza-svg"),[{transform:"rotate(-1deg)"},{transform:"rotate(1.5deg) translateY(-2px)"},{transform:"rotate(-1deg)"}],3000),
    motion(svg.querySelector(".arm-left"),[{transform:"rotate(1deg)"},{transform:"rotate(-2.5deg)"},{transform:"rotate(1deg)"}],2100),
    motion(svg.querySelector(".arm-right"),[{transform:"rotate(-1deg)"},{transform:"rotate(2.5deg)"},{transform:"rotate(-1deg)"}],2100)
  ].filter(Boolean) as Animation[];idle.forEach(a=>{a.effect&&a.updatePlaybackRate(1);(a.effect as KeyframeEffect).updateTiming({iterations:Infinity,easing:"ease-in-out"})});return()=>idle.forEach(a=>a.cancel())},[]);
  useEffect(()=>{if(!attacking||!attackKind||!rigRef.current)return;const animations=playRigMotion(rigRef.current,attackKind);return()=>animations.forEach(a=>a?.cancel())},[attacking,attackKind]);
  useEffect(()=>{if(!hit||!rigRef.current)return;const animations=playRigMotion(rigRef.current,"hit");return()=>animations.forEach(a=>a?.cancel())},[hit]);
  useEffect(()=>{if(!defeated||!rigRef.current)return;playRigMotion(rigRef.current,"defeat")},[defeated]);
  return <div className={`fighter ${side} ${variant} ${attacking?`attack attack-${attackKind}`:""} ${hit?"hit":""} ${defeated?"defeated":""}`} aria-hidden="true">
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
    <svg ref={rigRef} className="designed-rig rig-js" viewBox="0 0 979 1606" role="presentation">
      <g className="rig-body">
        <g className="limb-chain leg-chain leg-right"><g className="svg-part muslo-der"><use href="/characters/base-normal/personaje.svg#muslo_der"/></g><ellipse className="joint-cover" cx="615" cy="1110" rx="49" ry="42"/><g className="svg-part pierna-der"><use href="/characters/base-normal/personaje.svg#pierna_der"/></g><ellipse className="joint-cover" cx="595" cy="1380" rx="43" ry="35"/><g className="svg-part pie-der"><use href="/characters/base-normal/personaje.svg#pie_der"/></g></g>
        <g className="limb-chain arm-chain arm-right"><g className="svg-part brazo-der"><use href="/characters/base-normal/personaje.svg#brazo_der_superior"/></g><ellipse className="joint-cover" cx="650" cy="720" rx="43" ry="37"/><g className="svg-part antebrazo-der"><use href="/characters/base-normal/personaje.svg#antebrazo_der"/></g><ellipse className="joint-cover" cx="700" cy="930" rx="38" ry="32"/><g className="svg-part mano-der"><use href="/characters/base-normal/personaje.svg#mano_der"/></g></g>
        <g className="svg-part torso-svg"><use href="/characters/base-normal/personaje.svg#torso"/></g>
        <g className="limb-chain leg-chain leg-left"><g className="svg-part muslo-izq"><use href="/characters/base-normal/personaje.svg#muslo_izq"/></g><ellipse className="joint-cover" cx="380" cy="1110" rx="49" ry="42"/><g className="svg-part pierna-izq"><use href="/characters/base-normal/personaje.svg#pierna_izq"/></g><ellipse className="joint-cover" cx="350" cy="1380" rx="43" ry="35"/><g className="svg-part pie-izq"><use href="/characters/base-normal/personaje.svg#pie_izq"/></g></g>
        <g className="limb-chain arm-chain arm-left"><g className="svg-part brazo-izq"><use href="/characters/base-normal/personaje.svg#brazo_izq_superior"/></g><ellipse className="joint-cover" cx="305" cy="720" rx="43" ry="37"/><g className="svg-part antebrazo-izq"><use href="/characters/base-normal/personaje.svg#antebrazo_izq"/></g><ellipse className="joint-cover" cx="285" cy="925" rx="38" ry="32"/><g className="svg-part mano-izq"><use href="/characters/base-normal/personaje.svg#mano_izq"/></g></g>
        <g className="svg-part cuello-svg"><use href="/characters/base-normal/personaje.svg#cuello"/></g>
        <g className="svg-part cabeza-svg"><use href="/characters/base-normal/personaje.svg#cabeza"/></g>
      </g>
    </svg>
  </div>;
}

function FighterCard({fighter,side}:{fighter:Fighter;side:"left"|"right"}){
  const suffix=`life-${side}`;
  const fillWidth=1293*Math.max(0,Math.min(100,fighter.hp))/100;
  return <div className={`life-card card-${side}`} aria-label={`${fighter.name}: ${fighter.hp} puntos de vida`}>
    <svg viewBox="0 0 1600 300" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`life-green-${suffix}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#91ee37"/><stop offset=".46" stopColor="#47c923"/><stop offset="1" stopColor="#168c16"/></linearGradient>
        <linearGradient id={`life-shine-${suffix}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".72"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
        <clipPath id={`portrait-${suffix}`}><circle cx="130" cy="135" r="103"/></clipPath>
        <clipPath id={`progress-${suffix}`}><rect x="281" y="123" width={fillWidth} height="86" rx="38"/></clipPath>
        <filter id={`shadow-${suffix}`} x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="5" dy="7" stdDeviation="5" floodColor="#120b05" floodOpacity=".55"/></filter>
      </defs>
      <use href="/ui/barra-vida.svg#marco"/>
      <g filter={`url(#shadow-${suffix})`}>
        <circle cx="130" cy="135" r="111" fill="#3a2415" stroke="#e8aa2d" strokeWidth="12"/>
        <image href="/characters/base-normal/personaje-base.webp" x="26" y="27" width="208" height="208" preserveAspectRatio="xMidYMin slice" clipPath={`url(#portrait-${suffix})`}/>
        <circle cx="130" cy="135" r="103" fill="none" stroke="#fff4b0" strokeOpacity=".45" strokeWidth="5"/>
      </g>
      <text x="282" y="99" className="life-name-shadow">{fighter.name.toUpperCase()}</text>
      <text x="282" y="93" className="life-name">{fighter.name.toUpperCase()}</text>
      <rect x="271" y="113" width="1313" height="106" rx="49" fill="#1c160f" stroke="#0c0906" strokeWidth="5"/>
      <rect x="281" y="123" width="1293" height="86" rx="39" fill="#4f3c27"/>
      <g clipPath={`url(#progress-${suffix})`}>
        <rect x="281" y="123" width="1293" height="86" fill={`url(#life-green-${suffix})`}/>
        <rect x="281" y="127" width="1293" height="31" rx="16" fill={`url(#life-shine-${suffix})`}/>
        <path d="M288 192 Q620 174 945 192 T1566 191" fill="none" stroke="#0d6514" strokeOpacity=".55" strokeWidth="8"/>
      </g>
      <text x="286" y="270" className="life-count"><tspan>{fighter.hp}</tspan><tspan className="life-total"> / 100 PV</tspan></text>
      <text x="1568" y="270" textAnchor="end" className="life-stat">{fighter.stat.toUpperCase()}</text>
    </svg>
  </div>;
}

export default function Home(){
  const [fighters,setFighters]=useState(INITIAL);const [active,setActive]=useState<number|null>(null);const [attackKind,setAttackKind]=useState<AttackKind|null>(null);const [hit,setHit]=useState<number|null>(null);const [running,setRunning]=useState(false);const [winner,setWinner]=useState<string|null>(null);const [message,setMessage]=useState("Los brutos ocupan sus posiciones");const [damage,setDamage]=useState<number|null>(null);const [round,setRound]=useState(0);const run=useRef(0);
  const fight=useCallback(async()=>{
    const id=++run.current;let current=INITIAL.map(x=>({...x}));setFighters(current);setWinner(null);setRunning(true);setActive(null);setAttackKind(null);setHit(null);setDamage(null);setRound(0);setMessage("¡Que ruja la arena!");await wait(850);let attacker=Math.random()<.5?0:1;let turn=0;
    while(current[0].hp>0&&current[1].hp>0&&run.current===id){const defender=attacker?0:1,source=current[attacker],amount=Math.floor(Math.random()*(source.max-source.min+1))+source.min;turn+=1;const kind:AttackKind=turn%2?"punch":"kick";setRound(turn);setAttackKind(kind);setActive(attacker);setMessage(`${source.name} prepara ${kind==="punch"?"el puño":"una patada"}`);await wait(kind==="punch"?395:460);if(run.current!==id)return;current=current.map((x,i)=>i===defender?{...x,hp:Math.max(0,x.hp-amount)}:x);setFighters(current);setHit(defender);setDamage(amount);setMessage(`${source.name} conecta ${kind==="punch"?"el puñetazo":"la patada"}`);await wait(kind==="punch"?500:570);setHit(null);setDamage(null);setActive(null);setAttackKind(null);if(current[defender].hp<=0)break;attacker=defender;await wait(240)}
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
        <div className="stage"><Brute side="left" variant="ragnar" attacking={active===0} attackKind={active===0?attackKind:null} hit={hit===0} defeated={fighters[0].hp===0}/><div className={`impact ${hit!==null?"show":""}`}><span>{damage}</span><i>¡PUM!</i></div><Brute side="right" variant="brakka" attacking={active===1} attackKind={active===1?attackKind:null} hit={hit===1} defeated={fighters[1].hp===0}/></div>
        <div className="floor"><div className="arena-mark">AB</div><i/><i/><i/></div>
      </div>
      <div className="commentary"><div className="announcer"><span>📣</span><div><small>EL HERALDO DE LA ARENA</small><strong aria-live="polite">{message}</strong></div></div><button onClick={fight} disabled={running}><span>{running?"⚔":"↻"}</span>{running?"Combate en curso":"Repetir combate"}</button></div>
    </section>
    <section className="feature-strip"><div><b>⚔</b><span><strong>Combate automático</strong><small>Cada duelo es diferente</small></span></div><div><b>◆</b><span><strong>Estadísticas únicas</strong><small>Fuerza contra agilidad</small></span></div><div><b>★</b><span><strong>Victoria aleatoria</strong><small>La arena decide</small></span></div></section>
    <footer><span>ARENA DE BRUTOS · PROTOTIPO JUGABLE</span><b>Hecho para la gloria</b><span>SIN REGISTRO · SIN PAGOS</span></footer>
  </main>;
}
