import * as THREE from 'three';
import gsap from 'gsap';
import { createGlobe } from './globe.js';
import { createPoints, rotateGlobeToPoint } from './points.js';
import { setupControls } from './controls.js';
import vertexShader from './shader/vertex.glsl';
import fragmentShader from './shader/fragment.glsl';
import atmosferaVertex from './shader/atmosferaVertex.glsl';
import atmosferaFragment from './shader/atmosferaFragment.glsl';
import { createImageLabels } from './createImageLabels.js';

// Inizializza scena, camera e renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 12;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector('canvas')
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Crea il globo e componenti associati
const { globe, group} = createGlobe({
    scene,
    vertexShader,
    fragmentShader,
    atmosferaVertex,
    atmosferaFragment
});

// Crea i punti sulla mappa
const points = createPoints(group);

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
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

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

function handleClick(event) {
    // Se ci sono animazioni in corso, ignora il click
    if (imageLabels.isAnimating()) {
        console.log("Animazioni in corso, click ignorato");
        return;
    }
    
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    
    // Raccogli tutti i sotto-oggetti di ogni punto per il raycasting
    const allPointObjects = [];
    points.forEach(point => {
        // Associa ogni mesh figlio al suo punto parent per recuperarlo dopo
        point.mesh.children.forEach(childMesh => {
            childMesh.userData.parentPoint = point;
            allPointObjects.push(childMesh);
        });
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
            
            // Ruota il globo verso il punto
            rotateGlobeToPoint(group, clickedPoint, camera, () => {
                console.log("Rotazione completata");
            });
        }
        return; // Termina qui per evitare di gestire anche il click out
    }
    
    // Se arriviamo qui, non è stato cliccato un punto
    // Controlla se è stata cliccata un'etichetta
    const labelMeshes = imageLabels.getActiveLabels().map(label => label.mesh);
    const intersectsLabels = raycaster.intersectObjects(labelMeshes);
    
    if (intersectsLabels.length > 0) {
        // L'utente ha cliccato su un'etichetta, non facciamo nulla qui
        return;
    }
    
    // Se arriviamo qui, è un click out (né su un punto né su un'etichetta)
    // Chiudi tutte le etichette attive
    if (imageLabels.getActiveLabels().length > 0) {
        console.log("Click out - chiusura di tutte le etichette");
        
        // Rimuovi ogni etichetta con l'animazione di zoom out
        imageLabels.getActiveLabels().forEach((label) => {
            imageLabels.removeLabelForPoint(label.point);
        });
    }
}

window.addEventListener('click', handleClick);
window.addEventListener('pointermove', handlePointerMove);

// Salva le posizioni e orientamenti originali dei punti
const originalPointData = points.map(point => ({
    point,
    position: point.mesh.position.clone(),
    quaternion: point.mesh.quaternion.clone()
}));

// Loop di animazione
function animate() {
    // Aggiorna la rotazione automatica
    //if (autoRotateController.update()) {
      //  group.rotation.y += 0.001;
    //}
    
    // RIMOSSO: Aggiorna l'orientamento dei punti
    // Invece di copiare il quaternion del globo, manteniamo l'orientamento perpedicolare
    
    // Aggiorna le etichette (posizione e orientamento)
    imageLabels.updateLabels(camera, group);
    
    renderer.render(scene, camera);
}

// Avvia l'animazione
renderer.setAnimationLoop(animate);

// Gestione del ridimensionamento della finestra
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mantieni l'event listener per il pointermove
window.addEventListener('pointermove', handlePointerMove);