import type {FighterClass} from "./engine";

export type RivalCard={id:string;name:string;className:FighterClass;level:number;epithet:string};

export const RIVAL_ROSTER:RivalCard[]=[
  {id:"drago",name:"Drago",className:"Luchador",level:1,epithet:"El puño de hierro"},
  {id:"kairos",name:"Kairos",className:"Aventurero",level:1,epithet:"El imprevisible"},
  {id:"brakka",name:"Brakka",className:"Atleta",level:1,epithet:"La centella"},
  {id:"grom",name:"Grom",className:"Coloso",level:1,epithet:"El rompefilas"},
];

export function pickRival(previousId:string|null,random:()=>number=Math.random){
  const available=RIVAL_ROSTER.filter(rival=>rival.id!==previousId);
  return available[Math.min(available.length-1,Math.floor(random()*available.length))];
}
