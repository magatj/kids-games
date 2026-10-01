/* Procedural art and rendering. All assets are local; no runtime build step. */
(function () {
'use strict';
const T=window.THREE;if(!T)return;
const clamp=T.MathUtils.clamp,mix=T.MathUtils.lerp,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const geometries=new Map();
function geometry(key,create){if(!geometries.has(key))geometries.set(key,create());return geometries.get(key);}
const cube=geometry('box',()=>new T.BoxGeometry(1,1,1));
const sphere=geometry('sphere',()=>new T.SphereGeometry(1,16,10));
const cylinder=geometry('cylinder',()=>new T.CylinderGeometry(1,1,1,20));
const boltGeo=geometry('bolt',()=>new T.CylinderGeometry(1,1,1,6));
const bevel=geometry('bevel',()=>{
 const s=new T.Shape();s.moveTo(-.42,-.42);s.lineTo(.42,-.42);s.lineTo(.42,.42);s.lineTo(-.42,.42);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.84,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:2,steps:1,curveSegments:1});g.translate(0,0,-.42);return g;
});
const armorGeo=geometry('armor',()=>{
 const s=new T.Shape();s.moveTo(-.36,-.46);s.lineTo(.36,-.46);s.lineTo(.48,.18);s.lineTo(.28,.46);s.lineTo(-.28,.46);s.lineTo(-.48,.18);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.15,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:2,steps:1});g.translate(0,0,-.075);return g;
});
function mesh(parent,g,m,scale=[1,1,1],pos=[0,0,0]){const o=new T.Mesh(g,m);o.scale.set(...scale);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const plate=(p,m,w,h,d,x=0,y=0,z=0)=>mesh(p,bevel,m,[w,h,d],[x,y,z]);
const block=(p,m,w,h,d,x=0,y=0,z=0)=>mesh(p,cube,m,[w,h,d],[x,y,z]);
const armor=(p,m,w,h,d,x=0,y=0,z=0)=>mesh(p,armorGeo,m,[w,h,d],[x,y,z]);
function tube(p,m,r,h,x=0,y=0,z=0,axis='y'){const o=mesh(p,cylinder,m,[r,h,r],[x,y,z]);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o;}
const pbr=(color,metalness=.65,roughness=.35)=>new T.MeshStandardMaterial({color,metalness,roughness,envMapIntensity:.85});
const paint=color=>new T.MeshPhysicalMaterial({color,metalness:.72,roughness:.27,clearcoat:1,clearcoatRoughness:.2,envMapIntensity:1});
const emit=(color,intensity=3)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.3,metalness:.2});
const mats={frame:pbr(0x20272d,.8,.46),joint:pbr(0x10161c,.62,.56),chrome:pbr(0x9fa9ae,.94,.22),silver:pbr(0x667780,.82,.34),rubber:pbr(0x111417,.03,.95),blue:paint(0x234565),red:paint(0x923735),yellow:paint(0xc3912e),black:paint(0x293038),glass:new T.MeshPhysicalMaterial({color:0x345366,metalness:.3,roughness:.08,transparent:true,opacity:.87,clearcoat:1,envMapIntensity:1.4}),energy:emit(0x83c9ec,3.8),warm:emit(0xf0c294,2.6),evil:emit(0xff6243,3.8),tail:emit(0xd14438,1.5),white:emit(0xc9dce6,3),enemy:pbr(0x5c656b,.8,.44),heavy:pbr(0x626358,.78,.48)};
function texture(w,h,paintFn){const c=document.createElement('canvas');c.width=w;c.height=h;paintFn(c.getContext('2d'),w,h);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;}
// Instance each rig by shared geometry/material, while retaining the articulated hierarchy.
function batchRig(root){
 const groups=new Map();root.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.uuid+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});
 root.userData.rig=[];
 for(const list of groups.values()){
  const batch=new T.InstancedMesh(list[0].geometry,list[0].material,list.length);batch.instanceMatrix.setUsage(T.DynamicDrawUsage);batch.castShadow=true;batch.receiveShadow=true;batch.frustumCulled=false;root.add(batch);
  for(const o of list)o.visible=false;root.userData.rig.push({batch,list});
 }
 updateRig(root);
}
const rigInverse=new T.Matrix4(),rigMatrix=new T.Matrix4();
function updateRig(root){
 if(!root.userData.rig)return;root.updateMatrixWorld(true);rigInverse.copy(root.matrixWorld).invert();
 for(const {batch,list} of root.userData.rig){list.forEach((o,i)=>{rigMatrix.multiplyMatrices(rigInverse,o.matrixWorld);batch.setMatrixAt(i,rigMatrix);});batch.instanceMatrix.needsUpdate=true;}
}
let seed=1729;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function makeRobot(type=0){
 const root=new T.Group(),parts=[],wheels=[],limbs=[],paintMat=type?mats.yellow:mats.red,trim=type?mats.black:mats.blue;root.name=type?'Yellowjacket':'Atlas Prime';
 // Full-size components interpolate between two mechanical poses. No model reveal.
 function part(name,r,c,build,rr=[0,0,0],cr=[0,0,0],timing=[0,1],arc=0){
  const p=new T.Group();p.name=name;root.add(p);build(p);parts.push({p,r:V(...r),c:V(...c),rq:new T.Quaternion().setFromEuler(new T.Euler(...rr)),cq:new T.Quaternion().setFromEuler(new T.Euler(...cr)),timing,arc});return p;
 }
 part('spine',[0,3.3,-.18],[0,.75,-.2],p=>{plate(p,mats.frame,1.15,1.55,.65);for(let i=0;i<5;i++)plate(p,mats.silver,1.2,.1,.85,0,-.55+i*.24,.04);tube(p,mats.chrome,.13,1.4,-.45,0,.47);tube(p,mats.chrome,.13,1.4,.45,0,.47);},[0,0,0],[Math.PI/2,0,0],[.05,.85]);
 for(const s of [-1,1])part('hood'+s,[s*.62,4.4,.32],[s*.62,1.19,1.33],p=>{
  armor(p,paintMat,1.16,1.53,2,0,0,.18);armor(p,trim,1.03,.58,1.15,0,-.29,.39);plate(p,mats.chrome,.76,.045,.075,0,.45,.4);plate(p,mats.energy,.6,.045,.055,0,.28,.46);for(let i=0;i<3;i++)plate(p,mats.joint,.3,.032,.04,s*.21,-.37+i*.085,.57);
 },[0,0,-s*.07],[-Math.PI/2,0,0],[.22,.84],.5);
 part('reactor',[0,4.32,.45],[0,.99,.17],p=>{tube(p,mats.joint,.41,.25,0,0,0,'z');tube(p,mats.chrome,.31,.28,0,0,0,'z');tube(p,mats.energy,.2,.3,0,0,0,'z');for(let i=0;i<6;i++){const a=i/6*Math.PI*2;plate(p,mats.silver,.07,.15,.05,Math.sin(a)*.29,Math.cos(a)*.29,.17).rotation.z=-a;}},[0,0,0],[-Math.PI/2,0,0],[0,.48]);
 part('head',[0,5.53,.05],[0,.82,-.25],p=>{
  mesh(p,sphere,mats.joint,[.38,.43,.37]);armor(p,trim,.82,.88,2,0,.04,0);armor(p,mats.silver,.54,.43,.7,0,-.14,.29);plate(p,mats.joint,.63,.18,.15,0,.14,.35);
  for(const s of [-1,1]){plate(p,mats.energy,.22,.065,.035,s*.18,.15,.445).rotation.z=s*.08;armor(p,paintMat,.21,.68,1,s*.42,.17,-.01);if(!type)plate(p,trim,.11,.47,.19,s*.47,.63,-.12);}
  plate(p,paintMat,.21,.27,.6,0,.47,-.1);plate(p,mats.frame,.1,.31,.05,0,-.12,.42);
 },[0,0,0],[Math.PI/2,0,0],[0,.48]);
 part('canopy',[0,4.27,-.81],[0,type?1.49:1.72,-.28],p=>{
  plate(p,trim,1.92,.2,1.62,0,.36,0);plate(p,mats.glass,1.79,.71,.1,0,.03,.66).rotation.x=-.48;plate(p,mats.glass,1.75,.57,.08,0,.04,-.7).rotation.x=.3;
  for(const s of [-1,1]){plate(p,paintMat,.1,.68,1.62,s*.94,0,0);plate(p,mats.glass,.05,.45,1.06,s*.96,.04,-.05);plate(p,mats.chrome,.045,.65,.09,s*.88,.05,.76).rotation.x=-.48;}
  if(!type)for(const s of [-1,1]){tube(p,mats.chrome,.1,1.3,s*1.1,.15,-.6);tube(p,mats.frame,.13,.08,s*1.1,.83,-.6);}
 },[.22,0,0],[0,0,0],[.15,.92],.5);
 part('bumper',[0,2.71,.12],[0,.64,2.05],p=>{
  plate(p,trim,1.9,.48,.63);armor(p,mats.chrome,.68,.4,1.8,0,0,.4);for(const s of [-1,1])plate(p,mats.white,.46,.065,.05,s*.63,.05,.36);for(let i=-3;i<=3;i++)plate(p,mats.frame,.035,.19,.05,i*.1,-.02,.64);
 },[0,0,0],[0,0,0],[.3,1],.15);
 for(const s of [-1,1]){
  const upperArm=part('upper-arm'+s,[s*1.42,3.88,-.03],[s*1.19,.82,-.23],p=>{mesh(p,sphere,mats.joint,[.35,.4,.35],[0,.36,0]);tube(p,mats.chrome,.12,.94);armor(p,trim,.58,.85,2.3,0,-.1,.07);tube(p,mats.silver,.22,.64,0,-.45,0,'x');},[.03,0,-s*.08],[Math.PI/2,0,0],[.05,.7],.55);limbs.push({p:upperArm,side:s,kind:'arm'});
  const arm=part('forearm'+s,[s*1.59,2.98,.03],[s*1.21,.81,-1.09],p=>{
   armor(p,paintMat,.68,.91,2.3,0,.03,0);plate(p,mats.silver,.43,.08,.12,0,.27,.4);plate(p,mats.joint,.5,.27,.51,0,-.56,.05);for(let i=0;i<3;i++)plate(p,mats.chrome,.1,.24,.11,(i-1)*.14,-.57,.35);if(s===-1){tube(p,mats.frame,.2,.8,0,.03,.46);tube(p,mats.energy,.12,.09,0,-.41,.46);}
  },[.05,0,-s*.035],[-Math.PI/2,0,0],[.04,.65],.65);limbs.push({p:arm,side:s,kind:'forearm'});
  part('fender'+s,[s*1.56,4.79,-.01],[s*1.19,1.01,1.43],p=>{
   armor(p,paintMat,1.09,.83,3.7);plate(p,trim,.98,.17,1.03,0,.46,-.06);armor(p,mats.silver,.7,.25,1.1,0,.25,.54);plate(p,mats.white,.5,.07,.05,0,-.19,.6);for(const j of [-1,1])mesh(p,boltGeo,mats.chrome,[.055,.04,.055],[j*.32,.24,.54]).rotation.x=Math.PI/2;
  },[0,0,-s*.12],[0,0,0],[.42,1],.7);
  const thigh=part('thigh'+s,[s*.57,2.14,-.06],[s*.56,.9,-1.36],p=>{
   mesh(p,sphere,mats.joint,[.29,.28,.3],[0,.43,0]);tube(p,mats.chrome,.13,.87);armor(p,mats.silver,.72,1.07,2.9,0,0,.04);armor(p,trim,.56,.76,.85,0,.02,.37);tube(p,mats.joint,.28,.75,0,-.54,.02,'x');tube(p,mats.chrome,.14,.81,0,-.54,.02,'x');
  },[0,0,0],[Math.PI/2,0,0],[.25,.92],.25);limbs.push({p:thigh,side:s,kind:'thigh'});
  const shin=part('shin'+s,[s*.62,1.01,-.05],[s*.62,.88,-1.83],p=>{armor(p,trim,.88,1.29,3.1);armor(p,paintMat,.65,.9,.9,0,.02,.44);plate(p,mats.energy,.045,.4,.04,s*.2,.09,.55);tube(p,mats.chrome,.055,.91,s*.4,-.05,.13);armor(p,mats.chrome,.49,.29,.9,0,.49,.5);},[0,0,0],[Math.PI/2,0,0],[.18,.95],.65);limbs.push({p:shin,side:s,kind:'shin'});
  const foot=part('foot'+s,[s*.65,.23,.24],[s*.64,.8,-2.3],p=>{plate(p,mats.joint,.88,.19,1.4,0,-.05,.06);armor(p,trim,.92,1.05,2,0,.12,.25).rotation.x=-Math.PI/2;plate(p,mats.chrome,.7,.1,.12,0,.14,.8);plate(p,mats.tail,.5,.055,.06,0,.29,-.53);},[0,0,0],[0,Math.PI,0],[.35,1],.3);limbs.push({p:foot,side:s,kind:'foot'});
  for(const j of [-1,1]){
   const wheel=part('wheel'+s+j,[s*(j>0?1.9:.98),j>0?4.63:.95,-.32],[s*1.35,.59,j*1.47],p=>{
    const spin=new T.Group();p.add(spin);spin.rotation.z=Math.PI/2;tube(spin,mats.rubber,.57,.33);tube(spin,mats.chrome,.41,.35);tube(spin,mats.frame,.34,.37);
    for(let k=0;k<7;k++){const a=k/7*Math.PI*2;plate(spin,mats.chrome,.07,.045,.34,Math.sin(a)*.16,s*.2,Math.cos(a)*.16).rotation.y=a;}
    tube(spin,mats.silver,.12,.43);tube(spin,trim,.073,.44);const ring=mesh(spin,geometry('tire-ring',()=>new T.TorusGeometry(.46,.012,4,24)),mats.frame,[1,1,1],[0,.184,0]);ring.rotation.x=Math.PI/2;p.userData.spin=spin;
   },[0,0,0],[0,0,0],[.35,.97],.95);wheels.push(wheel);
  }
  part('exhaust'+s,[s*.62,3.5,-.64],[s*.72,.72,-2.65],p=>{tube(p,mats.frame,.2,.31,0,0,0,'z');tube(p,mats.energy,.13,.33,0,0,0,'z');},[0,0,0],[0,0,0],[.18,.9]);
 }
 const headlights=new T.SpotLight(0xc6e2ff,0,50,.55,.65,1.5);headlights.position.set(0,1.08,1.9);headlights.target.position.set(0,.05,25);root.add(headlights,headlights.target);
 root.userData={parts,wheels,limbs,headlights,type,wheelAngle:0};poseRobot(root,0,0);batchRig(root);return root;
}
function poseRobot(root,amount,time,speed=0,dt=0,turn=0){
 const u=root.userData,gait=Math.sin(time*(u.type?10:8)),weight=1-smooth(amount*2);
 for(const d of u.parts){const t=smooth((amount-d.timing[0])/(d.timing[1]-d.timing[0]));d.p.position.lerpVectors(d.r,d.c,t);d.p.position.y+=Math.sin(t*Math.PI)*d.arc;d.p.quaternion.slerpQuaternions(d.rq,d.cq,t);}
 const walking=Math.min(1,Math.abs(speed)/7)*weight;
 for(const l of u.limbs){const swing=gait*l.side*walking;if(l.kind==='thigh')l.p.rotation.x+=swing*.22;if(l.kind==='shin')l.p.rotation.x+=Math.max(0,-swing)*.25;if(l.kind==='foot')l.p.position.y+=Math.max(0,swing)*.18;if(l.kind==='arm')l.p.rotation.x-=swing*.24;if(l.kind==='forearm')l.p.rotation.x-=swing*.14;}
 u.wheelAngle+=speed*dt/.57;for(const w of u.wheels){w.userData.spin.rotation.y=u.wheelAngle;w.rotation.y+=turn*.22*smooth(amount);}u.headlights.intensity=smooth(amount)*32;
 root.rotation.z=mix(root.rotation.z,-turn*Math.min(Math.abs(speed)/25,1)*.045*smooth(amount),.1);root.position.y=Math.abs(gait)*walking*.065+Math.sin(time*18)*Math.min(Math.abs(speed)/35,1)*.016*amount;updateRig(root);
}
function makeEnemy(kind='soldier',boss=false){
 const root=new T.Group(),body=new T.Group(),legs=[],arms=[],heavy=kind==='heavy',scout=kind==='scout';root.add(body);
 const material=(heavy?mats.heavy:mats.enemy).clone();material.emissive=new T.Color(0xff694f);material.emissiveIntensity=0;
 armor(body,material,heavy?2.25:scout?1.12:1.6,heavy?1.65:1.18,heavy?5:3,0,3.22,0).rotation.x=-.12;armor(body,mats.frame,heavy?1.6:1.05,.86,2,0,3.03,.47);tube(body,mats.evil,heavy?.25:.16,.08,0,3.36,.61,'z');plate(body,mats.frame,.65,.64,.67,0,2.29,0);tube(body,mats.chrome,.15,.72,0,2.62,-.15);
 if(scout){mesh(body,sphere,mats.frame,[.49,.32,.43],[0,4.01,0]);plate(body,mats.evil,.62,.075,.12,0,4.04,.39);for(const s of [-1,1])armor(body,mats.silver,.2,1.2,1,s*.34,4.38,-.24).rotation.z=s*.5;}
 else{armor(body,material,.72,.65,2,0,4.22,0);plate(body,mats.joint,.63,.21,.1,0,4.25,.3);plate(body,mats.evil,.45,.065,.11,0,4.28,.35);}
 for(const s of [-1,1]){
  const leg=new T.Group();leg.position.set(s*(heavy?.67:.43),2.2,0);body.add(leg);legs.push({p:leg,s});tube(leg,mats.chrome,.13,.86,0,-.4,0);armor(leg,material,heavy?.77:.48,.86,2,0,-.39,.12);tube(leg,mats.joint,.2,.57,0,-.9,.03,'x');armor(leg,material,heavy?.9:.53,1.05,heavy?3:1.7,0,-1.45,.03);plate(leg,mats.frame,heavy?.93:.57,.27,1,0,-2.02,.23);if(scout)tube(leg,mats.chrome,.07,.95,s*.2,-1.4,-.18);
  const arm=new T.Group();arm.position.set(s*(heavy?1.35:scout?.85:1.04),3.66,0);body.add(arm);arms.push(arm);armor(arm,material,heavy?1.1:scout?.58:.86,.68,heavy?4:2.5,0,0,0).rotation.z=-s*.28;tube(arm,mats.chrome,.11,.8,0,-.5,0);armor(arm,mats.frame,.46,.75,2,0,-.65,0);tube(arm,mats.frame,heavy?.25:.15,heavy?1.5:.8,0,-.81,.29,'z');tube(arm,mats.evil,heavy?.14:.08,.06,0,-.81,heavy?1.07:.71,'z');
  if(heavy){plate(body,material,.61,.5,1.2,s*.8,4.13,-.28);for(let j=0;j<3;j++)tube(body,mats.joint,.09,.07,s*.8,4.12,-.28+j*.3);}
 }
 if(scout)root.scale.set(.85,.88,.85);if(heavy)root.scale.setScalar(boss?1.7:1.22);root.userData={body,legs,arms,material,kind,boss};batchRig(root);return root;
}
function poseEnemy(root,time,moving,hit=0){const u=root.userData;u.material.emissiveIntensity=hit*3;u.body.rotation.x=-hit*.25;u.body.rotation.z=Math.sin(time*25)*hit*.07;for(const l of u.legs)l.p.rotation.x=Math.sin(time*(u.kind==='scout'?12:6)+l.s)*moving*.25;for(let i=0;i<u.arms.length;i++)u.arms[i].rotation.x=Math.sin(time*6+i*Math.PI)*moving*.09;root.position.y=u.kind==='scout'?Math.abs(Math.sin(time*12))*.08*moving:0;updateRig(root);}
function disposeEnemy(root){root.userData.material.dispose();for(const {batch} of root.userData.rig)batch.dispose();}
// Compact HDR pipeline: multisampled scene, thresholded separable bloom, tone mapping,
// restrained grading and vignette. Medium uses edge smoothing; Low renders directly.
function makePipeline(renderer,scene,camera){
 const supported=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float'),type=supported?T.HalfFloatType:T.UnsignedByteType;
 const main=new T.WebGLRenderTarget(1,1,{type,depthBuffer:true}),a=new T.WebGLRenderTarget(1,1,{type,depthBuffer:false}),b=a.clone();
 const postScene=new T.Scene(),postCam=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2));postScene.add(quad);
 const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const blur=new T.ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms:{source:{value:null},step:{value:new T.Vector2()},threshold:{value:0}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform vec2 step;uniform float threshold;
 vec3 sampleAt(vec2 uv){vec3 c=texture2D(source,uv).rgb;float l=max(c.r,max(c.g,c.b));return c*max(0.,l-threshold)/max(.001,l);}
 void main(){vec3 c=sampleAt(vUv)*.227027;c+=(sampleAt(vUv+step*1.384615)+sampleAt(vUv-step*1.384615))*.316216;c+=(sampleAt(vUv+step*3.230769)+sampleAt(vUv-step*3.230769))*.070270;gl_FragColor=vec4(c,1.);}`});
 const final=new T.ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms:{source:{value:main.texture},glow:{value:a.texture},pixel:{value:new T.Vector2()},bloom:{value:.2},exposure:{value:1.02},aa:{value:0}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform sampler2D glow;uniform vec2 pixel;uniform float bloom;uniform float exposure;uniform float aa;
 float luminance(vec3 c){return dot(c,vec3(.299,.587,.114));}vec3 aces(vec3 c){return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);}
 void main(){vec3 c=texture2D(source,vUv).rgb;vec3 n=texture2D(source,vUv+vec2(0.,pixel.y)).rgb;vec3 s=texture2D(source,vUv-vec2(0.,pixel.y)).rgb;vec3 e=texture2D(source,vUv+vec2(pixel.x,0.)).rgb;vec3 w=texture2D(source,vUv-vec2(pixel.x,0.)).rgb;
 float contrast=max(max(luminance(n),luminance(s)),max(luminance(e),luminance(w)))-min(min(luminance(n),luminance(s)),min(luminance(e),luminance(w)));c=mix(c,(n+s+e+w+c*4.)/8.,smoothstep(.16,.6,contrast)*aa*.65);
 c+=texture2D(glow,vUv).rgb*bloom;c=aces(c*exposure);float l=luminance(c);c=mix(vec3(l),c,.9);c*=vec3(.98,1.005,1.035);vec2 p=vUv-.5;c*=1.-dot(p,p)*.48;c=pow(max(c,vec3(0.)),vec3(1./2.2));gl_FragColor=vec4(c,1.);}`});
 let level=2,w=1,h=1;
 function resize(width,height,q){level=q;w=width;h=height;main.setSize(w,h);const divisor=q===2?3:4;a.setSize(Math.max(1,Math.floor(w/divisor)),Math.max(1,Math.floor(h/divisor)));b.setSize(a.width,a.height);main.samples=renderer.capabilities.isWebGL2&&q===2?Math.min(4,renderer.capabilities.maxSamples):0;final.uniforms.pixel.value.set(1/w,1/h);final.uniforms.aa.value=main.samples?0:1;}
 function render(){
  if(level===0){renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.setRenderTarget(null);renderer.render(scene,camera);return;}
  renderer.toneMapping=T.NoToneMapping;renderer.setRenderTarget(main);renderer.render(scene,camera);quad.material=blur;blur.uniforms.source.value=main.texture;blur.uniforms.threshold.value=supported?1.4:.76;blur.uniforms.step.value.set(1.8/w,0);renderer.setRenderTarget(a);renderer.render(postScene,postCam);
  const rounds=level===2?3:1;blur.uniforms.threshold.value=0;
  for(let i=0;i<rounds;i++){blur.uniforms.source.value=a.texture;blur.uniforms.step.value.set(0,(1+i*.7)/a.height);renderer.setRenderTarget(b);renderer.render(postScene,postCam);blur.uniforms.source.value=b.texture;blur.uniforms.step.value.set((1+i*.7)/a.width,0);renderer.setRenderTarget(a);renderer.render(postScene,postCam);}
  quad.material=final;final.uniforms.bloom.value=level===2?.24:.13;renderer.setRenderTarget(null);renderer.render(postScene,postCam);
 }
 return {resize,render,supported};
}
function create(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.info.autoReset=false;renderer.useLegacyLights=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.fog=new T.FogExp2(0x637b90,.0043);const camera=new T.PerspectiveCamera(46,innerWidth/innerHeight,.18,1000);
 scene.add(new T.HemisphereLight(0xc0d3e2,0x443d36,1.35));
 const sun=new T.DirectionalLight(0xffd3ab,3.1);sun.position.set(-55,80,-45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:5,far:200});sun.shadow.bias=-.00015;sun.shadow.normalBias=.045;scene.add(sun,sun.target);
 const rim=new T.DirectionalLight(0x91b9da,1.3);rim.position.set(25,16,25);scene.add(rim);
 const key=new T.PointLight(0xb9d6ed,85,32,1.6);key.position.set(-5,7,8);scene.add(key);
 const heroLight=new T.PointLight(0xf0b889,65,28,1.6);heroLight.position.set(6,5,-5);scene.add(heroLight);
 const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(0x203d5a)},horizon:{value:new T.Color(0xb19a88)}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top;uniform vec3 horizon;void main(){vec3 n=normalize(v);float h=pow(max(n.y,0.),.38);vec3 c=mix(horizon,top,h);float sun=pow(max(dot(n,normalize(vec3(-.6,.14,-.8))),0.),180.);c+=vec3(1.,.69,.43)*sun*.9;gl_FragColor=vec4(c,1.);}'});
 const sky=mesh(scene,geometry('sky',()=>new T.SphereGeometry(850,32,16)),skyMaterial);sky.castShadow=false;sky.receiveShadow=false;
 // Procedural studio/sky radiance, prefiltered for painted metal and glass.
 const envScene=new T.Scene();envScene.add(new T.Mesh(sky.geometry,skyMaterial));
 for(const [pos,size,col] of [[[0,16,0],[30,1,30],0xc8e0f5],[[-15,6,5],[1,10,20],0xf7dac0],[[12,5,-12],[6,9,1],0x9cbdd7]]){const m=new T.MeshBasicMaterial({color:col});m.color.multiplyScalar(2);mesh(envScene,cube,m,size,pos);}
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene,.04,.1,950);scene.environment=environment.texture;pmrem.dispose();envScene.traverse(o=>{if(o.material&&o.material!==skyMaterial)o.material.dispose();});
 const obstacles=[],batches=new Map(),world=new T.Group();scene.add(world);const dummy=new T.Object3D();
 function instance(g,m,scale,pos,rotation=[0,0,0]){const id=g.uuid+m.uuid;if(!batches.has(id))batches.set(id,{g,m,items:[]});batches.get(id).items.push({scale,pos,rotation});}
 const ib=(m,w,h,d,x,y,z,ry=0)=>instance(cube,m,[w,h,d],[x,y,z],[0,ry,0]);
 const concrete=pbr(0x6f7a80,.08,.91),roadEdge=pbr(0x92958f,.08,.83),metal=pbr(0x334552,.8,.5),line=pbr(0xb4b6af,.04,.88),goldLine=pbr(0xc0a16e,.03,.85),soil=pbr(0x3b514d,.03,.95);
 const asphalt=texture(512,512,(c,w,h)=>{c.fillStyle='#586067';c.fillRect(0,0,w,h);for(let i=0;i<40000;i++){const a=rand()*90;c.fillStyle=`rgba(${a},${a+5},${a+8},.35)`;c.fillRect(rand()*w,rand()*h,1+rand()*2,1);}for(let i=0;i<30;i++){c.strokeStyle='#27354244';c.lineWidth=rand()*2;c.beginPath();let x=rand()*w,y=rand()*h;c.moveTo(x,y);for(let j=0;j<5;j++){x+=rand()*30-15;y+=rand()*35;c.lineTo(x,y);}c.stroke();}});asphalt.wrapS=asphalt.wrapT=T.RepeatWrapping;asphalt.repeat.set(72,72);
 const road=pbr(0x465461,.23,.48);road.map=asphalt;road.bumpMap=asphalt;road.bumpScale=.065;road.roughnessMap=asphalt;
 const ground=mesh(scene,new T.PlaneGeometry(640,640),road);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 const facade=texture(256,512,(c,w,h)=>{c.fillStyle='#434f5b';c.fillRect(0,0,w,h);for(let y=5;y<h;y+=18)for(let x=4;x<w;x+=17){c.fillStyle=rand()>.65?(rand()>.5?'#a5afad':'#af9b7c'):'#273847';c.fillRect(x,y,9,11);c.fillStyle='#71808c55';c.fillRect(x,y+10,9,1);}});
 const facades=[0x71818e,0x5f7384,0x899399,0x4c6372].map(c=>{const m=pbr(c,.56,.4);m.map=facade;m.emissiveMap=facade;m.emissive=new T.Color(0x7c939d);m.emissiveIntensity=.24;return m;});
 const litWindow=emit(0xd1b797,.9),foliage=pbr(0x3b5952,.03,.95),bark=pbr(0x4b4844,.1,.94),foliageGeo=geometry('tree',()=>new T.IcosahedronGeometry(1,1));
 for(let gx=-4;gx<4;gx++)for(let gz=-4;gz<4;gz++){
  const x=gx*60+30,z=gz*60+30;ib(concrete,40,.32,40,x,.16,z);ib(roadEdge,40,.1,.22,x,.37,z+20);ib(roadEdge,40,.1,.22,x,.37,z-20);
  if((gx+gz)%6===0){ib(soil,32,.16,32,x,.4,z);for(let k=0;k<9;k++){const tx=x+(rand()-.5)*27,tz=z+(rand()-.5)*27;instance(cylinder,bark,[.25,3,.25],[tx,1.9,tz]);instance(foliageGeo,foliage,[2.3,3.9,2.3],[tx,5.4,tz]);}continue;}
  const h=18+rand()*66,w=22+rand()*9,d=22+rand()*9;ib(facades[(gx-gz+12)%4],w,h,d,x,h/2+.4,z);obstacles.push({x,z,w:w/2+1,d:d/2+1,h});ib(metal,w+1,.55,d+1,x,h+.7,z);ib(metal,w*.5,2,d*.52,x,h+2,z);
  for(let k=4;k<h;k+=12)ib(metal,w+.2,.18,d+.2,x,k,z);
  for(const s of [-1,1]){ib(metal,.26,h+.5,.4,x+s*w*.42,h/2+.4,z+d/2+.15);ib(litWindow,w*.5,.07,.08,x,3.1,z+s*(d/2+.11));}
  ib(mats.glass,w*.74,2.8,.1,x,1.8,z+d/2+.1);ib(metal,w*.78,.18,2.5,x,3.6,z+d/2+1.1);
  for(let k=0;k<3;k++)ib(mats.silver,1.8,.8,2,x-3+k*3,h+1.3,z);
  if((gx-gz)%3===0){ib(metal,1.5,8,1.5,x,h+6,z);ib(mats.tail,.2,.25,.2,x,h+10.2,z);}
  if(gx>1&&gz>0)for(const s of [-1,1]){instance(cylinder,metal,[2.3,7,2.3],[x+s*13,4,z-14]);ib(mats.chrome,6,.4,.4,x,3,z-14);}
 }
 for(let x=-240;x<=240;x+=60){
  for(let z=-266;z<=266;z+=12){if(Math.abs(z%60)<12)continue;ib(goldLine,.1,.016,3.8,x-.22,.025,z);ib(goldLine,.1,.016,3.8,x+.22,.025,z);ib(line,3.8,.018,.1,z,.025,x);}
  for(let z=-240;z<=240;z+=60){for(let k=-3;k<=3;k++){ib(line,.65,.02,3,x+k*1.2,.03,z+8);ib(line,3,.02,.65,x+8,.03,z+k*1.2);}for(const s of [-1,1]){instance(cylinder,metal,[.095,8,.095],[x+s*11,4,z+11]);ib(metal,2.7,.12,.28,x+s*10,8,z+11);ib(mats.white,2.3,.045,.2,x+s*10,7.91,z+11);}}
 }
 // Elevated skybridges leave the streets underneath fully driveable.
 for(const z of [-180,-60,120,240]){ib(metal,62,.8,5,30,17,z);ib(mats.glass,62,2.4,.09,30,18.5,z-2.4);ib(mats.glass,62,2.4,.09,30,18.5,z+2.4);ib(litWindow,62,.09,.1,30,17.45,z-2.55);for(let x=4;x<=56;x+=13)ib(metal,.22,2.7,5,x,18.4,z);}
 for(let i=0;i<100;i++){const a=i/100*Math.PI*2,r=310+rand()*110,h=22+rand()*120;ib(facades[i%4],13+rand()*23,h,17+rand()*24,Math.sin(a)*r,h/2,Math.cos(a)*r);}
 for(let x=-270;x<=270;x+=15)for(const s of [-1,1]){ib(concrete,12,1.1,.7,x,.55,s*279);ib(concrete,.7,1.1,12,s*279,.55,x);ib(litWindow,1,.06,.08,x,.8,s*278.6);}
 const parkedMaterials=[paint(0x506577),paint(0x8a8274),paint(0x303a45)];
 for(let i=0;i<26;i++){
  const x=(Math.floor(rand()*7)-3)*60+11,z=(Math.floor(rand()*7)-3)*60+22+rand()*12,m=parkedMaterials[i%3];instance(bevel,m,[2,.55,4],[x,.64,z]);instance(bevel,mats.glass,[1.7,.62,1.7],[x,1.21,z-.3]);obstacles.push({x,z,w:1.3,d:2.3,h:1.6});
  for(const s of [-1,1])for(const j of [-1,1])instance(cylinder,mats.rubber,[.4,.22,.4],[x+s*1.02,.42,z+j*1.2],[0,0,Math.PI/2]);ib(mats.tail,1.5,.07,.03,x,.74,z-2.01);
 }
 const signTexture=texture(512,256,c=>{c.fillStyle='#172834';c.fillRect(0,0,512,256);c.fillStyle='#b8c4ca';c.font='300 60px Arial';c.fillText('NOVA',42,98);c.font='18px Arial';c.fillStyle='#9da990';c.fillText('A BETTER TOMORROW',46,138);c.fillStyle='#bba583';c.fillRect(44,179,76,3);});
 const signMat=new T.MeshStandardMaterial({map:signTexture,emissiveMap:signTexture,emissive:0xffffff,emissiveIntensity:.45,roughness:.7});
 for(const [x,z] of [[-18,-35],[78,-94],[-140,100],[160,42]]){block(world,metal,10,5,.4,x,10,z);const front=mesh(world,new T.PlaneGeometry(9.7,4.8),signMat,[1,1,1],[x,10,z+.23]);front.castShadow=false;ib(metal,.3,8,.3,x,4,z);}
 // Shared geometry instancing: the city is rendered in material batches.
 for(const {g,m,items} of batches.values()){const batch=new T.InstancedMesh(g,m,items.length);items.forEach((o,i)=>{dummy.position.set(...o.pos);dummy.rotation.set(...o.rotation);dummy.scale.set(...o.scale);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});batch.castShadow=true;batch.receiveShadow=true;batch.computeBoundingSphere();world.add(batch);}
 const stage=new T.Group();scene.add(stage);tube(stage,metal,4.9,.1,0,.035,0);const stageRing=mesh(stage,new T.TorusGeometry(4.55,.025,6,100),mats.warm);stageRing.rotation.x=Math.PI/2;stageRing.position.y=.095;
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;plate(stage,concrete,.07,.018,.5,Math.sin(a)*4.3,.12,Math.cos(a)*4.3).rotation.y=a;}
 const stageSpot=new T.SpotLight(0xf1d5b2,160,35,.65,.8,1.4);stageSpot.position.set(-4,13,4);stageSpot.target.position.set(0,2,0);scene.add(stageSpot,stageSpot.target);
 const glowTex=texture(64,64,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,.7)');g.addColorStop(.3,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
 const atmosphere=new T.Group();scene.add(atmosphere);
 for(let i=0;i<14;i++){const sm=new T.SpriteMaterial({map:glowTex,color:0xa4b6c5,transparent:true,opacity:.06,depthWrite:false});const sprite=new T.Sprite(sm);sprite.position.set((rand()-.5)*180,1+rand()*4,(rand()-.5)*180);sprite.scale.set(45,7,1);atmosphere.add(sprite);}
 const beamMat=new T.MeshBasicMaterial({color:0xbac6d2,transparent:true,opacity:.006,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 for(const x of [-10,10]){const beam=mesh(atmosphere,new T.ConeGeometry(3,12,20,1,true),beamMat,[1,1,1],[x,5,-10]);beam.rotation.z=.2*x/10;beam.castShadow=false;}
 const dustPos=new Float32Array(180*3);for(let i=0;i<dustPos.length;i+=3){dustPos[i]=(rand()-.5)*100;dustPos[i+1]=rand()*16;dustPos[i+2]=(rand()-.5)*100;}const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:0xc7c2b3,size:.055,transparent:true,opacity:.35,depthWrite:false}));scene.add(dust);
 // Fixed-size particle pools: one GPU draw, no per-particle meshes or materials.
 const poolSize=550,particleData=[],particlePos=new Float32Array(poolSize*3),particleColor=new Float32Array(poolSize*3),particleSize=new Float32Array(poolSize);
 const particleGeo=new T.BufferGeometry();particleGeo.setAttribute('position',new T.BufferAttribute(particlePos,3).setUsage(T.DynamicDrawUsage));particleGeo.setAttribute('color',new T.BufferAttribute(particleColor,3).setUsage(T.DynamicDrawUsage));particleGeo.setAttribute('size',new T.BufferAttribute(particleSize,1).setUsage(T.DynamicDrawUsage));
 const particleMat=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:T.AdditiveBlending,uniforms:{pixelScale:{value:500}},vertexShader:'attribute float size;varying vec3 col;uniform float pixelScale;void main(){col=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*pixelScale/max(1.,-p.z),0.,60.);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 col;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=pow(1.-d,2.);gl_FragColor=vec4(col*2.,a);}'});
 const particles=new T.Points(particleGeo,particleMat);particles.frustumCulled=false;scene.add(particles);let cursor=0;
 const smokePool=[];for(let i=0;i<36;i++){const m=new T.SpriteMaterial({map:glowTex,color:0x394552,transparent:true,opacity:0,depthWrite:false});const s=new T.Sprite(m);s.visible=false;scene.add(s);smokePool.push({s,life:0,max:1,v:V()});}let smokeCursor=0;
 const ringPool=[];const shockGeo=geometry('shock-ring',()=>new T.TorusGeometry(1,.018,5,90));for(let i=0;i<5;i++){const m=new T.MeshBasicMaterial({color:0xb0d5e7,transparent:true,opacity:0,depthWrite:false});const ring=mesh(scene,shockGeo,m);ring.rotation.x=Math.PI/2;ring.castShadow=false;ring.visible=false;ringPool.push({ring,life:0});}let ringCursor=0;
 const flash=new T.PointLight(0xffbd87,0,16,1.5);scene.add(flash);let flashTime=0;
 const corpses=[];let quality=matchMedia('(pointer:coarse)').matches?0:2,resolutionScale=1,adaptTime=0,slowTime=0,fastTime=0;
 function sparks(pos,color=0xffc488,count=18,speed=7,life=.5){const tint=new T.Color(color),n=Math.ceil(count*[.35,.65,1][quality]);for(let i=0;i<n;i++){const index=cursor++%poolSize,lifeSpan=life*(.5+Math.random());particleData[index]={life:lifeSpan,max:lifeSpan,v:V((Math.random()-.5)*speed,Math.random()*speed*.7,(Math.random()-.5)*speed),size:.1+Math.random()*.14};particlePos.set([pos.x,pos.y,pos.z],index*3);particleColor.set([tint.r,tint.g,tint.b],index*3);}}
 function smoke(pos,count=4){for(let i=0;i<Math.ceil(count*[.4,.7,1][quality]);i++){const p=smokePool[smokeCursor++%smokePool.length];p.life=p.max=1.3+Math.random();p.s.visible=true;p.s.position.copy(pos).add(V(Math.random()-.5,Math.random(),Math.random()-.5));p.v.set((Math.random()-.5)*1.2,1.5+Math.random(),(Math.random()-.5)*1.2);p.s.scale.setScalar(.6);}}
 function burst(pos,color=0xffbf82,count=35){sparks(pos,color,count,13,.7);smoke(pos,5);flash.position.copy(pos);flash.intensity=100;flashTime=.17;}
 function muzzle(pos,hostile=false){sparks(pos,hostile?0xff8960:0xc8eaff,5,1.7,.1);flash.position.copy(pos);flash.intensity=hostile?35:55;flashTime=.055;}
 function shockwave(pos){const p=ringPool[ringCursor++%ringPool.length];p.life=.8;p.ring.visible=true;p.ring.position.copy(pos);p.ring.position.y=.18;sparks(pos,0x94cbeb,60,22,.65);}
 function destroy(root){if(corpses.length>=12){const old=corpses.shift();scene.remove(old.root);disposeEnemy(old.root);}corpses.push({root,time:0});}
 function updateEffects(dt,time){
  for(let i=0;i<poolSize;i++){const p=particleData[i];if(!p||p.life<=0){particleSize[i]=0;continue;}p.life-=dt;p.v.y-=9*dt;particlePos[i*3]+=p.v.x*dt;particlePos[i*3+1]+=p.v.y*dt;particlePos[i*3+2]+=p.v.z*dt;particleSize[i]=p.size*Math.max(0,p.life/p.max);}
  particleGeo.attributes.position.needsUpdate=true;particleGeo.attributes.size.needsUpdate=true;particleGeo.attributes.color.needsUpdate=true;
  for(const p of smokePool){if(p.life<=0)continue;p.life-=dt;p.s.visible=p.life>0;p.s.position.addScaledVector(p.v,dt);p.s.scale.setScalar(1+(p.max-p.life)*3);p.s.material.opacity=Math.sin(Math.max(0,p.life/p.max)*Math.PI)*.24;p.s.material.rotation+=dt*.15;}
  for(const p of ringPool){if(p.life<=0)continue;p.life-=dt;p.ring.visible=p.life>0;p.ring.scale.setScalar(1+(1-p.life/.8)*20);p.ring.material.opacity=Math.max(0,p.life/.8)*.6;}
  flashTime=Math.max(0,flashTime-dt);flash.intensity*=flashTime>0?.84:0;
  for(let i=corpses.length-1;i>=0;i--){const c=corpses[i];c.time+=dt;c.root.userData.body.rotation.x=-Math.min(1.4,c.time*1.6);c.root.position.y=-Math.min(4,c.time*1.3);updateRig(c.root);if(c.time>1.6){scene.remove(c.root);disposeEnemy(c.root);corpses.splice(i,1);}}
  dust.rotation.y=time*.006;atmosphere.children.forEach((o,i)=>{if(o.isSprite)o.position.x+=Math.sin(time*.1+i)*dt*.4;});
 }
 function clearEffects(){for(const p of particleData)if(p)p.life=0;particleSize.fill(0);for(const p of smokePool){p.life=0;p.s.visible=false;}for(const p of ringPool){p.life=0;p.ring.visible=false;}for(const c of corpses){scene.remove(c.root);disposeEnemy(c.root);}corpses.length=0;flash.intensity=0;}
 const pipeline=makePipeline(renderer,scene,camera);
 function resize(){const cap=[1,1.35,1.8][quality];renderer.setPixelRatio(Math.min(devicePixelRatio,cap)*resolutionScale);renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const size=renderer.getDrawingBufferSize(new T.Vector2());pipeline.resize(size.x,size.y,quality);particleMat.uniforms.pixelScale.value=size.y*.72;}
 function setQuality(q){quality=q;resolutionScale=1;renderer.shadowMap.enabled=q>0;sun.shadow.mapSize.set(q===2?2048:1024,q===2?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}atmosphere.visible=q>0;dust.visible=q>0;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});resize();return quality;}
 function adapt(dt){if(dt>.12)return;adaptTime+=dt;slowTime=dt>.031?slowTime+dt:Math.max(0,slowTime-dt*.5);fastTime=dt<.02?fastTime+dt:0;if(adaptTime>8&&slowTime>4&&resolutionScale>.65){resolutionScale=Math.max(.65,resolutionScale-.1);resize();slowTime=0;adaptTime=0;}else if(fastTime>15&&resolutionScale<1){resolutionScale=Math.min(1,resolutionScale+.05);resize();fastTime=0;}}
 function lighting(position,menu,hero,dt){sun.target.position.copy(position);sun.position.copy(position).add(V(-55,80,-45));key.position.copy(position).add(V(-5,7,8));heroLight.position.copy(position).add(V(6,5,-5));heroLight.color.lerp(new T.Color(hero?0xe2b264:0x91b5d2),1-Math.exp(-dt*2));key.intensity=mix(key.intensity,menu?100:20,.04);stage.visible=menu;stageSpot.intensity=mix(stageSpot.intensity,menu?160:0,.04);}
 setQuality(quality);
 return {renderer,scene,camera,obstacles,makeRobot,poseRobot,makeEnemy,poseEnemy,disposeEnemy,burst,sparks,smoke,muzzle,shockwave,destroy,updateEffects,clearEffects,setQuality,getQuality:()=>quality,resize,adapt,lighting,render:()=>{renderer.info.reset();pipeline.render();},mats,mesh,plate,tube,geometry,V,stats:()=>({quality,resolutionScale,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,particles:particleData.filter(p=>p&&p.life>0).length})};
}
window.Guardian3D={create};
})();
