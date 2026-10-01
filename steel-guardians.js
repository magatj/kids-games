/* Steel Guardians: gameplay and presentation orchestration. Static-site compatible. */
(() => {
'use strict';
const $=id=>document.getElementById(id),T=window.THREE;
if(!T||!window.Guardian3D){$('error').hidden=false;return;}
let art;
try{art=Guardian3D.create($('world'));}catch(error){console.error(error);$('error').hidden=false;return;}
const {scene,camera,V}=art,clamp=T.MathUtils.clamp,mix=T.MathUtils.lerp;
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroInfo=[{name:'Atlas Prime',title:'Atlas<span>Prime</span>',description:'Built to hold the line.',vehicle:'Armored interceptor',role:'Vanguard',power:96,speed:62,armor:94},{name:'Yellowjacket',title:'Yellow<span>jacket</span>',description:'Leave the impossible behind.',vehicle:'Electric hypercar',role:'Pathfinder',power:67,speed:98,armor:71}];
const heroes=[art.makeRobot(0),art.makeRobot(1)],previews=[art.makeRobot(0),art.makeRobot(1)];
let heroType=0,player=heroes[0],preview=previews[0];scene.add(player,preview);
preview.position.set(3.3,0,-4.5);preview.rotation.y=-.32;art.poseRobot(preview,1,0);
const keys={},enemies=[],pickups=[];
const state={mode:'menu',car:false,morph:0,morphFrom:0,morphTo:0,transformTime:0,transforming:false,health:100,energy:100,speed:0,heading:0,wave:0,kills:0,waveTotal:0,shot:0,pulse:0,hurt:0,toast:0,nextWave:0,time:0,roam:false,score:0,objectiveTime:0,shake:0,aim:0,selection:0,boost:false,turn:0,elapsed:0};
// All audio is synthesized locally. These named hooks can later accept original samples.
const AudioBus=(()=>{
 let context,master,engine,engineGain,ambient,ambientGain,muted=false;
 function unlock(){
  if(!context){try{context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=.5;master.connect(context.destination);
   engine=context.createOscillator();engine.type='sawtooth';const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=280;engineGain=context.createGain();engineGain.gain.value=0;engine.connect(filter);filter.connect(engineGain);engineGain.connect(master);engine.start();
   ambient=context.createOscillator();ambient.type='sine';ambient.frequency.value=52;ambientGain=context.createGain();ambientGain.gain.value=0;ambient.connect(ambientGain);ambientGain.connect(master);ambient.start();
  }catch{return;}}if(context.state==='suspended')context.resume().catch(()=>{});
 }
 function tone(f,d=.15,type='sine',volume=.04,end=f){if(!context||muted)return;const osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(f,context.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),context.currentTime+d);gain.gain.setValueAtTime(volume,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+d);osc.connect(gain);gain.connect(master);osc.start();osc.stop(context.currentTime+d);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
 const hooks={weapon:()=>tone(240,.11,'triangle',.08,70),impact:()=>tone(135,.14,'sawtooth',.035,30),explosion:()=>{tone(65,.65,'sawtooth',.09,20);tone(115,.25,'triangle',.09,30);},transform:()=>{tone(95,.85,'sawtooth',.045,390);tone(680,1.3,'sine',.028,80);},latch:()=>tone(100,.12,'square',.025,35),shockwave:()=>tone(65,.6,'sawtooth',.075,220),pickup:()=>tone(510,.25,'sine',.06,920),select:()=>tone(400,.18,'sine',.035,650),enemy:()=>tone(135,.12,'triangle',.022,75),boost:()=>tone(150,.3,'sine',.025,350),wave:()=>tone(200,.45,'sine',.055,350),victory:()=>{tone(390,1,'sine',.07,520);tone(585,1,'sine',.05,780);},music:()=>{tone(130.81,3,'sine',.015);tone(196,3,'sine',.009);}};
 function update(s){if(!context)return;const active=s.mode==='playing',now=context.currentTime;engine.frequency.setTargetAtTime(35+Math.abs(s.speed)*3,now,.15);engineGain.gain.setTargetAtTime(active&&s.car?.013+Math.abs(s.speed)*.00035:0,now,.2);ambientGain.gain.setTargetAtTime(active?.008:0,now,.5);}
 return {unlock,play:name=>hooks[name]?.(),update,toggle:()=>{unlock();muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:.5,context.currentTime,.08);return muted;},quiet:()=>{if(engineGain){engineGain.gain.setTargetAtTime(0,context.currentTime,.05);ambientGain.gain.setTargetAtTime(0,context.currentTime,.05);}}};
})();
function toast(text,duration=2.6){$('toast').textContent=text;state.toast=duration;}
function announce(){state.objectiveTime=5.5;}
function syncHero(){const h=heroInfo[heroType];$('heroTitle').innerHTML=h.title;$('heroDescription').textContent=h.description;$('heroClass').textContent=h.role+' / '+h.vehicle;$('name').textContent=h.name;for(const key of ['Power','Speed','Armor'])$('stat'+key).style.width=h[key.toLowerCase()]+'%';document.querySelectorAll('[data-hero]').forEach((b,i)=>{b.classList.toggle('selected',i===heroType);b.setAttribute('aria-pressed',String(i===heroType));});document.documentElement.style.setProperty('--accent',heroType?'#e4c58a':'#b8d3e5');}
function changeHero(type){
 if(!['menu','playing'].includes(state.mode)||type===heroType)return;
 const position=player.position.clone(),rotation=player.rotation.clone();scene.remove(player,preview);heroType=type;player=heroes[type];preview=previews[type];player.position.copy(position);player.rotation.copy(rotation);scene.add(player);preview.position.set(3.3,0,-4.5);preview.rotation.y=-.32;art.poseRobot(preview,1,state.time);if(state.mode==='menu')scene.add(preview);state.selection=1;art.poseRobot(player,state.morph,state.time,state.speed);syncHero();AudioBus.unlock();AudioBus.play('select');if(state.mode==='playing')toast(heroInfo[type].name+' ready');
}
function transform(){
 if(!['menu','playing'].includes(state.mode)||state.transforming)return;
 AudioBus.unlock();AudioBus.play('transform');state.car=!state.car;state.morphFrom=state.morph;state.morphTo=state.car?1:0;state.transformTime=0;state.transforming=true;document.body.classList.add('transforming');
}
function updateTransformation(dt){
 if(!state.transforming)return;const previous=state.transformTime;state.transformTime+=dt;state.morph=mix(state.morphFrom,state.morphTo,smooth(state.transformTime/1.65));
 if(previous<.7&&state.transformTime>=.7){AudioBus.play('latch');art.sparks(player.position.clone().add(V(0,2.4,0)),0xb0d4ec,20,3,.4);}
 if(state.transformTime>=1.65){state.morph=state.morphTo;state.transforming=false;document.body.classList.remove('transforming');AudioBus.play('latch');}
}
function blocked(x,z,r=0){return Math.abs(x)>275||Math.abs(z)>275||art.obstacles.some(o=>Math.abs(x-o.x)<o.w+r&&Math.abs(z-o.z)<o.d+r);}
function move(obj,dx,dz,r=.35){if(!blocked(obj.position.x+dx,obj.position.z,r))obj.position.x+=dx;if(!blocked(obj.position.x,obj.position.z+dz,r))obj.position.z+=dz;}
function clearLine(a,b,r=0){const d=a.distanceTo(b),steps=Math.ceil(d/2);for(let i=1;i<steps;i++){const t=i/steps;if(blocked(mix(a.x,b.x,t),mix(a.z,b.z,t),r))return false;}return true;}
function target(){
 let best=null,dist=100;const f=V(Math.sin(state.heading),0,Math.cos(state.heading));
 for(const e of enemies){const delta=e.model.position.clone().sub(player.position),d=delta.length();if(d<dist&&(delta.normalize().dot(f)>.38||d<14)&&clearLine(player.position,e.model.position)){best=e;dist=d;}}
 return best;
}
// Reusable projectile pool. Trail geometry stays allocated between shots.
const shots=[],shotPool=[];
const shotGeo=art.geometry('plasma-core',()=>new T.SphereGeometry(.1,6,5)),trailGeo=art.geometry('plasma-trail',()=>new T.CylinderGeometry(.048,.012,1,5));
const shotMaterials=[new T.MeshBasicMaterial({color:0xc9efff}),new T.MeshBasicMaterial({color:0xff9068})],trailMaterials=[new T.MeshBasicMaterial({color:0x92cbea,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthWrite:false}),new T.MeshBasicMaterial({color:0xe77b5d,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthWrite:false})];
for(let i=0;i<96;i++){const root=new T.Group(),core=new T.Mesh(shotGeo,shotMaterials[0]),trail=new T.Mesh(trailGeo,trailMaterials[0]);trail.rotation.x=Math.PI/2;trail.position.z=-1.1;trail.scale.y=2.2;root.add(core,trail);root.visible=false;scene.add(root);shotPool.push({root,core,trail,active:false,dir:V(),life:0});}
function bullet(from,to,hostile=false,damage=20,velocity=90){const s=shotPool.find(p=>!p.active);if(!s)return;s.active=true;s.hostile=hostile;s.damage=damage;s.speed=velocity;s.life=2.5;s.root.visible=true;s.root.position.copy(from);s.dir.copy(to).sub(from).normalize();s.root.quaternion.setFromUnitVectors(V(0,0,1),s.dir);s.core.material=shotMaterials[hostile?1:0];s.trail.material=trailMaterials[hostile?1:0];shots.push(s);art.muzzle(from,hostile);}
function releaseShot(s){s.active=false;s.root.visible=false;}
function fire(){
 if(state.shot>0)return;state.shot=heroType?.16:.24;state.aim=1;state.shake=Math.max(state.shake,.055);
 const e=target(),f=V(Math.sin(state.heading),0,Math.cos(state.heading));
 const from=player.position.clone().addScaledVector(f,2);from.y=mix(3.8,1.1,state.morph);
 const to=e?e.model.position.clone().add(V(0,e.center,0)):from.clone().addScaledVector(f,90);
 bullet(from,to,false,heroType?20:30,110);AudioBus.play('weapon');
}
function dropRepair(pos){
 if(pickups.length>=30){const old=pickups.shift();scene.remove(old.model);}
 const g=new T.Group(),core=art.mesh(g,art.geometry('repair',()=>new T.OctahedronGeometry(.38)),art.mats.energy);core.material=repairMaterial;
 const ring=art.mesh(g,art.geometry('repair-ring',()=>new T.TorusGeometry(.6,.017,5,28)),repairMaterial);ring.rotation.x=Math.PI/2;g.position.copy(pos);g.position.y=1.1;scene.add(g);pickups.push({model:g,life:45});
}
const repairMaterial=new T.MeshStandardMaterial({color:0x8ac8a7,emissive:0x65b28a,emissiveIntensity:2,metalness:.6,roughness:.2});
function hitEnemy(e,damage){
 if(!enemies.includes(e))return;e.health-=damage;e.hit=.3;art.sparks(e.model.position.clone().add(V(0,e.center,0)),0xffc7a2,10,6,.4);AudioBus.play('impact');
 if(e.health<=0){const pos=e.model.position.clone();art.burst(pos.clone().add(V(0,e.center,0)),0xffbf82,e.boss?90:38);art.destroy(e.model);enemies.splice(enemies.indexOf(e),1);state.kills++;state.score+=e.boss?1000:e.kind==='heavy'?200:100;dropRepair(pos);announce();state.shake=Math.max(state.shake,.22*Math.max(0,1-pos.distanceTo(player.position)/55));AudioBus.play('explosion');}
}
function pulse(){if(state.mode!=='playing'||state.pulse>0)return;state.pulse=7;AudioBus.unlock();AudioBus.play('shockwave');art.shockwave(player.position);state.shake=.22;for(const e of [...enemies])if(e.model.position.distanceTo(player.position)<19)hitEnemy(e,heroType?65:95);}
function hurt(damage){if(state.hurt>0||state.mode!=='playing'||state.roam)return;state.health=Math.max(0,state.health-damage*(heroType?1:.8));state.hurt=.45;state.shake=.15;AudioBus.play('impact');if(state.health<=0)finish(false);}
function spawnWave(){
 state.wave++;state.kills=0;state.nextWave=0;const count=[5,7,9][state.wave-1];state.waveTotal=count;
 for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2;let x=clamp(Math.round((player.position.x+Math.sin(angle)*70)/60)*60,-240,240),z=clamp(Math.round((player.position.z+Math.cos(angle)*70)/60)*60,-240,240);
  if(Math.hypot(x-player.position.x,z-player.position.z)<28)z=clamp(z+(z>0?-60:60),-240,240);
  const boss=state.wave===3&&i===count-1,kind=boss?'heavy':['scout','soldier','soldier','scout','heavy'][i%5],model=art.makeEnemy(kind,boss);model.position.set(x,0,z+(i%2)*3);scene.add(model);
  const health=boss?440:kind==='scout'?45+state.wave*8:kind==='heavy'?140+state.wave*15:75+state.wave*10;
  enemies.push({model,health,max:health,kind,boss,center:boss?5:kind==='heavy'?3.6:kind==='scout'?2.5:3,hit:0,cooldown:2+i*.35,route:[],routeTime:0,strafe:i%2?1:-1});
 }
 announce();toast(state.wave===3?'The Iron Titan has arrived.':'Hostiles approaching · Wave '+state.wave);AudioBus.play('wave');
}
// Street graph routing prevents enemies becoming trapped behind city blocks.
const nodes=[];for(let x=-240;x<=240;x+=60)for(let z=-240;z<=240;z+=60)nodes.push(V(x,0,z));
function routeTo(from,to){
 const nearest=p=>nodes.filter(n=>clearLine(p,n,.9)).sort((a,b)=>a.distanceToSquared(p)-b.distanceToSquared(p))[0];const start=nearest(from),end=nearest(to);if(!start||!end)return [];
 const path=[start.clone()];let x=start.x,z=start.z;while(x!==end.x||z!==end.z){if(x!==end.x)x+=Math.sign(end.x-x)*60;else z+=Math.sign(end.z-z)*60;path.push(V(x,0,z));}return path;
}
function updateEnemies(dt){
 for(const e of [...enemies]){
  const p=e.model.position,delta=player.position.clone().sub(p),dist=delta.length();e.cooldown-=dt;e.hit=Math.max(0,e.hit-dt);e.routeTime-=dt;
  const los=clearLine(p,player.position,.85),desiredDistance=e.kind==='scout'?11:e.kind==='heavy'?23:17;let movement=0;
  if(dist>desiredDistance||!los){let destination=player.position;if(!los){if(e.routeTime<=0){e.route=routeTo(p,player.position);e.routeTime=2;}while(e.route.length&&e.route[0].distanceTo(p)<2)e.route.shift();destination=e.route[0]||player.position;}
   const dir=destination.clone().sub(p);dir.y=0;dir.normalize();const rate=e.boss?2.5:e.kind==='scout'?7:e.kind==='heavy'?2.8:4.1;move(e.model,dir.x*rate*dt,dir.z*rate*dt,.85);movement=1;
  }else if(e.kind==='scout'&&dist>6){const angle=Math.atan2(delta.x,delta.z)+Math.PI/2;move(e.model,Math.sin(angle)*e.strafe*dt*2,Math.cos(angle)*e.strafe*dt*2,.85);movement=.65;}
  e.model.rotation.y=Math.atan2(delta.x,delta.z);art.poseEnemy(e.model,state.time,movement,e.hit/.3);
  if(e.cooldown<.45&&e.cooldown>0)e.model.userData.material.emissiveIntensity=Math.max(e.model.userData.material.emissiveIntensity,(.45-e.cooldown)*.6);
  if(e.cooldown<=0&&dist<92&&los){
   e.cooldown=e.kind==='scout'?1.75:e.kind==='heavy'?3.1:2.5;const origin=p.clone().add(V(0,e.center,0)),aim=player.position.clone().add(V(0,mix(3,1,state.morph),0));
   if(e.kind==='heavy')for(const spread of [-1,0,1])bullet(origin,aim.clone().add(V(spread*3,0,0)),true,e.boss?13:10,24);else bullet(origin,aim,true,e.kind==='scout'?5:8,e.kind==='scout'?38:30);AudioBus.play('enemy');
  }
  if(dist<4&&state.car&&Math.abs(state.speed)>10){hitEnemy(e,Math.abs(state.speed)*4);state.speed*=.72;state.shake=.17;art.sparks(p,0xffc596,20,9,.4);}else if(dist<3.3)hurt(5);
 }
}
function updateShots(dt){
 for(let i=shots.length-1;i>=0;i--){const s=shots[i],before=s.root.position.clone(),length=s.speed*dt;s.life-=dt;let hit=false;
  for(let j=1;j<=Math.ceil(length/.6);j++){
   const p=before.clone().addScaledVector(s.dir,Math.min(length,j*.6));s.root.position.copy(p);if(blocked(p.x,p.z)){art.sparks(p,0xd6c3a4,5,3,.2);hit=true;break;}
   if(s.hostile){const center=player.position.clone().add(V(0,mix(3,1,state.morph),0));if(p.distanceTo(center)<mix(1.65,1.5,state.morph)){hurt(s.damage);art.sparks(p,0xffc499,8,4,.3);hit=true;}}
   else for(const e of [...enemies])if(p.distanceTo(e.model.position.clone().add(V(0,e.center,0)))<(e.boss?2.6:e.kind==='heavy'?1.9:e.kind==='scout'?1.15:1.5)){hitEnemy(e,s.damage);hit=true;break;}
   if(hit)break;
  }
  if(hit||s.life<=0){releaseShot(s);shots.splice(i,1);}
 }
}
function clearKeys(){for(const key in keys)delete keys[key];}
function resetWorld(){for(const e of enemies){scene.remove(e.model);art.disposeEnemy(e.model);}enemies.length=0;for(const p of pickups)scene.remove(p.model);pickups.length=0;for(const s of shots)releaseShot(s);shots.length=0;art.clearEffects();}
function start(){
 AudioBus.unlock();resetWorld();Object.assign(state,{mode:'playing',car:false,morph:0,transforming:false,transformTime:0,health:100,energy:100,speed:0,heading:Math.PI,wave:0,kills:0,shot:0,pulse:0,hurt:0,nextWave:0,roam:false,score:0,shake:0,aim:0,elapsed:0,boost:false});player.position.set(0,0,15);player.rotation.set(0,Math.PI,0);art.poseRobot(player,0,state.time);scene.remove(preview);clearKeys();$('menu').hidden=true;$('dialog').hidden=true;$('hud').hidden=false;$('pause').hidden=false;document.body.classList.add('playing');document.body.classList.remove('transforming','vehicle','aiming');cameraHeading=Math.PI;camera.position.set(-2,5.5,28);cameraFocus.copy(player.position).add(V(0,3.2,-3));spawnWave();
}
function showDialog(tag,title,text,action){$('dialog').hidden=false;$('dialogTag').textContent=tag;$('dialogTitle').textContent=title;$('dialogText').textContent=text;$('resume').textContent=action;$('helpControls').hidden=!['paused','help'].includes(state.mode);$('restart').hidden=state.mode==='help';}
function finish(win){state.mode=win?'win':'lost';clearKeys();AudioBus.quiet();showDialog(win?'City Shield · Complete':'Guardian recovery',win?'A city reclaimed.':'Rise again.',win?`The Iron Legion is defeated. ${state.score.toLocaleString()} points earned. Keep exploring Nova City, or begin a fresh mission.`:'Repair cores restore armor. Transform to escape, and use shockwave when surrounded.',win?'Explore the city ↗':'Try again ↗');if(win)AudioBus.play('victory');}
function pause(){if(state.mode==='playing'){state.mode='paused';clearKeys();AudioBus.quiet();showDialog('A moment of calm','Take a breath.','Your guardian is waiting.','Continue ↗');}else if(state.mode==='paused'){state.mode='playing';$('dialog').hidden=true;AudioBus.unlock();}}
function resume(){if(state.mode==='lost')start();else if(state.mode==='win'){state.mode='playing';state.roam=true;state.health=100;state.objectiveTime=6;$('dialog').hidden=true;toast('Nova City is yours.');}else if(state.mode==='help'){state.mode='menu';$('dialog').hidden=true;}else pause();}
let cameraHeading=0,cameraFocus=V(-1.3,3,0),hudTick=0,mouseFire=false,musicTime=0;
function updateCamera(dt){
 const cinematic=state.transforming?Math.sin(state.transformTime/1.65*Math.PI):0;
 if(state.mode==='menu'||state.mode==='help'){
  const orbit=reducedMotion?0:Math.sin(state.time*.12)*.55;
  const aspect=camera.aspect,mobile=aspect<1.15;
  const desired=V(8.5+orbit+state.selection*1.1+cinematic*1.4,mix(5.2,3.5,state.morph),mix(11.5,10.7,state.morph));
  if(mobile){desired.multiplyScalar(1.3);desired.y+=1.3;}
  camera.position.lerp(desired,1-Math.exp(-dt*2.5));cameraFocus.lerp(V(mobile?-1:-1.6,mix(3.05,1.2,state.morph),0),1-Math.exp(-dt*3));camera.lookAt(cameraFocus);camera.fov=mix(camera.fov,mobile?49:43,1-Math.exp(-dt*3));
 }else{
  const delta=Math.atan2(Math.sin(state.heading-cameraHeading),Math.cos(state.heading-cameraHeading));cameraHeading+=delta*(1-Math.exp(-dt*(state.car?4:7)));
  const forward=V(Math.sin(cameraHeading),0,Math.cos(cameraHeading)),right=V(Math.cos(cameraHeading),0,-Math.sin(cameraHeading));
  const speedRatio=clamp(Math.abs(state.speed)/42,0,1),shoulder=mix(1.9,.45,state.morph)+(reducedMotion?0:cinematic*2.7);
  const behind=mix(11.5,10.5,state.morph)+speedRatio*2+cinematic*2;
  let desired=player.position.clone().addScaledVector(forward,-behind).addScaledVector(right,shoulder);desired.y+=mix(5.2,3.5,state.morph)+cinematic*.8;
  const focus=player.position.clone().addScaledVector(forward,mix(4.5,6,state.morph));focus.y+=mix(3.6,1.5,state.morph);cameraFocus.lerp(focus,1-Math.exp(-dt*7));
  // Shorten the camera boom at walls, instead of jumping abruptly above buildings.
  const anchor=player.position.clone().add(V(0,mix(3.5,1.7,state.morph),0));const length=anchor.distanceTo(desired);
  for(let d=1;d<length;d+=.65){const p=anchor.clone().lerp(desired,d/length);if(art.obstacles.some(o=>p.y<o.h+1&&Math.abs(p.x-o.x)<o.w+.5&&Math.abs(p.z-o.z)<o.d+.5)){desired=anchor.clone().lerp(desired,Math.max(.12,(d-.9)/length));break;}}
  camera.position.lerp(desired,1-Math.exp(-dt*(state.car?5:7)));
  if(!reducedMotion){const shake=state.shake+(state.boost?.027:0);camera.position.x+=Math.sin(state.time*81)*shake;camera.position.y+=Math.sin(state.time*67)*shake*.6;}
  camera.lookAt(cameraFocus);const fov=mix(50,57,state.morph)+speedRatio*9+(state.boost?4:0)-state.aim*2;camera.fov=mix(camera.fov,fov,1-Math.exp(-dt*3));
 }
 camera.updateProjectionMatrix();
}
const radar=$('radar').getContext('2d');
function drawRadar(){
 const size=240,center=120,scale=.395;radar.clearRect(0,0,size,size);radar.save();radar.beginPath();radar.arc(center,center,108,0,Math.PI*2);radar.clip();radar.fillStyle='#101d2844';radar.fillRect(0,0,size,size);radar.strokeStyle='#aebdcc18';radar.lineWidth=1;
 for(let x=-240;x<=240;x+=60){radar.beginPath();radar.moveTo(center+x*scale,5);radar.lineTo(center+x*scale,235);radar.stroke();radar.beginPath();radar.moveTo(5,center+x*scale);radar.lineTo(235,center+x*scale);radar.stroke();}
 for(const p of pickups){radar.fillStyle='#96c7a7';radar.fillRect(center-2+p.model.position.x*scale,center-2+p.model.position.z*scale,4,4);}
 for(const e of enemies){radar.fillStyle=e.boss?'#e9b785':'#cd8f72';radar.beginPath();radar.arc(center+e.model.position.x*scale,center+e.model.position.z*scale,e.boss?5:2.5,0,Math.PI*2);radar.fill();}
 radar.save();radar.translate(center+player.position.x*scale,center+player.position.z*scale);radar.rotate(-state.heading);radar.fillStyle='#e7f1f5';radar.beginPath();radar.moveTo(0,6);radar.lineTo(-4,-4);radar.lineTo(0,-2);radar.lineTo(4,-4);radar.closePath();radar.fill();radar.restore();radar.restore();radar.strokeStyle='#d0dce729';radar.beginPath();radar.arc(center,center,108,0,Math.PI*2);radar.stroke();
}
function updateHUD(dt){
 hudTick+=dt;if(hudTick<.08)return;hudTick=0;
 $('health').style.width=state.health+'%';$('health').style.background=state.health<30?'#d89486':'#dce7ed';$('healthText').innerHTML=Math.ceil(state.health)+'<span>%</span>';$('energy').style.width=state.energy+'%';$('energyText').textContent=Math.ceil(state.energy)+'%';$('form').textContent=state.transforming?'Shifting':state.car?'Vehicle':'Robot';$('speed').textContent=Math.round(Math.abs(state.speed)*5);$('wave').textContent=state.roam?'Free drive':'Wave '+state.wave+' of 3';$('remaining').textContent=state.roam?'':state.kills+' / '+state.waveTotal;$('waveProgress').style.width=(state.waveTotal?state.kills/state.waveTotal*100:0)+'%';
 $('ability').textContent=state.pulse>0?Math.ceil(state.pulse)+'s':'Shockwave';$('pulseCooldown').style.transform='scaleX('+state.pulse/7+')';$('pulse').setAttribute('aria-label',state.pulse>0?'Shockwave ready in '+Math.ceil(state.pulse)+' seconds':'Shockwave (E)');$('missionTitle').textContent=state.roam?'City secured':'City Shield';$('objective').textContent=state.roam?'Make the city your own.':state.wave===3?'Neutralize the Iron Titan':'Neutralize hostile units';$('mission').classList.toggle('visible',state.objectiveTime>0);$('radarCaption').textContent=state.roam?'City secured':enemies.length+' hostiles';
 $('toast').style.opacity=state.toast>0?1:0;$('damageFlash').style.opacity=state.hurt*.7;$('controlHint').style.opacity=state.elapsed<14?1:0;
 document.body.classList.toggle('vehicle',state.morph>.5);document.body.classList.toggle('aiming',state.aim>.1);const e=target();$('reticle').classList.toggle('locked',!!e);$('targetLabel').textContent=e?(e.boss?'Iron Titan':e.kind[0].toUpperCase()+e.kind.slice(1))+' · '+Math.ceil(e.health/e.max*100)+'%':'';drawRadar();
}
function update(dt){
 state.time+=dt;state.elapsed+=dt;for(const key of ['shot','pulse','hurt','toast','objectiveTime','aim'])state[key]=Math.max(0,state[key]-dt);state.shake=Math.max(0,state.shake-dt*.55);state.selection=Math.max(0,state.selection-dt*.8);updateTransformation(dt);
 const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),turn=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0),boost=!!((keys.ShiftLeft||keys.ShiftRight)&&forward>0&&state.energy>2);
 if(boost&&!state.boost)AudioBus.play('boost');state.boost=boost;state.turn=turn;
 const max=mix(heroType?10:8,heroType?29:23,state.morph);state.speed=mix(state.speed,forward*max*(boost?1.75:1),1-Math.exp(-dt*mix(8,2.5,state.morph)));state.energy=clamp(state.energy+(boost?-24:14)*dt,0,100);state.heading+=turn*dt*mix(2.6,1.55,state.morph)*(state.speed<-.5?-1:1);player.rotation.y=state.heading;
 const old=player.position.clone();move(player,Math.sin(state.heading)*state.speed*dt,Math.cos(state.heading)*state.speed*dt,state.car?.2:.4);if(player.position.distanceTo(old)<Math.abs(state.speed)*dt*.25)state.speed*=.7;art.poseRobot(player,state.morph,state.time,state.speed,dt,turn);
 if(state.car&&Math.abs(state.speed)>5&&Math.random()<dt*14){const exhaust=player.position.clone().add(V(-Math.sin(state.heading)*2.7,.45,-Math.cos(state.heading)*2.7));if(boost)art.sparks(exhaust,0x99d9f5,9,3,.3);else if(turn)art.smoke(exhaust,1);}
 art.mats.tail.emissiveIntensity=forward<0?4:1.4;
 if(keys.Space||mouseFire)fire();updateEnemies(dt);updateShots(dt);
 for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.life-=dt;p.model.rotation.y+=dt;p.model.position.y=1.1+Math.sin(state.time*2+i)*.18;if(p.model.position.distanceTo(player.position)<3.5){state.health=Math.min(100,state.health+18);state.energy=Math.min(100,state.energy+25);p.life=0;AudioBus.play('pickup');toast('Armor restored +18',1.6);}if(p.life<=0){scene.remove(p.model);pickups.splice(i,1);}}
 if(!enemies.length&&!state.roam&&state.mode==='playing'){state.nextWave+=dt;if(state.nextWave>3){if(state.wave<3){state.health=Math.min(100,state.health+25);spawnWave();}else finish(true);}else if(state.nextWave<dt*2)toast(state.wave===3?'The city is safe.':'Wave cleared · Armor recovering');}
 art.updateEffects(dt,state.time);updateCamera(dt);art.lighting(player.position,false,heroType,dt);updateHUD(dt);AudioBus.update(state);musicTime+=dt;if(musicTime>28){musicTime=0;AudioBus.play('music');}
}
function refreshQuality(){const q=art.getQuality(),label=['Low','Medium','High'][q];$('quality').innerHTML=label+' <span>⌄</span>';$('quality').setAttribute('aria-label','Graphics quality: '+label);document.body.classList.toggle('low-quality',q===0);}
function userAction(action){return ()=>{AudioBus.unlock();action();};}
$('start').onclick=start;$('preview').onclick=transform;$('transform').onclick=transform;$('touchTransform').onclick=transform;$('pulse').onclick=userAction(pulse);$('switch').onclick=()=>changeHero(1-heroType);$('pause').onclick=pause;$('restart').onclick=start;$('resume').onclick=resume;
$('help').onclick=()=>{state.mode='help';showDialog('Your city. Your rules.','Become a guardian.','Defeat three waves of the Iron Legion, then enjoy free driving.','Got it ↗');};
$('sound').onclick=()=>{const muted=AudioBus.toggle();$('sound').setAttribute('aria-pressed',String(muted));$('sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');};
$('quality').onclick=()=>{art.setQuality((art.getQuality()+1)%3);refreshQuality();};
for(const b of document.querySelectorAll('[data-hero]'))b.onclick=()=>changeHero(Number(b.dataset.hero));
for(const b of document.querySelectorAll('[data-key]')){
 b.addEventListener('pointerdown',e=>{e.preventDefault();AudioBus.unlock();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>delete keys[b.dataset.key]);
}
addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&state.mode==='playing')e.preventDefault();keys[e.code]=true;if(e.repeat)return;
 if(e.code==='KeyT')transform();if(e.code==='KeyC')changeHero(1-heroType);if(e.code==='KeyE')pulse();if(e.code==='Escape'||e.code==='KeyP'){if(state.mode==='help')resume();else pause();}if(e.code==='Enter'&&state.mode==='menu')start();
});addEventListener('keyup',e=>delete keys[e.code]);
function loseFocus(){clearKeys();mouseFire=false;if(state.mode==='playing')pause();AudioBus.quiet();}
addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});
$('world').addEventListener('pointerdown',e=>{if(state.mode==='playing'&&e.button===0){mouseFire=true;AudioBus.unlock();$('world').setPointerCapture(e.pointerId);}});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(event,()=>mouseFire=false);$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();loseFocus();$('errorText').textContent='The graphics connection was interrupted. Reload this page to reconnect.';$('error').hidden=false;});
addEventListener('resize',()=>art.resize());
let last=performance.now(),testFrozen=false;
function frame(now){
 requestAnimationFrame(frame);const elapsed=(now-last)/1000,dt=Math.min(elapsed,.05);last=now;if(document.hidden||testFrozen)return;
 if(state.mode==='menu'||state.mode==='help'){
  state.time+=dt;state.selection=Math.max(0,state.selection-dt*.8);updateTransformation(dt);player.rotation.y=mix(player.rotation.y,-.16+(reducedMotion?0:Math.sin(state.time*.18)*.09),1-Math.exp(-dt*2));art.poseRobot(player,state.morph,state.time);art.poseRobot(preview,1,state.time);updateCamera(dt);art.lighting(player.position,true,heroType,dt);art.updateEffects(dt,state.time);
 }else if(state.mode==='playing')update(dt);
 art.adapt(elapsed);art.render();
}
syncHero();refreshQuality();camera.position.set(8.5,5.2,11.5);camera.lookAt(-1.6,3.05,0);requestAnimationFrame(frame);
// Explicit test mode exposes deterministic simulation controls, absent in normal play.
if(new URLSearchParams(location.search).has('test'))window.__guardianTest={state,keys,heroes,previews,enemies,pickups,shots,art,start,transform,pulse,changeHero,hitEnemy,hurt,pause,resume,blocked,clearLine,routeTo,update,player:()=>player,freeze:value=>testFrozen=value,step:seconds=>{for(let t=0;t<seconds;t+=1/60){if(state.mode==='playing')update(1/60);else{state.time+=1/60;updateTransformation(1/60);art.poseRobot(player,state.morph,state.time);updateCamera(1/60);art.updateEffects(1/60,state.time);}}art.render();},snapshot:()=>({mode:state.mode,hero:heroType,car:state.car,morph:state.morph,health:state.health,energy:state.energy,speed:state.speed,wave:state.wave,kills:state.kills,enemies:enemies.map(e=>({kind:e.kind,boss:e.boss,health:e.health})),position:player.position.toArray(),stats:art.stats()})};
})();
