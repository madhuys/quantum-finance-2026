/* Q-FINEX hero wave: the campaign key visual (q-finex_kv.psd, a dotted particle wave in Wave Blue / Dynamic Purple
   on Midnight Navy) as a live three.js scene. The webp KV stays underneath as the poster and the fallback:
   no WebGL or prefers-reduced-motion -> the static image only. three.js r180 is vendored in vendor/. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, Points, ShaderMaterial,
  AdditiveBlending, Color
} from './vendor/three.module.min.js';

const hosts = Array.from(document.querySelectorAll('[data-wave] .hero-kv'));
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const VERT = `
uniform float uTime;
uniform float uSize;
uniform float uFocus;
uniform float uRange;
uniform vec2 uHalf;
attribute float aSeed;
varying float vH;
varying float vBlur;
varying float vEdge;
varying float vHue;
varying float vSeed;
float wave(vec2 p, float t) {
  float h = sin(p.x * 0.42 + t * 0.30) * 0.95;
  h += sin(p.x * 0.85 - p.y * 0.55 + t * 0.46) * 0.42;
  h += sin(p.y * 1.25 + p.x * 0.22 - t * 0.26) * 0.30;
  h += sin(p.x * 1.9 + p.y * 1.1 + t * 0.7) * 0.07;
  return h;
}
void main() {
  vec3 p = position;
  float h = wave(p.xz, uTime);
  p.y += h;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;
  float blur = clamp(abs(dist - uFocus) / uRange, 0.0, 1.0);
  blur = blur * blur;
  gl_PointSize = uSize * (1.0 + blur * 5.0) * (12.0 / dist);
  vec2 e = abs(position.xz) / uHalf;
  vEdge = (1.0 - smoothstep(0.72, 1.0, e.x)) * (1.0 - smoothstep(0.55, 1.0, e.y));
  vH = h;
  vBlur = blur;
  vHue = 0.5 + 0.5 * sin(position.x * 0.32 + position.z * 0.5 + uTime * 0.12);
  vSeed = aSeed;
}`;

const FRAG = `
uniform vec3 uBlue;
uniform vec3 uPurple;
uniform vec3 uMagenta;
uniform float uGain;
varying float vH;
varying float vBlur;
varying float vEdge;
varying float vHue;
varying float vSeed;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float soft = mix(0.06, 0.5, vBlur);
  float a = 1.0 - smoothstep(0.5 - soft, 0.5, r);
  if (a <= 0.0) discard;
  vec3 col = mix(uBlue, uPurple, smoothstep(0.25, 0.85, vHue));
  col = mix(col, uMagenta, smoothstep(0.75, 1.0, vHue) * 0.6);
  float crest = smoothstep(0.55, 1.35, vH);
  col = mix(col, vec3(0.86, 0.84, 1.0), crest * 0.55);
  float lum = 0.55 + 0.45 * smoothstep(-1.2, 1.2, vH) + vSeed * 0.12;
  a *= lum * vEdge * uGain / (1.0 + vBlur * 7.0);
  gl_FragColor = vec4(col * a, a);
}`;

function makeWave(host) {
  const small = window.matchMedia('(max-width: 760px)').matches;
  const renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000120, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.className = 'kv-gl';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 80);

  /* the grid: fewer points on phones */
  const NX = small ? 150 : 260, NZ = small ? 64 : 110;
  const HX = 13, HZ = 5.2;
  const pos = new Float32Array(NX * NZ * 3), seed = new Float32Array(NX * NZ);
  let k = 0;
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      pos[k * 3] = (i / (NX - 1) * 2 - 1) * HX;
      pos[k * 3 + 1] = 0;
      pos[k * 3 + 2] = (j / (NZ - 1) * 2 - 1) * HZ;
      seed[k] = Math.random();
      k++;
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: small ? 3.2 : 3.0 },
    uFocus: { value: 11 },
    uRange: { value: 6.5 },
    uHalf: { value: [HX, HZ] },
    uGain: { value: 1.5 },
    uBlue: { value: new Color(0x0050E7) },
    uPurple: { value: new Color(0x8A3CF0) },
    uMagenta: { value: new Color(0xCD34E8) }
  };
  const mat = new ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, uniforms,
    transparent: true, depthWrite: false, blending: AdditiveBlending
  });
  /* three sheets, as in the KV: the sharp main wave, a soft one high behind it, a blurred glow band in front */
  const main = new Points(geo, mat);
  main.rotation.y = -0.42;
  const backU = Object.assign({}, uniforms, { uGain: { value: 0.9 }, uSize: uniforms.uSize });
  const back = new Points(geo, new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: backU,
    transparent: true, depthWrite: false, blending: AdditiveBlending }));
  back.rotation.set(0.05, -0.3, 0.06);
  const frontU = Object.assign({}, uniforms, { uGain: { value: 0.75 } });
  const front = new Points(geo, new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: frontU,
    transparent: true, depthWrite: false, blending: AdditiveBlending }));
  front.rotation.set(0, -0.2, -0.04);
  front.scale.set(1, 0.6, 0.35);
  scene.add(back, main, front);
  const pts = main;

  let w = 0, h = 0;
  function frame() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* wide hero: the wave sits right / lower right; phones and tablets: the canvas is a band at the bottom (CSS)
       and the wave runs across it, as the poster crops do */
    if (camera.aspect >= 1.4) {
      camera.position.set(-3.2, 2.1, 11.5);
      camera.lookAt(-0.6, -0.9, 0);
      pts.position.set(4.2, -1.0, 0);
      back.position.set(6.5, 2.0, -8);
      front.position.set(3.0, -3.1, 4.2);
      uniforms.uFocus.value = 11.5;
    } else {
      camera.position.set(0, 2.4, 12.5);
      camera.lookAt(0, -0.2, 0);
      pts.position.set(1.0, -0.6, 0);
      back.position.set(3.0, 2.4, -8);
      front.position.set(0.5, -2.6, 4.2);
      uniforms.uFocus.value = 12;
    }
    uniforms.uSize.value = (small ? 3.2 : 3.0) * Math.min(1.25, Math.max(0.75, h / 900));
    camera.updateProjectionMatrix();
  }

  let visible = true, running = false, t0 = performance.now(), last = 0, shown = false;
  function loop(now) {
    if (!running) return;
    uniforms.uTime.value = (now - t0) / 1000;
    renderer.render(scene, camera);
    if (!shown) { shown = true; host.classList.add('gl-on'); }
    requestAnimationFrame(loop);
  }
  function update() {
    const want = visible && !document.hidden;
    if (want && !running) { running = true; requestAnimationFrame(loop); }
    else if (!want) running = false;
  }
  frame();
  new ResizeObserver(frame).observe(canvas);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; update(); }).observe(host);
  }
  document.addEventListener('visibilitychange', update);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; host.classList.remove('gl-on'); });
  update();
}

if (hosts.length && !reduce.matches && webglOK()) {
  hosts.forEach((h) => { try { makeWave(h); } catch (e) { /* the poster stays */ } });
}
