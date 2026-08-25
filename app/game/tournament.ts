import type {FighterClass} from "./engine";

/** One bracket participant. `isPlayer` marks the human's own brute so the UI
 * knows which match needs a "LUCHAR" button instead of auto-resolving. */
export type TournamentFighter={id:string;name:string;className:FighterClass;level:number;title:string;isPlayer:boolean};

export type TournamentMatch={id:string;a:TournamentFighter;b:TournamentFighter;winnerId?:string};

const ROUND_NAME_BY_SIZE:Record<number,string>={16:"Octavos",8:"Cuartos",4:"Semifinal",2:"Final"};

/** Human-readable round name for a bracket of `size` fighters (16→Octavos, ... 2→Final). */
export function roundName(size:number):string{
  return ROUND_NAME_BY_SIZE[size]??`Ronda de ${size}`;
}

/** Fisher–Yates shuffle. Takes an injectable `random` so results stay testable/deterministic if needed. */
export function shuffle<T>(items:T[],random:()=>number=Math.random):T[]{
  const copy=items.slice();
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

/** Draws a fresh set of pairings for a round: shuffles the fighters and pairs
 * them up consecutively. Fighters.length must be even (16/8/4/2). */
export function pairUp(fighters:TournamentFighter[],random:()=>number=Math.random):TournamentMatch[]{
  const shuffled=shuffle(fighters,random);
  const matches:TournamentMatch[]=[];
  for(let i=0;i<shuffled.length;i+=2){
    matches.push({id:`${shuffled[i].id}-vs-${shuffled[i+1].id}`,a:shuffled[i],b:shuffled[i+1]});
  }
  return matches;
}

/** Whether every match in the round already has a winner recorded. */
export function roundResolved(matches:TournamentMatch[]):boolean{
  return matches.every(match=>match.winnerId!==undefined);
}

/** Pulls the winners out of a fully-resolved round, in no particular order. */
export function collectWinners(matches:TournamentMatch[]):TournamentFighter[]{
  return matches.map(match=>match.winnerId===match.a.id?match.a:match.b);
}
