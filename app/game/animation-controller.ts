export type MotionName="idle"|"punch"|"kick"|"block"|"perfect-block"|"dodge"|"hit"|"critical"|"defeat";

export type Pose={x?:number;y?:number;r?:number;sx?:number;sy?:number;advance?:number};
export type MotionKey={t:number;pose:Pose};
export type MotionTrack={selector:"root"|string;keys:MotionKey[]};
export type MotionDefinition={duration:number;contact:number;loop?:boolean;tracks:MotionTrack[]};

const k=(t:number,pose:Pose):MotionKey=>({t,pose});
const track=(selector:MotionTrack["selector"],keys:MotionKey[]):MotionTrack=>({selector,keys});

export const MOTIONS:Record<MotionName,MotionDefinition>={
  idle:{duration:3200,contact:0,loop:true,tracks:[
    track(".skeleton-character-rig",[k(0,{y:0,r:-.12}),k(.5,{y:-3,r:.12}),k(1,{y:0,r:-.12})]),
    track(".bone-core",[k(0,{y:0,sy:1}),k(.52,{y:-3,sx:1.004,sy:1.009}),k(1,{y:0,sy:1})]),
    track(".bone-head",[k(0,{r:-.4}),k(.5,{r:.7,y:-1}),k(1,{r:-.4})]),
    track(".bone-upper-arm-izq",[k(0,{r:.6}),k(.52,{r:-1}),k(1,{r:.6})]),
    track(".bone-upper-arm-der",[k(0,{r:-.5}),k(.52,{r:.8}),k(1,{r:-.5})])]},
  punch:{duration:1250,contact:700,tracks:[
    // Superman punch: carga, amago de rodilla, vuelo, impacto y aterrizaje.
    track("root",[k(0,{}),k(.08,{x:-4,y:3,r:.6}),k(.18,{x:-9,y:7,r:1.5}),k(.3,{advance:.18,y:-20,r:-1}),k(.43,{advance:.55,y:-43,r:-1.8}),k(.56,{advance:1,y:-28,r:-2.8}),k(.62,{advance:1,y:-26,r:-2.3}),k(.74,{advance:.78,y:-24,r:.7}),k(.86,{advance:.3,y:-17,r:1.1}),k(.94,{advance:.04,y:4,r:-.5}),k(1,{})]),
    track(".shadow",[k(0,{}),k(.18,{x:-3,sx:.94,sy:.9}),k(.43,{advance:.2,sx:.72,sy:.58}),k(.6,{advance:.42,sx:.66,sy:.52}),k(.82,{advance:.18,sx:.8,sy:.68}),k(.94,{sx:1.08,sy:.92}),k(1,{})]),
    track(".bone-core",[k(0,{}),k(.1,{x:-3,y:2,r:1}),k(.2,{x:-10,y:7,r:5}),k(.34,{x:-7,y:1,r:2}),k(.47,{x:7,y:-7,r:-4}),k(.56,{x:23,y:-9,r:-11}),k(.64,{x:25,y:-8,r:-11}),k(.76,{x:11,y:-4,r:-4}),k(.9,{x:1,y:4,r:2}),k(1,{})]),
    track(".bone-neck",[k(0,{}),k(.2,{r:-1}),k(.48,{r:2}),k(.58,{x:3,r:4}),k(.7,{r:2}),k(1,{})]),
    track(".bone-head",[k(0,{}),k(.2,{x:-2,y:2,r:-3}),k(.4,{x:-1,y:-2,r:-1}),k(.56,{x:5,y:0,r:7}),k(.64,{x:5,y:0,r:7}),k(.78,{x:2,r:2}),k(.94,{y:3,r:-2}),k(1,{})]),
    track(".bone-upper-arm-izq",[k(0,{}),k(.18,{r:21}),k(.34,{r:12}),k(.46,{r:-18}),k(.53,{r:-48}),k(.56,{x:2,y:-1,r:-72}),k(.64,{x:2,y:-1,r:-72}),k(.74,{r:-38}),k(.86,{r:-9}),k(1,{})]),
    track(".bone-forearm-izq",[k(0,{}),k(.18,{r:24}),k(.38,{r:31}),k(.48,{r:22}),k(.53,{r:11}),k(.56,{r:4}),k(.64,{r:4}),k(.74,{r:19}),k(.86,{r:7}),k(1,{})]),
    track(".bone-hand-izq",[k(0,{}),k(.46,{r:-2}),k(.56,{r:-8,sx:1.045,sy:1.045}),k(.64,{r:-8,sx:1.045,sy:1.045}),k(.74,{r:-3,sx:1.015,sy:1.015}),k(1,{})]),
    track(".bone-upper-arm-der",[k(0,{}),k(.2,{r:-12}),k(.38,{r:25}),k(.56,{r:48}),k(.67,{r:48}),k(.8,{r:22}),k(1,{})]),
    track(".bone-forearm-der",[k(0,{}),k(.22,{r:-18}),k(.4,{r:-48}),k(.56,{r:-66}),k(.68,{r:-66}),k(.82,{r:-28}),k(1,{})]),
    track(".bone-hand-der",[k(0,{}),k(.4,{r:-8}),k(.56,{x:-2,y:-2,r:-13}),k(.7,{r:-10}),k(1,{})]),
    track(".bone-thigh-der",[k(0,{}),k(.12,{r:6}),k(.26,{x:2,y:-3,r:-28}),k(.4,{x:4,y:-8,r:-53}),k(.5,{r:-24}),k(.56,{x:-4,y:3,r:31}),k(.68,{x:-5,y:5,r:38}),k(.8,{r:19}),k(.94,{r:-5}),k(1,{})]),
    track(".bone-shin-der",[k(0,{}),k(.2,{r:20}),k(.34,{r:58}),k(.44,{r:72}),k(.54,{r:34}),k(.62,{r:18}),k(.72,{r:29}),k(.86,{r:12}),k(1,{})]),
    track(".bone-foot-der",[k(0,{}),k(.28,{r:12}),k(.44,{r:22}),k(.6,{r:34}),k(.76,{r:17}),k(.92,{r:-5}),k(1,{})]),
    track(".bone-thigh-izq",[k(0,{}),k(.16,{x:-3,y:3,r:9}),k(.3,{r:4}),k(.5,{x:-2,y:1,r:-7}),k(.68,{r:-5}),k(.82,{x:3,y:-1,r:-12}),k(.94,{x:1,y:4,r:7}),k(1,{})]),
    track(".bone-shin-izq",[k(0,{}),k(.18,{r:-9}),k(.34,{r:-3}),k(.56,{r:7}),k(.76,{r:13}),k(.9,{r:-12}),k(1,{})]),
    track(".bone-foot-izq",[k(0,{}),k(.18,{r:-5}),k(.48,{r:9}),k(.72,{r:13}),k(.88,{r:-10}),k(.96,{r:4}),k(1,{})])]},
  critical:{duration:1250,contact:700,tracks:[]},
  kick:{duration:1260,contact:690,tracks:[
    track("root",[k(0,{}),k(.09,{x:-6,y:5,r:1.3}),k(.23,{advance:.18,y:-25,r:-2}),k(.44,{advance:.82,y:-13}),k(.55,{advance:1,y:-3,r:-.6}),k(.64,{advance:1,y:-3,r:-.6}),k(.75,{advance:.82,y:-16,r:.8}),k(.9,{advance:.18,y:-8}),k(1,{})]),
    track(".bone-core",[k(0,{}),k(.15,{x:-4,y:2,r:-2}),k(.28,{x:-10,y:-4,r:-6}),k(.45,{x:5,y:-18,r:10}),k(.64,{x:5,y:-18,r:10}),k(.77,{x:2,y:-8,r:4}),k(1,{})]),
    track(".bone-head",[k(0,{}),k(.28,{r:2}),k(.48,{x:-2,y:-3,r:-8}),k(.65,{x:-2,y:-3,r:-8}),k(1,{})]),
    track(".bone-thigh-izq",[k(0,{}),k(.18,{r:-8}),k(.32,{r:-36}),k(.45,{r:-62}),k(.55,{r:-76}),k(.65,{r:-76}),k(.76,{r:-50}),k(1,{})]),
    track(".bone-shin-izq",[k(0,{}),k(.18,{r:12}),k(.32,{r:55}),k(.45,{r:29}),k(.55,{r:4}),k(.65,{r:4}),k(.76,{r:34}),k(1,{})]),
    track(".bone-foot-izq",[k(0,{}),k(.32,{r:10}),k(.5,{r:-8}),k(.66,{r:-8}),k(1,{})]),
    track(".bone-thigh-der",[k(0,{}),k(.25,{x:-4,y:3,r:7}),k(.7,{x:-4,y:3,r:7}),k(1,{})]),
    track(".bone-upper-arm-izq",[k(0,{}),k(.3,{r:29}),k(.68,{r:29}),k(1,{})]),
    track(".bone-upper-arm-der",[k(0,{}),k(.3,{r:-25}),k(.68,{r:-25}),k(1,{})])]},
  block:{duration:620,contact:290,tracks:[
    track(".bone-core",[k(0,{}),k(.24,{x:-7,y:5,r:4}),k(.7,{x:-7,y:5,r:4}),k(1,{})]),
    track(".bone-upper-arm-izq",[k(0,{}),k(.24,{r:-54}),k(.7,{r:-54}),k(1,{})]),
    track(".bone-forearm-izq",[k(0,{}),k(.24,{r:-48}),k(.7,{r:-48}),k(1,{})]),
    track(".bone-upper-arm-der",[k(0,{}),k(.24,{r:42}),k(.7,{r:42}),k(1,{})]),
    track(".bone-thigh-der",[k(0,{}),k(.24,{x:-3,y:2,r:5}),k(.7,{x:-3,y:2,r:5}),k(1,{})])]},
  "perfect-block":{duration:720,contact:320,tracks:[]},
  dodge:{duration:680,contact:330,tracks:[
    track(".skeleton-character-rig",[k(0,{}),k(.24,{x:-25,y:-12,r:-8}),k(.68,{x:-25,y:-12,r:-8}),k(1,{})]),
    track(".bone-core",[k(0,{}),k(.24,{x:-8,y:-2,r:-9}),k(.68,{x:-8,y:-2,r:-9}),k(1,{})]),
    track(".bone-thigh-der",[k(0,{}),k(.25,{x:-4,y:3,r:8}),k(.7,{x:-4,y:3,r:8}),k(1,{})]),
    track(".bone-thigh-izq",[k(0,{}),k(.25,{r:-5}),k(.7,{r:-5}),k(1,{})])]},
  hit:{duration:520,contact:120,tracks:[
    track(".skeleton-character-rig",[k(0,{}),k(.24,{x:-20,r:6}),k(.58,{x:7,r:-2}),k(.8,{x:-2}),k(1,{})]),
    track(".bone-core",[k(0,{}),k(.24,{x:-8,y:2,r:8}),k(.58,{r:-2}),k(1,{})]),
    track(".bone-head",[k(0,{}),k(.24,{x:-7,y:-3,r:17}),k(.58,{r:-4}),k(1,{})]),
    track(".bone-upper-arm-izq",[k(0,{}),k(.25,{r:16}),k(.6,{r:-5}),k(1,{})]),
    track(".bone-upper-arm-der",[k(0,{}),k(.25,{r:-14}),k(.6,{r:4}),k(1,{})])]},
  defeat:{duration:1050,contact:180,tracks:[
    track(".skeleton-character-rig",[k(0,{}),k(.18,{x:-5,y:-4,r:3}),k(.45,{x:-20,y:2,r:12}),k(.75,{x:-34,y:17,r:24}),k(1,{x:-40,y:22,r:78,sy:.96})]),
    track(".bone-thigh-der",[k(0,{}),k(.45,{r:8}),k(.72,{r:28}),k(1,{r:48})]),
    track(".bone-thigh-izq",[k(0,{}),k(.45,{r:-5}),k(.72,{r:-19}),k(1,{r:-32})]),
    track(".bone-upper-arm-izq",[k(0,{}),k(.55,{r:-18}),k(1,{r:-42})]),
    track(".bone-upper-arm-der",[k(0,{}),k(.55,{r:16}),k(1,{r:35})])]},
};

