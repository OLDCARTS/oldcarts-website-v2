/* ═══════════════════════════════════════════════════════════
   OLDCARTS — hero3d.js
   A living "operational organism": ~50k GPU particles on a
   noise-displaced sphere, beating at a resting heart rate.
   Custom GLSL (simplex noise, curl drift, lub-dub envelope),
   additive blending, pointer repulsion, scroll response.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';

const NOISE_GLSL = /* glsl */`
  //  Simplex 3D noise — Ashima / Ian McEwan (MIT)
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const VERT = /* glsl */`
  ${NOISE_GLSL}
  attribute float aRand;
  attribute float aShell;      // 0 = organism, 1 = ambient dust
  uniform float uTime;
  uniform float uBeat;         // 0..1 heartbeat envelope
  uniform float uScroll;       // 0..1 hero scroll progress
  uniform vec3  uPointer;      // pointer in object space
  uniform float uPointerStr;
  uniform float uSize;
  varying float vGlow;
  varying float vRand;
  varying float vShell;
  varying float vFacing;

  void main() {
    vRand = aRand;
    vShell = aShell;
    vec3 p = position;

    // breathing noise displacement along radial direction
    float n = snoise(p * 1.35 + vec3(uTime * 0.09, uTime * 0.055, uTime * 0.07));
    float n2 = snoise(p * 3.4 - vec3(0.0, uTime * 0.12, 0.0));
    float displ = n * 0.24 + n2 * 0.075;

    // heartbeat: systolic expansion, stronger where noise is high
    float beatAmp = mix(0.10, 0.22, smoothstep(-0.4, 0.8, n));
    displ += uBeat * beatAmp;

    vec3 dir = normalize(p + 0.0001);
    p += dir * displ * mix(1.0, 0.35, aShell);

    // ambient dust drifts slowly outward
    p += aShell * dir * (0.35 + 0.1 * sin(uTime * 0.2 + aRand * 6.283));

    // pointer repulsion — a gentle palpation
    vec3 toP = p - uPointer;
    float d = length(toP);
    float rep = smoothstep(0.75, 0.0, d) * uPointerStr;
    p += normalize(toP + 0.0001) * rep * 0.34;

    // scroll: the organism loosens and recedes as you examine deeper
    p *= 1.0 + uScroll * 0.55;

    // rim shading — particles near the silhouette glow (spherical reading)
    vec3 nrmV = normalize((modelViewMatrix * vec4(dir, 0.0)).xyz);
    vFacing = pow(1.0 - abs(nrmV.z), 1.5);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * mix(0.9, 1.9, aRand) * (1.0 + uBeat * 0.5);
    size *= mix(1.0, 0.55, aShell);
    gl_PointSize = size * (1.0 / -mv.z);

    vGlow = smoothstep(-0.2, 0.9, n) + rep * 2.2;
  }
`;

const FRAG = /* glsl */`
  uniform vec3 uColorA;   // sage
  uniform vec3 uColorB;   // pulse coral
  uniform vec3 uColorC;   // bone
  uniform float uBeat;
  uniform float uScroll;
  varying float vGlow;
  varying float vRand;
  varying float vShell;
  varying float vFacing;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.06, r);

    vec3 col = mix(uColorA, uColorB, smoothstep(0.35, 1.05, vGlow * 0.7 + vFacing * 0.55 + uBeat * 0.5));
    col = mix(col, uColorC, step(0.984, vRand));           // rare bone motes
    col = mix(col, uColorA * 0.55, vShell * 0.6);          // dust is dimmer sage
    col *= (0.55 + vFacing * 0.9) * (1.0 + uBeat * 0.35);  // rim light + systole

    float alpha = soft * mix(0.35, 1.0, vFacing * 0.75 + vGlow * 0.25);
    alpha *= mix(1.0, 0.2, vShell);
    alpha *= 1.0 - uScroll * 0.65;
    gl_FragColor = vec4(col, alpha);
  }
