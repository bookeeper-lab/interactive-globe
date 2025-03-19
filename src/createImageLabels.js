import * as THREE from 'three';
import gsap from 'gsap';

export function createImageLabels() {
    // Array per tenere traccia delle etichette attive
    const activeLabels = [];
    const textureLoader = new THREE.TextureLoader();
    let animationsInProgress = false;
    
    // Funzione per creare un'etichetta per un punto con effetto zoom in
    function createLabelForPoint(point, group, scene, camera) {
        console.log("Creazione etichetta per:", point.name);
        
        // Se ci sono animazioni in corso, ignora la richiesta
        if (animationsInProgress) {
            console.log("Animazioni in corso, nuova richiesta ignorata");
            return;
        }
        
        // Controlla se ci sono etichette attive e rimuovile prima di procedere
        if (activeLabels.length > 0) {
            animationsInProgress = true;
            
            // Salva i parametri per una chiamata futura
            const params = { point, group, scene, camera };
            
            // Rimuovi tutte le etichette esistenti e crea quella nuova dopo che sono state rimosse
            const labelsToRemove = [...activeLabels]; // Crea una copia dell'array
            
            // Imposta un flag per tracciare quando tutte le etichette sono state rimosse
            let removedCount = 0;
            
            labelsToRemove.forEach((label, index) => {
                // Utilizza una funzione di callback per verificare quando tutte le etichette sono state rimosse
                gsap.to(label.mesh.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 0.6,
                    ease: "back.in(1.7)",
                    onComplete: function() {
                        console.log("Zoom out completato");
                        
                        // Rimuovi la mesh dalla scena
                        if (label.mesh.parent) {
                            label.mesh.parent.remove(label.mesh);
                        }
                        
                        // Disponi delle risorse
                        label.mesh.geometry.dispose();
                        label.mesh.material.dispose();
                        if (label.mesh.material.map) {
                            label.mesh.material.map.dispose();
                        }
                        
                        // Rendi nuovamente visibile il punto
                        label.point.mesh.visible = true;
                        
                        // Rimuovi dall'array - assicurati che questo funzioni sempre
                        const labelIndex = activeLabels.findIndex(l => l === label);
                        if (labelIndex !== -1) {
                            activeLabels.splice(labelIndex, 1);
                        }
                        
                        // Conta le etichette rimosse
                        removedCount++;
                        
                        // Se tutte le etichette sono state rimosse, procedi con la creazione della nuova
                        if (removedCount === labelsToRemove.length) {
                            // Ora crea l'etichetta per il nuovo punto
                            animationsInProgress = false;
                            _createNewLabel(params.point, params.group, params.scene, params.camera);
                        }
                    }
                });
            });
            
            return; // Esci dalla funzione, la nuova etichetta verrà creata nella callback
        }
        
        // Se non ci sono etichette attive, crea direttamente la nuova
        _createNewLabel(point, group, scene, camera);
    }
    
    // Funzione interna per la creazione effettiva dell'etichetta
    function _createNewLabel(point, group, scene, camera) {
        // Carica l'immagine come texture
        animationsInProgress = true;
        textureLoader.load(
            point.image, 
            (texture) => {
                console.log("Texture caricata con successo");
                
                // Crea un materiale con la texture
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                
                // Calcola le proporzioni dell'immagine
                const imgWidth = texture.image.width;
                const imgHeight = texture.image.height;
                const aspectRatio = imgHeight / imgWidth;
                
                // Crea un piano per l'etichetta
                const planeWidth = 2.5;
                const planeHeight = planeWidth * aspectRatio;
                const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                const labelMesh = new THREE.Mesh(geometry, material);
                
                // Aggiungi l'etichetta direttamente alla scena per evitare che ruoti con il globo
                scene.add(labelMesh);

                
                
                // Calcola la posizione mondiale del punto
                const worldPosition = new THREE.Vector3();
                point.mesh.getWorldPosition(worldPosition);
                
                // Calcola la direzione dal centro del globo al punto
                const direction = worldPosition.clone().normalize();
                
                // Posiziona l'etichetta al di fuori del globo
                const globeRadius = 5; // Raggio del globo (dovrebbe corrispondere al valore usato in points.js)
                const offset = 0.5; // Distanza aggiuntiva dalla superficie del globo
                labelMesh.position.copy(direction.multiplyScalar(globeRadius + offset));
                
                // Fai guardare l'etichetta verso la camera
                labelMesh.lookAt(camera.position);
                
                // EFFETTO ZOOM IN: inizia con scala 0 e anima fino alla scala 1
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
                
                // Aggiungi un riferimento al punto originale all'etichetta
                labelMesh.userData.point = point;
                
                // Salva riferimento all'etichetta
                activeLabels.push({
                    mesh: labelMesh,
                    point: point
                });
                
                // Nascondi il punto originale
                point.mesh.visible = false;
            },
            undefined,
            (error) => {
                console.error("Errore nel caricamento della texture:", error);
                animationsInProgress = false;
            }
        );
    }

    
    
    // Funzione per aggiornare l'orientamento e la posizione delle etichette
    function updateLabels(camera, group) {
        activeLabels.forEach(label => {
            // Ottieni la posizione mondiale aggiornata del punto
            const worldPosition = new THREE.Vector3();
            
            // Se il punto è ancora nella scena, ottieni la sua posizione mondiale
            if (label.point && label.point.mesh && label.point.mesh.parent) {
                label.point.mesh.getWorldPosition(worldPosition);
                
                // Calcola la direzione dal centro alla posizione del punto
                const direction = worldPosition.clone().normalize();
                
                // Aggiorna la posizione dell'etichetta
                const globeRadius = 5; // Raggio del globo
                const offset = 0.5; // Distanza aggiuntiva
                label.mesh.position.copy(direction.multiplyScalar(globeRadius + offset));
            }
            
            // Fa in modo che l'etichetta guardi sempre verso la camera
            if (label.mesh) {
                label.mesh.lookAt(camera.position);
            }
        });
    }
    
    // Funzione per rimuovere un'etichetta con effetto zoom out
    function removeLabel(labelIndex) {
        if (labelIndex >= 0 && labelIndex < activeLabels.length) {
            const label = activeLabels[labelIndex];
            animationsInProgress = true;
            
            console.log("Rimozione etichetta iniziata");
            
            // EFFETTO ZOOM OUT: anima da scala 1 a scala 0
            gsap.to(label.mesh.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.6,
                ease: "back.in(1.7)",
                onComplete: function() {
                    console.log("Zoom out completato");
                    
                    // Rimuovi la mesh dalla scena
                    if (label.mesh.parent) {
                        label.mesh.parent.remove(label.mesh);
                    }
                    
                    // Disponi delle risorse
                    label.mesh.geometry.dispose();
                    label.mesh.material.dispose();
                    if (label.mesh.material.map) {
                        label.mesh.material.map.dispose();
                    }
                    
                    // Rendi nuovamente visibile il punto
                    if (label.point && label.point.mesh) {
                        label.point.mesh.visible = true;
                    }
                    
                    // Rimuovi dall'array - IMPORTANTE: usa lo splice più specifico possibile
                    activeLabels.splice(labelIndex, 1);
                    
                    animationsInProgress = false;
                    console.log("Etichetta rimossa con successo");
                }
            });
        }
    }
    
    // Funzione per forzare la rimozione immediata di tutte le etichette
    function forceRemoveAllLabels() {
        console.log("Rimozione forzata di tutte le etichette");
        // Ferma tutte le animazioni GSAP in corso
        gsap.killTweensOf(activeLabels.map(label => label.mesh.scale));
        
        // Rimuovi immediatamente tutte le etichette senza animazioni
        while (activeLabels.length > 0) {
            const label = activeLabels[0];
            
            // Rimuovi dalla scena
            if (label.mesh && label.mesh.parent) {
                label.mesh.parent.remove(label.mesh);
            }
            
            // Disponi delle risorse
            if (label.mesh) {
                if (label.mesh.geometry) label.mesh.geometry.dispose();
                if (label.mesh.material) {
                    if (label.mesh.material.map) label.mesh.material.map.dispose();
                    label.mesh.material.dispose();
                }
            }
            
            // Rendi nuovamente visibile il punto
            if (label.point && label.point.mesh) {
                label.point.mesh.visible = true;
            }
            
            // Rimuovi dall'array
            activeLabels.shift();
        }
        
        animationsInProgress = false;
        console.log("Tutte le etichette rimosse con successo");
    }
    
    // Trova e rimuovi l'etichetta associata a un punto
    function removeLabelForPoint(point) {
        const index = activeLabels.findIndex(label => label.point === point);
        if (index !== -1) {
            removeLabel(index);
            return true;
        }
        return false;
    }
    
    // Controlla se un punto ha già un'etichetta
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