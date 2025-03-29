import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import pp_vertex from './shaders/pp_vertex.glsl';
import pp_fragment_bloom from './shaders/pp_frag_bloom.glsl';
import pp_fragment_nightvision from './shaders/pp_frag_nightvision.glsl';

import { GUIManager } from './utils/GuiManager';
import { ModelLoader } from './utils/MoldelLoader';

export class MainApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private bloomPass: ShaderPass;
  private nightVisionPass: ShaderPass; // Nuevo pass para visión nocturna
  private guiManager: GUIManager;
  private time: number = 0; // Para animaciones en los shaders

  private cameraConfig = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
  }

  constructor() {
    // Crear la escena
    this.scene = new THREE.Scene();

    // Configuración de la camara
    this.camera = new THREE.PerspectiveCamera(
      this.cameraConfig.fov,
      this.cameraConfig.aspect,
      this.cameraConfig.near,
      this.cameraConfig.far
    );

    this.camera.position.set(0, 20, 200);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );

    // Configuración del renderizador
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    if (!this.renderer.capabilities.isWebGL2) {
      console.warn('WebGL 2.0 is not available on this browser.');
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Controles de la camara
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // Cargar el modelo 3D
    ModelLoader.loadModel('./static/models/downtown-echo/source/echo.glb', (model) => {
      model.scale.set(1, 1, 1);
      model.position.set(0, 0, 0);
      this.scene.add(model);
    });

    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 100);
    this.scene.add(ambientLight);

    // Crear el post-procesamiento
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom Pass (existente)
    this.bloomPass = new ShaderPass(
      new THREE.RawShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          intensity: { value: 1 },
          threshold: { value: 0.8 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
        vertexShader: pp_vertex,
        fragmentShader: pp_fragment_bloom,
        glslVersion: THREE.GLSL3,
      })
    );

    // Nuevo Night Vision Pass
    this.nightVisionPass = new ShaderPass(
      new THREE.RawShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          noiseIntensity: { value: 0.5 },
          contrast: { value: 1.5 },
          time: { value: 0 },
        },
        vertexShader: pp_vertex,
        fragmentShader: pp_fragment_nightvision,
        glslVersion: THREE.GLSL3,
      })
    );

    // Configurar el orden de los efectos
    this.composer.addPass(this.bloomPass); // Bloom primero
    this.composer.addPass(this.nightVisionPass); // Visión nocturna luego
    this.composer.addPass(fxaaPass); // FXAA al final

    // Se inicializa la gui
    this.guiManager = new GUIManager(this.bloomPass, this.nightVisionPass);

    // Manejar eventos de redimensionamiento
    window.addEventListener('resize', () => this.onWindowResize());

    // Animar la escena
    this.animate();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Actualizar la resolución en los shaders
    this.bloomPass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    this.nightVisionPass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();

    // Actualizar el tiempo para animaciones en los shaders
    this.time += 0.01;
    this.nightVisionPass.material.uniforms.time.value = this.time;

    this.composer.render();
  }
}

// Ejecutar
const app = new MainApp();