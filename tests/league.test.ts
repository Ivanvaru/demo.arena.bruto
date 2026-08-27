import assert from "node:assert/strict";
import test from "node:test";
import {getLeagueForLevel,leagueLabel,LEAGUE_NAMES} from "../app/game/league.ts";

test("explicit level -> label examples from the spec",()=>{
    const cases:[number,string][]=[
          [1,"Barro III"],[3,"Barro III"],[4,"Barro II"],[6,"Barro II"],[7,"Barro I"],[9,"Barro I"],
          [10,"Piedra III"],[18,"Piedra I"],
          [19,"Cobre III"],[27,"Cobre I"],
          [28,"Bronce III"],[36,"Bronce I"],
          [37,"Hierro III"],[45,"Hierro I"],
          [46,"Acero III"],[54,"Acero I"],
          [55,"Plata III"],[63,"Plata I"],
          [64,"Oro III"],[72,"Oro I"],
          [73,"Platino III"],[81,"Platino I"],
          [82,"Diamante III"],[90,"Diamante I"],
          [91,"Leyenda III"],[93,"Leyenda III"],[94,"Leyenda II"],[96,"Leyenda II"],[97,"Leyenda I"],[99,"Leyenda I"],
          [100,"Bruto Supremo"],
        ];
    for(const [level,label] of cases){
          assert.equal(leagueLabel(level),label,`level ${level}`);
    }
});

test("level 100 is Bruto Supremo with no league and no division",()=>{
    const tier=getLeagueForLevel(100);
    assert.equal(tier.label,"Bruto Supremo");
    assert.equal(tier.league,null);
    assert.equal(tier.division,null);
    assert.doesNotMatch(tier.label,/Bruto Supremo (I|II|III|null)/);
});

test("promotions land on the expected division/league boundaries",()=>{
    const promotions:[number,number,string,string][]=[
          [3,4,"Barro III","Barro II"],
          [6,7,"Barro II","Barro I"],
          [9,10,"Barro I","Piedra III"],
          [90,91,"Diamante I","Leyenda III"],
          [93,94,"Leyenda III","Leyenda II"],
          [96,97,"Leyenda II","Leyenda I"],
          [99,100,"Leyenda I","Bruto Supremo"],
        ];
    for(const [before,after,beforeLabel,afterLabel] of promotions){
          assert.equal(leagueLabel(before),beforeLabel,`level ${before}`);
          assert.equal(leagueLabel(after),afterLabel,`level ${after}`);
    }
});

test("full 1-100 sweep: shape, counts and ordering are all internally consistent",()=>{
    const byLeague=new Map<string,number[]>();
    for(let level=1;level<=100;level++){
          const tier=getLeagueForLevel(level);
          assert.equal(tier.level,level);
          if(level===100){
                  assert.equal(tier.league,null);
                  assert.equal(tier.division,null);
                  assert.equal(tier.label,"Bruto Supremo");
                  continue;
          }
          assert.ok(tier.league&&(LEAGUE_NAMES as readonly string[]).includes(tier.league),`level ${level} has a real league`);
          assert.ok(tier.division==="III"||tier.division==="II"||tier.division==="I",`level ${level} has a real division`);
          assert.equal(tier.label,`${tier.league} ${tier.division}`);
          const list=byLeague.get(tier.league!)??[];
          list.push(level);
          byLeague.set(tier.league!,list);
    }
    assert.equal(byLeague.size,11);
    for(const name of LEAGUE_NAMES){
          const levels=byLeague.get(name)!;
          assert.equal(levels.length,9,`league ${name} should hold exactly 9 levels`);
          const divisions=levels.map(l=>getLeagueForLevel(l).division);
          assert.deepEqual(divisions,["III","III","III","II","II","II","I","I","I"],`league ${name} division order`);
    }
    assert.equal(leagueLabel(99),"Leyenda I");
    assert.equal(leagueLabel(100),"Bruto Supremo");
});

test("invalid levels are rejected instead of silently producing a league",()=>{
    for(const bad of [0,-1,-100,101,1000,1.5,99.9,NaN,Infinity,-Infinity]){
          assert.throws(()=>getLeagueForLevel(bad),RangeError,`level ${bad} should be rejected`);
    }
});
