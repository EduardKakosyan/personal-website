'use client'

// How the world is drawn. Three looks to compare (Eduard, after the pixel
// pass: "a bit more smoothed out and less pixelly ... closer to Animal Crossing"):
// - pixel:  drawn ~230 pixels tall, light in flat steps, one-pixel outlines (A34)
// - soft:   the same, at about twice the resolution, so pixels and outlines are finer
// - smooth: full resolution, soft light and shadows, no outlines

import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GROUND_MASK, GROUND_RECT, type Look } from './world'

let currentLook: Look = 'pixel'
/** Shared by the ground and foliage shaders: 1 = soft edges, and how strong the speckles are. */
const lookUniforms = { uSoft: { value: 0 }, uSpeck: { value: 1 } }

/** Call once, before the models load. */
export function configureLook(look: Look) {
  currentLook = look
  lookUniforms.uSoft.value = look === 'smooth' ? 1 : 0
  lookUniforms.uSpeck.value = look === 'pixel' ? 1 : look === 'soft' ? 0.7 : 0
}

// ------------------------------------------------------------------ light
/**
 * The light ramp: away from the sun, side-on, facing the sun. Pixel looks use
 * hard steps; the smooth look blends them into a soft terminator.
 */
function makeGradient(steps: number[], smooth: boolean) {
  const data = new Uint8Array(steps.length * 4)
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4))
  const tex = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat)
  tex.minFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter
  tex.magFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}

const steppedGradient = makeGradient([0, 150, 255], false)
const smoothGradient = makeGradient([30, 120, 215, 255], true)
const gradientFor = () => (currentLook === 'smooth' ? smoothGradient : steppedGradient)
const toonCache = new Map<string, THREE.Material>()

/** Swap the glTF's standard materials for toon ones (shared, so cheap). */
export function toToon(source: THREE.Material): THREE.Material {
  const key = `${currentLook}:${source.uuid}`
  const cached = toonCache.get(key)
  if (cached) return cached
  const m = source as THREE.MeshStandardMaterial
  const toon = new THREE.MeshToonMaterial({
    name: m.name,
    color: m.color?.clone() ?? new THREE.Color('#ffffff'),
    map: m.map ?? null,
    emissive: m.emissive?.clone() ?? new THREE.Color('#000000'),
    emissiveIntensity: m.emissiveIntensity ?? 1,
    gradientMap: gradientFor(),
    vertexColors: m.vertexColors,
    side: m.side,
  })
  if (FOLIAGE.test(m.name)) addFoliageTexture(toon)
  toonCache.set(key, toon)
  return toon
}

/**
 * The cabin cutaway: 0 = solid, 1 = gone. Shared by the roof, the south wall
 * and the string lights, which dissolve in a pixel dither pattern when the
 * guest steps inside.
 */
export const cutaway = { value: 0 }
const fadeCache = new Map<string, THREE.Material>()

export function toFadeable(source: THREE.Material): THREE.Material {
  const key = `${currentLook}:${source.uuid}`
  const cached = fadeCache.get(key)
  if (cached) return cached
  const mat = makeFadeable(source, cutaway)
  fadeCache.set(key, mat)
  return mat
}

/**
 * A material of its own that dissolves in the same pixel dither, driven by its
 * own amount (0 = solid, 1 = gone). Used for a tree that stands between the
 * camera and the guest.
 */
export function toOwnFade(source: THREE.Material, amount: { value: number }): THREE.Material {
  return makeFadeable(source, amount)
}