MOTIONS.critical={...MOTIONS.punch};
MOTIONS["perfect-block"]={...MOTIONS.block,duration:720,contact:320};

type PoseField=keyof Pose;
const poseValue=(key:MotionKey|undefined,field:PoseField,fallback:number)=>key?.pose[field]??fallback;
// Continuous velocity between poses avoids a visible brake at each keyframe.
const spline=(p0:number,p1:number,p2:number,p3:number,t:number)=>{const t2=t*t,t3=t2*t;return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3)};
const interpolate=(keys:MotionKey[],index:number,field:PoseField,t:number,fallback:number)=>spline(poseValue(keys[index-1]??keys[index],field,fallback),poseValue(keys[index],field,fallback),poseValue(keys[index+1],field,fallback),poseValue(keys[index+2]??keys[index+1],field,fallback),t);
export function poseAt(keys:MotionKey[],progress:number):Pose{
  if(progress<=keys[0].t)return keys[0].pose;if(progress>=keys[keys.length-1].t)return keys[keys.length-1].pose;
  let index=0;while(index<keys.length-1&&progress>keys[index+1].t)index++;
  const a=keys[index],b=keys[index+1],t=Math.max(0,Math.min(1,(progress-a.t)/(b.t-a.t)));
  return{x:interpolate(keys,index,"x",t,0),y:interpolate(keys,index,"y",t,0),r:interpolate(keys,index,"r",t,0),sx:interpolate(keys,index,"sx",t,1),sy:interpolate(keys,index,"sy",t,1),advance:interpolate(keys,index,"advance",t,0)};
}

export function poseTransform(pose:Pose,advanceDistance:number){const x=(pose.x??0)+(pose.advance??0)*advanceDistance;return `translate(${x}px,${pose.y??0}px) rotate(${pose.r??0}deg) scale(${pose.sx??1},${pose.sy??1})`;}
