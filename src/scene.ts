import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import gsap from "gsap";

const ids = ["vizija", "povjerenje", "preciznost", "projekt"];
const sculptureX = [3.8, -2, 3.2, -0.5];
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
export async function mountGarden(
  host: HTMLDivElement,
  onFail: () => void,
): Promise<() => void> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    onFail();
    return () => {};
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e2e6ea");
  scene.fog = new THREE.Fog("#e2e6ea", 20, 39);
  const camera = new THREE.PerspectiveCamera(
    44,
    innerWidth / innerHeight,
    0.15,
    140,
  );
  const dpr = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.55;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#f1f5ff", "#50565f", 1.1));
  const sun = new THREE.DirectionalLight("#ffffff", 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 65;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const geometries: THREE.BufferGeometry[] = [];
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const fragments: {
    mesh: THREE.Mesh;
    index: number;
    origin: THREE.Vector3;
  }[] = [];
  let disposed = false;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tween: gsap.core.Tween | undefined;
  const water = new Reflector(new THREE.PlaneGeometry(220, 230), {
    color: 0x969fa8,
    textureWidth: 768,
    textureHeight: 768,
    clipBias: 0.001,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.006, -35);
  const waterMaterial = water.material as THREE.ShaderMaterial;
  waterMaterial.uniforms.uTime = { value: 0 };
  waterMaterial.vertexShader = waterMaterial.vertexShader
    .replace("varying vec4 vUv;", "varying vec4 vUv;\n varying vec3 vWorld;")
    .replace(
      "void main() {",
      "void main() {\n vWorld = (modelMatrix * vec4(position,1.0)).xyz;",
    );
  waterMaterial.fragmentShader = waterMaterial.fragmentShader
    .replace(
      "uniform vec3 color;",
      "uniform vec3 color;\n uniform float uTime;\n varying vec3 vWorld;",
    )
    .replace(
      "vec4 base = texture2DProj( tDiffuse, vUv );",
      "vec4 rippleUv=vUv;\n rippleUv.x += sin(vWorld.z*2.8+uTime*.5)*.00042*vUv.w;\n rippleUv.y += sin(vWorld.x*3.1+vWorld.z*1.2+uTime*.3)*.0003*vUv.w;\n vec4 base = texture2DProj(tDiffuse,rippleUv);",
    )
    .replace(
      "vec4( blendOverlay( base.rgb, color ), 1.0 )",
      "vec4(mix(blendOverlay(base.rgb,color),vec3(.48,.52,.57),.16),1.0)",
    );
  scene.add(water);
  const model = new GLTFLoader();
  model.setMeshoptDecoder(MeshoptDecoder);
  try {
    const gltf = await model.loadAsync("/assets/adduco-garden.glb");
    gltf.scene.updateMatrixWorld(true);
    const batches = new Map<
      string,
      {
        material: THREE.MeshStandardMaterial;
        geometries: THREE.BufferGeometry[];
      }
    >();
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) meshes.push(o);
    });
    let batchStart = performance.now();
    for (const o of meshes) {
      if (performance.now() - batchStart > 8) {
        await yieldToBrowser();
        batchStart = performance.now();
      }
      const mat = o.material as THREE.MeshStandardMaterial;
      materials.add(mat);
      if (o.name.startsWith("Reflective")) {
        o.geometry.dispose();
        continue;
      }
      const geom = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      // Compressed attributes may be normalized integers. Convert before applying
      // world transforms so coordinates cannot overflow their integer storage.
      for (const name of ["position", "normal", "uv"]) {
        const attribute = geom.getAttribute(name);
        if (!attribute || attribute.array instanceof Float32Array) continue;
        const values = new Float32Array(attribute.count * attribute.itemSize);
        for (let i = 0; i < attribute.count; i++) {
          values[i * attribute.itemSize] = attribute.getX(i);
          values[i * attribute.itemSize + 1] = attribute.getY(i);
          if (attribute.itemSize > 2)
            values[i * attribute.itemSize + 2] = attribute.getZ(i);
        }
        geom.setAttribute(
          name,
          new THREE.Float32BufferAttribute(values, attribute.itemSize),
        );
      }
      geom.applyMatrix4(o.matrixWorld);
      o.geometry.dispose();
      for (const attr of Object.keys(geom.attributes))
        if (attr !== "position" && attr !== "normal" && attr !== "uv")
          geom.deleteAttribute(attr);
      if (!geom.attributes.normal) geom.computeVertexNormals();
      for (const map of [
        mat.map,
        mat.normalMap,
        mat.roughnessMap,
        mat.metalnessMap,
      ]) {
        if (map) {
          map.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy(),
          );
          textures.add(map);
        }
      }
      if (mat.name.includes("foliage")) mat.side = THREE.DoubleSide;
      if (o.name.startsWith("portal_fragment")) {
        geom.computeBoundingBox();
        const origin = geom.boundingBox!.getCenter(new THREE.Vector3());
        geom.translate(-origin.x, -origin.y, -origin.z);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(origin);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        geometries.push(geom);
        fragments.push({
          mesh,
          index: Number(o.name.split("_").pop()),
          origin,
        });
        continue;
      }
      const key = mat.uuid;
      const batch = batches.get(key) ?? { material: mat, geometries: [] };
      batch.geometries.push(geom);
      batches.set(key, batch);
    }
    for (const batch of batches.values()) {
      await yieldToBrowser();
      const merged = mergeGeometries(batch.geometries);
      batch.geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, batch.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      geometries.push(merged);
    }
    // Spread GPU uploads across tasks instead of blocking the first visible frame.
    for (const texture of textures) {
      await yieldToBrowser();
      renderer.initTexture(texture);
    }
  } catch {
    renderer.dispose();
    water.dispose();
    environment.dispose();
    renderer.domElement.remove();
    onFail();
    return () => {};
  }
  let desired = 0;
  const state = { progress: 0 };
  let lastActive = performance.now();
  let slowFrames = 0;
  let measuredFrames = 0;
  let reducedQuality = false;
  let bounds: { top: number; height: number }[] = [];
  function measure() {
    bounds = ids.map((id) => {
      const el = document.getElementById(id)!;
      return { top: el.offsetTop, height: el.offsetHeight };
    });
  }
  function getProgress() {
    const y = scrollY;
    for (let i = 0; i < 3; i++) {
      const end = bounds[i].top + bounds[i].height * 0.35;
      const next = bounds[i + 1].top;
      if (y < end)
        return i + Math.max(0, (y - bounds[i].top) / bounds[i].height) * 0.055;
      if (y < next) {
        const t = THREE.MathUtils.clamp((y - end) / (next - end), 0, 1);
        return i + 0.02 + 0.98 * (t * t * (3 - 2 * t));
      }
    }
    return (
      3 +
      THREE.MathUtils.clamp((y - bounds[3].top) / bounds[3].height, 0, 1) * 0.12
    );
  }
  function cameraPose(progress: number) {
    const p = Math.min(progress, 3);
    const index = Math.min(Math.floor(p), 2);
    const t = p - index;
    const x = THREE.MathUtils.lerp(sculptureX[index], sculptureX[index + 1], t);
    const portrait = camera.aspect < 1.1;
    const narrow = camera.aspect < 0.65;
    camera.position.set(
      0.25 * Math.sin(p * Math.PI),
      2.15,
      (narrow ? 18 : portrait ? 16 : 12) - 25 * progress,
    );
    camera.lookAt(
      x - (portrait ? 0 : 3.6),
      narrow ? 6 : portrait ? 5.1 : 2.4,
      -25 * progress,
    );
    sun.position.set(-12, 18, 5 - 25 * progress);
    sun.target.position.set(0, 0, -25 * progress);
    const assembly = THREE.MathUtils.smoothstep(progress, 2.7, 3.03);
    fragments.forEach(({ mesh, index: i, origin }) => {
      const amount = 1 - assembly;
      mesh.position.set(
        origin.x + (i % 2 ? 1 : -1) * amount * (0.7 + i * 0.08),
        origin.y + amount * (i * 0.12),
        origin.z + amount * (i % 2 ? 0.4 : -0.6),
      );
      mesh.rotation.z = amount * (i % 2 ? 0.04 : -0.03);
    });
  }
  function exposed() {
    return bounds.some(
      (b) =>
        scrollY + innerHeight > b.top + 70 && scrollY < b.top + b.height - 60,
    );
  }
  function draw(now: number) {
    frame = 0;
    if (disposed || document.hidden || !exposed()) return;
    const start = performance.now();
    cameraPose(state.progress);
    waterMaterial.uniforms.uTime.value = now * 0.001;
    renderer.render(scene, camera);
    renderer.domElement.classList.add("ready");
    const cost = performance.now() - start;
    if (measuredFrames++ < 70 && cost > 32) slowFrames++;
    if (measuredFrames === 70 && slowFrames > 35 && !reducedQuality) {
      renderer.setPixelRatio(Math.min(dpr, 1));
      water.getRenderTarget().setSize(384, 384);
      reducedQuality = true;
    }
    if (now - lastActive < 1800 || Math.abs(desired - state.progress) > 0.001)
      timer = setTimeout(() => {
        timer = undefined;
        frame = requestAnimationFrame(tick);
      }, 32);
  }
  function wake() {
    if (disposed) return;
    lastActive = performance.now();
    if (!frame && !timer) frame = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    timer = undefined;
    draw(now);
  }
  function scroll() {
    desired = getProgress();
    tween?.kill();
    tween = gsap.to(state, {
      progress: desired,
      duration: 0.38,
      ease: "power2.out",
      onUpdate: () => {
        if (!frame) {
          clearTimeout(timer);
          timer = undefined;
          frame = requestAnimationFrame(tick);
        }
      },
    });
    wake();
  }
  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    measure();
    scroll();
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      clearTimeout(timer);
      timer = undefined;
    } else wake();
  }
  function lost(e: Event) {
    e.preventDefault();
    onFail();
  }
  measure();
  desired = getProgress();
  state.progress = desired;
  cameraPose(desired);
  // Let drivers with parallel shader compilation prepare the scene asynchronously.
  await renderer.compileAsync(scene, camera);
  measure();
  desired = getProgress();
  state.progress = desired;
  cameraPose(desired);
  wake();
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return () => {
    disposed = true;
    tween?.kill();
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    water.geometry.dispose();
    water.dispose();
    environment.dispose();
    sun.shadow.map?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
