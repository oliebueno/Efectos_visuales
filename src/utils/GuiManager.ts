import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export class GUIManager {
    private gui: GUI;

    constructor(bloomPass: ShaderPass, dispersionPass: ShaderPass, ambientLight: THREE.AmbientLight) {
        this.gui = new GUI();

        // Carpeta para los efectos Bloom
        const bloomFolder = this.gui.addFolder('Bloom Effect');

        // Configuración
        const bloomSettings = {
            threshold: bloomPass.material.uniforms.threshold.value,
            intensity: bloomPass.material.uniforms.intensity.value,
            dispersion: dispersionPass.material.uniforms.dispersion.value,
            ambientLightIntensity: ambientLight.intensity,
        };

        // Control del umbral
        bloomFolder.add(bloomSettings, 'threshold', 0.0, 1.0).onChange((value) => {
            bloomPass.material.uniforms.threshold.value = value;
        });

        // Control de la intensidad del Bloom
        bloomFolder.add(bloomSettings, 'intensity', 0.0, 5.0).onChange((value) => {
            bloomPass.material.uniforms.intensity.value = value;
        });

        // Control de dispersión para el halo
        bloomFolder.add(bloomSettings, 'dispersion', 0.0, 10.0).onChange((value) => {
            dispersionPass.material.uniforms.dispersion.value = value;
        });

        // Carpeta para la Luz Ambiental
        const lightFolder = this.gui.addFolder('Ambient Light');
        lightFolder.add(bloomSettings, 'ambientLightIntensity', 0.0, 150.0).onChange((value) => {
            ambientLight.intensity = value;
        });

        bloomFolder.open();
        lightFolder.open();
    }
}