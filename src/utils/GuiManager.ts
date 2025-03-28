import { GUI } from 'dat.gui';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export class GUIManager {
    private gui: GUI;

    constructor(bloomPass: ShaderPass) {
        this.gui = new GUI();

        // Carpeta para los efectos Bloom
        const bloomFolder = this.gui.addFolder('Bloom Effect');

        // Configuración inicial
        const bloomSettings = {
            threshold: bloomPass.material.uniforms.threshold.value,
            intensity: bloomPass.material.uniforms.intensity.value,
        };

        // Control del umbral
        bloomFolder.add(bloomSettings, 'threshold', 0.0, 1.0).onChange((value) => {
            bloomPass.material.uniforms.threshold.value = value;
        });

        // Control de la intensidad
        bloomFolder.add(bloomSettings, 'intensity', 0.0, 5.0).onChange((value) => {
            bloomPass.material.uniforms.intensity.value = value;
        });

        bloomFolder.open(); // Abre la carpeta por defecto
    }
}