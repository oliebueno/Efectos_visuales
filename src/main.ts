import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


import pp_vertex from './shaders/pp_vertex.glsl';
import pp_fragment_bloom from './shaders/pp_frag_bloom.glsl';
import pp_fragment_disp from './shaders/pp_frag_disp.glsl';
import pp_fragment_nightvision from './shaders/pp_frag_nightvision.glsl';

import { GUIManager } from './utils/GuiManager';
import { ModelLoader } from './utils/MoldelLoader';
import { SimpleModelLoader } from './utils/ModelSimpleLoader';

export class MainApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private bloomPass: ShaderPass;
  private dispersionPass: ShaderPass;
  private nightVisionPass: ShaderPass;
  private guiManager: GUIManager;
  private clock = new THREE.Clock();
  private mixers: THREE.AnimationMixer[] = [];
  private time = 0;

  private cameraConfig = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 100000,
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

    // Luces
    // Crear una luz direccional
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Luz blanca con intensidad 1.5
    directionalLight.position.set(50, 50, 50); // Configura la posición de la luz
    directionalLight.target.position.set(39, 6, 30); // Apunta la luz hacia el modelo 'huracan'

    // Agregar la luz y su objetivo a la escena
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);

    const ambientLight = new THREE.AmbientLight(0x404040, 75.0);
    this.scene.add(ambientLight);

    // Cargar el modelos 3D ---------------------------------------------------------------------

    // Ciudad
    SimpleModelLoader.loadModel('./static/models/huracan.glb', (model) => {
      model.scale.set(2, 2, 2);
      model.position.set(39, 6, 30);
      this.scene.add(model);
    });

    // Huracan car estatico 
    SimpleModelLoader.loadModel('./static/models/downtown-echo/source/echo.glb', (model) => {
      model.scale.set(1, 1, 1);
      model.position.set(0, 0, 0);
      this.scene.add(model);
    });

    // Skybox
    SimpleModelLoader.loadModel('./static/models/panorama.glb', (model) => {
      model.scale.set(700, 700, 700);
      model.position.set(0, 0, 0);
      this.scene.add(model);
    });

    // Personaje bailando
    ModelLoader.loadModel('./static/models/rumba.glb', (gltf) => {
      const model = gltf.scene; 
      const mixer = new THREE.AnimationMixer(model);
  
      model.scale.set(3, 3, 3);
      model.position.set(-25, 4.3, 30); 
  
      // Reproducir animaciones si existen
      if (gltf.animations && gltf.animations.length > 0) {
          console.log('Animaciones cargadas:', gltf.animations);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play(); 
      }
      this.mixers.push(mixer);
      this.scene.add(model); 
    });

    
    // carro 1
    ModelLoader.loadModel('./static/models/car1.glb', (gltf) => {
      const model = gltf.scene; 
      const mixer = new THREE.AnimationMixer(model);
  
      model.scale.set(3, 3, 3);
      model.position.set(-30, 4.3, 44);
      model.rotation.y = Math.PI / 2;
  
      // Reproducir animaciones si existen
      if (gltf.animations && gltf.animations.length > 0) {
          console.log('Animaciones cargadas:', gltf.animations);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play(); 
      }
      this.mixers.push(mixer);
      this.scene.add(model); 
    });

    // Crear el post-procesamiento ----------------------------------------------------------------
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
        vertexShader: pp_vertex, 
        fragmentShader: pp_fragment_bloom,
        glslVersion: THREE.GLSL3,
      })
    );

    this.dispersionPass = new ShaderPass(
      new THREE.RawShaderMaterial({
          uniforms: {
              tDiffuse: { value: null }, // Textura renderizada
              dispersion: { value: 0.0 }, // Nivel inicial de dispersión
              resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }, // Resolución
          },
          vertexShader: pp_vertex,
          fragmentShader: pp_fragment_disp,
          glslVersion: THREE.GLSL3,
      })
  );

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
  
    
    this.composer.addPass(this.bloomPass); // Agrega el Bloom al composser
    this.composer.addPass(this.dispersionPass); // Agrega la difusión al composser
    this.composer.addPass(this.nightVisionPass); // Agrega el efecto de visión nocturna al composser
    this.composer.addPass(fxaaPass); // Mejora la resolución
    
    // Se inicializa la gui
    this.guiManager = new GUIManager(this.bloomPass, this.dispersionPass, this.nightVisionPass, ambientLight);

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
    this.controls.update();
    this.composer.render(); 

    const delta = this.clock.getDelta();

    this.mixers.forEach((mixer) => mixer.update(delta));
    this.nightVisionPass.material.uniforms.time.value += delta;
  }
}

// Ejecutar
const app = new MainApp();
