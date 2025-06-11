import * as THREE from 'three';
import { createGlobe } from './globe.js';
import { createPoints, rotateGlobeToPoint } from './points.js';
import { setupControls } from './controls.js';
import vertexShader from './shader/vertex.glsl';
import fragmentShader from './shader/fragment.glsl';
import atmosferaVertex from './shader/atmosferaVertex.glsl';
import atmosferaFragment from './shader/atmosferaFragment.glsl';
import { createImageLabels } from './createImageLabels.js';
//import { MapsUI } from './mapsUI.js';
import gsap from 'gsap';


function toggleHTMLElements(hide = true) {
    const elementsToHide = [
        '.search-comune-container', 
        '.helper',
        '.zoom-controls'
    ];
    
    elementsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            if (hide) {
                // Nasconde con animazione fade-out
                gsap.to(element, {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.out",
                    onComplete: () => {
                        element.style.pointerEvents = 'none'; // Disabilita anche l'interazione
                    }
                });
            } else {
                // Mostra con animazione fade-in
                element.style.pointerEvents = 'auto'; // Riabilita l'interazione
                gsap.to(element, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out",
                    delay: 0.8
                });
            }
        }
    });
}

function toggleMapElements(show, numeroMappe = 0) {
    const elementsToToggle = [
        '.mappe-info',
        '.close-map', 
        '.mappe-name',
        '.esplora'
    ];
    
    if (show) {
        // Aggiorna il numero di mappe
        const numeroMappeSpan = document.getElementById('numero-mappe');
        if (numeroMappeSpan) {
            numeroMappeSpan.textContent = numeroMappe;
        }
        
        // Mostra elementi con animazione fade-in
        elementsToToggle.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.pointerEvents = 'auto';
                gsap.to(element, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out",
                    delay: 0.8
                });
            }
        });
        
    } else {
        // Nasconde elementi con animazione fade-out
        elementsToToggle.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                gsap.to(element, {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.out",
                    onComplete: () => {
                        element.style.pointerEvents = 'none';
                    }
                });
            }
        });
    }
}

