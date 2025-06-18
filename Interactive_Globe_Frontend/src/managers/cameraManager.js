import * as THREE from 'three';
import gsap from 'gsap';

export class CameraManager {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.originalCameraPosition = null;
        this.globeContainer = document.querySelector('.globe-container');
    }

    resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        
        if (needResize) {
            renderer.setSize(width, height, false);
            
            if (this.camera) {
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
            }
        }
        
        return needResize;
    }

    handleResize() {
        const newWidth = this.globeContainer.clientWidth;
        const newHeight = this.globeContainer.clientHeight;
        
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(newWidth, newHeight);
    }

    saveOriginalPosition() {
        if (!this.originalCameraPosition) {
            this.originalCameraPosition = this.camera.position.clone();
            console.log("Posizione originale salvata:", this.originalCameraPosition);
        }
    }

    zoomOut() {
        if (!this.originalCameraPosition) {
            console.log("Posizione originale non salvata");
            return;
        }
        
        gsap.to(this.camera.position, {
            x: this.originalCameraPosition.x,
            y: this.originalCameraPosition.y,
            z: this.originalCameraPosition.z,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
                console.log("Zoom out completato");
                this.originalCameraPosition = null; 
            }
        });
    }

    zoomToPoint(point, scene, imageLabels) {
        console.log("Funzione zoom chiamata per punto:", point.name);
        
        this.saveOriginalPosition();
        
        setTimeout(() => {
            const activeLabels = imageLabels.getActiveLabels();
            console.log("Etichette attive:", activeLabels.length);
            
            const activeLabel = activeLabels.find(label => label.point === point);
            
            if (!activeLabel) {
                console.log("Etichetta non trovata per lo zoom. Etichette disponibili:", activeLabels);
                return;
            }
            
            // Calcola posizione di zoom
            const currentPosition = this.camera.position.clone();
            const centerPosition = new THREE.Vector3(0, 0, 0);
            const direction = currentPosition.clone().sub(centerPosition).normalize();
            
            const zoomDistance = 8.8;
            const targetPosition = direction.multiplyScalar(zoomDistance);
            
            // Anima lo zoom
            gsap.to(this.camera.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration: 1.5,
                ease: "power2.inOut",
                onStart: () => {
                    console.log("Animazione zoom iniziata");
                },
                onUpdate: () => {
                    console.log("Posizione camera durante animazione:", this.camera.position);
                },
                onComplete: () => {
                    console.log("Zoom simultaneo completato");
                }
            });
        }, 100);
    }
}