function makeFadeable(source: THREE.Material, amount: { value: number }): THREE.Material {
  const toon = toToon(source) as THREE.MeshToonMaterial
  const mat = toon.clone()
  // keep the toon material's own shader changes (the foliage blotches)
  const before = toon.onBeforeCompile.bind(toon)
  const baseKey = toon.customProgramCacheKey()
  mat.onBeforeCompile = (shader, renderer) => {
    before(shader, renderer)
    shader.uniforms.uCutaway = amount
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uCutaway;
float bayer4(vec2 p) {
  ivec2 i = ivec2(mod(p, 4.0));
  float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  return (m[i.x + i.y * 4] + 0.5) / 16.0;
}`,
      )
      .replace(
        'void main() {',
        'void main() {\n  if (uCutaway > 0.001 && bayer4(gl_FragCoord.xy) < uCutaway) discard;',
      )
  }
  mat.customProgramCacheKey = () => `cabin-fade:${baseKey}`
  return mat
}

const FOLIAGE = /^(spruce|blue_spruce|birch_leaf|alder|grass|moss)/

const NOISE_GLSL = /* glsl */ `
uniform float uSoft;
uniform float uSpeck;
// a hard step in the pixel looks, a soft blend in the smooth look
float edge(float a, float x) { return mix(step(a, x), smoothstep(a - 0.12, a + 0.12, x), uSoft); }
float gHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), f.x),
             mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), f.x), f.y);
}`

/** Needles and leaves: light and dark blotches, so trees look painted, not faceted. */
function addFoliageTexture(mat: THREE.MeshToonMaterial) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lookUniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLeafPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvLeafPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLeafPos;\n${NOISE_GLSL}`)
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
  vec2 lp = vLeafPos.xz + vec2(vLeafPos.y * 0.7, -vLeafPos.y * 0.4);
  float blot = gNoise(lp * 2.6) + (gHash(floor(lp / 0.13)) - 0.5) * 0.35 * uSpeck;
  diffuseColor.rgb *= mix(0.74, 1.0, edge(0.4, blot));
  diffuseColor.rgb *= mix(1.0, 1.25, edge(0.74, blot));`,
      )
  }
  mat.customProgramCacheKey = () => 'cabin-foliage'
}

// ------------------------------------------------------------------ painted ground
// Colours for the ground paint, from the palette sampled from Eduard's photos (A37).
const GROUND_COLORS = {
  uGrassDark: '#4d8a3a',
  uGrass: '#5f9c42',
  uGrassLight: '#79b24c',
  uMeadow: '#7f9c44',
  uMeadowLight: '#9bb052',
  uBlue: '#4c6e45',
  uBlueDark: '#3f5d40',
  uBerry: '#4a5aa8',
  uGravel: '#c2b49b',
  uGravelLight: '#d5c8ae',
  uGravelDark: '#9a8c77',
  uBank: '#8a7358',
}

/**
 * The ground is one big mesh. Where the gravel, the meadow and the blueberry
 * field are comes from a small mask painted in Blender; this shader turns it
 * into crisp, wobbly patches with speckles, so the ground looks hand-pixelled
 * at any screen size.
 */
export function makeGroundMaterial() {
  const mask = new THREE.TextureLoader().load(GROUND_MASK)
  mask.colorSpace = THREE.NoColorSpace
  mask.minFilter = THREE.LinearFilter
  mask.magFilter = THREE.LinearFilter
  mask.generateMipmaps = false

  const mat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: gradientFor() })
  const uniforms: Record<string, THREE.IUniform> = {
    uMask: { value: mask },
    uMaskRect: { value: new THREE.Vector3(GROUND_RECT.x0, GROUND_RECT.y0, GROUND_RECT.size) },
  }
  for (const [k, hex] of Object.entries(GROUND_COLORS))
    uniforms[k] = { value: new THREE.Color(hex) }

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, lookUniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGroundPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvGroundPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    const colorUniforms = Object.keys(GROUND_COLORS)
      .map((k) => `uniform vec3 ${k};`)
      .join('\n')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vGroundPos;
uniform sampler2D uMask;
uniform vec3 uMaskRect;
${colorUniforms}
${NOISE_GLSL}`,
      )
      .replace(
        '#include <map_fragment>',
        `
  // Blender's ground plane: x east, y north (three.js z points south).
  vec2 w = vec2(vGroundPos.x, -vGroundPos.z);
  vec3 m = texture2D(uMask, (w - uMaskRect.xy) / uMaskRect.z).rgb;
  float wob = gNoise(w * 1.4) - 0.5;
  float big = gNoise(w * 0.33);
  float fine = gNoise(w * 2.3) - 0.5;
  float speck = gHash(floor(w / 0.11));

  vec3 c = mix(uGrassDark, uGrass, edge(0.38, big + fine * 0.2));
  c = mix(c, uGrassLight, edge(0.7, big + fine * 0.25));
  c = mix(c, c * 1.16, step(0.95, speck) * uSpeck);

  vec3 meadow = mix(uMeadow, uMeadowLight, edge(0.55, gNoise(w * 0.6) + fine * 0.3));
  meadow = mix(meadow, uGrassDark, step(0.93, speck) * uSpeck);
  c = mix(c, meadow, edge(0.5, m.g + wob * 0.35));

  vec3 berries = mix(uBlue, uBlueDark, edge(0.5, gNoise(w * 0.9) + fine * 0.2));
  berries = mix(berries, uBerry, step(0.9, speck) * uSpeck);
  c = mix(c, berries, edge(0.5, m.b + wob * 0.25));

  vec3 gravel = mix(uGravel, uGravelLight, edge(0.58, gNoise(w * 1.6) + fine * 0.3));
  gravel = mix(gravel, uGravelDark, step(0.86, speck) * uSpeck);
  c = mix(c, gravel, edge(0.5, m.r + wob * 0.3));

  // the brook's banks: bare, stony ground where the channel drops away
  c = mix(c, uBank, edge(0.5, smoothstep(-0.1, -0.3, vGroundPos.y) + wob * 0.5));
  diffuseColor.rgb *= c;
`,
      )
  }
  mat.customProgramCacheKey = () => 'cabin-ground'
  return mat
}

// ------------------------------------------------------------------ low-res render + outlines
const compositeVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