`;

function sampleSphere(count, radius, jitter) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // gaussian → uniform on sphere, with radial jitter for depth
    let x = 0, y = 0, z = 0, l = 0;
    do {
      x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1;
      l = Math.hypot(x, y, z);
    } while (l > 1 || l === 0);
    const r = radius * (1 + (Math.random() - 0.5) * jitter);
    arr[i * 3] = (x / l) * r;
    arr[i * 3 + 1] = (y / l) * r;
    arr[i * 3 + 2] = (z / l) * r;
  }
  return arr;
}

export function createHeroScene({ canvas, beatClock, reducedMotion }) {
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const ORGANISM = reducedMotion ? 9000 : (isMobile ? 15000 : 42000);
  const DUST = reducedMotion ? 600 : (isMobile ? 700 : 1800);
  const COUNT = ORGANISM + DUST;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
  camera.position.z = 3.4;

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  pos.set(sampleSphere(ORGANISM, 1.0, 0.14), 0);
  pos.set(sampleSphere(DUST, 1.62, 0.7), ORGANISM * 3);
  const rand = new Float32Array(COUNT);
  const shell = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    rand[i] = Math.random();
    shell[i] = i < ORGANISM ? 0 : 1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.setAttribute('aShell', new THREE.BufferAttribute(shell, 1));

  const uniforms = {
    uTime: { value: 0 },
    uBeat: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector3(99, 99, 99) },
    uPointerStr: { value: 0 },
    uSize: { value: (isMobile ? 5.4 : 6.8) * Math.min(devicePixelRatio, 1.75) },
    uColorA: { value: new THREE.Color('#8FB8A5') },
    uColorB: { value: new THREE.Color('#FF5C42') },
    uColorC: { value: new THREE.Color('#EDE7DB') },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // ── layout: keep the organism right-of-center on desktop ──
  function layout() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 980;
    group.position.x = wide ? 0.92 : 0;
    group.position.y = wide ? 0.02 : 0.62;
    const s = wide ? 0.75 : 0.62;
    group.scale.setScalar(s);
  }
  layout();

  // ── pointer → object space (approx, plane z=0) ──
  const pointerTarget = new THREE.Vector3(99, 99, 99);
  let ptrStrTarget = 0;
  function onPointer(e) {
    const x = (e.clientX / innerWidth) * 2 - 1;
    const y = -(e.clientY / innerHeight) * 2 + 1;
    const vec = new THREE.Vector3(x, y, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    const world = camera.position.clone().add(dir.multiplyScalar(dist));
    pointerTarget.copy(group.worldToLocal(world));
    ptrStrTarget = 1;
  }
  function onPointerLeave() { ptrStrTarget = 0; }
  addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerLeave);

  // ── rotation drift + parallax ──
  let rx = 0, ry = 0, mx = 0, my = 0;
  addEventListener('pointermove', (e) => {
    mx = (e.clientX / innerWidth - 0.5);
    my = (e.clientY / innerHeight - 0.5);
  }, { passive: true });

  let scrollP = 0;
  const api = {
    setScroll(p) { scrollP = p; },
    resize: layout,
    renderer,
  };

  const clock = new THREE.Clock();
  let running = true;

  function frame() {
    if (!running) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uBeat.value = beatClock.value;
    uniforms.uScroll.value += (scrollP - uniforms.uScroll.value) * 0.08;

    uniforms.uPointer.value.lerp(pointerTarget, 0.12);
    uniforms.uPointerStr.value += (ptrStrTarget - uniforms.uPointerStr.value) * 0.06;

    ry += ((mx * 0.5 + t * 0.03) - ry) * 0.05;
    rx += ((my * 0.35) - rx) * 0.05;
    group.rotation.y = ry;
    group.rotation.x = rx;

    renderer.render(scene, camera);
    if (!reducedMotion) requestAnimationFrame(frame);
  }
  frame();
  if (reducedMotion) { renderer.render(scene, camera); }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; }
    else if (!running && !reducedMotion) { running = true; clock.getDelta(); frame(); }
  });

  addEventListener('resize', layout);
  return api;
}
