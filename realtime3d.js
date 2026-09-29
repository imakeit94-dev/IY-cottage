let THREE;
let GLTFLoader;

const params=new URLSearchParams(location.search);
const enabled=params.get('realtime3d')==='1';
const preview=params.get('preview3d')==='1';
const page=document.getElementById('page');
const visual=document.querySelector('.visual');
const container=document.getElementById('realtime-3d');
const canvas=document.getElementById('cottage-webgl');
const status=document.getElementById('realtime-3d-status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

// Realtime Summer lighting controls. These are the first values to tune.
const TIME_TRANSITION_MS=2100;
const SEASON_TRANSITION_MS=1650;
const TIME_OF_DAY={
  day:{
    sunlightIntensity:3.15,sunlightColor:0xffdfae,sunPosition:[-10,16,-12],
    environmentIntensity:2.15,environmentColor:0xf5edda,groundColor:0x53645a,
    exposure:1.05,windowEmission:.012,windowColor:0xffd6a0,porchEmission:0,porchColor:0xffbc69,
    windowLight:0,porchLight:0,cameraYaw:-.014,
    background:[0xb8c2ad,0xcbc9b7,0xb7c5ae],halo:0xffe2a8,haloOpacity:.13,fogColor:0xd9e2d4,fogDensity:.0025,homeActivity:.42,nightFactor:0
  },
  sunset:{
    sunlightIntensity:2.45,sunlightColor:0xff9a68,sunPosition:[-15,5.2,-10],
    environmentIntensity:1.25,environmentColor:0xdba5a0,groundColor:0x514151,
    exposure:1.0,windowEmission:.46,windowColor:0xffad59,porchEmission:.36,porchColor:0xffa851,
    windowLight:12,porchLight:9,cameraYaw:.025,
    background:[0x503744,0x754759,0x9d6670],halo:0xffa85c,haloOpacity:.26,fogColor:0x74505c,fogDensity:.0065,homeActivity:.76,nightFactor:.36
  },
  night:{
    sunlightIntensity:.42,sunlightColor:0x809dca,sunPosition:[-8,8,-7],
    environmentIntensity:.58,environmentColor:0x31486d,groundColor:0x14243a,
    exposure:.91,windowEmission:1.3,windowColor:0xffc36b,porchEmission:1.15,porchColor:0xffb45d,
    windowLight:30,porchLight:20,cameraYaw:0,
    background:[0x121e31,0x102a42,0x1b3550],halo:0xffbd66,haloOpacity:.24,fogColor:0x172b43,fogDensity:.012,homeActivity:1,nightFactor:1
  }
};

// Season is independent from time of day. Summer uses the original GLB colours.
const SEASON_STATE={
  spring:{treeColor:0x86ad70,winterLeafLoss:0,cameraDrift:-.018,compositionScale:1,groundColor:0x71957b,decorOpacity:.86,environmentTint:0xe5f1df,environmentBlend:.11,backgroundTint:0xd8ead2,backgroundBlend:.09,sunTint:0xfff1d2,sunBlend:.035,springBlossoms:1,autumnLeaves:0,winterSnow:0,smoke:.16,springCreature:1,summerCreature:0,autumnCreature:0,winterCreature:0},
  summer:{treeColor:0x4d7755,winterLeafLoss:0,cameraDrift:0,compositionScale:.9,groundColor:0x5f8682,decorOpacity:1,environmentTint:0xffffff,environmentBlend:0,backgroundTint:0xffffff,backgroundBlend:0,sunTint:0xffffff,sunBlend:0,springBlossoms:0,autumnLeaves:0,winterSnow:0,smoke:.025,springCreature:0,summerCreature:1,autumnCreature:0,winterCreature:0},
  autumn:{treeColor:0xc47732,winterLeafLoss:.06,cameraDrift:.026,compositionScale:.98,groundColor:0x796f50,decorOpacity:.72,environmentTint:0xffc58c,environmentBlend:.13,backgroundTint:0xc78355,backgroundBlend:.1,sunTint:0xffbd72,sunBlend:.06,springBlossoms:0,autumnLeaves:1,winterSnow:0,smoke:.46,springCreature:0,summerCreature:0,autumnCreature:1,winterCreature:0},
  winter:{treeColor:0x9ca7a4,winterLeafLoss:1,cameraDrift:0,compositionScale:.97,groundColor:0xb8c8cb,decorOpacity:.16,environmentTint:0xb9d4e4,environmentBlend:.19,backgroundTint:0x9db9cc,backgroundBlend:.15,sunTint:0xd7e7f4,sunBlend:.08,springBlossoms:0,autumnLeaves:0,winterSnow:1,smoke:.86,springCreature:0,summerCreature:0,autumnCreature:0,winterCreature:1}
};

let loadingOverlay=null;
let loadingShownAt=0;
let loadingHideTimer=0;
function showLoading(){
  loadingShownAt=performance.now();
  loadingOverlay=document.createElement('div');loadingOverlay.className='realtime-loading-overlay';loadingOverlay.innerHTML='<span class="realtime-loading-mark" aria-hidden="true">⌂</span><p>小屋正在醒来。</p>';
  loadingOverlay.setAttribute('role','status');loadingOverlay.setAttribute('aria-live','polite');document.body.append(loadingOverlay);document.body.classList.add('realtime-loading-active');
  requestAnimationFrame(()=>loadingOverlay?.classList.add('show'));
}
function hideLoading(){
  if(!loadingOverlay){document.body.classList.remove('realtime-loading-active');return}
  clearTimeout(loadingHideTimer);
  const delay=Math.max(0,700-(performance.now()-loadingShownAt));
  loadingHideTimer=setTimeout(()=>{
    if(!loadingOverlay)return;
    loadingOverlay.classList.remove('show');loadingOverlay.classList.add('done');
    setTimeout(()=>{document.body.classList.remove('realtime-loading-active');loadingOverlay?.remove();loadingOverlay=null},560);
  },delay);
}

if(enabled){
  showLoading();
  if(preview){
    const prologue=document.getElementById('prologue');prologue.hidden=true;document.body.classList.remove('prologue-active');
    document.querySelectorAll('.top,.copy,.visual,.controls,.foot,.music-toggle').forEach(el=>el.inert=false);
  }
  init().catch(fallback);
}

function fallback(error){
  console.warn('Realtime cottage unavailable; static fallback retained.',error);
  page.classList.remove('realtime-3d-loading','realtime-3d-ready');page.classList.add('realtime-3d-fallback');
  page.dataset.webgl='fallback';status.textContent='Static cottage restored';
  hideLoading();
}

async function init(){
  if(!canvas||!container)return;
  const [threeModule,loaderModule]=await Promise.all([import('three'),import('three/addons/loaders/GLTFLoader.js')]);
  THREE=threeModule;GLTFLoader=loaderModule.GLTFLoader;
  page.classList.add('realtime-3d-loading');page.dataset.webgl='loading';
  const mobile=matchMedia('(max-width: 767px)').matches;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.2:1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFShadowMap;

  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xd9e2d4,.0025);
  const hemi=new THREE.HemisphereLight();scene.add(hemi);
  const sun=new THREE.DirectionalLight();sun.target.position.set(0,2,0);scene.add(sun,sun.target);
  if(renderer.shadowMap.enabled){sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.near=.1;sun.shadow.camera.far=60;sun.shadow.bias=-.0003}

  const loader=new GLTFLoader();
  const gltf=await loader.loadAsync('assets/models/summer_day_cottage.glb',progress=>{
    if(progress.total)status.textContent=`Loading the little house · ${Math.round(progress.loaded/progress.total*100)}%`;
  });
  scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
  const model=gltf.scene.getObjectByName('Cottage_Root')||gltf.scene;
  const controls={};['House','Windows','Porch_Light','Tree_Trunk','Tree_Crown','Ground','Guitar','Piano','Bookshelf'].forEach(name=>controls[name]=gltf.scene.getObjectByName(name));
  gltf.scene.traverse(object=>{if(object.isMesh){object.castShadow=renderer.shadowMap.enabled;object.receiveShadow=renderer.shadowMap.enabled}});

  prepareWinterCrown(controls.Tree_Crown);
  const treeMaterials=prepareColorMaterials(controls.Tree_Crown);
  const groundMaterials=prepareColorMaterials(controls.Ground);
  const decorObject=gltf.scene.getObjectByName('Summer_Decor');
  const decorMaterials=prepareColorMaterials(decorObject,true);
  const seasonalObjects=createSeasonalObjects(model,controls);
  const lifeDetails=createLifeDetails(model);
  const windowMaterials=prepareEmissionMaterials(controls.Windows);
  const porchMaterials=prepareEmissionMaterials(controls.Porch_Light);
  const highlightMaterials={
    Guitar:prepareHighlightMaterials(controls.Guitar),
    Piano:prepareHighlightMaterials(controls.Piano),
    Bookshelf:prepareHighlightMaterials(controls.Bookshelf)
  };
  const windowLight=new THREE.PointLight(0xffbd68,0,11,2);positionLightAt(windowLight,controls.Windows,.3);scene.add(windowLight);
  const porchLight=new THREE.PointLight(0xffad55,0,9,2);positionLightAt(porchLight,controls.Porch_Light,.15);scene.add(porchLight);

  const camera=gltf.scene.getObjectByName('Camera_Main')||gltf.cameras[0];
  if(!camera||!camera.isOrthographicCamera)throw new Error('Camera_Main orthographic camera missing from GLB');
  scene.attach(camera);camera.updateMatrixWorld(true);
  const baseHalfHeight=(camera.top-camera.bottom)/2;
  const cameraBasePosition=camera.position.clone();const cameraForward=new THREE.Vector3();camera.getWorldDirection(cameraForward);
  const cameraRight=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).normalize();const cameraUp=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion).normalize();
  const cameraBaseTarget=cameraBasePosition.clone().addScaledVector(cameraForward,32);let cameraLookTarget=cameraBaseTarget.clone();
  const CAMERA_SEASON={spring:{lateral:-.28,height:.03,depth:.02,target:-.04},summer:{lateral:.38,height:0,depth:.04,target:.05},autumn:{lateral:-.42,height:.02,depth:.03,target:-.06},winter:{view:'Winter_Right_View',worldAzimuth:24,height:.08,target:-.12}};
  function cameraPose(name){
    const pose=CAMERA_SEASON[name]||CAMERA_SEASON.spring;
    const target=cameraBaseTarget.clone().addScaledVector(cameraRight,pose.target||0);
    if(Number.isFinite(pose.worldAzimuth)){
      const baseOffset=cameraBasePosition.clone().sub(cameraBaseTarget),radius=Math.hypot(baseOffset.x,baseOffset.z),angle=THREE.MathUtils.degToRad(pose.worldAzimuth);
      return {position:target.clone().add(new THREE.Vector3(Math.sin(angle)*radius,baseOffset.y+(pose.height||0),Math.cos(angle)*radius)),target};
    }
    return {position:cameraBasePosition.clone().addScaledVector(cameraRight,pose.lateral).addScaledVector(cameraUp,pose.height).addScaledVector(cameraForward,pose.depth),target};
  }
  function setCameraPose(name){const pose=cameraPose(name);camera.position.copy(pose.position);cameraLookTarget.copy(pose.target);camera.lookAt(cameraLookTarget)}
  const baseY=model.position.y;
  const pointerTarget={yaw:0,pitch:0},pointerCurrent={yaw:0,pitch:0};
  const overrides={window:null,porch:null};
  const picker=createObjectPicker(model,controls);
  const highlightLevel={Guitar:0,Piano:0,Bookshelf:0};
  let hoveredName=null,lampTarget=page.classList.contains('lamp-on')?1:0,lampLevel=lampTarget,windowTarget=0,windowLevelInteractive=0,cameraPushTarget=0,cameraPushLevel=0;
  let windowRestoreTimer=0,cameraPushTimer=0;
  let lighting=makeLighting(TIME_OF_DAY.day);
  let seasonLighting=makeLighting(SEASON_STATE.summer);
  let lightingTransition=null;
  let seasonTransition=null;
  let sharedTransition=null;
  let running=true,last=performance.now();
  let activeTime='day',activeSeason='summer';

  function prepareWinterCrown(tree){
    if(!tree?.isMesh)return;
    const geometry=tree.geometry.clone();tree.geometry=geometry;const position=geometry.attributes.position;const index=geometry.index;const count=position.count;
    const parents=Int32Array.from({length:count},(_,item)=>item);
    function find(item){while(parents[item]!==item){parents[item]=parents[parents[item]];item=parents[item]}return item}
    function join(a,b){a=find(a);b=find(b);if(a!==b)parents[b]=a}
    const triangleCount=index?index.count/3:count/3;
    for(let triangle=0;triangle<triangleCount;triangle++){
      const a=index?index.getX(triangle*3):triangle*3;const b=index?index.getX(triangle*3+1):triangle*3+1;const c=index?index.getX(triangle*3+2):triangle*3+2;join(a,b);join(b,c);
    }
    const groups=new Map();for(let vertex=0;vertex<count;vertex++){const root=find(vertex);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(vertex)}
    const components=[...groups.values()].filter(group=>group.length>12).map(vertices=>{
      const center=new THREE.Vector3();for(const vertex of vertices)center.add(new THREE.Vector3().fromBufferAttribute(position,vertex));center.multiplyScalar(1/vertices.length);return {vertices,center};
    }).sort((a,b)=>a.center.x-b.center.x||a.center.y-b.center.y);
    const target=new Float32Array(position.array);
    components.forEach((component,componentIndex)=>{
      const scale=componentIndex%3===0?.08:.72;
      for(const vertex of component.vertices){const point=new THREE.Vector3().fromBufferAttribute(position,vertex);point.sub(component.center).multiplyScalar(scale).add(component.center);target[vertex*3]=point.x;target[vertex*3+1]=point.y;target[vertex*3+2]=point.z}
    });
    geometry.morphAttributes.position=[new THREE.Float32BufferAttribute(target,3)];geometry.morphTargetsRelative=false;tree.updateMorphTargets();
  }

  function prepareColorMaterials(object,transparent=false){
    const result=[];if(!object)return result;
    object.traverse(child=>{
      if(!child.isMesh)return;
      const wasArray=Array.isArray(child.material);const source=wasArray?child.material:[child.material];
      const cloned=source.map(material=>{const copy=material.clone();copy.transparent=transparent;copy.opacity=1;copy.needsUpdate=true;result.push(copy);return copy});
      child.material=wasArray?cloned:cloned[0];
    });
    return result;
  }
  function prepareHighlightMaterials(object){
    const result=[];if(!object)return result;
    object.traverse(child=>{
      if(!child.isMesh)return;const wasArray=Array.isArray(child.material);const source=wasArray?child.material:[child.material];
      const cloned=source.map(material=>{const copy=material.clone();copy.emissive=new THREE.Color(0xffba68);copy.emissiveIntensity=0;copy.needsUpdate=true;result.push(copy);return copy});child.material=wasArray?cloned:cloned[0];
    });return result;
  }

  function prepareEmissionMaterials(object){
    const result=[];if(!object)return result;
    object.traverse(child=>{
      if(!child.isMesh)return;
      const wasArray=Array.isArray(child.material);const source=wasArray?child.material:[child.material];
      const cloned=source.map(material=>{const copy=material.clone();copy.emissive=new THREE.Color(0x000000);copy.emissiveIntensity=0;copy.needsUpdate=true;result.push(copy);return copy});
      child.material=wasArray?cloned:cloned[0];
    });
    return result;
  }
  function positionLightAt(light,object,yOffset){
    if(!object)return;const center=new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());light.position.copy(center);light.position.y+=yOffset;
  }
  function createSeasonalObjects(parent,objects){
    const group=new THREE.Group();group.name='Seasonal_Runtime';parent.add(group);
    const tree=objects.Tree_Crown;tree.geometry.computeBoundingBox();
    const treeCenter=tree.geometry.boundingBox.getCenter(new THREE.Vector3()).add(tree.position);
    const treeSize=tree.geometry.boundingBox.getSize(new THREE.Vector3());

    const blossomMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false});
    const blossoms=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),blossomMaterial,28);blossoms.name='Spring_Blossoms';
    const matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion();
    for(let index=0;index<28;index++){
      const vertical=((index*17)%29)/28*2-1;const radial=Math.sqrt(Math.max(0,1-vertical*vertical));const angle=index*2.39996;
      const position=new THREE.Vector3(treeCenter.x+Math.cos(angle)*treeSize.x*.48*radial,treeCenter.y+vertical*treeSize.y*.52,treeCenter.z+Math.sin(angle)*treeSize.z*.48*radial);
      const size=.105+(index%5)*.018;matrix.compose(position,quaternion,new THREE.Vector3(size,size*.62,size));blossoms.setMatrixAt(index,matrix);
      blossoms.setColorAt(index,new THREE.Color([0xf4b9c4,0xf7d8dd,0xffc7b0][index%3]));
    }
    blossoms.instanceMatrix.needsUpdate=true;blossoms.instanceColor.needsUpdate=true;blossoms.computeBoundingSphere();group.add(blossoms);

    const leafMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
    const leaves=new THREE.InstancedMesh(new THREE.CircleGeometry(1,5),leafMaterial,26);leaves.name='Autumn_Ground_Leaves';
    for(let index=0;index<26;index++){
      const x=-10.2+((index*47)%101)/100*20.4;const z=-8.2+((index*31)%97)/96*17.2;const size=.16+(index%5)*.035;
      quaternion.setFromEuler(new THREE.Euler(-Math.PI/2,(index*.73)%Math.PI,0));matrix.compose(new THREE.Vector3(x,.09,z),quaternion,new THREE.Vector3(size,size*.58,size));leaves.setMatrixAt(index,matrix);
      leaves.setColorAt(index,new THREE.Color([0xd39a3c,0xbc682f,0x8f5131,0xe0b45b][index%4]));
    }
    leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;leaves.computeBoundingSphere();group.add(leaves);

    const snowMaterial=new THREE.MeshStandardMaterial({color:0xe8eff0,roughness:.94,transparent:true,opacity:0,depthWrite:true});
    const groundSnow=new THREE.Mesh(new THREE.BoxGeometry(22.8,.12,20.2),snowMaterial);groundSnow.name='Winter_Ground_Snow';groundSnow.position.set(0,.08,0);group.add(groundSnow);
    const roofMaterial=new THREE.MeshStandardMaterial({color:0xf1f4f2,roughness:.9,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:true});
    const roofPositions=[];
    function collectUpwardFaces(object,minHeight){
      if(!object?.isMesh)return;const positions=object.geometry.attributes.position;const index=object.geometry.index;object.updateMatrix();
      const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),center=new THREE.Vector3();
      const triangleCount=index?index.count/3:positions.count/3;
      for(let triangle=0;triangle<triangleCount;triangle++){
        const ia=index?index.getX(triangle*3):triangle*3;const ib=index?index.getX(triangle*3+1):triangle*3+1;const ic=index?index.getX(triangle*3+2):triangle*3+2;
        a.fromBufferAttribute(positions,ia).applyMatrix4(object.matrix);b.fromBufferAttribute(positions,ib).applyMatrix4(object.matrix);c.fromBufferAttribute(positions,ic).applyMatrix4(object.matrix);
        normal.subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize();center.copy(a).add(b).add(c).multiplyScalar(1/3);
        if(normal.y>.28&&center.y>minHeight){for(const point of [a,b,c])roofPositions.push(point.x+normal.x*.025,point.y+normal.y*.025,point.z+normal.z*.025)}
      }
    }
    collectUpwardFaces(parent.getObjectByName('House'),5.1);
    const roofGeometry=new THREE.BufferGeometry();roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roofPositions,3));roofGeometry.computeVertexNormals();
    const roofSnow=new THREE.Mesh(roofGeometry,roofMaterial);roofSnow.name='Winter_Roof_Snow';group.add(roofSnow);
    return {group,blossoms,blossomMaterial,leaves,leafMaterial,groundSnow,snowMaterial,roofSnow,roofMaterial};
  }
  function createLifeDetails(parent){
    const group=new THREE.Group();group.name='Life_Details_Runtime';parent.add(group);
    const part=(owner,geometry,material,position,scale=[1,1,1],rotation=[0,0,0])=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.fromArray(position);mesh.scale.fromArray(scale);mesh.rotation.set(...rotation);mesh.castShadow=renderer.shadowMap.enabled;mesh.receiveShadow=renderer.shadowMap.enabled;owner.add(mesh);return mesh};

    // A quiet cup beside the existing open book makes the garden table feel used.
    const cupGroup=new THREE.Group();cupGroup.name='Table_Cup';cupGroup.position.set(6.38,1.27,4.47);cupGroup.rotation.y=-.22;group.add(cupGroup);
    const cupMaterial=new THREE.MeshStandardMaterial({color:0xd8c09d,roughness:.88});
    part(cupGroup,new THREE.CylinderGeometry(.13,.115,.23,10),cupMaterial,[0,.115,0]);part(cupGroup,new THREE.TorusGeometry(.095,.025,5,10,Math.PI*1.55),cupMaterial,[.12,.13,0],[1,1,1],[0,Math.PI/2,.15]);

    // A small low-poly chimney and soft puffs; no particle engine or extra model.
    const chimneyMaterial=new THREE.MeshStandardMaterial({color:0x6d5a50,roughness:.96});part(group,new THREE.BoxGeometry(.62,1.15,.58),chimneyMaterial,[-3.55,7.75,-2.75]);
    const smokeCanvas=document.createElement('canvas');smokeCanvas.width=smokeCanvas.height=64;const smokeContext=smokeCanvas.getContext('2d');const smokeGradient=smokeContext.createRadialGradient(32,32,2,32,32,31);smokeGradient.addColorStop(0,'rgba(220,226,228,.42)');smokeGradient.addColorStop(.42,'rgba(202,210,214,.24)');smokeGradient.addColorStop(1,'rgba(188,198,203,0)');smokeContext.fillStyle=smokeGradient;smokeContext.fillRect(0,0,64,64);
    const smokeMaterial=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(smokeCanvas),color:0xd4d9da,transparent:true,opacity:0,depthWrite:false});const smoke=new THREE.Group();smoke.name='Chimney_Smoke';smoke.position.set(-3.55,8.35,-2.75);group.add(smoke);const smokePuffs=[];
    for(let index=0;index<7;index++){const puff=new THREE.Sprite(smokeMaterial);puff.position.set(0,0,0);puff.scale.set(.2,.15,1);puff.userData.phase=index/7;smoke.add(puff);smokePuffs.push(puff)}

    const porchPoolMaterial=new THREE.MeshBasicMaterial({color:0xffbd72,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});const porchPool=part(group,new THREE.CircleGeometry(1.75,28),porchPoolMaterial,[0,.045,2.35],[1.25,.72,1],[-Math.PI/2,0,0]);porchPool.name='Porch_Warmth';

    const spring=new THREE.Group();spring.name='Spring_Butterfly';spring.position.set(5.05,5.28,1.25);group.add(spring);const butterflyWingMaterial=new THREE.MeshBasicMaterial({color:0xe5a6b6,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});const butterflyBodyMaterial=new THREE.MeshBasicMaterial({color:0x5c4c48,transparent:true,opacity:0,depthWrite:false});
    const leftWing=part(spring,new THREE.CircleGeometry(.25,8),butterflyWingMaterial,[-.13,0,0],[1,.62,1],[0,.5,0]);const rightWing=part(spring,new THREE.CircleGeometry(.25,8),butterflyWingMaterial,[.13,0,0],[1,.62,1],[0,-.5,0]);part(spring,new THREE.SphereGeometry(.09,7,5),butterflyBodyMaterial,[0,-.02,0],[.55,1.5,.55],[Math.PI/2,0,0]);

    const fireflyGeometry=new THREE.BufferGeometry();const fireflyBase=[[-.5,.2,-.1],[.1,.55,.25],[.65,.12,-.2],[-.1,.85,-.5],[.42,.72,.48]];fireflyGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fireflyBase.flat(),3));const fireflyMaterial=new THREE.PointsMaterial({color:0xffda78,size:.16,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});const summer=new THREE.Points(fireflyGeometry,fireflyMaterial);summer.name='Summer_Fireflies';summer.position.set(5.55,1.35,3.7);group.add(summer);

    const autumn=new THREE.Group();autumn.name='Autumn_Squirrel';autumn.position.set(4.9,.18,2.55);autumn.rotation.y=-.55;group.add(autumn);const squirrelMaterial=new THREE.MeshStandardMaterial({color:0x9b5b32,roughness:.92,transparent:true,opacity:0});
    part(autumn,new THREE.SphereGeometry(.32,9,7),squirrelMaterial,[0,.35,0],[.72,1,.78]);part(autumn,new THREE.SphereGeometry(.22,8,6),squirrelMaterial,[0,.72,.02]);const squirrelTail=part(autumn,new THREE.SphereGeometry(.38,9,7),squirrelMaterial,[-.34,.6,-.04],[.72,1.38,.58],[0,0,-.48]);part(autumn,new THREE.ConeGeometry(.07,.16,5),squirrelMaterial,[-.09,.91,0],[1,1,1],[0,0,-.2]);part(autumn,new THREE.ConeGeometry(.07,.16,5),squirrelMaterial,[.09,.91,0],[1,1,1],[0,0,.2]);

    const winter=new THREE.Group();winter.name='Winter_Porch_Cat';winter.position.set(2.25,.15,2.05);winter.rotation.y=-.28;group.add(winter);const catMaterial=new THREE.MeshStandardMaterial({color:0x8a817a,roughness:.95,transparent:true,opacity:0});
    part(winter,new THREE.SphereGeometry(.32,9,7),catMaterial,[0,.36,0],[.72,1.08,.68]);part(winter,new THREE.SphereGeometry(.23,9,7),catMaterial,[0,.73,.03]);part(winter,new THREE.ConeGeometry(.09,.19,4),catMaterial,[-.12,.94,.02],[1,1,1],[0,0,-.1]);part(winter,new THREE.ConeGeometry(.09,.19,4),catMaterial,[.12,.94,.02],[1,1,1],[0,0,.1]);const catTail=part(winter,new THREE.CylinderGeometry(.055,.075,.62,7),catMaterial,[-.28,.38,-.04],[1,1,1],[0,0,-.72]);

    return {group,cupGroup,smoke,smokeMaterial,smokePuffs,porchPool,porchPoolMaterial,spring,summer,autumn,winter,butterflyWingMaterial,butterflyBodyMaterial,fireflyMaterial,squirrelMaterial,catMaterial,leftWing,rightWing,squirrelTail,catTail,fireflyBase};
  }
  function createObjectPicker(parent,objects){
    const raycaster=new THREE.Raycaster();raycaster.layers.set(1);const pointer=new THREE.Vector2();const targets=[];
    const expansion={Guitar:[2.3,1.6,2.1],Windows:[1.08,1.2,1.18],Porch_Light:[4.2,3.2,4.2],Piano:[1.35,1.35,1.35],Bookshelf:[1.45,1.4,1.45]};
    for(const name of Object.keys(expansion)){
      const object=objects[name];if(!object?.isMesh)continue;object.geometry.computeBoundingBox();const center=object.geometry.boundingBox.getCenter(new THREE.Vector3()).add(object.position);const size=object.geometry.boundingBox.getSize(new THREE.Vector3());const factor=expansion[name];size.set(Math.max(size.x*factor[0],.55),Math.max(size.y*factor[1],.55),Math.max(size.z*factor[2],.55));
      const material=new THREE.MeshBasicMaterial({color:0xffffff,colorWrite:false,depthWrite:false});const proxy=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),material);proxy.position.copy(center);proxy.name=`Pick_${name}`;proxy.userData.pickName=name;proxy.layers.set(1);parent.add(proxy);targets.push(proxy);
    }
    function pick(event){
      const rect=canvas.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);
      // Projected proxy centres provide forgiving touch/hover targets for small
      // props that can sit behind porch geometry, while Raycaster remains the
      // primary hit test for the visible GLB surface.
      const projected=targets.map(object=>{
        const point=object.getWorldPosition(new THREE.Vector3()).project(camera);
        const x=rect.left+(point.x+1)*rect.width/2;const y=rect.top+(1-point.y)*rect.height/2;
        return {object,distance:(x-event.clientX)**2+(y-event.clientY)**2};
      }).sort((a,b)=>a.distance-b.distance);
      if(projected[0]?.distance<(mobile?54:64)**2)return projected[0].object.userData.pickName||null;
      const hits=raycaster.intersectObjects(targets,false);if(!hits.length)return null;
      hits.sort((left,right)=>{
        const leftCenter=left.object.getWorldPosition(new THREE.Vector3()).project(camera);const rightCenter=right.object.getWorldPosition(new THREE.Vector3()).project(camera);
        return leftCenter.distanceToSquared(pointer)-rightCenter.distanceToSquared(pointer);
      });
      return hits[0].object.userData.pickName||null;
    }
    return {raycaster,targets,pick};
  }
  function makeLighting(source){
    const value={};for(const [key,item] of Object.entries(source))value[key]=Array.isArray(item)?[...item]:item;return value;
  }
  function mixNumber(a,b,t){return a+(b-a)*t}
  function mixColor(a,b,t){return new THREE.Color(a).lerp(new THREE.Color(b),t).getHex()}
  function mixLighting(a,b,t){
    const value={};
    for(const key of ['sunlightIntensity','environmentIntensity','exposure','windowEmission','porchEmission','windowLight','porchLight','cameraYaw','haloOpacity','fogDensity','homeActivity','nightFactor'])value[key]=mixNumber(a[key],b[key],t);
    for(const key of ['sunlightColor','environmentColor','groundColor','windowColor','porchColor','halo','fogColor'])value[key]=mixColor(a[key],b[key],t);
    value.sunPosition=a.sunPosition.map((item,index)=>mixNumber(item,b.sunPosition[index],t));
    value.background=a.background.map((item,index)=>mixColor(item,b.background[index],t));
    return value;
  }
  function mixSeason(a,b,t){
    const value={};
    for(const key of ['winterLeafLoss','cameraDrift','compositionScale','decorOpacity','environmentBlend','backgroundBlend','sunBlend','springBlossoms','autumnLeaves','winterSnow','smoke','springCreature','summerCreature','autumnCreature','winterCreature'])value[key]=mixNumber(a[key],b[key],t);
    for(const key of ['treeColor','groundColor','environmentTint','backgroundTint','sunTint'])value[key]=mixColor(a[key],b[key],t);
    return value;
  }
  function staggerProgress(raw,start=0,end=1){const value=Math.max(0,Math.min(1,(raw-start)/(end-start)));return value*value*(3-2*value)}
  function mixSeasonStaggered(transition,raw){
    const base=staggerProgress(raw);const value=mixSeason(transition.from,transition.to,base);
    const timings={springBlossoms:[0,1],autumnLeaves:[0,1],winterSnow:[0,1],winterLeafLoss:[0,1]};
    if(transition.fromName==='spring'&&transition.toName==='summer')timings.springBlossoms=[0,.68];
    if(transition.toName==='autumn')timings.autumnLeaves=[.18,1];
    if(transition.fromName==='autumn')timings.autumnLeaves=[0,.62];
    if(transition.toName==='winter'){timings.winterSnow=[.22,1];timings.winterLeafLoss=[.06,1]}
    if(transition.fromName==='winter'){timings.winterSnow=[0,.62];timings.winterLeafLoss=[.12,1]}
    if(transition.toName==='spring')timings.springBlossoms=[.35,1];
    for(const [key,[start,end]] of Object.entries(timings))value[key]=mixNumber(transition.from[key],transition.to[key],staggerProgress(raw,start,end));
    return value;
  }
  function colorCss(hex){return `#${new THREE.Color(hex).getHexString()}`}
  function setMaterials(materials,color,intensity){for(const material of materials){material.emissive.setHex(color);material.emissiveIntensity=intensity}}
  function applySeason(value){
    for(const material of treeMaterials)material.color.setHex(value.treeColor);
    for(const material of groundMaterials)material.color.setHex(value.groundColor);
    for(const material of decorMaterials)material.opacity=value.decorOpacity;
    if(controls.Tree_Crown?.morphTargetInfluences)controls.Tree_Crown.morphTargetInfluences[0]=value.winterLeafLoss;
    seasonalObjects.blossomMaterial.opacity=value.springBlossoms*.92;seasonalObjects.blossoms.visible=value.springBlossoms>.002;
    seasonalObjects.leafMaterial.opacity=value.autumnLeaves*.94;seasonalObjects.leaves.visible=value.autumnLeaves>.002;
    seasonalObjects.snowMaterial.opacity=value.winterSnow*.82;seasonalObjects.groundSnow.visible=value.winterSnow>.002;
    seasonalObjects.roofMaterial.opacity=value.winterSnow*.92;seasonalObjects.roofSnow.visible=value.winterSnow>.002;
  }
  function applyLighting(value,now=0){
    const sunlightColor=new THREE.Color(value.sunlightColor).lerp(new THREE.Color(seasonLighting.sunTint),seasonLighting.sunBlend);
    const environmentColor=new THREE.Color(value.environmentColor).lerp(new THREE.Color(seasonLighting.environmentTint),seasonLighting.environmentBlend);
    sun.intensity=value.sunlightIntensity;sun.color.copy(sunlightColor);sun.position.fromArray(value.sunPosition);
    hemi.intensity=value.environmentIntensity;hemi.color.copy(environmentColor);hemi.groundColor.setHex(value.groundColor);
    renderer.toneMappingExposure=value.exposure;
    const pulse=value.windowEmission>.1?1+Math.sin(now*.00115)*.035:1;
    const windowLevel=((overrides.window??value.windowEmission)+windowLevelInteractive*.56+(hoveredName==='Windows'?.055:0))*pulse;
    const porchLevel=(overrides.porch??value.porchEmission)+lampLevel*(.08+value.porchEmission*.5)+(hoveredName==='Porch_Light'?.045:0);
    setMaterials(windowMaterials,value.windowColor,windowLevel);setMaterials(porchMaterials,value.porchColor,porchLevel);
    windowLight.color.setHex(value.windowColor);windowLight.intensity=value.windowLight*(windowLevel/Math.max(value.windowEmission,.001))+windowLevelInteractive*12;
    porchLight.color.setHex(value.porchColor);porchLight.intensity=value.porchLight*(porchLevel/Math.max(value.porchEmission,.001))+lampLevel*(2+value.porchEmission*8);
    scene.fog.color.setHex(value.fogColor);scene.fog.density=value.fogDensity*(1+seasonLighting.winterSnow*.16);
    const backgrounds=value.background.map(color=>new THREE.Color(color).lerp(new THREE.Color(seasonLighting.backgroundTint),seasonLighting.backgroundBlend).getHex());
    page.style.setProperty('--rt-bg-a',colorCss(backgrounds[0]));page.style.setProperty('--rt-bg-b',colorCss(backgrounds[1]));page.style.setProperty('--rt-bg-c',colorCss(backgrounds[2]));
    page.style.setProperty('--rt-halo',colorCss(new THREE.Color(value.halo).lerp(new THREE.Color(seasonLighting.sunTint),seasonLighting.sunBlend).getHex()));page.style.setProperty('--rt-halo-opacity',value.haloOpacity.toFixed(3));
  }
  function animateLife(now){
    const seconds=now*.001,night=lighting.nightFactor;
    const smokeStrength=seasonLighting.smoke*lighting.homeActivity;lifeDetails.smokeMaterial.opacity=smokeStrength*.2;lifeDetails.smoke.visible=smokeStrength>.008;
    lifeDetails.smokePuffs.forEach((puff,index)=>{const phase=(seconds*.047+puff.userData.phase)%1;const sway=Math.sin(seconds*.42+index*.8)*.08;puff.position.set(phase*.62+sway,phase*2.5,Math.sin(seconds*.31+index)*.09);const size=.14+Math.sin(Math.PI*phase)*(.22+phase*.25);puff.scale.set(size*1.3,size,1)});
    lifeDetails.porchPoolMaterial.opacity=Math.min(.145,(lighting.porchEmission*.082+lampLevel*.042))*lighting.homeActivity;

    const springOpacity=seasonLighting.springCreature*(1-night*.65)*.88;lifeDetails.spring.visible=springOpacity>.003;lifeDetails.butterflyWingMaterial.opacity=springOpacity*.82;lifeDetails.butterflyBodyMaterial.opacity=springOpacity;
    const flap=.38+Math.sin(seconds*3.2)*.24;lifeDetails.leftWing.rotation.y=flap;lifeDetails.rightWing.rotation.y=-flap;lifeDetails.spring.position.y=5.28+Math.sin(seconds*.72)*.035;lifeDetails.spring.rotation.y=Math.sin(seconds*.35)*.12;

    const summerOpacity=seasonLighting.summerCreature*(.06+night*.94)*(.76+Math.sin(seconds*1.15)*.18);lifeDetails.summer.visible=summerOpacity>.003;lifeDetails.fireflyMaterial.opacity=summerOpacity;
    const positions=lifeDetails.summer.geometry.attributes.position;lifeDetails.fireflyBase.forEach((point,index)=>{positions.setXYZ(index,point[0]+Math.sin(seconds*.42+index)*.07,point[1]+Math.sin(seconds*.58+index*1.7)*.08,point[2]+Math.cos(seconds*.37+index)*.06)});positions.needsUpdate=true;

    const autumnOpacity=seasonLighting.autumnCreature*(1-night*.55)*.94;lifeDetails.autumn.visible=autumnOpacity>.003;lifeDetails.squirrelMaterial.opacity=autumnOpacity;lifeDetails.squirrelTail.rotation.z=-.48+Math.sin(seconds*.62)*.055;lifeDetails.autumn.position.y=.18+Math.sin(seconds*.85)*.009;
    const winterOpacity=seasonLighting.winterCreature*(.72+night*.28)*.9;lifeDetails.winter.visible=winterOpacity>.003;lifeDetails.catMaterial.opacity=winterOpacity;lifeDetails.catTail.rotation.z=-.72+Math.sin(seconds*.48)*.045;lifeDetails.winter.rotation.y=-.28+Math.sin(seconds*.18)*.025;
  }
  function transitionTime(name,animate=true){
    const next=TIME_OF_DAY[name]||TIME_OF_DAY.day;overrides.window=null;overrides.porch=null;
    if(!animate||reduced.matches){lighting=makeLighting(next);lightingTransition=null;applyLighting(lighting,performance.now());return}
    lightingTransition={from:makeLighting(lighting),to:makeLighting(next),start:performance.now(),duration:TIME_TRANSITION_MS};
  }
  function transitionSeason(name,animate=true){
    const next=SEASON_STATE[name]||SEASON_STATE.summer;
    if(!animate||reduced.matches){seasonLighting=makeLighting(next);seasonTransition=null;applySeason(seasonLighting);applyLighting(lighting,performance.now());return}
    seasonTransition={from:makeLighting(seasonLighting),to:makeLighting(next),fromName:activeSeason,toName:name,start:performance.now(),duration:SEASON_TRANSITION_MS};
  }
  function resize(){
    const rect=container.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const aspect=rect.width/rect.height;camera.left=-baseHalfHeight*aspect;camera.right=baseHalfHeight*aspect;camera.top=baseHalfHeight;camera.bottom=-baseHalfHeight;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);
  }
  new ResizeObserver(resize).observe(container);resize();

  function syncState(event){
    const detail=event?.detail;const [stateSeason,stateTime]=(page.dataset.state||'').split('_');
    page.classList.add('realtime-3d-ready');container.setAttribute('aria-hidden','false');
    const nextTime=detail?.time||stateTime;const nextSeason=detail?.season||stateSeason;
    const unified=detail?.unified&&window.CottageTransition?.active;
    if(nextTime!==activeTime){if(!unified)transitionTime(nextTime,true);activeTime=nextTime}
    if(nextSeason!==activeSeason){if(!unified)transitionSeason(nextSeason,true);activeSeason=nextSeason}
    page.dataset.realtimeTime=nextTime;page.dataset.realtimeSeason=nextSeason;
  }
  page.addEventListener('cottage:statechange',syncState);
  page.addEventListener('cottage:transitionstart',event=>{
    const detail=event.detail;const toLighting=TIME_OF_DAY[detail.toTime]||TIME_OF_DAY.day;const toSeason=SEASON_STATE[detail.toSeason]||SEASON_STATE.spring;
    sharedTransition={id:detail.id,timeChanged:detail.timeChanged,seasonChanged:detail.seasonChanged,fromLighting:makeLighting(lighting),toLighting:makeLighting(toLighting),season:{from:makeLighting(seasonLighting),to:makeLighting(toSeason),fromName:detail.fromSeason,toName:detail.toSeason},cameraFrom:{position:camera.position.clone(),target:cameraLookTarget.clone()},cameraTo:cameraPose(detail.toSeason)};
    lightingTransition=null;seasonTransition=null;
  });
  page.addEventListener('cottage:transitionframe',event=>{
    if(!sharedTransition||event.detail.id!==sharedTransition.id)return;const raw=event.detail.raw;
    const lightProgress=window.CottageTransition.smooth(window.CottageTransition.range(raw,.02,.92));const seasonProgress=window.CottageTransition.range(raw,.03,.94);
    if(sharedTransition.timeChanged)lighting=mixLighting(sharedTransition.fromLighting,sharedTransition.toLighting,lightProgress);
    if(sharedTransition.seasonChanged)seasonLighting=mixSeasonStaggered(sharedTransition.season,seasonProgress);
    if(sharedTransition.seasonChanged){const cameraProgress=window.CottageTransition.easeInOutCubic(window.CottageTransition.range(raw,0,1));camera.position.lerpVectors(sharedTransition.cameraFrom.position,sharedTransition.cameraTo.position,cameraProgress);camera.position.addScaledVector(cameraUp,Math.sin(Math.PI*cameraProgress)*.07);cameraLookTarget.lerpVectors(sharedTransition.cameraFrom.target,sharedTransition.cameraTo.target,cameraProgress);camera.lookAt(cameraLookTarget)}
  });
  page.addEventListener('cottage:transitionend',event=>{if(sharedTransition?.id===event.detail.id)sharedTransition=null});

  page.addEventListener('pointermove',event=>{
    if(reduced.matches)return;
    const rect=visual.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const amplitude=event.pointerType==='touch'?.03:.095;
    pointerTarget.yaw=THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width-.5,-.5,.5)*amplitude;
    pointerTarget.pitch=THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height-.5,-.5,.5)*(mobile?.012:.026);
  },{passive:true});
  page.addEventListener('pointerleave',()=>{pointerTarget.yaw=0;pointerTarget.pitch=0});

  function setHover(name){hoveredName=name;container.classList.toggle('has-pick',Boolean(name));container.dataset.hoverObject=name||''}
  function cameraPush(){cameraPushTarget=1;clearTimeout(cameraPushTimer);cameraPushTimer=setTimeout(()=>cameraPushTarget=0,520)}
  function interact(name){
    if(!name)return;cameraPush();
    if(name==='Guitar')window.cottageInteractions?.playSeasonGuitar();
    else if(name==='Porch_Light')window.cottageInteractions?.toggleLamp();
    else if(name==='Windows')window.cottageInteractions?.awakenWindow();
    else page.dispatchEvent(new CustomEvent('cottage3d:objectclick',{detail:{name}}));
  }
  canvas.addEventListener('pointermove',event=>setHover(event.pointerType==='touch'?null:picker.pick(event)),{passive:true});
  canvas.addEventListener('pointerleave',()=>setHover(null));
  canvas.addEventListener('click',event=>interact(picker.pick(event)));
  page.addEventListener('cottage:lamp',event=>{lampTarget=event.detail?.on?1:0});
  page.addEventListener('cottage:windowawake',()=>{windowTarget=1;clearTimeout(windowRestoreTimer);windowRestoreTimer=setTimeout(()=>windowTarget=0,2700)});

  window.cottage3D={
    renderer,scene,camera,model,objects:controls,timeOfDay:TIME_OF_DAY,seasons:SEASON_STATE,seasonalObjects,lifeDetails,picker,
    setTimeOfDay:(name,animate=true)=>transitionTime(name,animate),
    setSeason:(name,animate=true)=>transitionSeason(name,animate),
    setRotation:yaw=>{pointerTarget.yaw=THREE.MathUtils.clamp(yaw,-.07,.07)},
    setWindowGlow:intensity=>{overrides.window=Math.max(0,Number(intensity)||0)},
    setPorchGlow:intensity=>{overrides.porch=Math.max(0,Number(intensity)||0)},
    clearGlowOverrides:()=>{overrides.window=null;overrides.porch=null},
    setTreeCrownVisible:visible=>{if(controls.Tree_Crown)controls.Tree_Crown.visible=Boolean(visible)},
    fallback:()=>fallback(new Error('Manual fallback'))
  };

  const [initialSeason='summer',initialTime='day']=(page.dataset.state||'summer_day').split('_');activeSeason=initialSeason;activeTime=initialTime;transitionSeason(initialSeason,false);transitionTime(initialTime,false);setCameraPose(initialSeason);
  await renderer.compileAsync(scene,camera);
  page.classList.remove('realtime-3d-loading');page.dataset.webgl='ready';page.dataset.glbObjects=Object.keys(controls).filter(name=>controls[name]).join(',');
  hideLoading();
  syncState();

  function frame(now){
    if(!running)return;requestAnimationFrame(frame);
    const dt=Math.min(.05,(now-last)/1000);last=now;
    if(lightingTransition){
      const raw=Math.min(1,(now-lightingTransition.start)/lightingTransition.duration);const eased=raw*raw*(3-2*raw);
      lighting=mixLighting(lightingTransition.from,lightingTransition.to,eased);if(raw===1)lightingTransition=null;
    }
    if(seasonTransition){
      const raw=Math.min(1,(now-seasonTransition.start)/seasonTransition.duration);
      seasonLighting=mixSeasonStaggered(seasonTransition,raw);if(raw===1)seasonTransition=null;
    }
    lampLevel=THREE.MathUtils.damp(lampLevel,lampTarget,4.6,dt);windowLevelInteractive=THREE.MathUtils.damp(windowLevelInteractive,windowTarget,3.8,dt);cameraPushLevel=THREE.MathUtils.damp(cameraPushLevel,cameraPushTarget,5.2,dt);
    for(const name of Object.keys(highlightMaterials)){
      const target=hoveredName===name?(name==='Guitar'?.18:.075):0;highlightLevel[name]=THREE.MathUtils.damp(highlightLevel[name],target,7,dt);for(const material of highlightMaterials[name])material.emissiveIntensity=highlightLevel[name];
    }
    applySeason(seasonLighting);
    applyLighting(lighting,now);
    animateLife(now);
    pointerCurrent.yaw=THREE.MathUtils.damp(pointerCurrent.yaw,pointerTarget.yaw,3.0,dt);pointerCurrent.pitch=THREE.MathUtils.damp(pointerCurrent.pitch,pointerTarget.pitch,3.0,dt);
    if(!reduced.matches){model.rotation.y=lighting.cameraYaw+seasonLighting.cameraDrift+pointerCurrent.yaw;model.rotation.x=pointerCurrent.pitch;model.position.y=baseY+Math.sin(now*.00067)*.018}else{model.rotation.y=lighting.cameraYaw+seasonLighting.cameraDrift;model.rotation.x=0;model.position.y=baseY}
    const nextZoom=seasonLighting.compositionScale+cameraPushLevel*.026;if(Math.abs(camera.zoom-nextZoom)>.0001){camera.zoom=nextZoom;camera.updateProjectionMatrix()}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{running=!document.hidden;if(running){last=performance.now();requestAnimationFrame(frame)}});
}
