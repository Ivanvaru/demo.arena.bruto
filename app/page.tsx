"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import {CLASS_NAMES,CLASS_ABILITIES,describeAttack,makeProfile,maxHp,simulateBattle,type AttackKind as EngineAttack,type BattleFighter,type FighterClass,type Outcome} from "./game/engine";
import {pickRival,RIVAL_ROSTER,type RivalCard} from "./game/roster";
import rigDefinition from "./game/rig.json";
import {motionTiming,REACTION_TIMINGS} from "./game/motion";
import {MOTIONS,poseAt,poseTransform,type MotionName} from "./game/animation-controller";
import {DEFAULT_OUTFIT,loadOutfit,saveOutfit,HAIR_STYLES,HAIR_COLORS,type Outfit} from "./game/wardrobe";
import {DEFAULT_IDENTITY,loadIdentity,saveIdentity,SKIN_TONES,DEFAULT_SKIN_TONE_ID,EYE_STYLES,EYE_COLORS,EYEBROW_STYLES,CLASS_CLOTHING,CLASS_BODY_TEXTURE,CLASS_DRESSED_TEXTURE,DEFAULT_BODY_TEXTURE,FACE_PLACEHOLDER_GEOMETRY,resolveFaceAppearance,type PlayerIdentity,type FaceAppearance} from "./game/character";
import {xpToNextLevel,xpReward,applyXpGain} from "./game/leveling";
import {shuffle,pairUp,roundName,roundResolved,collectWinners,type TournamentFighter,type TournamentMatch} from "./game/tournament";

/** Shape returned by the API for the logged-in user's saved character (see db/schema.ts). */
type SavedCharacter={name:string;className:FighterClass;level:number;xp:number;wins:number;losses:number;hairStyle:string;hairColor:string;skinToneId:string;eyeStyleId:string;eyeColor:string;eyebrowStyleId:string};
type AuthResponse={username:string;character:SavedCharacter|null;error?:string};

type AttackKind="punch"|"kick";
type DefenseReaction="dodge"|"block"|"perfect-block";
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const fresh=(name:string,className:FighterClass,level=1):BattleFighter=>{const profile=makeProfile(name,className,level);const life=maxHp(profile);return{...profile,hp:life,maxHp:life}};
const INITIAL:[BattleFighter,BattleFighter]=[fresh("Ragnar","Luchador"),fresh("Brakka","Atleta")];
/** Instantly resolves every match in a round that doesn't involve the player —
 * only the player's own match gets the full animated treatment. */
function resolveAiMatches(matches:TournamentMatch[]):TournamentMatch[]{
  return matches.map(match=>{
    if(match.a.isPlayer||match.b.isPlayer)return match;
    const result=simulateBattle(makeProfile(match.a.name,match.a.className,match.a.level),makeProfile(match.b.name,match.b.className,match.b.level));
    return{...match,winnerId:result.winner===0?match.a.id:match.b.id};
  });
}
const CHARACTER_RIG_SVG="/characters/base-normal/personaje-43-capas.svg";
type RigLayer={id:string;file:string;parent:string;z_index:number;canvas_position:{x:number;y:number};size:{width:number;height:number};pivot_global:{x:number;y:number};pivot_local:{x:number;y:number}};
const RIG_CANVAS=rigDefinition.canvas;
const RIG_LAYERS=(rigDefinition.layers as RigLayer[]).slice().sort((a,b)=>a.z_index-b.z_index);
function CharacterLayer({id,className=""}:{id:string;className?:string}){return <g className={`svg-part part-${id} ${className}`}><use href={`${CHARACTER_RIG_SVG}#${id}`}/></g>}

function LayeredCharacterRig(){return <div className="layered-character-rig" data-layer-count={RIG_LAYERS.length}><img className="rig-composite-base" src="/characters/base-normal/verificacion/montaje.png" alt="" draggable={false}/>{RIG_LAYERS.map(layer=><img key={layer.id} className={`rig-part rig-part-${layer.id}`} data-part={layer.id} data-parent={layer.parent} src={`/characters/base-normal/${layer.file}`} alt="" draggable={false} style={{left:`${layer.canvas_position.x/RIG_CANVAS.width*100}%`,top:`${layer.canvas_position.y/RIG_CANVAS.height*100}%`,width:`${layer.size.width/RIG_CANVAS.width*100}%`,height:`${layer.size.height/RIG_CANVAS.height*100}%`,zIndex:layer.z_index+1,transformOrigin:`${layer.pivot_local.x/layer.size.width*100}% ${layer.pivot_local.y/layer.size.height*100}%`}}/>)}</div>}

function SvgCharacterRig(){
  const instance=useId().replace(/[^a-zA-Z0-9_-]/g,"");
  const baseId=`character-base-${instance}`;
  return <div className="svg-character-rig rig-ready" data-layer-count={RIG_LAYERS.length}><svg className="character-rig-svg" viewBox={`0 0 ${RIG_CANVAS.width} ${RIG_CANVAS.height}`} role="presentation"><defs><image id={baseId} href="/characters/active/montaje-verificacion.png" x="0" y="0" width={RIG_CANVAS.width} height={RIG_CANVAS.height} preserveAspectRatio="none"/>{RIG_LAYERS.map(layer=><clipPath key={layer.id} id={`clip-${layer.id}-${instance}`} clipPathUnits="userSpaceOnUse"><rect x={layer.canvas_position.x} y={layer.canvas_position.y} width={layer.size.width} height={layer.size.height}/></clipPath>)}</defs><g data-rig="43-capas">{RIG_LAYERS.map(layer=><g key={layer.id} className={`rig-svg-part rig-part-${layer.id}`} data-part={layer.id} data-parent={layer.parent} clipPath={`url(#clip-${layer.id}-${instance})`} style={{transformOrigin:`${layer.pivot_global.x}px ${layer.pivot_global.y}px`}}><use href={`#${baseId}`}/></g>)}</g></svg></div>;
}

const LAYER_BY_ID=new Map(RIG_LAYERS.map(layer=>[layer.id,layer]));
function RigImage({id,instance,baseId}:{id:string;instance:string;baseId:string}){return <g className={`skeleton-art art-${id}`} data-part={id} clipPath={`url(#skeleton-clip-${id}-${instance})`}><use href={`#${baseId}`}/></g>}
/** Simple colored patch clipped to an existing rig layer's bounding box. Used to render
 * placeholder clothing/hair (no dedicated art yet) that still follows the skeleton animation,
 * since it reuses the same clip-path as the body part it sits on top of. */
