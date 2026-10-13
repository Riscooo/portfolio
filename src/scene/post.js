// Postprocesado: el brillo (bloom) que hace de luz a las partículas, una aberración cromática sutil en los
// bordes, grano de película, viñeta y tone mapping ACES, todo en HDR (HalfFloat).
import * as THREE from 'three'
import {
  BlendFunction, BloomEffect, ChromaticAberrationEffect, EffectComposer, EffectPass, NoiseEffect,
  RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from 'postprocessing'

export function createPost(renderer, scene, camera, { phone }) {
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType })
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new BloomEffect({
    mipmapBlur: true, intensity: phone ? 1.1 : 1.45, luminanceThreshold: 0.16, luminanceSmoothing: 0.32, radius: 0.74, levels: phone ? 6 : 8,
  })
  const vignette = new VignetteEffect({ offset: 0.24, darkness: 0.78 })
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
  composer.addPass(new EffectPass(camera, bloom, vignette, tone))
  // La aberración cromática no se mezcla con efectos de convolución: va en su propio paso, con el grano.
  const chroma = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0011, 0.0008), radialModulation: true, modulationOffset: 0.42 })
  const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false })
  grain.blendMode.opacity.value = 0.11
  composer.addPass(new EffectPass(camera, chroma, grain))
  return {
    render: delta => composer.render(delta),
    setSize: (width, height) => composer.setSize(width, height),
    /** Con la captura formada, menos brillo y aberración: la imagen se ve limpia. */
    focus(form) {
      bloom.intensity = (phone ? 1.1 : 1.45) * (1 - form * 0.45)
      chroma.offset.set(0.0011 * (1 - form * 0.8), 0.0008 * (1 - form * 0.8))
    },
    dispose: () => composer.dispose(),
  }
}
