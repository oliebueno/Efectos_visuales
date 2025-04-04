import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
    static loadModel(
        path: string,
        onLoadCallback: (gltf: THREE.GLTF) => void // Ahora pasa gltf completo
    ): void {
        const loader = new GLTFLoader();
        loader.load(
            path,
            (gltf) => {
                onLoadCallback(gltf); // Pasa el objeto gltf completo al callback
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% cargado');
            },
            (error) => {
                console.error('Error al cargar el modelo:', error);
            }
        );
    }
}