function RigColorPatch({id,instance,color,inset=6,radius=10}:{id:string;instance:string;color:string;inset?:number;radius?:number}){
  const layer=LAYER_BY_ID.get(id);
  if(!layer)return null;
  const width=Math.max(0,layer.size.width-inset*2);
  const height=Math.max(0,layer.size.height-inset*2);
  return <rect className="skeleton-cloth" data-cloth-part={id} x={layer.canvas_position.x+inset} y={layer.canvas_position.y+inset} width={width} height={height} rx={radius} fill={color} clipPath={`url(#skeleton-clip-${id}-${instance})`}/>;
}
function Bone({name,pivot,children}:{name:string;pivot:{x:number;y:number};children:ReactNode}){return <g className={`skeleton-bone bone-${name}`} style={{transformOrigin:`${pivot.x}px ${pivot.y}px`}}>{children}</g>}
function limbPivot(id:string){return LAYER_BY_ID.get(id)!.pivot_global}
function ArmChain({side,instance,baseId,glovesColor}:{side:"izq"|"der";instance:string;baseId:string;glovesColor?:string|null}){
  const part=(id:string)=><RigImage id={id} instance={instance} baseId={baseId}/>;
  const patch=(id:string,inset?:number,radius?:number)=>glovesColor?<RigColorPatch id={id} instance={instance} color={glovesColor} inset={inset} radius={radius}/>:null;
  return <Bone name={`upper-arm-${side}`} pivot={limbPivot(`hombro_${side}`)}>{part(`clavicula_${side}`)}{part(`hombro_${side}`)}{part(`brazo_${side}_superior`)}{part(`codo_${side}`)}<Bone name={`forearm-${side}`} pivot={limbPivot(`codo_${side}`)}>{part(`antebrazo_${side}`)}{part(`muneca_${side}`)}<Bone name={`hand-${side}`} pivot={limbPivot(`muneca_${side}`)}>{part(`mano_${side}`)}{part(`dedos_${side}`)}{patch(`mano_${side}`,4,16)}{patch(`dedos_${side}`,3,10)}</Bone></Bone></Bone>;
}
function LegChain({side,instance,baseId,pantsColor,bootsColor}:{side:"izq"|"der";instance:string;baseId:string;pantsColor?:string|null;bootsColor?:string|null}){
  const part=(id:string)=><RigImage id={id} instance={instance} baseId={baseId}/>;
  const pantsPatch=(id:string)=>pantsColor?<RigColorPatch id={id} instance={instance} color={pantsColor} inset={6}/>:null;
  const bootPatch=(id:string,inset?:number,radius?:number)=>bootsColor?<RigColorPatch id={id} instance={instance} color={bootsColor} inset={inset} radius={radius}/>:null;
  return <Bone name={`thigh-${side}`} pivot={limbPivot(`cadera_${side}`)}>{part(`cadera_${side}`)}{part(`muslo_${side}_superior`)}{part(`muslo_${side}_inferior`)}{pantsPatch(`muslo_${side}_superior`)}{pantsPatch(`muslo_${side}_inferior`)}{part(`rodilla_${side}`)}<Bone name={`shin-${side}`} pivot={limbPivot(`rodilla_${side}`)}>{part(`pantorrilla_${side}_superior`)}{part(`pantorrilla_${side}_inferior`)}{pantsPatch(`pantorrilla_${side}_superior`)}{pantsPatch(`pantorrilla_${side}_inferior`)}{part(`tobillo_${side}`)}{bootPatch(`tobillo_${side}`,4,8)}<Bone name={`foot-${side}`} pivot={limbPivot(`tobillo_${side}`)}>{part(`pie_${side}`)}{part(`dedos_pie_${side}`)}{bootPatch(`pie_${side}`,4,14)}{bootPatch(`dedos_pie_${side}`,3,10)}</Bone></Bone></Bone>;
}
/** Placeholder eyes/eyebrows drawn from simple geometry (see FACE_PLACEHOLDER_GEOMETRY).
 * Swap for real <image> layers once the corresponding art exists — the asset path each
 * style expects is already recorded on EYE_STYLES/EYEBROW_STYLES in game/character.ts. */
function FacePlaceholder({instance,face}:{instance:string;face:FaceAppearance}){
  const g=FACE_PLACEHOLDER_GEOMETRY;
  const clip=`url(#skeleton-clip-rostro_mandibula-${instance})`;
  return <g className="skeleton-face-placeholder" clipPath={clip}>
    <ellipse cx={g.eyeCenterX-g.eyeOffsetX} cy={g.eyeCenterY} rx={face.eye.rx} ry={face.eye.ry} fill={face.eyeColor}/>
    <ellipse cx={g.eyeCenterX+g.eyeOffsetX} cy={g.eyeCenterY} rx={face.eye.rx} ry={face.eye.ry} fill={face.eyeColor}/>
    <rect x={g.eyeCenterX-g.eyeOffsetX-face.eyebrow.width/2} y={g.eyebrowCenterY-face.eyebrow.height/2} width={face.eyebrow.width} height={face.eyebrow.height} rx={face.eyebrow.height/2} fill={face.eyeColor} transform={`rotate(${-face.eyebrow.angle} ${g.eyeCenterX-g.eyeOffsetX} ${g.eyebrowCenterY})`}/>
    <rect x={g.eyeCenterX+g.eyeOffsetX-face.eyebrow.width/2} y={g.eyebrowCenterY-face.eyebrow.height/2} width={face.eyebrow.width} height={face.eyebrow.height} rx={face.eyebrow.height/2} fill={face.eyeColor} transform={`rotate(${face.eyebrow.angle} ${g.eyeCenterX+g.eyeOffsetX} ${g.eyebrowCenterY})`}/>
  </g>;
}
function SkeletonCharacterRig({outfit,face,bodyTexture}:{outfit?:Outfit;face?:FaceAppearance;bodyTexture?:string}){
  const instance=useId().replace(/[^a-zA-Z0-9_-]/g,"");
  const baseId=`skeleton-texture-${instance}`;
  const part=(id:string)=><RigImage id={id} instance={instance} baseId={baseId}/>;
  const hairColor=outfit&&outfit.hairStyle!=="ninguno"?outfit.hairColor:null;
  return <div className="skeleton-character-rig" data-engine="skeletal-v1" data-layer-count="43"><svg className="character-rig-svg" viewBox={`0 0 ${RIG_CANVAS.width} ${RIG_CANVAS.height}`} role="presentation"><defs><image id={baseId} href={bodyTexture??DEFAULT_BODY_TEXTURE} x="0" y="0" width={RIG_CANVAS.width} height={RIG_CANVAS.height} preserveAspectRatio="none" style={face?{filter:face.skinFilter}:undefined}/>{RIG_LAYERS.map(layer=><clipPath key={layer.id} id={`skeleton-clip-${layer.id}-${instance}`} clipPathUnits="userSpaceOnUse"><rect x={layer.canvas_position.x} y={layer.canvas_position.y} width={layer.size.width} height={layer.size.height}/></clipPath>)}</defs><g className="skeleton-root">
    <LegChain side="der" instance={instance} baseId={baseId}/>
    <Bone name="core" pivot={limbPivot("pelvis")}>
      {part("pelvis")}{part("abdomen_inferior")}{part("abdomen_superior")}{part("caja_toracica")}
      <ArmChain side="der" instance={instance} baseId={baseId}/>
      {part("pecho_superior")}
      <Bone name="neck" pivot={limbPivot("cuello_inferior")}>
        {part("cuello_inferior")}{part("cuello_superior")}
        <Bone name="head" pivot={limbPivot("rostro_mandibula")}>
          {part("rostro_mandibula")}{part("craneo")}
          {face?<FacePlaceholder instance={instance} face={face}/>:null}
          {hairColor&&outfit!.hairStyle==="corto"?<RigColorPatch id="craneo" instance={instance} color={hairColor} inset={10} radius={40}/>:null}
          {hairColor&&outfit!.hairStyle==="mohawk"?<RigColorPatch id="craneo" instance={instance} color={hairColor} inset={26} radius={16}/>:null}
          {hairColor&&outfit!.hairStyle==="largo"?<>
            <RigColorPatch id="craneo" instance={instance} color={hairColor} inset={8} radius={40}/>
            <RigColorPatch id="cuello_superior" instance={instance} color={hairColor} inset={6} radius={14}/>
            <RigColorPatch id="cuello_inferior" instance={instance} color={hairColor} inset={10} radius={14}/>
          </>:null}
        </Bone>
      </Bone>
      <ArmChain side="izq" instance={instance} baseId={baseId}/>
    </Bone>
    <LegChain side="izq" instance={instance} baseId={baseId}/>
  </g></svg></div>;
}

