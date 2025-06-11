// File createImageLabels.js corretto

import * as THREE from 'three';
import gsap from 'gsap';

export function createImageLabels() {
    const activeLabels = [];
    const textureLoader = new THREE.TextureLoader();
    let animationsInProgress = false;
    let overlayMesh = null;
     // Riferimento all'overlay
    
    // Funzione per creare l'overlay nero trasparente che copre tutto lo schermo
    function createOverlay(scene, camera) {
        if (overlayMesh) return; // Se esiste già, non crearne un altro
        
        // Crea un piano molto grande che copre tutto il campo visivo
        const overlayGeometry = new THREE.PlaneGeometry(100, 100); // Piano molto grande
        
        // Materiale nero trasparente
        const overlayMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5, // Regola l'opacità come preferisci (0.0 = trasparente, 1.0 = opaco)
            side: THREE.DoubleSide,
            depthTest: false, // Importante: disabilita il depth test
            depthWrite: false // Importante per la trasparenza
        });
        
        overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial);
        
        // Posiziona l'overlay davanti alla camera ma dietro alle etichette
        // Calcola una posizione tra la camera e il globo
        const distance = 8; // Distanza dalla camera (regola se necessario)
        const direction = new THREE.Vector3(0, 0, -1); // Direzione verso il globo
        overlayMesh.position.copy(camera.position.clone().add(direction.multiplyScalar(distance)));
        
        // Fai in modo che l'overlay sia sempre perpendicolare alla camera
        overlayMesh.lookAt(camera.position);
        
        // Imposta l'ordine di rendering per assicurarsi che sia dietro alle etichette ma davanti al globo
        overlayMesh.renderOrder = 1;
        
        // Inizia con opacità 0 per l'animazione di fade-in
        overlayMaterial.opacity = 0;
        
        scene.add(overlayMesh);
        
        // Anima il fade-in dell'overlay
        gsap.to(overlayMaterial, {
            opacity: 0.6,
            duration: 0.5,
            ease: "power2.out"
        });
    }
    
    // Funzione per aggiornare la posizione dell'overlay per seguire la camera
    function updateOverlay(camera) {
        if (!overlayMesh) return;
        
        // Mantieni l'overlay sempre davanti alla camera
        const distance = 8;
        const direction = new THREE.Vector3(0, 0, -1);
        overlayMesh.position.copy(camera.position.clone().add(direction.multiplyScalar(distance)));
        overlayMesh.lookAt(camera.position);
    }
    
    // Funzione per rimuovere l'overlay con animazione
    function removeOverlay(scene) {
        if (!overlayMesh) return;

        const meshToRemove = overlayMesh;
        const geometryToDispose = overlayMesh.geometry;
        const materialToDispose = overlayMesh.material;
        
        // Anima il fade-out dell'overlay
        gsap.to(materialToDispose, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                // Controllo di sicurezza per scene
                if (scene && typeof scene.remove === 'function') {
                    scene.remove(meshToRemove);
                } else {
                    console.warn("Scene non disponibile per la rimozione dell'overlay");
                }
                
                // Pulisci le risorse in modo sicuro
                if (geometryToDispose && typeof geometryToDispose.dispose === 'function') {
                    geometryToDispose.dispose();
                }
                if (materialToDispose && typeof materialToDispose.dispose === 'function') {
                    materialToDispose.dispose();
                }
                
                // Reset della variabile globale
                overlayMesh = null;
                
                console.log("Overlay rimosso con successo");
            }
        });
    }
    
    function createLabelForPoint(point, group, scene, camera) {
        console.log("Creazione etichetta per:", point.name);
        
        if (animationsInProgress) {
            console.log("Animazioni in corso, nuova richiesta ignorata");
            return;
        }
        
        // Crea l'overlay quando viene creata la prima etichetta
        if (activeLabels.length === 0) {
            createOverlay(scene, camera);
        }
        
        if (activeLabels.length > 0) {
            animationsInProgress = true;
            const params = { point, group, scene, camera };
            const labelsToRemove = [...activeLabels];
            let removedCount = 0;
            
            labelsToRemove.forEach((label, index) => {
                gsap.to(label.mesh.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 0.6,
                    ease: "back.in(1.7)",
                    onComplete: function() {
                        console.log("Zoom out completato");
                        
                        // FIX: Controllo di sicurezza
                        if (label.mesh && label.mesh.parent) {
                            label.mesh.parent.remove(label.mesh);
                        } else if (label.mesh) {
                            scene.remove(label.mesh);
                        }
                        
                        // Pulisci le risorse
                        if (label.mesh) {
                            if (label.mesh.geometry) label.mesh.geometry.dispose();
                            if (label.mesh.material) {
                                if (label.mesh.material.map) label.mesh.material.map.dispose();
                                label.mesh.material.dispose();
                            }
                        }
                        
                        if (label.point && label.point.mesh) {
                            label.point.mesh.visible = true;
                        }
                        
                        const labelIndex = activeLabels.findIndex(l => l === label);
                        if (labelIndex !== -1) {
                            activeLabels.splice(labelIndex, 1);
                        }
                        
                        removedCount++;
                        
                        if (removedCount === labelsToRemove.length) {
                            animationsInProgress = false;
                            _createNewLabel(params.point, params.group, params.scene, params.camera);
                        }
                    }
                });
            });
            
            return;
        }
        
        _createNewLabel(point, group, scene, camera);
    }
    
    function _createNewLabel(point, group, scene, camera) {
        animationsInProgress = true;
        textureLoader.load(
            point.image, 
            (texture) => {
                console.log("Texture caricata con successo");
                
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                
                const imgWidth = texture.image.width;
                const imgHeight = texture.image.height;
                const aspectRatio = imgHeight / imgWidth;
                
                const planeWidth = 2.5;
                const planeHeight = planeWidth * aspectRatio;
                const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                const labelMesh = new THREE.Mesh(geometry, material);
                
                // Imposta l'ordine di rendering per assicurarsi che sia davanti all'overlay
                labelMesh.renderOrder = 2;
                
                scene.add(labelMesh);
                
                const worldPosition = new THREE.Vector3();
                point.mesh.getWorldPosition(worldPosition);
                
                const direction = worldPosition.clone().normalize();
                
                const globeRadius = 5;
                const offset = 0.5;
                labelMesh.position.copy(direction.multiplyScalar(globeRadius + offset));
                
                labelMesh.lookAt(camera.position);
                
                labelMesh.scale.set(0, 0, 0);
                gsap.to(labelMesh.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 0.8,
                    ease: "back.out(1.7)",
                    onComplete: function() {
                        console.log("Zoom in completato");
                        animationsInProgress = false;
                    }
                });
                
                labelMesh.userData.point = point;
                
                activeLabels.push({
                    mesh: labelMesh,
                    point: point
                });
                
                point.mesh.visible = false;
            },
            undefined,
            (error) => {
                console.error("Errore nel caricamento della texture:", error);
                animationsInProgress = false;
            }
        );
    }
    
    function updateLabels(camera, group) {
        // Aggiorna la posizione dell'overlay
        updateOverlay(camera);
        
        activeLabels.forEach(label => {
            const worldPosition = new THREE.Vector3();
            
            if (label.point && label.point.mesh && label.point.mesh.parent) {
                label.point.mesh.getWorldPosition(worldPosition);
                
                const direction = worldPosition.clone().normalize();
                
                const globeRadius = 5;
                const offset = 0.5;
                label.mesh.position.copy(direction.multiplyScalar(globeRadius + offset));
            }
            
            if (label.mesh) {
                label.mesh.lookAt(camera.position);
            }
        });
    }
    
    function removeLabel(labelIndex, scene) {
        if (labelIndex >= 0 && labelIndex < activeLabels.length) {
            const label = activeLabels[labelIndex];
            animationsInProgress = true;
            
            console.log("Rimozione etichetta iniziata");
            
            gsap.to(label.mesh.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.6,
                ease: "back.in(1.7)",
                onComplete: function() {
                    console.log("Zoom out completato");
                    
                    // FIX: Controllo di sicurezza per il parent
                    if (label.mesh && label.mesh.parent) {
                        label.mesh.parent.remove(label.mesh);
                    } else if (label.mesh) {
                        // Fallback: rimuovi direttamente dalla scena
                        scene.remove(label.mesh);
                    }
                    
                    // Pulisci le risorse
                    if (label.mesh) {
                        if (label.mesh.geometry) label.mesh.geometry.dispose();
                        if (label.mesh.material) {
                            if (label.mesh.material.map) label.mesh.material.map.dispose();
                            label.mesh.material.dispose();
                        }
                    }
                    
                    if (label.point && label.point.mesh) {
                        label.point.mesh.visible = true;
                    }
                    
                    activeLabels.splice(labelIndex, 1);
                    
                    // Rimuovi l'overlay se non ci sono più etichette attive
                    if (activeLabels.length === 0) {
                        removeOverlay(scene);
                    }
                    
                    animationsInProgress = false;
                    console.log("Etichetta rimossa con successo");
                }
            });
        }
    }
    
    function forceRemoveAllLabels(scene) {
        console.log("Rimozione forzata di tutte le etichette");
        gsap.killTweensOf(activeLabels.map(label => label.mesh.scale));
        
        while (activeLabels.length > 0) {
            const label = activeLabels[0];
            
            // FIX: Controllo di sicurezza
            if (label.mesh && label.mesh.parent) {
                label.mesh.parent.remove(label.mesh);
            } else if (label.mesh) {
                scene.remove(label.mesh);
            }
            
            // Pulisci le risorse
            if (label.mesh) {
                if (label.mesh.geometry) label.mesh.geometry.dispose();
                if (label.mesh.material) {
                    if (label.mesh.material.map) label.mesh.material.map.dispose();
                    label.mesh.material.dispose();
                }
            }
            
            if (label.point && label.point.mesh) {
                label.point.mesh.visible = true;
            }
            
            activeLabels.shift();
        }
        
        // Rimuovi l'overlay
        removeOverlay(scene);
        
        animationsInProgress = false;
        console.log("Tutte le etichette rimosse con successo");
    }
    
    function removeLabelForPoint(point, scene) {
        const index = activeLabels.findIndex(label => label.point === point);
        if (index !== -1) {
            removeLabel(index, scene);
            return true;
        }
        return false;
    }
    
    function hasLabel(point) {
        return activeLabels.some(label => label.point === point);
    }
    
    return {
        createLabelForPoint,
        removeLabel, 
        removeLabelForPoint,
        updateLabels,
        hasLabel,
        forceRemoveAllLabels,
        getActiveLabels: () => activeLabels,
        isAnimating: () => animationsInProgress
    };
}