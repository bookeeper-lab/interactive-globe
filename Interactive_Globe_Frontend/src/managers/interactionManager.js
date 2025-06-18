import * as THREE from 'three';
import { rotateGlobeToPoint } from '../core/marker.js';

export class InteractionManager {
    constructor({
        camera,
        scene,
        group,
        points,
        imageLabels,
        autoRotateController,
        uiManager,
        cameraManager
    }) {
        this.camera = camera;
        this.scene = scene;
        this.group = group;
        this.points = points;
        this.imageLabels = imageLabels;
        this.autoRotateController = autoRotateController;
        this.uiManager = uiManager;
        this.cameraManager = cameraManager;
        
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.globeContainer = document.querySelector('.globe-container');
    }

    handlePointerMove(event) {
        const rect = this.globeContainer.getBoundingClientRect();
        
        if (this.isPointerInBounds(event, rect)) {
            this.updatePointerCoordinates(event, rect);
            this.raycaster.setFromCamera(this.pointer, this.camera);
            
            const allPointObjects = this.getAllPointObjects();
            const intersects = this.raycaster.intersectObjects(allPointObjects);
            
            document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        }
    }

    handleClick(event) {
        const rect = this.globeContainer.getBoundingClientRect();
        
        if (!this.isPointerInBounds(event, rect)) return;
        
        if (this.imageLabels.isAnimating()) {
            console.log("Animazioni in corso, click ignorato");
            return;
        }
        
        this.updatePointerCoordinates(event, rect);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        
        // Check for point clicks
        const visiblePointObjects = this.getVisiblePointObjects();
        const intersectsPoints = this.raycaster.intersectObjects(visiblePointObjects);
        
        if (intersectsPoints.length > 0) {
            this.handlePointClick(intersectsPoints[0]);
            return;
        }
        
        // Check for label clicks
        const labelMeshes = this.imageLabels.getActiveLabels().map(label => label.mesh);
        const intersectsLabels = this.raycaster.intersectObjects(labelMeshes);
        
        if (intersectsLabels.length > 0) {
            this.handleLabelClick(intersectsLabels[0]);
            return;
        }
        
        // Handle click out
        this.handleClickOut();
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            if (this.imageLabels.getActiveLabels().length > 0) {
                this.uiManager.showHTMLElements();
                
                this.imageLabels.getActiveLabels().forEach((label) => {
                    this.imageLabels.removeLabelForPoint(label.point);
                });
            }
        }
    }

    // Helper methods
    isPointerInBounds(event, rect) {
        return event.clientX >= rect.left && 
               event.clientX <= rect.right && 
               event.clientY >= rect.top && 
               event.clientY <= rect.bottom;
    }

    updatePointerCoordinates(event, rect) {
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    getAllPointObjects() {
        const allPointObjects = [];
        this.points.forEach(point => {
            point.mesh.children.forEach(childMesh => {
                allPointObjects.push(childMesh);
            });
        });
        return allPointObjects;
    }

    getVisiblePointObjects() {
        const allPointObjects = [];
        
        this.points.forEach(point => {
            if (this.isPointVisible(point)) {
                point.mesh.children.forEach(childMesh => {
                    childMesh.userData.parentPoint = point;
                    allPointObjects.push(childMesh);
                });
            }
        });
        
        return allPointObjects;
    }

    isPointVisible(point) {
        const pointPosition = new THREE.Vector3().setFromMatrixPosition(point.mesh.matrixWorld);
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const pointDirection = new THREE.Vector3().subVectors(pointPosition, this.camera.position).normalize();
        
        const dotProduct = cameraDirection.dot(pointDirection);
        
        // Check if point is occluded by globe
        const raycasterFromPoint = new THREE.Raycaster();
        raycasterFromPoint.set(pointPosition, new THREE.Vector3().subVectors(this.camera.position, pointPosition).normalize());
        
        const globeMesh = this.group.children[0];
        const intersections = raycasterFromPoint.intersectObject(globeMesh);
        
        return dotProduct > 0 && intersections.length === 0;
    }

    async handlePointClick(intersection) {
        const clickedPoint = intersection.object.userData.parentPoint;
        console.log("Punto cliccato:", clickedPoint.name);

        this.updatePlaceName(clickedPoint.name);
        this.autoRotateController.disable();

        if (clickedPoint.coord_id) {
            console.log("aspettando il conteggio")
            await this.updateMapCountForPoint(clickedPoint.coord_id);
        }
        
        if (!this.imageLabels.hasLabel(clickedPoint)) {
            this.imageLabels.createLabelForPoint(clickedPoint, this.group, this.scene, this.camera);
            
            this.uiManager.hideHTMLElements();
            this.uiManager.showMapElements();
            
            rotateGlobeToPoint(this.group, clickedPoint, this.camera, () => {
                console.log("Rotazione completata");
            });

            this.cameraManager.zoomToPoint(clickedPoint, this.scene, this.imageLabels);
        }
    }

    updatePlaceName(placeName) {
        const mappeElement = document.querySelector('.mappe-name');
        if(mappeElement) {
            mappeElement.textContent = placeName;
        }
    }

    async updateMapCountForPoint(coordId) {
        console.log("contando le mappe")
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/coordinates/${coordId}/maps/count`);
            //console.log("risposta ricevuta", response);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateMapCount(data.count);

            
            // Salva l'ID coordinata per uso futuro (per il pulsante Esplora)
            this.currentCoordId = coordId;
            
        } catch (error) {
            console.error('Errore nel recupero del numero di mappe:', error);
            this.updateMapCount(0); // Fallback
        }
    }

    updateMapCount(count) {
        console.log("Aggiornamento numero mappe:", count);
        setTimeout(() => {
            const numeroMappeElement = document.getElementById('numero-mappe');
            if (numeroMappeElement) {
                numeroMappeElement.textContent = count;
                console.log("Aggiornamento riuscito");
            } else {
                console.warn("Elemento #numero-mappe non trovato nel timeout");
            }
        }, 500); // ritardo di mezzo secondo
    }


    handleLabelClick(intersection) {
        const clickedLabel = intersection.object;
        const labelData = this.imageLabels.getActiveLabels().find(label => label.mesh === clickedLabel);
        
        if (labelData) {
            console.log("Click su miniatura");
            // Add additional logic as needed
        }
    }

    handleClickOut() {
        if (this.imageLabels.getActiveLabels().length > 0) {
            console.log("Click out - chiusura di tutte le etichette");
            
            this.uiManager.showHTMLElements();
            this.uiManager.hideMapElements();
            this.cameraManager.zoomOut();
            
            this.imageLabels.getActiveLabels().forEach((label) => {
                this.imageLabels.removeLabelForPoint(label.point);
            });
        }
    }
}