function LegacyBrute({side,variant,attacking,attackKind,hit,critical,reaction,defeated}:{side:"left"|"right";variant:"ragnar"|"brakka";attacking:boolean;attackKind:AttackKind|null;hit:boolean;critical:boolean;reaction:DefenseReaction|null;defeated:boolean}){
  return <div className={`fighter ${side} ${variant} ${attacking?`attack attack-${attackKind}`:""} ${critical?"critical":""} ${hit?"hit":""} ${reaction?`defense-${reaction}`:""} ${defeated?"defeated":""}`} aria-hidden="true">
    <div className="fighter-aura"/><div className="shadow"/>
    <LayeredCharacterRig/>
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
    <svg className="designed-rig" viewBox="0 0 979 1606" role="presentation" data-rig="43-capas">
      <g className="rig-body">
        <g className="limb-chain leg-chain leg-right">
          <CharacterLayer id="dedos_pie_der"/><CharacterLayer id="pie_der" className="pie-der"/><CharacterLayer id="tobillo_der"/><CharacterLayer id="pantorrilla_der_inferior" className="pierna-der"/><CharacterLayer id="pantorrilla_der_superior"/><CharacterLayer id="rodilla_der"/><CharacterLayer id="muslo_der_inferior"/><CharacterLayer id="muslo_der_superior" className="muslo-der"/><CharacterLayer id="cadera_der"/>
        </g>
        <g className="limb-chain leg-chain leg-left">
          <CharacterLayer id="dedos_pie_izq"/><CharacterLayer id="pie_izq" className="pie-izq"/><CharacterLayer id="tobillo_izq"/><CharacterLayer id="pantorrilla_izq_inferior" className="pierna-izq"/><CharacterLayer id="pantorrilla_izq_superior"/><CharacterLayer id="rodilla_izq"/><CharacterLayer id="muslo_izq_inferior"/><CharacterLayer id="muslo_izq_superior" className="muslo-izq"/><CharacterLayer id="cadera_izq"/>
        </g>
        <g className="limb-chain arm-chain arm-right">
          <CharacterLayer id="dedos_der"/><CharacterLayer id="mano_der" className="mano-der"/><CharacterLayer id="muneca_der"/><CharacterLayer id="antebrazo_der" className="antebrazo-der"/><CharacterLayer id="codo_der"/><CharacterLayer id="brazo_der_superior" className="brazo-der"/><CharacterLayer id="hombro_der"/><CharacterLayer id="clavicula_der"/>
        </g>
        <g className="limb-chain arm-chain arm-left">
          <CharacterLayer id="dedos_izq"/><CharacterLayer id="mano_izq" className="mano-izq"/><CharacterLayer id="muneca_izq"/><CharacterLayer id="antebrazo_izq" className="antebrazo-izq"/><CharacterLayer id="codo_izq"/><CharacterLayer id="brazo_izq_superior" className="brazo-izq"/><CharacterLayer id="hombro_izq"/><CharacterLayer id="clavicula_izq"/>
        </g>
        <g className="torso-svg"><CharacterLayer id="pelvis"/><CharacterLayer id="abdomen_inferior"/><CharacterLayer id="abdomen_superior"/><CharacterLayer id="caja_toracica"/><CharacterLayer id="pecho_superior"/></g>
        <g className="cuello-svg"><CharacterLayer id="cuello_inferior"/><CharacterLayer id="cuello_superior"/></g>
        <g className="cabeza-svg"><CharacterLayer id="rostro_mandibula"/><CharacterLayer id="craneo"/></g>
      </g>
    </svg>
  </div>;
}

type MotionControl={speed?:number;paused?:boolean;restart?:number;seek?:number;onProgress?:(progress:number)=>void};
function useMotionController(rootRef:RefObject<HTMLDivElement|null>,motion:MotionName,control?:MotionControl){
  const pausedRef=useRef(Boolean(control?.paused)),speedRef=useRef(control?.speed??1),progressRef=useRef(control?.onProgress);pausedRef.current=Boolean(control?.paused);speedRef.current=control?.speed??1;progressRef.current=control?.onProgress;
  useEffect(()=>{const root=rootRef.current;if(!root)return;const definition=MOTIONS[motion],targets=new Map<string,HTMLElement|SVGElement>();for(const motionTrack of definition.tracks){const target=motionTrack.selector==="root"?root.querySelector(".skeleton-character-rig"):root.querySelector(motionTrack.selector);if(target)targets.set(motionTrack.selector,target as HTMLElement|SVGElement)}
    const reset=()=>{root.querySelectorAll<HTMLElement|SVGElement>(".skeleton-character-rig,.skeleton-bone,.shadow").forEach(element=>{element.style.transform=""})};reset();
    const viewport=window.innerWidth,isLab=Boolean(root.closest(".lab-demo")),advance=isLab?Math.max(120,Math.min(300,viewport*.22)):viewport<=720?Math.max(72,Math.min(115,viewport*.22)):Math.max(120,Math.min(285,viewport*.19));let elapsed=Math.max(0,Math.min(1,control?.seek??0))*definition.duration,last=performance.now(),frame=0,lastReport=-1;
    const render=(progress:number)=>{for(const motionTrack of definition.tracks){const target=targets.get(motionTrack.selector);if(!target)continue;target.style.transform=poseTransform(poseAt(motionTrack.keys,progress),advance)}if(progressRef.current&&Math.abs(progress-lastReport)>.015){lastReport=progress;progressRef.current(progress)}};
    const tick=(now:number)=>{const delta=Math.min(50,Math.max(0,now-last));last=now;if(!pausedRef.current)elapsed+=delta*speedRef.current;let progress=elapsed/definition.duration;if(definition.loop){progress%=1;elapsed%=definition.duration}else progress=Math.min(1,progress);render(progress);if(definition.loop||progress<1||pausedRef.current)frame=requestAnimationFrame(tick);else progressRef.current?.(1)};render(elapsed/definition.duration);frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);reset()};
  },[rootRef,motion,control?.restart,control?.seek]);
}
function Brute({side,variant,attacking,attackKind,hit,critical,reaction,defeated,control,outfit,face,bodyTexture}:{side:"left"|"right";variant:"ragnar"|"brakka";attacking:boolean;attackKind:AttackKind|null;hit:boolean;critical:boolean;reaction:DefenseReaction|null;defeated:boolean;control?:MotionControl;outfit?:Outfit;face?:FaceAppearance;bodyTexture?:string}){
  const rootRef=useRef<HTMLDivElement>(null);const motion:MotionName=defeated?"defeat":reaction??(hit?"hit":attacking?(critical?"critical":attackKind??"punch"):"idle");useMotionController(rootRef,motion,control);
  return <div ref={rootRef} data-motion={motion} className={`fighter motion-driven character-clean ${side} ${variant} ${attacking?`attack attack-${attackKind}`:""} ${critical?"critical":""} ${hit?"hit":""} ${reaction?`defense-${reaction}`:""} ${defeated?"defeated":""}`} aria-hidden="true"><div className="fighter-aura"/><div className="shadow"/><SkeletonCharacterRig outfit={outfit} face={face} bodyTexture={bodyTexture}/></div>;
}

function FighterCard({fighter,side}:{fighter:BattleFighter;side:"left"|"right"}){
  const suffix=`life-${side}`;
  const percent=Math.max(0,Math.min(100,fighter.hp/fighter.maxHp*100));
  const fillWidth=1293*percent/100;
  return <div className={`life-card card-${side}`} aria-label={`${fighter.name}: ${fighter.hp} de ${fighter.maxHp} puntos de vida`}>
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
        <image href={CLASS_DRESSED_TEXTURE[fighter.className]??DEFAULT_BODY_TEXTURE} x="26" y="27" width="208" height="208" preserveAspectRatio="xMidYMin slice" clipPath={`url(#portrait-${suffix})`}/>
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
      <text x="286" y="270" className="life-count"><tspan>{fighter.hp}</tspan><tspan className="life-total"> / {fighter.maxHp} PV</tspan></text>
      <text x="1568" y="270" textAnchor="end" className="life-stat">{fighter.stat.toUpperCase()}</text>
    </svg>
  </div>;
}

const STAT_LABELS={strength:"Fuerza",speed:"Velocidad",agility:"Agilidad",resistance:"Resistencia",precision:"Precisión",luck:"Suerte"} as const;
function StatsPanel({fighter}:{fighter:BattleFighter}){
  return <div className="stats-panel">{Object.entries(fighter.stats).map(([key,value])=><div className="stat-row" key={key}><span>{STAT_LABELS[key as keyof typeof STAT_LABELS]}</span><div><i style={{width:`${Math.min(100,value*12)}%`}}/></div><b>{value}</b></div>)}</div>;
}
function GameHeader(){return <header className="topbar"><button className="brand brand-button" aria-label="Liga de Brutos"><img className="header-logo" src="/brand/logo-horizontal.webp" alt="Liga de Brutos"/></button><div className="top-actions"><span className="season">TEMPORADA I</span></div></header>}

function ColorSwatchRow({label,colors,value,onSelect,allowNone,noneLabel}:{label:string;colors:string[];value:string|null;onSelect:(color:string|null)=>void;allowNone?:boolean;noneLabel?:string}){
  return <div className="wardrobe-row">
    <span className="wardrobe-row-label">{label}</span>
    <div className="swatch-list">
      {allowNone?<button type="button" className={`swatch swatch-none ${value===null?"selected":""}`} aria-label={noneLabel??"Ninguno"} title={noneLabel??"Ninguno"} onClick={()=>onSelect(null)}>✕</button>:null}
      {colors.map(color=><button type="button" key={color} className={`swatch ${value===color?"selected":""}`} style={{background:color}} aria-label={color} onClick={()=>onSelect(color)}/>)}
    </div>
  </div>;
}
/** Row of named-option buttons (hair style, eye style...), styled like the class picker. */
function StyleButtonRow({label,options,value,onSelect}:{label:string;options:{id:string;label:string}[];value:string;onSelect:(id:string)=>void}){
  return <div className="wardrobe-row">
    <span className="wardrobe-row-label">{label}</span>
    <div className="class-picker wardrobe-style-picker">
      {options.map(option=><button key={option.id} type="button" className={value===option.id?"selected":""} onClick={()=>onSelect(option.id)}>{option.label}</button>)}
    </div>
  </div>;
}
/** Row of skin-tone swatches. Uses each tone's representative `swatch` color for the button. */
function SkinToneRow({label,tones,value,onSelect}:{label:string;tones:typeof SKIN_TONES;value:string;onSelect:(id:string)=>void}){
  return <div className="wardrobe-row">
    <span className="wardrobe-row-label">{label}</span>
    <div className="swatch-list">
      {tones.map(tone=><button type="button" key={tone.id} className={`swatch ${value===tone.id?"selected":""}`} style={{background:tone.swatch}} aria-label={tone.label} title={tone.label} onClick={()=>onSelect(tone.id)}/>)}
    </div>
  </div>;
}

