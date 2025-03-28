import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import pp_vertex from './shaders/pp_vertex.glsl';
import pp_fragment_bloom from './shaders/pp_frag_bloom.glsl';

export class MainApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private bloomPass: ShaderPass;
  private gui: GUI;

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

    this.camera.position.set(0, 0, 5);

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

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      emissive: 0x5555ff,
      emissiveIntensity: 1.0,
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Crear el post-procesamiento
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new ShaderPass(
      new THREE.RawShaderMaterial({
        uniforms: {
          tDiffuse: { value: null }, // Textura renderizada
          threshold: { value: 0.8 }, // Umbral inicial
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }, // Resolución de la pantalla
        },
        vertexShader: pp_vertex, // El shader de vértices básico que ya tienes
        fragmentShader: pp_fragment_bloom, // Este es el nuevo fragment shader para Bloom
        glslVersion: THREE.GLSL3,
      })
    );
    
    this.composer.addPass(this.bloomPass); // Agrega el Bloom al compositor
    
    // **Configurar dat.GUI para el control de threshold**
    this.gui = new GUI();
    const bloomFolder = this.gui.addFolder('Bloom Effect');
    const bloomSettings = { threshold: 0.8 }; // Configuración inicial

    bloomFolder.add(bloomSettings, 'threshold', 0.0, 1.0).onChange((value) => {
        this.bloomPass.material.uniforms.threshold.value = value; // Vincula el valor de la GUI al shader
    });

    bloomFolder.open(); // Abre la carpeta

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
