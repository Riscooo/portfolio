// La nube: simulación en la GPU (GPUComputationRenderer) y su dibujo como puntos.
import * as THREE from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import noise from '../shaders/noise.glsl?raw'
import velocityShader from '../shaders/velocity.glsl?raw'
import positionShader from '../shaders/position.glsl?raw'
import pointsVertex from '../shaders/points.vert.glsl?raw'
import pointsFragment from '../shaders/points.frag.glsl?raw'
import { clusterTargets, imageTargets, random, sphereTargets } from './targets.js'

export const SPHERE_RADIUS = 1.85
export const CLUSTER_RADIUS = 0.62

function dataTexture(data, size) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  texture.needsUpdate = true
  return texture
}

/**
 * `size`: lado de la textura (256, 384 o 512). `images`: 8 capturas como { width, height, data } o null.
 * `palette`: 8 colores en hex. Devuelve los puntos, `update()` por fotograma y `setImages()`.
 */
export function createParticles(renderer, { size, images, palette }) {
  const rand = random(20261013)
  const sphere = sphereTargets(size, rand, SPHERE_RADIUS)
  const cluster = clusterTargets(size, rand, CLUSTER_RADIUS)
  const tSphere = dataTexture(sphere, size)
  const tCluster = dataTexture(cluster, size)
  const { uv, color } = imageTargets(size, images, rand)
  const tImage = dataTexture(uv, size)
  const tColor = dataTexture(color, size)

  const gpu = new GPUComputationRenderer(size, size, renderer)
  if (renderer.capabilities.isWebGL2 === false) gpu.setDataType(THREE.HalfFloatType)
  const pos0 = gpu.createTexture(), vel0 = gpu.createTexture()
  const p = pos0.image.data
  for (let i = 0; i < size * size; i++) {
    // Al cargar, la nube viene de lejos y se condensa.
    const spread = 2.5 + rand() * 4
    p.set([sphere[i * 4] * spread, sphere[i * 4 + 1] * spread, sphere[i * 4 + 2] * spread, sphere[i * 4 + 3]], i * 4)
  }
  const velocity = gpu.addVariable('textureVelocity', noise + '\n' + velocityShader, vel0)
  const position = gpu.addVariable('texturePosition', positionShader, pos0)
  gpu.setVariableDependencies(velocity, [velocity, position])
  gpu.setVariableDependencies(position, [velocity, position])
  const sim = velocity.material.uniforms
  Object.assign(sim, {
    uTime: { value: 0 }, uDelta: { value: 0 }, uOpen: { value: 0 }, uForm: { value: 0 }, uActive: { value: -1 },
    uRingAngle: { value: 0 }, uRingRadius: { value: 3.1 }, uDrift: { value: 0 }, uMotion: { value: 1 }, uIntro: { value: 1 }, uFocus: { value: 0 },
    uPlaneCenter: { value: new THREE.Vector3() }, uPlaneRight: { value: new THREE.Vector3(1, 0, 0) },
    uPlaneUp: { value: new THREE.Vector3(0, 1, 0) }, uPlaneSize: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector3(99, 99, 99) }, uPointerForce: { value: 0 },
    tSphere: { value: tSphere }, tCluster: { value: tCluster }, tImage: { value: tImage },
  })
  position.material.uniforms.uDelta = { value: 0 }
  const error = gpu.init()
  if (error) throw new Error(error)

  const references = new Float32Array(size * size * 2)
  for (let i = 0; i < size * size; i++) references.set([(i % size + 0.5) / size, (Math.floor(i / size) + 0.5) / size], i * 2)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(size * size * 3), 3))
  geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50)
  const material = new THREE.ShaderMaterial({
    vertexShader: pointsVertex, fragmentShader: pointsFragment,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      tPosition: { value: null }, tVelocity: { value: null }, tCluster: { value: tCluster }, tImage: { value: tImage }, tColor: { value: tColor },
      uPalette: { value: palette.map(hex => new THREE.Color(hex)) },
      uOpen: { value: 0 }, uForm: { value: 0 }, uActive: { value: -1 }, uDrift: { value: 0 }, uTime: { value: 0 }, uFocus: { value: 0 },
      uSize: { value: 26 * (384 / size) }, uPixelSize: { value: 2 }, uPixelRatio: { value: renderer.getPixelRatio() },
    },
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  function update({ time, delta, state, plane, pointer, motion, intro, pixelSize, pixelRatio, ringRadius }) {
    // Pasos de como mucho 1/45 s: con tirones, dos pasos en vez de uno grande e inestable.
    const steps = delta > 1 / 45 ? 2 : 1
    const step = Math.min(delta, 1 / 30) / steps
    sim.uOpen.value = state.open
    sim.uTime.value = time; sim.uDelta.value = step; sim.uForm.value = state.form; sim.uActive.value = state.active
    sim.uRingAngle.value = state.ring; sim.uRingRadius.value = ringRadius; sim.uDrift.value = state.drift
    sim.uMotion.value = motion; sim.uIntro.value = intro; sim.uFocus.value = state.focus
    sim.uPlaneCenter.value.copy(plane.center); sim.uPlaneRight.value.copy(plane.right); sim.uPlaneUp.value.copy(plane.up)
    sim.uPlaneSize.value.set(plane.width, plane.height)
    sim.uPointer.value.copy(pointer.position); sim.uPointerForce.value = pointer.force
    position.material.uniforms.uDelta.value = step
    for (let s = 0; s < steps; s++) gpu.compute()
    const u = material.uniforms
    u.tPosition.value = gpu.getCurrentRenderTarget(position).texture
    u.tVelocity.value = gpu.getCurrentRenderTarget(velocity).texture
    u.uOpen.value = state.open; u.uForm.value = state.form; u.uActive.value = state.active; u.uDrift.value = state.drift
    u.uTime.value = time; u.uFocus.value = state.focus; u.uPixelSize.value = pixelSize; u.uPixelRatio.value = pixelRatio
  }

  /** Cambia las capturas (al cargarse) sin rehacer la simulación. */
  function setImages(next) {
    const result = imageTargets(size, next, random(7))
    tImage.image.data.set(result.uv); tImage.needsUpdate = true
    tColor.image.data.set(result.color); tColor.needsUpdate = true
  }

  function dispose() {
    gpu.dispose(); geometry.dispose(); material.dispose()
    for (const texture of [tSphere, tCluster, tImage, tColor]) texture.dispose()
  }

  return { points, update, setImages, dispose, count: size * size }
}