// Outlines in the style of pixel-art 3D: a dark pixel on the near side of a
// depth jump (silhouettes), and a light pixel along outward creases (edges).
const compositeFragment = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec2 uRes;
uniform float uNear;
uniform float uFar;
uniform float uOutlines;
varying vec2 vUv;

float depthAt(vec2 uv) {
  return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar);
}
vec3 normalAt(vec2 uv) {
  return texture2D(tNormal, uv).xyz * 2.0 - 1.0;
}

void main() {
  vec4 col = texture2D(tColor, vUv);
  if (uOutlines > 0.5) {
    vec2 t = 1.0 / uRes;
    float d = depthAt(vUv);
    vec3 n = normalAt(vUv);
    float depthDiff = 0.0;
    float creases = 0.0;
    vec2 offs[4];
    offs[0] = vec2(0.0, 1.0); offs[1] = vec2(0.0, -1.0);
    offs[2] = vec2(1.0, 0.0); offs[3] = vec2(-1.0, 0.0);
    for (int i = 0; i < 4; i++) {
      vec2 uv = vUv + offs[i] * t;
      float dn = depthAt(uv);
      depthDiff += max(dn - d, 0.0);
      vec3 nn = normalAt(uv);
      float towards = smoothstep(-0.01, 0.01, dot(n - nn, vec3(1.0, 1.0, 1.0)));
      float sameSurface = 1.0 - step(0.15, abs(dn - d));
      creases += (1.0 - dot(n, nn)) * towards * sameSurface;
    }
    float silhouette = step(0.3 + d * 0.035, depthDiff);
    float crease = step(0.25, creases) * (1.0 - silhouette);
    // keep the sky and far haze clean
    float near = 1.0 - step(70.0, d);
    col.rgb = mix(col.rgb, col.rgb * vec3(0.42, 0.4, 0.52), silhouette * near);
    col.rgb = mix(col.rgb, col.rgb * 1.22 + 0.015, crease * near);
  }
  gl_FragColor = col;
  #include <colorspace_fragment>
}`

/** The render targets and the full-screen pass that draws them with outlines. */
function createPixelPass() {
  const depthTexture = new THREE.DepthTexture(1, 1)
  depthTexture.type = THREE.UnsignedIntType
  const color = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
    depthTexture,
  })
  const normal = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  })
  const material = new THREE.ShaderMaterial({
    vertexShader: compositeVertex,
    fragmentShader: compositeFragment,
    uniforms: {
      tColor: { value: color.texture },
      tDepth: { value: depthTexture },
      tNormal: { value: normal.texture },
      uRes: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.5 },
      uFar: { value: 140 },
      uOutlines: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  const quadScene = new THREE.Scene()
  quadScene.add(quad)
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const normalMaterial = new THREE.MeshNormalMaterial()
  const size = new THREE.Vector2()

  function render(
    gl: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    outlines: boolean,
  ) {
    gl.getDrawingBufferSize(size)
    if (color.width !== size.x || color.height !== size.y) {
      color.setSize(size.x, size.y)
      normal.setSize(size.x, size.y)
    }
    const cam = camera as THREE.PerspectiveCamera
    material.uniforms.uRes.value.copy(size)
    material.uniforms.uNear.value = cam.near
    material.uniforms.uFar.value = cam.far
    material.uniforms.uOutlines.value = outlines ? 1 : 0

    gl.setRenderTarget(color)
    gl.render(scene, camera)

    if (outlines) {
      // Normals of everything solid (things marked noOutline are skipped).
      const hidden: THREE.Object3D[] = []
      scene.traverse((o) => {
        if (o.visible && o.userData.noOutline) {
          o.visible = false
          hidden.push(o)
        }
      })
      const bg = scene.background
      const fog = scene.fog
      scene.background = null
      scene.fog = null
      scene.overrideMaterial = normalMaterial
      gl.setRenderTarget(normal)
      gl.setClearColor(0x8080ff, 1)
      gl.clear()
      gl.render(scene, camera)
      scene.overrideMaterial = null
      scene.background = bg
      scene.fog = fog
      hidden.forEach((o) => (o.visible = true))
    }

    gl.setRenderTarget(null)
    gl.render(quadScene, quadCamera)
  }

  function dispose() {
    color.dispose()
    normal.dispose()
    depthTexture.dispose()
    material.dispose()
    normalMaterial.dispose()
    quad.geometry.dispose()
  }

  return { render, dispose }
}

/**
 * Takes over drawing: renders the scene into small targets (the canvas itself is
 * already low-res, see `dpr`), then draws it to the screen with outlines.
 */
export function PixelPass({ outlines }: { outlines: boolean }) {
  const pass = useMemo(() => createPixelPass(), [])
  useEffect(() => () => pass.dispose(), [pass])
  useFrame(({ gl, scene, camera }) => pass.render(gl, scene, camera, outlines), 1)
  return null
}
