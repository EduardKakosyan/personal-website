// The brook's water (scene 6). Photo 03: shallow, clear and tea-coloured, the
// red-brown stones on the bed showing through, the sky and the leaves
// catching on the surface in long streaks where it runs. Drawn as a
// see-through toon surface over the bed (the ground shader paints the
// stones), with streaks that move downstream and a few glints that take the
// sun's colour, so they turn gold at sunset (daylight.ts).

import * as THREE from 'three'

/** Shared by every water mesh: the time (for the streaks) and the light's colour (for the glints). */
export const waterUniforms = {
  uTime: { value: 0 },
  uGlint: { value: new THREE.Color('#fff4d6') },
  uSheen: { value: new THREE.Color('#d6e8e4') },
  /** The sky it reflects (daylight.ts keeps it the sky's colour). */
  uSky: { value: new THREE.Color('#9fd0ee') },
  /** The sky straight overhead, which the water shows looking down: cool by day, dark at night. */
  uOverhead: { value: new THREE.Color().setRGB(0.5, 0.74, 0.88) },
  /** The leaves over it, as it reflects them (dark green by day, nearly black at night). */
  uLeaves: { value: new THREE.Color().setRGB(0.13, 0.27, 0.2) },
}

const WATER_GLSL = /* glsl */ `
uniform float uTime;
uniform vec3 uGlint;
uniform vec3 uSheen;
uniform vec3 uSky;
uniform vec3 uOverhead;
uniform vec3 uLeaves;
uniform float uWaterSoft;
varying vec3 vWaterPos;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), f.x),
             mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float wEdge(float a, float x) { return mix(step(a, x), smoothstep(a - 0.1, a + 0.1, x), uWaterSoft); }
`

/**
 * The water material. `smooth` is the smooth look (soft edges); the pixel
 * looks get hard steps like everything else.
 */
export function makeWaterMaterial(smooth: boolean) {
  const mat = new THREE.MeshToonMaterial({
    color: '#3f7a68',
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
  })
  mat.name = 'brook-water'
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, waterUniforms, { uWaterSoft: { value: smooth ? 1 : 0 } })
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWaterPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWaterPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${WATER_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  // (the brook runs north–south: everything on it is long along z and drifts
  // downstream, which is north, towards -z; it used to run the other way,
  // uphill: Eduard, "the river is flowing the wrong way")
  vec2 w = vWaterPos.xz;
  float flow = uTime * 0.5;
  // what it reflects, in long slow bands: the leaves over it (dark) and
  // gaps of sky between them (light)
  float band = wNoise(vec2(w.x * 1.7, (w.y + flow * 0.25) * 0.42)) * 0.75
    + wNoise(vec2(w.x * 4.3, (w.y + flow * 0.5) * 1.1)) * 0.25;
  float skyGap = wEdge(0.67, band);
  float leaves = 1.0 - wEdge(0.42, band);
  // ripples: thin bright dashes riding the current
  vec2 rc = vec2(w.x / 0.055, (w.y + flow) / 0.62);
  rc.y += wHash(vec2(floor(rc.x), 3.0)) * 7.0;
  float rh = wHash(floor(rc));
  float along = fract(rc.y);
  float ripple = step(0.935, rh) * step(0.12, along) * step(along, 0.35 + rh * 0.5);
  // glints: a few cells that catch the sun now and then
  vec2 cell = floor(w / 0.07);
  float blink = sin(uTime * (1.5 + wHash(cell) * 2.5) + wHash(cell + 7.0) * 6.28);
  float glint = step(0.994, wHash(cell + floor(uTime * 0.7))) * step(0.3, blink) * skyGap;
  diffuseColor.a = diffuseColor.a + leaves * 0.22 + skyGap * 0.24;
  diffuseColor.a = max(diffuseColor.a, max(ripple * 0.9, glint * 0.95));`,
      )
      .replace(
        '#include <opaque_fragment>',
        `// (after the light, so the reflections keep their own colours.) Looking
  // down, water shows the sky overhead, which stays cool when the horizon
  // has gone peach; more of it the flatter you look across the water.
  float fres = 1.0 - abs(dot(normalize(vViewPosition), normalize(normal)));
  vec3 overhead = mix(uSky, uOverhead, 0.7);
  outgoingLight = mix(outgoingLight, uLeaves, leaves * 0.55);
  outgoingLight = mix(outgoingLight, overhead, skyGap * 0.6 + 0.12 * smoothstep(0.3, 0.9, fres));
  outgoingLight = mix(outgoingLight, mix(overhead, uSheen, 0.6) * 1.15, ripple);
  outgoingLight = mix(outgoingLight, uGlint, glint);
  #include <opaque_fragment>`,
      )
  }
  mat.customProgramCacheKey = () => `brook-water:${smooth ? 1 : 0}`
  return mat
}

/** The water running from the tap into the jug (shown while the tap's on). */
export function createTapStream(tap: { x: number; y: number; z: number }, bottomY: number) {
  const h = tap.y - bottomY
  const geo = new THREE.CylinderGeometry(0.014, 0.019, h, 6)
  geo.translate(0, -h / 2, 0)
  const stream = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: '#dff1f4',
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  )
  stream.position.set(tap.x, tap.y, tap.z)
  stream.visible = false
  stream.userData.noOutline = true
  stream.raycast = () => {}
  return stream
}
