export type FighterClass="Luchador"|"Aventurero"|"Atleta"|"Coloso";
export type StatKey="strength"|"speed"|"agility"|"resistance"|"precision"|"luck";
export type Stats=Record<StatKey,number>;
export type AttackKind="punch"|"kick"|"heavy"|"combo";
export type Outcome="hit"|"dodge"|"block"|"perfect-block";

export type FighterProfile={id:string;name:string;title:string;className:FighterClass;level:number;stats:Stats;stat:string};
export type BattleFighter=FighterProfile&{hp:number;maxHp:number};
export type BattleTurn={actor:0|1;target:0|1;attack:AttackKind;outcome:Outcome;damage:number;hpAfter:number;critical:boolean;knockback:boolean;knockdown:boolean;stun:boolean;counter:boolean;hits:number};
export type BattleResult={seed:number;fighters:[BattleFighter,BattleFighter];turns:BattleTurn[];winner:0|1};

export const CLASS_TEMPLATES:Record<FighterClass,{stats:Stats;title:string}>={
  Luchador:{title:"El combatiente",stats:{strength:5,speed:3,agility:3,resistance:5,precision:3,luck:2}},
  Aventurero:{title:"El imprevisible",stats:{strength:3,speed:4,agility:4,resistance:4,precision:5,luck:5}},
  Atleta:{title:"La centella",stats:{strength:2,speed:5,agility:5,resistance:3,precision:4,luck:2}},
  Coloso:{title:"El rompefilas",stats:{strength:6,speed:2,agility:1,resistance:6,precision:3,luck:2}},
};

export const CLASS_NAMES:FighterClass[]=["Luchador","Aventurero","Atleta","Coloso"];
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const mulberry32=(seed:number)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const weighted=<T,>(rng:()=>number,items:Array<[T,number]>)=>{const total=items.reduce((n,x)=>n+x[1],0);let roll=rng()*total;for(const[item,weight]of items){roll-=weight;if(roll<=0)return item}return items.at(-1)![0]};

export function makeProfile(name:string,className:FighterClass,level=1):FighterProfile{
  const base=CLASS_TEMPLATES[className];
  return{id:`${name}-${className}`,name,title:base.title,className,level,stats:{...base.stats},stat:`Nivel ${level} · ${className}`};
}

export function maxHp(f:FighterProfile){return Math.round(80+f.level*2.2+f.stats.resistance*4.2)}
const attackName:Record<AttackKind,string>={punch:"puñetazo",kick:"patada",heavy:"golpe fuerte",combo:"combo"};
export const describeAttack=(attack:AttackKind)=>attackName[attack];

export function simulateBattle(left:FighterProfile,right:FighterProfile,seed=(Date.now()^Math.floor(Math.random()*2**31))>>>0):BattleResult{
  const rng=mulberry32(seed);
  const fighters:[BattleFighter,BattleFighter]=[left,right].map(f=>({...f,maxHp:maxHp(f),hp:maxHp(f)})) as [BattleFighter,BattleFighter];
  const next=[rng()*18,rng()*18];
  const stunned=[0,0],turns:BattleTurn[]=[];
  let guard=0;

  const resolve=(actor:0|1,target:0|1,forcedCounter=false)=>{
    const a=fighters[actor],d=fighters[target],as=a.stats,ds=d.stats;
    const attack=forcedCounter?"punch":weighted<AttackKind>(rng,[["punch",38],["kick",27+as.agility],["heavy",12+as.strength],["combo",8+as.speed]]);
    const costs:Record<AttackKind,number>={punch:100,kick:116,heavy:142,combo:132};
    let outcome:Outcome="hit",damage=0,hits=1,critical=false,knockback=false,knockdown=false,stun=false,counter=false;
    {
      const dodge=clamp(.06+(ds.agility-as.precision)*.022,.02,.32);
      const block=clamp(.08+(ds.resistance-as.strength)*.014,.03,.28);
      const defenseRoll=rng();
      if(defenseRoll<dodge)outcome="dodge";
      else if(defenseRoll<dodge+block)outcome=rng()<clamp(.012+ds.luck*.004,.012,.06)?"perfect-block":"block";
      if(outcome==="hit"||outcome==="block"){
        hits=attack==="combo"?2+(rng()<clamp(as.speed*.035,.08,.45)?1:0):1;
        const power={punch:8.5,kick:9.8,heavy:13.2,combo:5.1}[attack];
        const variance=.9+rng()*.2;
        const critChance=clamp(.025+as.luck*.007+as.strength*.002,.03,.22);
        critical=rng()<critChance;
        const lateFightBoost=turns.length>18?1+Math.min(.75,(turns.length-18)*.08):1;
        damage=Math.max(1,Math.round(power*1.27*lateFightBoost*(1+as.strength*.038)*variance*hits*(critical?1.62:1)));
        if(outcome==="block")damage=Math.max(1,Math.round(damage*.22));
        d.hp=Math.max(0,d.hp-damage);
        knockback=critical||damage>=d.maxHp*.16;
        knockdown=d.hp>0&&rng()<clamp(.012+(as.strength-ds.resistance)*.006+(attack==="heavy"?.045:0)+(critical?.035:0),.005,.14);
        stun=d.hp>0&&!knockdown&&rng()<clamp(.003+(as.strength-ds.resistance)*.002+(critical?.018:0),.002,.05);
        if(knockdown)stunned[target]=Math.max(stunned[target],78/(1+ds.agility*.045));
        if(stun)stunned[target]=Math.max(stunned[target],52/(1+ds.speed*.035));
      }
      counter=d.hp>0&&(outcome==="dodge"||outcome==="block"||outcome==="perfect-block")&&rng()<clamp(.1+ds.agility*.018+ds.speed*.009,.12,.42);
    }
    turns.push({actor,target,attack,outcome,damage,hpAfter:d.hp,critical,knockback,knockdown,stun,counter,hits});
    next[actor]+=costs[attack]/(1+as.speed*.105)+(forcedCounter?18:0);
    if(outcome==="block")next[target]+=rng()<.5?12:28;
    if(outcome==="dodge")next[target]+=rng()<.65?0:16;
    if(counter&&turns.length<48)resolve(target,actor,true);
  };

  while(fighters[0].hp>0&&fighters[1].hp>0&&guard++<64){
    const actor=(next[0]<=next[1]?0:1) as 0|1,target=(actor===0?1:0) as 0|1;
    if(stunned[actor]>0){next[actor]+=stunned[actor];stunned[actor]=0;continue}
    resolve(actor,target);
  }
  const winner=(fighters[0].hp>fighters[1].hp?0:1) as 0|1;
  const loser=(winner===0?1:0) as 0|1;
  // Salvaguarda extrema: si se alcanza el límite técnico, el desenlace también
  // queda registrado como una acción visible y reproducible por la interfaz.
  if(fighters[loser].hp>0){
    const damage=fighters[loser].hp;
    fighters[loser].hp=0;
    turns.push({actor:winner,target:loser,attack:"heavy",outcome:"hit",damage,hpAfter:0,critical:false,knockback:true,knockdown:true,stun:false,counter:false,hits:1});
  }
  return{seed,fighters,turns,winner};
}
