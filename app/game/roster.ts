import type {FighterClass} from "./engine";

export type RivalCard={id:string;name:string;className:FighterClass;level:number;epithet:string};

/** 16 named rivals (4 per class) — enough to fill a 16-brute tournament bracket
 * without repeats. The original 4 (drago/kairos/brakka/grom) are kept as-is so
 * the existing exhibition picker (`pickRival`) behaves exactly like before. */
export const RIVAL_ROSTER:RivalCard[]=[
  {id:"drago",name:"Drago",className:"Luchador",level:1,epithet:"El puño de hierro"},
  {id:"vulkan",name:"Vulkan",className:"Luchador",level:1,epithet:"El yunque"},
  {id:"torvo",name:"Torvo",className:"Luchador",level:1,epithet:"El demoledor"},
  {id:"ronin",name:"Ronin",className:"Luchador",level:1,epithet:"La sombra veloz"},
  {id:"kairos",name:"Kairos",className:"Aventurero",level:1,epithet:"El imprevisible"},
  {id:"nix",name:"Nix",className:"Aventurero",level:1,epithet:"La cazadora"},
  {id:"fenrik",name:"Fenrik",className:"Aventurero",level:1,epithet:"El lobo errante"},
  {id:"sable",name:"Sable",className:"Aventurero",level:1,epithet:"El as de espadas"},
  {id:"brakka",name:"Brakka",className:"Atleta",level:1,epithet:"La centella"},
  {id:"zephyra",name:"Zephyra",className:"Atleta",level:1,epithet:"El viento fugaz"},
  {id:"kestra",name:"Kestra",className:"Atleta",level:1,epithet:"La flecha"},
  {id:"rayo",name:"Rayo",className:"Atleta",level:1,epithet:"El relámpago humano"},
  {id:"grom",name:"Grom",className:"Coloso",level:1,epithet:"El rompefilas"},
  {id:"boulder",name:"Boulder",className:"Coloso",level:1,epithet:"La montaña"},
  {id:"krag",name:"Krag",className:"Coloso",level:1,epithet:"El inquebrantable"},
  {id:"thog",name:"Thog",className:"Coloso",level:1,epithet:"El machaca huesos"},
];

export function pickRival(previousId:string|null,random:()=>number=Math.random){
  const available=RIVAL_ROSTER.filter(rival=>rival.id!==previousId);
  return available[Math.min(available.length-1,Math.floor(random()*available.length))];
}