export default function Home(){
  const [view,setView]=useState<"splash"|"login"|"creator"|"locker"|"encounter"|"battle"|"lab"|"tournament"|"tournament-battle">("splash");
  const [outfit,setOutfit]=useState<Outfit>(DEFAULT_OUTFIT);
  const [identity,setIdentity]=useState<PlayerIdentity>(DEFAULT_IDENTITY);
  useEffect(()=>{setOutfit(loadOutfit());setIdentity(loadIdentity())},[]);
  const updateOutfit=useCallback((patch:Partial<Outfit>)=>{setOutfit(current=>{const next={...current,...patch};saveOutfit(next);return next})},[]);
  const updateIdentity=useCallback((patch:Partial<PlayerIdentity>)=>{setIdentity(current=>{const next={...current,...patch};saveIdentity(next);return next})},[]);
  const face=resolveFaceAppearance(identity);
  const [loading,setLoading]=useState(false);const [progress,setProgress]=useState(0);const [playerClass,setPlayerClass]=useState<FighterClass>("Luchador");const [selectedRival,setSelectedRival]=useState<RivalCard>(RIVAL_ROSTER[2]);const [fighters,setFighters]=useState<[BattleFighter,BattleFighter]>(INITIAL);const [active,setActive]=useState<number|null>(null);const [attackKind,setAttackKind]=useState<AttackKind|null>(null);const [hit,setHit]=useState<number|null>(null);const [reaction,setReaction]=useState<{target:number;kind:DefenseReaction}|null>(null);const [critical,setCritical]=useState(false);const [running,setRunning]=useState(false);const [winner,setWinner]=useState<string|null>(null);const [message,setMessage]=useState("Los brutos ocupan sus posiciones");const [damage,setDamage]=useState<number|null>(null);const [round,setRound]=useState(0);const [seed,setSeed]=useState<number|null>(null);const [labMotion,setLabMotion]=useState<MotionName>("punch");const [labPlaying,setLabPlaying]=useState(true);const [labSpeed,setLabSpeed]=useState<"normal"|"half"|"quarter">("half");const [labKey,setLabKey]=useState(0);const [labProgress,setLabProgress]=useState(0);const [labSeek,setLabSeek]=useState(0);const run=useRef(0);const previousRival=useRef<string>("brakka");
  const [username,setUsername]=useState<string|null>(null);const [hasCharacter,setHasCharacter]=useState(false);const [authMode,setAuthMode]=useState<"login"|"register">("login");const [authUser,setAuthUser]=useState("");const [authPass,setAuthPass]=useState("");const [authError,setAuthError]=useState<string|null>(null);const [authBusy,setAuthBusy]=useState(false);
  const [level,setLevel]=useState(1);const [xp,setXp]=useState(0);const [wins,setWins]=useState(0);const [losses,setLosses]=useState(0);const [lastXpGain,setLastXpGain]=useState<number|null>(null);
  const [tMatches,setTMatches]=useState<TournamentMatch[]|null>(null);const [tBracketSize,setTBracketSize]=useState(16);const [tChampion,setTChampion]=useState(false);const [tEliminatedRound,setTEliminatedRound]=useState<string|null>(null);
  const [tFighters,setTFighters]=useState<[BattleFighter,BattleFighter]|null>(null);const [tOpponent,setTOpponent]=useState<TournamentFighter|null>(null);const [tActive,setTActive]=useState<number|null>(null);const [tAttackKind,setTAttackKind]=useState<AttackKind|null>(null);const [tHit,setTHit]=useState<number|null>(null);const [tReaction,setTReaction]=useState<{target:number;kind:DefenseReaction}|null>(null);const [tCritical,setTCritical]=useState(false);const [tRunning,setTRunning]=useState(false);const [tRoundNum,setTRoundNum]=useState(0);const [tDamage,setTDamage]=useState<number|null>(null);const [tMessage,setTMessage]=useState("");const tRun=useRef(0);
  const applyCharacter=useCallback((character:SavedCharacter|null)=>{
    if(!character){setHasCharacter(false);return}
    setHasCharacter(true);updateIdentity({name:character.name,skinToneId:character.skinToneId,eyeStyleId:character.eyeStyleId,eyeColor:character.eyeColor,eyebrowStyleId:character.eyebrowStyleId});updateOutfit({...CLASS_CLOTHING[character.className],hairStyle:character.hairStyle as Outfit["hairStyle"],hairColor:character.hairColor});setPlayerClass(character.className);setLevel(character.level);setXp(character.xp);setWins(character.wins);setLosses(character.losses);
  },[updateIdentity,updateOutfit]);
  useEffect(()=>{(async()=>{try{const response=await fetch("/api/auth/me");if(!response.ok)return;const data=(await response.json())as AuthResponse;setUsername(data.username);applyCharacter(data.character)}catch{/* sin sesión activa o backend no disponible: se queda en la pantalla de acceso */}})()},[applyCharacter]);
  const saveCharacter=useCallback(async(overrides?:Partial<{level:number;xp:number;wins:number;losses:number}>)=>{
    try{
      await fetch("/api/character",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:identity.name.trim()||"Ragnar",className:playerClass,level:overrides?.level??level,xp:overrides?.xp??xp,wins:overrides?.wins??wins,losses:overrides?.losses??losses,hairStyle:outfit.hairStyle,hairColor:outfit.hairColor,skinToneId:identity.skinToneId,eyeStyleId:identity.eyeStyleId,eyeColor:identity.eyeColor,eyebrowStyleId:identity.eyebrowStyleId})});
    }catch{/* si falla el guardado en el servidor, el progreso sigue disponible en esta sesión */}
  },[identity,outfit,playerClass,level,xp,wins,losses]);
  const playerBodyTexture=CLASS_DRESSED_TEXTURE[playerClass]??DEFAULT_BODY_TEXTURE;
  const playerName=identity.name.trim()||"Ragnar";
  const player=fresh(playerName,playerClass,level);
  const selectClass=useCallback((name:FighterClass)=>{setPlayerClass(name);updateOutfit(CLASS_CLOTHING[name])},[updateOutfit]);
  const enterGame=useCallback(async()=>{if(loading)return;setLoading(true);setProgress(0);for(let value=4;value<=100;value+=4){await wait(38);setProgress(value)}await wait(180);setLoading(false);if(username){setView(hasCharacter?"locker":"creator")}else{setAuthError(null);setView("login")}},[loading,username,hasCharacter]);
  const submitAuth=useCallback(async()=>{
    const user=authUser.trim();
    if(!user||!authPass){setAuthError("Introduce usuario y contraseña.");return}
    setAuthBusy(true);setAuthError(null);
    try{
      const response=await fetch(`/api/auth/${authMode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:authPass})});
      const data=(await response.json())as AuthResponse;
      if(!response.ok){setAuthError(data.error??"No se pudo completar la operación.");setAuthBusy(false);return}
      setUsername(data.username);applyCharacter(data.character);setAuthPass("");setAuthBusy(false);setView(data.character?"locker":"creator");
    }catch{setAuthError("No se pudo conectar con el servidor. Inténtalo de nuevo.");setAuthBusy(false)}
  },[authMode,authUser,authPass,applyCharacter]);
  const logout=useCallback(async()=>{try{await fetch("/api/auth/logout",{method:"POST"})}catch{/* ignorar fallos de red al cerrar sesión */}setUsername(null);setHasCharacter(false);setAuthUser("");setAuthPass("");setView("splash")},[]);
  const prepareEncounter=useCallback(()=>{const rival=pickRival(previousRival.current);previousRival.current=rival.id;setSelectedRival(rival);const rivalFighter=fresh(rival.name,rival.className,Math.max(rival.level,level));rivalFighter.title=rival.epithet;setFighters([fresh(playerName,playerClass,level),rivalFighter]);setWinner(null);setRound(0);setLastXpGain(null);setView("encounter")},[playerClass,playerName,level]);
  const fight=useCallback(async()=>{
    const id=++run.current;const rivalLevel=Math.max(selectedRival.level,level);const rivalProfile=makeProfile(selectedRival.name,selectedRival.className,rivalLevel);rivalProfile.title=selectedRival.epithet;const result=simulateBattle(makeProfile(playerName,playerClass,level),rivalProfile);setView("battle");setSeed(result.seed);let current:[BattleFighter,BattleFighter]=result.fighters.map(f=>({...f,hp:f.maxHp})) as [BattleFighter,BattleFighter];setFighters(current);setWinner(null);setRunning(true);setActive(null);setAttackKind(null);setHit(null);setReaction(null);setCritical(false);setDamage(null);setRound(0);setLastXpGain(null);setMessage(`${selectedRival.name}, ${selectedRival.className}, entra en la arena`);await wait(650);
    const abilityText:Record<string,(actor:string,target:string)=>string>={
      "guardia-de-hierro":actor=>`¡${actor} activa Guardia de Hierro y anula el golpe!`,
      "golpe-de-suerte":actor=>`¡${actor} conecta con Golpe de Suerte!`,
      "rafaga":actor=>`¡${actor} encadena un ataque extra con Ráfaga!`,
      "piel-de-piedra":(_actor,target)=>`¡Piel de Piedra evita que ${target} caiga!`,
    };
    const outcomeText=(outcome:Outcome,actor:string,target:string,attack:EngineAttack,critical:boolean,ability?:string)=>{
      if(ability&&abilityText[ability])return abilityText[ability](actor,target);
      if(outcome==="dodge")return `${target} esquiva ${describeAttack(attack)}`;if(outcome==="perfect-block")return `¡Bloqueo perfecto de ${target}!`;if(outcome==="block")return `${target} bloquea gran parte del golpe`;return `${actor} conecta ${critical?"un crítico":"su ataque"}`};
    for(let index=0;index<result.turns.length;index++){if(run.current!==id)return;const turn=result.turns[index],source=current[turn.actor],target=current[turn.target],visual:AttackKind=turn.attack==="kick"?"kick":"punch",defense:DefenseReaction|null=turn.outcome==="dodge"||turn.outcome==="block"||turn.outcome==="perfect-block"?turn.outcome:null,timing=motionTiming(visual,Boolean(turn.knockdown||turn.stun));setRound(index+1);setAttackKind(visual);setActive(turn.actor);setMessage(`${source.name} toma impulso y salta hacia ${target.name}`);await wait(timing.contact);if(run.current!==id)return;current=current.map((f,i)=>i===turn.target?{...f,hp:turn.hpAfter}:f) as [BattleFighter,BattleFighter];setFighters(current);setReaction(defense?{target:turn.target,kind:defense}:null);setHit(turn.outcome==="hit"&&turn.damage>0?turn.target:null);setCritical(turn.critical);setDamage(turn.damage||null);setMessage(outcomeText(turn.outcome,source.name,target.name,turn.attack,turn.critical,turn.ability));await wait(Math.max(0,timing.total-timing.contact));setHit(null);setReaction(null);setCritical(false);setDamage(null);setActive(null);setAttackKind(null);if(turn.knockdown){setMessage(`${target.name} cae y debe recomponerse`);await wait(REACTION_TIMINGS.knockdown)}else if(turn.stun){setMessage(`${target.name} queda aturdido`);await wait(REACTION_TIMINGS.stun)}else await wait(timing.settle)}
    if(run.current!==id)return;const champion=result.fighters[result.winner].name;const won=result.winner===0;setWinner(champion);setMessage(`¡${champion} domina la arena!`);setRunning(false);
    const gained=xpReward(won,rivalLevel);const nextLevelState=applyXpGain({level,xp},gained);const nextWins=won?wins+1:wins;const nextLosses=won?losses:losses+1;
    setLevel(nextLevelState.level);setXp(nextLevelState.xp);setWins(nextWins);setLosses(nextLosses);setLastXpGain(gained);
    void saveCharacter({level:nextLevelState.level,xp:nextLevelState.xp,wins:nextWins,losses:nextLosses});
  },[playerClass,playerName,selectedRival,level,xp,wins,losses,saveCharacter]);
  const drawTournament=useCallback(()=>{   const opponents=shuffle(RIVAL_ROSTER,Math.random).slice(0,15).map((rival,index)=>({id:`${rival.id}-${index}`,name:rival.name,className:rival.className,level:Math.max(rival.level,level),title:rival.epithet,isPlayer:false} as TournamentFighter));   const playerFighter:TournamentFighter={id:"player",name:playerName,className:playerClass,level,title:CLASS_ABILITIES[playerClass].name,isPlayer:true};   setTMatches(resolveAiMatches(pairUp([playerFighter,...opponents],Math.random)));setTBracketSize(16);setTChampion(false);setTEliminatedRound(null); },[playerName,playerClass,level]); const findPlayerMatch=useCallback((matches:TournamentMatch[])=>matches.find(match=>match.a.isPlayer||match.b.isPlayer)??null,[]); const startTournamentMatch=useCallback(async()=>{   if(!tMatches)return;   const match=findPlayerMatch(tMatches);   if(!match||match.winnerId)return;   const opponent=match.a.isPlayer?match.b:match.a;   const id=++tRun.current;   const rightProfile=makeProfile(opponent.name,opponent.className,opponent.level);rightProfile.title=opponent.title;   const result=simulateBattle(makeProfile(playerName,playerClass,level),rightProfile);   setTOpponent(opponent);setView("tournament-battle");   let current:[BattleFighter,BattleFighter]=result.fighters.map(f=>({...f,hp:f.maxHp})) as [BattleFighter,BattleFighter];   setTFighters(current);setTActive(null);setTAttackKind(null);setTHit(null);setTReaction(null);setTCritical(false);setTDamage(null);setTRoundNum(0);setTRunning(true);setTMessage(`${opponent.name}, ${opponent.className}, entra en la arena`);   await wait(650);   for(let index=0;index<result.turns.length;index++){     if(tRun.current!==id)return;     const turn=result.turns[index],source=current[turn.actor],target=current[turn.target],visual:AttackKind=turn.attack==="kick"?"kick":"punch",defense:DefenseReaction|null=turn.outcome==="dodge"||turn.outcome==="block"||turn.outcome==="perfect-block"?turn.outcome:null,timing=motionTiming(visual,Boolean(turn.knockdown||turn.stun));     setTRoundNum(index+1);setTAttackKind(visual);setTActive(turn.actor);setTMessage(`${source.name} toma impulso y salta hacia ${target.name}`);     await wait(timing.contact);     if(tRun.current!==id)return;     current=current.map((f,i)=>i===turn.target?{...f,hp:turn.hpAfter}:f) as [BattleFighter,BattleFighter];     setTFighters(current);setTReaction(defense?{target:turn.target,kind:defense}:null);setTHit(turn.outcome==="hit"&&turn.damage>0?turn.target:null);setTCritical(turn.critical);setTDamage(turn.damage||null);     setTMessage(turn.outcome==="dodge"?`${target.name} esquiva ${describeAttack(turn.attack)}`:turn.outcome==="perfect-block"?`¡Bloqueo perfecto de ${target.name}!`:turn.outcome==="block"?`${target.name} bloquea gran parte del golpe`:`${source.name} conecta ${turn.critical?"un crítico":"su ataque"}`);     await wait(Math.max(0,timing.total-timing.contact));     setTHit(null);setTReaction(null);setTCritical(false);setTDamage(null);setTActive(null);setTAttackKind(null);     if(turn.knockdown){setTMessage(`${target.name} cae y debe recomponerse`);await wait(REACTION_TIMINGS.knockdown)}     else if(turn.stun){setTMessage(`${target.name} queda aturdido`);await wait(REACTION_TIMINGS.stun)}     else await wait(timing.settle);   }   if(tRun.current!==id)return;   const won=result.winner===0;setTMessage(won?`¡${playerName} avanza de ronda!`:`¡${opponent.name} elimina a ${playerName}!`);setTRunning(false);   const gained=xpReward(won,opponent.level);const nextLevelState=applyXpGain({level,xp},gained);const nextWins=won?wins+1:wins;const nextLosses=won?losses:losses+1;   setLevel(nextLevelState.level);setXp(nextLevelState.xp);setWins(nextWins);setLosses(nextLosses);setLastXpGain(gained);   void saveCharacter({level:nextLevelState.level,xp:nextLevelState.xp,wins:nextWins,losses:nextLosses});   setTMatches(tMatches.map(m=>m.id===match.id?{...m,winnerId:won?"player":opponent.id}:m));   await wait(900);   if(!won)setTEliminatedRound(roundName(tBracketSize));   setView("tournament"); },[tMatches,findPlayerMatch,playerName,playerClass,level,xp,wins,losses,saveCharacter,tBracketSize]); const advanceTournamentRound=useCallback(()=>{   if(!tMatches||!roundResolved(tMatches))return;   const winners=collectWinners(tMatches);   if(winners.length<=1){     const bonus=50;const nextLevelState=applyXpGain({level,xp},bonus);     setLevel(nextLevelState.level);setXp(nextLevelState.xp);setLastXpGain(bonus);     void saveCharacter({level:nextLevelState.level,xp:nextLevelState.xp,wins,losses});     setTChampion(true);setTMatches(null);return;   }   setTMatches(resolveAiMatches(pairUp(winners,Math.random)));setTBracketSize(winners.length); },[tMatches,tBracketSize,level,xp,wins,losses,saveCharacter]); useEffect(()=>()=>{run.current+=1},[]);
  if(view==="splash")return <main className="splash-screen"><div className="splash-logo"><img src="/brand/logo-principal.webp" alt="Liga de Brutos"/><p>Forja tu leyenda. La arena decidirá el resto.</p></div><button className={`start-button ${loading?"loading":""}`} onClick={enterGame} disabled={loading}><img className="start-frame" src="/ui/cartel-pergamino.svg" alt="" aria-hidden="true"/>{loading?<><span className="start-progress"><i style={{width:`${progress}%`}}/></span><b>{progress}%</b></>:<><span>⚔</span><b>EMPEZAR</b></>}</button></main>;
  if(view==="login")return <main className="login-page"><section className="login-canvas" aria-label="Inicio de sesión"><h2 className="login-title">INICIO DE SESIÓN</h2><img className="login-logo" src="/brand/login-logo.webp" alt="Liga de Brutos"/><form className="login-form" onSubmit={event=>{event.preventDefault();if(!authBusy)submitAuth()}}><div className="login-fields"><input className="login-input" type="text" maxLength={20} placeholder="Usuario" value={authUser} onChange={event=>setAuthUser(event.target.value)} autoFocus/><input className="login-input" type="password" maxLength={72} placeholder="Contraseña" value={authPass} onChange={event=>setAuthPass(event.target.value)}/></div>{authError?<p className="auth-error">{authError}</p>:null}<div className="login-actions"><button className="primary-game-button login-submit" type="submit" disabled={authBusy||!authUser.trim()||!authPass}><span>✓</span> {authBusy?"UN MOMENTO…":authMode==="register"?"CREAR CUENTA":"ENTRAR"}</button><button className="secondary-game-button auth-switch" type="button" onClick={()=>{setAuthMode(mode=>mode==="register"?"login":"register");setAuthError(null)}}>{authMode==="register"?"¿Ya tienes cuenta? Inicia sesión":"¿Sin cuenta? Crear una"}</button></div></form></section></main>;
  if(view==="creator"&&hasCharacter)return <main><GameHeader/><section className="flow-screen wardrobe-screen"><div className="screen-heading"><small>CREACIÓN DE PERSONAJE</small><h2>Da forma a tu bruto</h2><p>Elige clase, peinado, tono de piel y rasgos. La ropa inicial cambia según la clase.</p></div><div className="locker-layout"><div className="locker-character"><Brute side="left" variant="ragnar" attacking={false} attackKind={null} hit={false} critical={false} reaction={null} defeated={false} outfit={outfit} face={face} bodyTexture={playerBodyTexture}/></div><div className="locker-sheet wardrobe-controls"><div className="wardrobe-row"><span className="wardrobe-row-label">Nombre del avatar</span><input className="login-input wardrobe-name-input" type="text" maxLength={18} value={identity.name} onChange={event=>updateIdentity({name:event.target.value})}/></div><StyleButtonRow label="Clase" options={CLASS_NAMES.map(name=>({id:name,label:name}))} value={playerClass} onSelect={id=>selectClass(id as FighterClass)}/><div className="ability-callout"><b>✦ {CLASS_ABILITIES[playerClass].name}</b><span>{CLASS_ABILITIES[playerClass].description}</span></div><StyleButtonRow label="Peinado" options={HAIR_STYLES} value={outfit.hairStyle} onSelect={id=>updateOutfit({hairStyle:id as Outfit["hairStyle"]})}/><ColorSwatchRow label="Color de pelo" colors={HAIR_COLORS} value={outfit.hairColor} onSelect={color=>updateOutfit({hairColor:color??outfit.hairColor})}/><SkinToneRow label="Tono de piel" tones={SKIN_TONES} value={identity.skinToneId} onSelect={id=>updateIdentity({skinToneId:id})}/><StyleButtonRow label="Ojos" options={EYE_STYLES} value={identity.eyeStyleId} onSelect={id=>updateIdentity({eyeStyleId:id})}/><ColorSwatchRow label="Color de ojos" colors={EYE_COLORS} value={identity.eyeColor} onSelect={color=>updateIdentity({eyeColor:color??identity.eyeColor})}/><StyleButtonRow label="Cejas" options={EYEBROW_STYLES} value={identity.eyebrowStyleId} onSelect={id=>updateIdentity({eyebrowStyleId:id})}/><p className="wardrobe-note">Ojos y cejas son un boceto de referencia por ahora — se sustituirán por arte definitivo más adelante.</p></div></div><div className="locker-actions"><button className="primary-game-button" onClick={()=>{setHasCharacter(true);void saveCharacter();setView("locker")}}><span>⚔</span> ENTRAR AL VESTUARIO</button></div></section></main>;
  if(view==="creator")return <main><GameHeader/><section className="initial-creator-screen"><header className="initial-creator-heading"><small>CREACIÓN DE PERSONAJE</small><h2>Da forma a tu bruto</h2><p>Elige clase, peinado, tono de piel y rasgos. La ropa inicial cambia según la clase.</p></header><div className="initial-creator-layout"><div className="initial-creator-preview"><Brute side="left" variant="ragnar" attacking={false} attackKind={null} hit={false} critical={false} reaction={null} defeated={false} outfit={outfit} face={face} bodyTexture={playerBodyTexture}/></div><div className="initial-creator-controls"><div className="initial-creator-basics"><div className="wardrobe-row"><span className="wardrobe-row-label">Nombre del avatar</span><input className="initial-creator-name-input" type="text" maxLength={18} value={identity.name} onChange={event=>updateIdentity({name:event.target.value})}/></div><StyleButtonRow label="Clase" options={CLASS_NAMES.map(name=>({id:name,label:name}))} value={playerClass} onSelect={id=>selectClass(id as FighterClass)}/><div className="ability-callout"><b>✦ {CLASS_ABILITIES[playerClass].name}</b><span>{CLASS_ABILITIES[playerClass].description}</span></div></div><div className="initial-creator-appearance"><StyleButtonRow label="Peinado" options={HAIR_STYLES} value={outfit.hairStyle} onSelect={id=>updateOutfit({hairStyle:id as Outfit["hairStyle"]})}/><ColorSwatchRow label="Color de pelo" colors={HAIR_COLORS} value={outfit.hairColor} onSelect={color=>updateOutfit({hairColor:color??outfit.hairColor})}/><SkinToneRow label="Tono de piel" tones={SKIN_TONES} value={identity.skinToneId} onSelect={id=>updateIdentity({skinToneId:id})}/><StyleButtonRow label="Ojos" options={EYE_STYLES} value={identity.eyeStyleId} onSelect={id=>updateIdentity({eyeStyleId:id})}/><ColorSwatchRow label="Color de ojos" colors={EYE_COLORS} value={identity.eyeColor} onSelect={color=>updateIdentity({eyeColor:color??identity.eyeColor})}/><StyleButtonRow label="Cejas" options={EYEBROW_STYLES} value={identity.eyebrowStyleId} onSelect={id=>updateIdentity({eyebrowStyleId:id})}/></div><p className="initial-creator-note">Ojos y cejas son un boceto de referencia por ahora — se sustituirán por arte definitivo más adelante.</p></div></div><div className="initial-creator-actions"><button className="primary-game-button" onClick={()=>{setHasCharacter(true);void saveCharacter();setView("locker")}}><span>⚔</span> ENTRAR AL VESTUARIO</button></div></section></main>;
  if(view==="locker"){
    const xpNeeded=xpToNextLevel(level);
    return <main><GameHeader/><section className="flow-screen locker-screen"><header className="screen-heading"><small>VESTUARIO · {username}</small><h2>Tu bruto está preparado</h2><p>Consulta sus atributos antes de entrar en la arena.</p></header><div className="locker-layout"><div className="locker-character"><Brute side="left" variant="ragnar" attacking={false} attackKind={null} hit={false} critical={false} reaction={null} defeated={false} outfit={outfit} face={face} bodyTexture={playerBodyTexture}/></div><div className="locker-sheet"><div className="sheet-title"><span>NV. {level}</span><div><h3>{player.name}</h3><p>{player.className} · {player.title}</p></div></div><section className="locker-xp-section" aria-label="Experiencia"><div className="xp-row"><div className="xp-bar"><i style={{width:`${Math.min(100,xp/xpNeeded*100)}%`}}/></div><span>{xp} / {xpNeeded} XP</span></div><p className="record-line">{wins}V — {losses}D</p></section><section className="locker-stats-section" aria-label="Atributos"><StatsPanel fighter={player}/></section><section className="locker-ability-section"><div className="ability-callout"><b>✦ {CLASS_ABILITIES[playerClass].name}</b><span>{CLASS_ABILITIES[playerClass].description}</span></div></section><div className="class-picker" aria-label="Clase del jugador">{CLASS_NAMES.map(name=><button key={name} className={name===playerClass?"selected":""} onClick={()=>selectClass(name)}>{name}</button>)}</div></div></div><div className="locker-actions"><button className="secondary-game-button" onClick={()=>setView("creator")}>🎭 PERSONAJE</button><button className="secondary-game-button" onClick={()=>setView("lab")}>⚙ LABORATORIO</button><button className="secondary-game-button" onClick={()=>setView("tournament")}>🏆 TORNEO</button><button className="primary-game-button" onClick={prepareEncounter}><span>⚔</span> LUCHAR</button></div><button className="logout-link" onClick={logout} type="button">Cerrar sesión</button></section></main>;
  }
  if(view==="encounter")return <main><GameHeader/><section className="flow-screen encounter-screen"><div className="screen-heading"><small>PRÓXIMO ENCUENTRO</small><h2>La arena ha elegido</h2><p>Revisa el enfrentamiento antes de comenzar.</p></div><div className="matchup"><div className="match-card player-card"><div className="match-character"><Brute side="left" variant="ragnar" attacking={false} attackKind={null} hit={false} critical={false} reaction={null} defeated={false} outfit={outfit} face={face} bodyTexture={playerBodyTexture}/></div><small>TU BRUTO</small><h3>{fighters[0].name}</h3><b>{fighters[0].className}</b><p>{fighters[0].title}</p><StatsPanel fighter={fighters[0]}/></div><div className="match-versus"><span>VS</span><small>★ COMBATE 1 VS 1 ★</small></div><div className="match-card rival-card"><div className="match-character"><Brute side="right" variant="brakka" attacking={false} attackKind={null} hit={false} critical={false} reaction={null} defeated={false} bodyTexture={CLASS_DRESSED_TEXTURE[fighters[1].className]}/></div><small>RIVAL</small><h3>{fighters[1].name}</h3><b>{fighters[1].className}</b><p>{fighters[1].title}</p><StatsPanel fighter={fighters[1]}/></div></div><div className="encounter-actions"><button className="secondary-game-button" onClick={()=>setView("locker")}>VOLVER</button><button className="primary-game-button" onClick={fight}><span>⚔</span> EMPEZAR COMBATE</button></div></section></main>;
  if(view==="lab"){
    const attacking=labMotion==="punch"||labMotion==="kick"||labMotion==="critical";
    const reaction:DefenseReaction|null=labMotion==="block"?"block":labMotion==="perfect-block"?"perfect-block":labMotion==="dodge"?"dodge":null;
    const definition=MOTIONS[labMotion],speed=labSpeed==="normal"?1:labSpeed==="half"?.5:.25,contactProgress=definition.contact/definition.duration,recoveryProgress=Math.min(.88,contactProgress+.12),frameStep=1000/60/definition.duration,phase=labProgress<contactProgress?"PREPARACIÓN":labProgress<recoveryProgress?"CONTACTO":"RECUPERACIÓN";
    return <main><GameHeader/><section className="flow-screen lab-screen"><div className="screen-heading"><small>LABORATORIO DE ANIMACIONES · MOTOR JS</small><h2>Banco de pruebas del rig</h2><p>Un único reloj controla las 43 capas, el contacto y la recuperación.</p></div><div className="lab-timeline-status"><b>{phase}</b><span>{Math.round(labProgress*MOTIONS[labMotion].duration)} / {MOTIONS[labMotion].duration} ms</span></div><div className="lab-demo"><Brute side="left" variant="ragnar" attacking={attacking} attackKind={attacking?(labMotion==="kick"?"kick":"punch"):null} hit={labMotion==="hit"} critical={labMotion==="critical"} reaction={reaction} defeated={labMotion==="defeat"} control={{speed,paused:!labPlaying,restart:labKey,seek:labSeek,onProgress:setLabProgress}} outfit={outfit} face={face} bodyTexture={playerBodyTexture}/><div className="lab-target"><span>OBJETIVO</span></div></div><div className="lab-controls"><label className="lab-scrubber"><span>0</span><input aria-label="Línea temporal" type="range" min="0" max="1000" value={Math.round(labProgress*1000)} onChange={event=>{const value=Number(event.target.value)/1000;setLabPlaying(false);setLabSeek(value);setLabProgress(value)}}/><span>100%</span></label><div className="lab-motion-list">{([['idle','Guardia'],['punch','Puñetazo'],['kick','Patada'],['block','Bloqueo'],['perfect-block','Bloqueo perfecto'],['dodge','Esquiva'],['hit','Impacto'],['critical','Crítico'],['defeat','Derrota']] as const).map(([id,label])=><button key={id} className={labMotion===id?"selected":""} onClick={()=>{setLabMotion(id);setLabPlaying(true);setLabSeek(0);setLabProgress(0);setLabKey(value=>value+1)}}>{label}</button>)}</div><div className="lab-transport"><button onClick={()=>setLabPlaying(value=>!value)}>{labPlaying?"⏸ PAUSAR":"▶ REANUDAR"}</button><button onClick={()=>{setLabPlaying(true);setLabSeek(0);setLabProgress(0);setLabKey(value=>value+1)}}>↻ REPETIR</button><button onClick={()=>{const value=Math.max(0,labProgress-frameStep);setLabPlaying(false);setLabSeek(value);setLabProgress(value)}}>−1 FOTOGRAMA</button><button onClick={()=>{const value=Math.min(1,labProgress+frameStep);setLabPlaying(false);setLabSeek(value);setLabProgress(value)}}>+1 FOTOGRAMA</button><label>VELOCIDAD <select value={labSpeed} onChange={event=>setLabSpeed(event.target.value as "normal"|"half"|"quarter")}><option value="normal">1×</option><option value="half">0,5×</option><option value="quarter">0,25×</option></select></label></div></div><button className="secondary-game-button lab-back" onClick={()=>setView("locker")}>← VOLVER AL VESTUARIO</button></section></main>;
  }
if(view==="tournament"){
    const allResolved=tMatches?roundResolved(tMatches):false;
    const heading=tChampion?"¡Eres el campeón!":tEliminatedRound?`Eliminado en ${tEliminatedRound}`:tMatches?roundName(tBracketSize):"Cuadro de 16 brutos";
    const subtitle=tChampion?"Has derrotado a los quince rivales y alzado el título.":tEliminatedRound?"Tu bruto cayó en el cuadro. Puedes intentarlo de nuevo cuando quieras.":tMatches?"Sorteo por ronda, eliminación directa. Un solo combate, sin segundas oportunidades.":"Dieciséis brutos, sorteo en cada ronda: octavos, cuartos, semifinal y final.";
    return <main><GameHeader/><section className="flow-screen tournament-screen"><div className="screen-heading"><small>TORNEO DE LA LIGA</small><h2>{heading}</h2><p>{subtitle}</p></div>
      {!tMatches&&!tChampion&&!tEliminatedRound?<div className="locker-actions"><button className="primary-game-button" onClick={drawTournament}><span>🏆</span> SORTEAR OCTAVOS</button></div>:null}
      {tMatches?<div className="bracket-list">{tMatches.map(match=>{
        const isPlayerMatch=match.a.isPlayer||match.b.isPlayer;
        const winner=match.winnerId?(match.winnerId===match.a.id?match.a:match.b):null;
        return <div key={match.id} className={`bracket-match ${isPlayerMatch?"bracket-match-player":""} ${winner?"bracket-resolved":""}`}>
          <span className={winner===match.a?"bracket-winner":""}>{match.a.name}<i>{match.a.className}</i></span>
          <b>VS</b>
          <span className={winner===match.b?"bracket-winner":""}>{match.b.name}<i>{match.b.className}</i></span>
          {isPlayerMatch&&!match.winnerId?<button className="secondary-game-button" onClick={startTournamentMatch}>LUCHAR</button>:winner?<em>{winner.isPlayer?"¡Ganaste!":`Gana ${winner.name}`}</em>:<em>Pendiente</em>}
        </div>;
      })}</div>:null}
      {tMatches&&allResolved&&!tChampion&&!tEliminatedRound?<div className="locker-actions"><button className="primary-game-button" onClick={advanceTournamentRound}><span>{tBracketSize===2?"🏆":"🎲"}</span> {tBracketSize===2?"PROCLAMAR CAMPEÓN":`SORTEAR ${roundName(tBracketSize/2).toUpperCase()}`}</button></div>:null}
      {tChampion?<div className="locker-actions"><button className="secondary-game-button" onClick={drawTournament}>🏆 NUEVO TORNEO</button></div>:null}
      {tEliminatedRound?<div className="locker-actions"><button className="secondary-game-button" onClick={drawTournament}>🏆 REINTENTAR</button></div>:null}
      <button className="secondary-game-button lab-back" onClick={()=>{setTChampion(false);setTEliminatedRound(null);setView("locker")}}>← VOLVER AL VESTUARIO</button>
    </section></main>;
  }
  if(view==="tournament-battle"&&tFighters&&tOpponent)return <main>
    <GameHeader/>
    <section className="hero" id="arena-tournament"><div className="eyebrow"><span/>{roundName(tBracketSize).toUpperCase()} · TORNEO<span/></div><h2>{tRunning?"Combate a muerte súbita":tFighters[0].hp>0&&tFighters[1].hp===0?`${tFighters[0].name} avanza de ronda`:tFighters[1].hp>0&&tFighters[0].hp===0?`${tFighters[1].name} avanza de ronda`:"Combate a muerte súbita"}</h2><p>{tMessage}</p></section>
    <section className="battle-wrap">
      <div className="battle-frame"><div className="frame-rivets"><i/><i/><i/><i/></div>
        <div className="sky"><div className="sun"/><div className="cloud cloud-a"/><div className="cloud cloud-b"/><div className="mountains"/></div>
        <div className="banners"><span>AB</span><span>AB</span><span>AB</span><span>AB</span><span>AB</span></div><div className="crowd"/>
        <div className="cards-row"><FighterCard fighter={tFighters[0]} side="left"/><div className="versus"><small>RONDA</small><strong>{tRoundNum||"—"}</strong><b>VS</b></div><FighterCard fighter={tFighters[1]} side="right"/></div>
        <div className="stage"><Brute side="left" variant="ragnar" attacking={tActive===0} attackKind={tActive===0?tAttackKind:null} hit={tHit===0} critical={tCritical&&tActive===0} reaction={tReaction?.target===0?tReaction.kind:null} defeated={tFighters[0].hp===0} outfit={outfit} face={face} bodyTexture={playerBodyTexture}/><div className={`impact ${tHit!==null?"show":""} ${tCritical?"critical-impact":""}`}><span>{tDamage}</span><i>{tCritical?"¡CRÍTICO!":"¡PUM!"}</i></div><div className={`defense-effect ${tReaction?`show ${tReaction.kind}`:""}`}><span>{tReaction?.kind==="dodge"?"¡ESQUIVA!":tReaction?.kind==="perfect-block"?"¡BLOQUEO PERFECTO!":"¡BLOQUEO!"}</span></div><Brute side="right" variant="brakka" attacking={tActive===1} attackKind={tActive===1?tAttackKind:null} hit={tHit===1} critical={tCritical&&tActive===1} reaction={tReaction?.target===1?tReaction.kind:null} defeated={tFighters[1].hp===0} bodyTexture={CLASS_DRESSED_TEXTURE[tFighters[1].className]}/></div>
        <div className="floor"><div className="arena-mark">AB</div><i/><i/><i/></div>
      </div>
      <div className="commentary"><div className="announcer"><span>📣</span><div><small>TORNEO DE LA LIGA · {roundName(tBracketSize)} · vs {tOpponent.name}</small><strong aria-live="polite">{tMessage}</strong></div></div><button onClick={()=>setView("tournament")} disabled={tRunning}><span>{tRunning?"⚔":"↩"}</span>{tRunning?"Combate en curso":"Volver al cuadro"}</button></div>
    </section>
  </main>;
  return <main>
    <GameHeader/>
    <section className="hero" id="arena"><div className="eyebrow"><span/>COMBATE DE EXHIBICIÓN<span/></div><h2>{winner?`${winner} es el vencedor`:"Dos brutos. Un solo vencedor."}</h2><p>{winner&&lastXpGain!==null?`+${lastXpGain} XP · Nivel ${level}`:"La suerte elige el golpe. Las estadísticas inclinan la balanza."}</p></section>
    <section className="battle-wrap">
      <div className="battle-frame"><div className="frame-rivets"><i/><i/><i/><i/></div>
        <div className="sky"><div className="sun"/><div className="cloud cloud-a"/><div className="cloud cloud-b"/><div className="mountains"/></div>
        <div className="banners"><span>AB</span><span>AB</span><span>AB</span><span>AB</span><span>AB</span></div><div className="crowd"/>
        <div className="cards-row"><FighterCard fighter={fighters[0]} side="left"/><div className="versus"><small>RONDA</small><strong>{round||"—"}</strong><b>VS</b></div><FighterCard fighter={fighters[1]} side="right"/></div>
        <div className="stage"><Brute side="left" variant="ragnar" attacking={active===0} attackKind={active===0?attackKind:null} hit={hit===0} critical={critical&&active===0} reaction={reaction?.target===0?reaction.kind:null} defeated={fighters[0].hp===0} outfit={outfit} face={face} bodyTexture={playerBodyTexture}/><div className={`impact ${hit!==null?"show":""} ${critical?"critical-impact":""}`}><span>{damage}</span><i>{critical?"¡CRÍTICO!":"¡PUM!"}</i></div><div className={`defense-effect ${reaction?`show ${reaction.kind}`:""}`}><span>{reaction?.kind==="dodge"?"¡ESQUIVA!":reaction?.kind==="perfect-block"?"¡BLOQUEO PERFECTO!":"¡BLOQUEO!"}</span></div><Brute side="right" variant="brakka" attacking={active===1} attackKind={active===1?attackKind:null} hit={hit===1} critical={critical&&active===1} reaction={reaction?.target===1?reaction.kind:null} defeated={fighters[1].hp===0} bodyTexture={CLASS_DRESSED_TEXTURE[fighters[1].className]}/></div>
        <div className="floor"><div className="arena-mark">AB</div><i/><i/><i/></div>
      </div>
      <div className="commentary"><div className="announcer"><span>📣</span><div><small>EL HERALDO DE LA ARENA · {seed?`COMBATE ${String(seed).slice(-6)}`:"PREPARANDO"}</small><strong aria-live="polite">{message}</strong></div></div><button onClick={()=>setView("locker")} disabled={running}><span>{running?"⚔":"↩"}</span>{running?"Combate en curso":"Volver al vestuario"}</button></div>
    </section>
    <section className="feature-strip"><div><b>⚔</b><span><strong>Combate automático</strong><small>Cada duelo es diferente</small></span></div><div><b>◆</b><span><strong>Estadísticas únicas</strong><small>Fuerza contra agilidad</small></span></div><div><b>★</b><span><strong>Victoria aleatoria</strong><small>La arena decide</small></span></div></section>
    <footer><span>ARENA DE BRUTOS · PROTOTIPO JUGABLE</span><b>Hecho para la gloria</b><span>SIN REGISTRO · SIN PAGOS</span></footer>
  </main>;
}
