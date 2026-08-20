import assert from "node:assert/strict";
import test from "node:test";
import {CLASS_NAMES,makeProfile,simulateBattle} from "../app/game/engine.ts";
import {pickRival,RIVAL_ROSTER} from "../app/game/roster.ts";

test("a seed always produces the same combat",()=>{
  const left=makeProfile("Ragnar","Luchador"),right=makeProfile("Brakka","Atleta");
  assert.deepEqual(simulateBattle(left,right,43821),simulateBattle(left,right,43821));
});

test("every combat has one defeated fighter and no draw",()=>{
  for(let seed=1;seed<=250;seed++){
    const result=simulateBattle(makeProfile("Ragnar","Luchador"),makeProfile("Grom","Coloso"),seed);
    assert.equal(result.fighters.filter(f=>f.hp===0).length,1);
    assert.ok(result.turns.length>0&&result.turns.length<=65);
    assert.equal(result.fighters[result.winner].hp>0,true);
    assert.equal(result.turns.at(-1)?.hpAfter,0);
  }
});

test("the engine generates the agreed combat variety",()=>{
  const seen=new Set<string>();let consecutive=false;
  for(let seed=300;seed<500;seed++){
    const result=simulateBattle(makeProfile("Lyn","Atleta"),makeProfile("Ragnar","Luchador"),seed);
    result.turns.forEach(t=>{seen.add(t.attack);seen.add(t.outcome);if(t.critical)seen.add("critical");if(t.knockdown)seen.add("knockdown");if(t.stun)seen.add("stun");if(t.counter)seen.add("counter")});
    consecutive ||= result.turns.some((t,i)=>i>0&&result.turns[i-1].actor===t.actor);
  }
  ["punch","kick","heavy","combo","hit","dodge","block","critical","counter"].forEach(value=>assert.equal(seen.has(value),true,`missing ${value}`));
  assert.equal(consecutive,true);
});

test("attacks always end in a hit, block or dodge",()=>{
  const valid=new Set(["hit","dodge","block","perfect-block"]);
  for(let seed=700;seed<950;seed++){
    const result=simulateBattle(makeProfile("A","Aventurero"),makeProfile("B","Atleta"),seed);
    result.turns.forEach(turn=>assert.equal(valid.has(turn.outcome),true));
  }
});

test("the initial classes remain competitive",()=>{
  for(const leftClass of CLASS_NAMES){
    for(const rightClass of CLASS_NAMES){
      let wins=0;
      for(let seed=1;seed<=400;seed++)wins+=simulateBattle(makeProfile("A",leftClass),makeProfile("B",rightClass),seed).winner===0?1:0;
      const rate=wins/400;
      assert.ok(rate>.35&&rate<.65,`${leftClass} vs ${rightClass}: ${rate}`);
    }
  }
});

test("the rival roster contains four distinct names and classes",()=>{
  assert.equal(RIVAL_ROSTER.length,4);
  assert.equal(new Set(RIVAL_ROSTER.map(rival=>rival.name)).size,4);
  assert.equal(new Set(RIVAL_ROSTER.map(rival=>rival.className)).size,4);
});

test("new rival never repeats the current opponent",()=>{
  for(const current of RIVAL_ROSTER){
    for(const roll of [0,.25,.5,.75,.999])assert.notEqual(pickRival(current.id,()=>roll).id,current.id);
  }
});
