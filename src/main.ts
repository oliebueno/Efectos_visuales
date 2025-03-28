import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


import pp_vertex from './shaders/pp_vertex.glsl';
import pp_fragment_bloom from './shaders/pp_frag_bloom.glsl';

import { GUIManager } from './utils/GuiManager';
import { ModelLoader } from './utils/MoldelLoader';

export class MainApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private bloomPass: ShaderPass;
  private guiManager: GUIManager;

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

    // Cargar el modelo 3D utilizando ModelLoader
    ModelLoader.loadModel('./static/models/downtown-echo/source/echo.glb', (model) => {
      model.scale.set(1, 1, 1); // Ajusta el tamaño del modelo
      model.position.set(0, 0, 0); // Ajusta su posición inicial en la escena
      this.scene.add(model); // Agrega el modelo a la escena
    });

    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x404040,100);
    this.scene.add(ambientLight);

    // Crear el post-procesamiento
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new ShaderPass(
      new THREE.RawShaderMaterial({
        uniforms: {
          tDiffuse: { value: null }, // Textura renderizada
          intensity: { value: 1}, // Intensidad
          threshold: { value: 0.8 }, // Umbral inicial
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }, // Resolución de la pantalla
        },
        vertexShader: pp_vertex, // El shader de vértices básico que ya tienes
        fragmentShader: pp_fragment_bloom, // Este es el nuevo fragment shader para Bloom
        glslVersion: THREE.GLSL3,
      })
    );
    
    this.composer.addPass(this.bloomPass); // Agrega el Bloom al compositor
    this.composer.addPass(fxaaPass); // Mejora la resolución
    
    // Se inicializa la gui
    this.guiManager = new GUIManager(this.bloomPass);

    // Manejar eventos de redimensionamiento
    window.addEventListener('resize', () => this.onWindowResize());

    // Animar la escena
    this.animate();
  }

  
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Actualizar la resolución en el shader
    this.bloomPass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
}

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update(); // Mantén el movimiento de la cámara fluido
    this.composer.render(); // Renderiza con EffectComposer

  }
}

// Ejecutar
const app = new MainApp();