// Funzione principale asincrona
async function init() {

    //const mapsUI = new MapsUI();

    //await mapsUI.loadMapsForCurrentDigitalLibrary();


    // Inizializza scena, camera e renderer
    const scene = new THREE.Scene();
    const globeContainer = document.querySelector('.globe-container');
    const containerWidth = globeContainer.clientWidth;
    const containerHeight = globeContainer.clientHeight;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.querySelector('canvas')
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Crea il globo e componenti associati
    const { group } = createGlobe({
        scene,
        vertexShader,
        fragmentShader,
        atmosferaVertex,
        atmosferaFragment
    });

    //mi serve per il resize corretto del canvas ovvero il globo visto che viene schiacciato un po' durante il rendering 
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        
        if (needResize) {
          // Imposta il renderer alle dimensioni del container
          renderer.setSize(width, height, false);
          
          // Aggiorna anche l'aspect ratio della camera
          if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
        }
        
        return needResize;
      }

    // Carica i punti dal backend (ora asincrono)
    try {
        const points = await createPoints(group);
        const imageLabels = createImageLabels();
        // Configura il controller di rotazione automatica
        const autoRotateController = {
            enabled: true,
            lastInteractionTime: 0,
            pauseDuration: 2000,
            
            enable() {
                this.enabled = true;
            },
            
            disable() {
                this.enabled = false;
                this.lastInteractionTime = Date.now();
            },
            
            update() {
                const currentTime = Date.now();
                if (!this.enabled && currentTime - this.lastInteractionTime > this.pauseDuration) {
                    this.enabled = true;
                }
                return this.enabled;
            }
        };

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Configura i controlli utente (mouse, zoom, etc.)
        setupControls(camera, group, autoRotateController);

        // Configura il raycaster per la selezione dei punti
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        // Cambia il cursore quando passa sopra i punti
        function handlePointerMove(event) {
            const rect = globeContainer.getBoundingClientRect();
            if (
                event.clientX >= rect.left && 
                event.clientX <= rect.right && 
                event.clientY >= rect.top && 
                event.clientY <= rect.bottom
            ) {
                // Normalizza le coordinate del puntatore per il raycaster
                pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(pointer, camera);
                
                // Raccogli tutti i sotto-oggetti di ogni punto
                const allPointObjects = [];
                points.forEach(point => {
                    point.mesh.children.forEach(childMesh => {
                        allPointObjects.push(childMesh);
                    });
                });
                
                const intersects = raycaster.intersectObjects(allPointObjects);
                document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
            }
        }

        let originalCameraPosition = null;

        function zoomOut(camera) {
                    if (!originalCameraPosition) {
                        console.log("Posizione originale non salvata");
                        return;
                    }
                    
                    gsap.to(camera.position, {
                        x: originalCameraPosition.x,
                        y: originalCameraPosition.y,
                        z: originalCameraPosition.z,
                        duration: 1.0,
                        ease: "power2.inOut",
                        onComplete: () => {
                            console.log("Zoom out completato");
                            originalCameraPosition = null; 
                        }
                    });
        }

        function handleClick(event) {
            // Controlla se il click è avvenuto all'interno del contenitore del globo
            const rect = globeContainer.getBoundingClientRect();
            
            // Verifica se il click è avvenuto all'interno del contenitore
            if (
                event.clientX >= rect.left && 
                event.clientX <= rect.right && 
                event.clientY >= rect.top && 
                event.clientY <= rect.bottom
            ) {
                // Se ci sono animazioni in corso, ignora il click
                if (imageLabels.isAnimating()) {
                    console.log("Animazioni in corso, click ignorato");
                    return;
                }
                
                // Normalizza le coordinate del puntatore per il raycaster
                pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(pointer, camera);
                
                // Raccogli tutti i sotto-oggetti di ogni punto per il raycasting
                const allPointObjects = [];
                points.forEach(point => {
                    // Controllo se il punto è visibile (di fronte alla telecamera)
                    const pointPosition = new THREE.Vector3().setFromMatrixPosition(point.mesh.matrixWorld);
                    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                    const pointDirection = new THREE.Vector3().subVectors(pointPosition, camera.position).normalize();
                    
                    // Calcola il prodotto scalare tra la direzione della camera e la direzione del punto
                    // Se è positivo, il punto è di fronte alla telecamera
                    const dotProduct = cameraDirection.dot(pointDirection);
                    
                    // Controllo aggiuntivo: ray casting dal punto alla camera per vedere se è ostruito dal globo
                    const raycasterFromPoint = new THREE.Raycaster();
                    raycasterFromPoint.set(pointPosition, new THREE.Vector3().subVectors(camera.position, pointPosition).normalize());
                    
                    // Esegui il ray cast contro il globo (assumendo che sia l'elemento 0 nel gruppo)
                    const globeMesh = group.children[0]; // Il primo elemento del gruppo dovrebbe essere il globo
                    const intersections = raycasterFromPoint.intersectObject(globeMesh);
                    
                    // Se dotProduct > 0 (punto davanti alla camera) e non ci sono intersezioni con il globo
                    // allora il punto è visibile e cliccabile
                    const isVisible = dotProduct > 0 && intersections.length === 0;
                    
                    if (isVisible) {
                        // Associa ogni mesh figlio al suo punto parent per recuperarlo dopo
                        point.mesh.children.forEach(childMesh => {
                            childMesh.userData.parentPoint = point;
                            allPointObjects.push(childMesh);
                        });
                    }
                });
                
                // Controlla se è stato cliccato un punto
                const intersectsPoints = raycaster.intersectObjects(allPointObjects);
                
                if (intersectsPoints.length > 0) {
                    // Recupera il punto parent dal sotto-oggetto che è stato cliccato
                    const clickedPoint = intersectsPoints[0].object.userData.parentPoint;
                    console.log("Punto cliccato:", clickedPoint.name);
                    
                    // Disattiva la rotazione automatica
                    autoRotateController.disable();
                    
                    
                    // Se non ha già un'etichetta, crea una nuova etichetta
                    if (!imageLabels.hasLabel(clickedPoint)) {
                        // Crea una nuova etichetta passando la scena e la camera
                        imageLabels.createLabelForPoint(clickedPoint, group, scene, camera);
                        
                        toggleHTMLElements(true);
                        toggleMapElements(true, 10);
                        // Ruota il globo verso il punto
                        rotateGlobeToPoint(group, clickedPoint, camera, () => {
                            console.log("Rotazione completata");
                        });

                        zoomToMiniaturesimultaneous(clickedPoint, camera, scene, originalCameraPosition);
                    }
                    return; // Termina qui per evitare di gestire anche il click out
                }

                function zoomToMiniaturesimultaneous(point, camera, scene, savedOriginalPosition) {
                    console.log("Funzione zoom chiamata per punto:", point.name);
                    
                    // Salva la posizione originale
                    if (!originalCameraPosition) {
                        originalCameraPosition = camera.position.clone(); // Usa la posizione attuale della camera
                        console.log("Posizione originale salvata:", originalCameraPosition);
                    }
                    
                    // Attendi un momento per assicurarsi che l'etichetta sia stata creata
                    setTimeout(() => {
                        const activeLabels = imageLabels.getActiveLabels();
                        console.log("Etichette attive:", activeLabels.length);
                        
                        const activeLabel = activeLabels.find(label => label.point === point);
                        
                        if (!activeLabel) {
                            console.log("Etichetta non trovata per lo zoom. Etichette disponibili:", activeLabels);
                            return;
                        }
                        
                        // Calcola una posizione di zoom semplice - più vicina al globo
                        const currentPosition = camera.position.clone();
                        const centerPosition = new THREE.Vector3(0, 0, 0); // Centro del globo
                        const direction = currentPosition.clone().sub(centerPosition).normalize();
                        
                        const zoomDistance = 8.8; // Distanza fissa per lo zoom (SI PUO REGOLARE)
                        const targetPosition = direction.multiplyScalar(zoomDistance);
                        // Anima lo zoom della camera
                        gsap.to(camera.position, {
                            x: targetPosition.x,
                            y: targetPosition.y,
                            z: targetPosition.z,
                            duration: 1.5,
                            ease: "power2.inOut",
                            onStart: () => {
                                console.log("Animazione zoom iniziata");
                            },
                            onUpdate: () => {
                                console.log("Posizione camera durante animazione:", camera.position);
                            },
                            onComplete: () => {
                                console.log("Zoom simultaneo completato");
                            }
                        });
                    }, 100); // Attendi che l'etichetta sia completamente creata
                }
                
                // Se arriviamo qui, non è stato cliccato un punto
                // Controlla se è stata cliccata un'etichetta
                const labelMeshes = imageLabels.getActiveLabels().map(label => label.mesh);
                const intersectsLabels = raycaster.intersectObjects(labelMeshes);
                
                if (intersectsLabels.length > 0) {
                    // L'utente ha cliccato su un'etichetta
                    const clickedLabel = intersectsLabels[0].object;
                    const labelData = imageLabels.getActiveLabels().find(label => label.mesh === clickedLabel);
                    
                    if (labelData) {
                        console.log("Click su miniatura");
                        
                        // Qui puoi aggiungere logica aggiuntiva, come:
                        // - Aprire una finestra di dettaglio
                        // - Navigare a una pagina specifica
                        // - Mostrare informazioni aggiuntive
                    }
                    
                    return;
                }
                
                // Se arriviamo qui, è un click out (né su un punto né su un'etichetta)
                // Chiudi tutte le etichette attive
                if (imageLabels.getActiveLabels().length > 0) {
                    console.log("Click out - chiusura di tutte le etichette");
                    toggleHTMLElements(false);
                    toggleMapElements(false, 10);
                    zoomOut(camera);
                    // Rimuovi ogni etichetta con l'animazione di zoom out
                    imageLabels.getActiveLabels().forEach((label) => {
                        imageLabels.removeLabelForPoint(label.point);
                    });
                }
            }
        }

        window.addEventListener('click', handleClick);
        window.addEventListener('pointermove', handlePointerMove);
        
        // Carica la texture di sfondo
        /* const loader = new THREE.TextureLoader();
        loader.load('../assets/texture/backgroundGlobe.jpg', function(texture) {
            scene.background = texture;
        }); */

        scene.background = new THREE.Color(0xE4E0C1); // Imposta uno sfondo nero

        // Loop di animazione
        function animate() {
            // Aggiorna le etichette (posizione e orientamento)
            imageLabels.updateLabels(camera, group);
            renderer.render(scene, camera);
            resizeRendererToDisplaySize(renderer);
            //requestAnimationFrame(animate);
        }

        // Avvia l'animazione
        renderer.setAnimationLoop(animate);
        const loaderDiv = document.getElementById('loader');
        if (loaderDiv) {
            loaderDiv.style.opacity = '0';
            setTimeout(() => loaderDiv.style.display = 'none', 500); // dopo la transizione
        }


        // Gestione del ridimensionamento della finestra
        window.addEventListener('resize', () => {
            // Aggiorna le dimensioni in base al contenitore
            const newWidth = globeContainer.clientWidth;
            const newHeight = globeContainer.clientHeight;
            
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (imageLabels.getActiveLabels().length > 0) {
                    // MOSTRA GLI ELEMENTI HTML ANCHE CON ESCAPE
                    toggleHTMLElements(false);
                    
                    imageLabels.getActiveLabels().forEach((label) => {
                        imageLabels.removeLabelForPoint(label.point);
                    });
                }
            }
        });

    } catch (error) {
        console.error("Errore durante il caricamento dei punti:", error);
        // Mostra messaggio di errore all'utente
    }
}



// Avvia l'applicazione
init().catch(error => {
    console.error("Errore durante l'inizializzazione:", error);
    // Potresti voler mostrare un messaggio di errore all'utente
    const errorElement = document.createElement('div');
    errorElement.style.position = 'absolute';
    errorElement.style.top = '50%';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translate(-50%, -50%)';
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '20px';
    errorElement.textContent = 'Si è verificato un errore. Ricarica la pagina.';
    document.body.appendChild(errorElement);
});