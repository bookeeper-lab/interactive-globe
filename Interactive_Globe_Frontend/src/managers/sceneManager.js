import * as THREE from 'three';

export class SceneManager {
    constructor(scene) {
        this.scene = scene;
    }

    setupLighting() {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
    }

    //background sfondo
    setupBackground() {
        this.scene.background = new THREE.Color(0xE4E0C1);
    }


    addObject(object) {
        this.scene.add(object);
    }

    removeObject(object) {
        this.scene.remove(object);
    }

    getScene() {
        return this.scene;
    }
}