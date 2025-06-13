import * as THREE from 'three';
import gsap from 'gsap';

export class Point {
    constructor(lat, lng, name, description, image) {
        this.lat = lat;
        this.lng = lng;
        this.name = name;
        this.description = description;
        this.image = image;
        this.mesh = this.createMesh();
        this.createBlinkingEffect(); 
    }

    createMesh() {
        const group = new THREE.Group();
        
        const markerColor = 0x8b1f0c;
        
        // Materiale principale con effetto metallico dorato
        const material = new THREE.MeshPhongMaterial({ 
            color: markerColor,
            transparent: true,
            opacity: 1,
            specular: 0x943126,
            shininess: 40,
            //emissive: markerColor,
            emissiveIntensity: 0.6, 
        });
        
        // Fattore di riduzione della dimensione (0.6 = 60% della dimensione originale)
        const scaleFactor = 0.6;
        
        // Creiamo la goccia combinando una sfera e un cono
        
        // 1. La sfera ridimensionata nella parte superiore del marker
        const sphereGeometry = new THREE.SphereGeometry(0.2 * scaleFactor, 20, 20);
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(0, 0.19 * scaleFactor, 0); // Posizione proporzionalmente ridotta
        
        // 2. Il cono ridimensionato nella parte inferiore
        const coneGeometry = new THREE.ConeGeometry(0.18 * scaleFactor, 0.3 * scaleFactor, 20);
        const cone = new THREE.Mesh(coneGeometry, material);
        cone.position.set(0, -0.05 * scaleFactor, 0); // Posizione proporzionalmente ridotta
        cone.rotation.x = Math.PI; // Questa rotazione fa puntare la punta verso il basso
        
        // Aggiungiamo tutti gli elementi al gruppo
        group.add(sphere);
        group.add(cone);
    
        // Converti coordinate geografiche in posizione 3D
        const phi = (90 - this.lat) * (Math.PI / 180);
        const theta = (this.lng + 180) * (Math.PI / 180);
        const radius = 5;
    
        // Posizionamento preciso sul globo
        group.position.x = -(radius * Math.sin(phi) * Math.cos(theta));
        group.position.z = (radius * Math.sin(phi) * Math.sin(theta));
        group.position.y = (radius * Math.cos(phi));
    
        // Calcola la distanza corretta per far "galleggiare" il marker
        // Anche la distanza va ridotta proporzionalmente
        const floatDistance = 0.18 * scaleFactor; 
        const direction = new THREE.Vector3().copy(group.position).normalize();
        group.position.add(direction.multiplyScalar(floatDistance));
    
        // Allinea il marker perpendicolare alla superficie del globo
        group.lookAt(new THREE.Vector3(0, 0, 0));
        
        group.rotateX(-Math.PI/2);
        
        return group;
    }



    createBlinkingEffect() {
        const sphere = this.mesh.children[0];
        const cone = this.mesh.children[1];
        
        // Colore originale del marker
        const originalColor = new THREE.Color(0xa6251c);
        // Colore leggermente più luminoso per l'effetto di illuminazione
        const brightColor = new THREE.Color(0xe83a2d);
        
        // Salva riferimenti ai materiali
        const materials = [sphere.material, cone.material];
        
        // Creiamo una variabile di controllo per l'animazione
        const animationControl = { value: 0 };
        
        // Una singola animazione che controlla tutto
        gsap.to(animationControl, {
            value: 1,
            duration: 1.3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            onUpdate: function() {
                const t = animationControl.value;
                
                // Applica il valore corrente dell'animazione a entrambi i materiali
                materials.forEach(material => {
                    // Colore base interpolato
                    const currentColor = originalColor.clone().lerp(brightColor, t * 0.5);
                    material.color.copy(currentColor);
                    
                    // Colore emissivo correlato
                    const emissiveColor = currentColor.clone().multiplyScalar(0.7);
                    material.emissive.copy(emissiveColor);
                    
                    // Intensità emissiva correlata
                    material.emissiveIntensity = 0.3 + (t * 0.2);
                });
            }
        });
    }

    
}

    // Modifica in points.js nella funzione createPoints
export async function createPoints(group) {
    try {
        const municipalityId = localStorage.getItem('selectedMunicipalityId') || 1;
        
        const apiUrl = `${import.meta.env.VITE_BACKEND_URL}/api/maps/${municipalityId}`;
        //console.log('Fetching maps from:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Error fetching maps: ${response.status} ${response.statusText}`);
        }
        
        const mapData = await response.json();
        console.log('Map data received:', mapData);
        
        const mapsWithCoordinates = mapData.filter(map => map.Coordinate !== null);
        
        if (mapsWithCoordinates.length === 0) {
            console.warn('No maps with coordinates found, falling back to static points');
            return createStaticPoints(group);
        }
        
        // Trasforma i dati in punti
        const points = mapsWithCoordinates.map(map => {
            const lat = map.Coordinate ? map.Coordinate.latitude : 0;
            const lng = map.Coordinate ? map.Coordinate.longitude : 0;
            
            console.log(`Creating point for map: ${map.title} at lat:${lat}, lng:${lng}`);
            
            // Importante: costruisco qui l'URL corretto per l'immagine utilizzando l'endpoint API
            const imageUrl = `${import.meta.env.VITE_BACKEND_URL}/api/maps/${map.id}/image`;
            
            return new Point(
                lat, 
                lng, 
                map.title, 
                map.location || 'Nessuna descrizione disponibile',
                imageUrl  //uso l'url creato dinamicamente 
            );
        });
        
        // Aggiungi i punti al gruppo
        points.forEach(point => group.add(point.mesh));
        
        return points;
        
    } catch (error) {
        console.error('Error loading points:', error);
        // Se c'è un errore, torna ai punti statici
        return createStaticPoints(group);
    }
}
    

export function createStaticPoints(group) {
    console.log("Creazione punti statici");
    const pointsData = [
        {
            lat: 50.4501, 
            lng: 30.5234, 
            name: "Ucraina", 
            description: "Mappa storica dell'Ucraina.",
            image: "../assets/maps/ucraina.png"
        },
        {
            lat: 7.873054, 
            lng: 80.771797, 
            name: "Ceylon (Sri Lanka)", 
            description: "Mappa storica di Ceylon.",
            image: "../assets/maps/celyon.png"
        },
        {
            lat: 17.352656, 
            lng: 9.677581, 
            name: "Africa", 
            description: "Mappa storica dell'Africa.",
            image: "../assets/maps/africa.png"
        },
        {
            lat: 59.329323, 
            lng: 18.068581, 
            name: "Norway", 
            description: "Mappa antica della Scandinavia.",
            image: "../assets/maps/norway.png"
        },
        {
            lat: 41.902783, 
            lng: 12.496365, 
            name: "Italy", 
            description: "Mappa storica dell'Italia.",
            image: "../assets/maps/italy.png"
        }
    ];

    const points = pointsData.map(data => new Point(
        data.lat, 
        data.lng, 
        data.name, 
        data.description, 
        data.image
    ));

    points.forEach(point => group.add(point.mesh));

    return points;
}

export function rotateGlobeToPoint(group, point, camera, callback) {
    // Ottieni la posizione del punto nel sistema di coordinate globale
    const pointPosition = new THREE.Vector3().copy(point.mesh.position);
    
    // Calcola gli angoli di rotazione necessari
    const horizontalAngle = Math.atan2(pointPosition.x, pointPosition.z);
    const distance = Math.sqrt(pointPosition.x * pointPosition.x + pointPosition.z * pointPosition.z);
    const verticalAngle = Math.atan2(pointPosition.y, distance);
    
    // Normalizza gli angoli correnti e target per assicurare la strada più breve
    let targetRotationY = -horizontalAngle;
    let currentRotationY = group.rotation.y % (2 * Math.PI);
    
    // Normalizza l'angolo corrente tra -PI e +PI
    if (currentRotationY > Math.PI) {
        currentRotationY -= 2 * Math.PI;
    } else if (currentRotationY < -Math.PI) {
        currentRotationY += 2 * Math.PI;
    }
    
    // Normalizza l'angolo target tra -PI e +PI
    if (targetRotationY > Math.PI) {
        targetRotationY -= 2 * Math.PI;
    } else if (targetRotationY < -Math.PI) {
        targetRotationY += 2 * Math.PI;
    }
    
    // Calcola la differenza e scegli la strada più breve
    let diffY = targetRotationY - currentRotationY;
    
    // Se la differenza è maggiore di 180 gradi (PI radianti), prendiamo la strada opposta
    if (diffY > Math.PI) {
        diffY -= 2 * Math.PI;
    } else if (diffY < -Math.PI) {
        diffY += 2 * Math.PI;
    }
    
    // Calcola il target finale sommando la differenza all'angolo corrente
    const targetY = group.rotation.y + diffY;
    
    // Imposta lo stato per l'animazione
    const currentState = {
        rotationY: group.rotation.y,
        rotationX: group.rotation.x
    };
    
    // Anima la rotazione
    gsap.to(currentState, {
        rotationY: targetY,
        rotationX: verticalAngle,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: function() {
            group.rotation.y = currentState.rotationY;
            group.rotation.x = currentState.rotationX;
        },
        onComplete: callback
    });
}

export function isPointVisible(point, camera, group) {
    // 1. Ottieni la posizione del punto nel world space
    const pointPosition = new THREE.Vector3();
    point.mesh.getWorldPosition(pointPosition);
    
    // 2. Verifica se il punto è di fronte alla telecamera usando il prodotto scalare
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const pointDirection = new THREE.Vector3().subVectors(pointPosition, camera.position).normalize();
    
    // Se il prodotto scalare è negativo, il punto è dietro la camera
    const dotProduct = cameraDirection.dot(pointDirection);
    if (dotProduct <= 0) {
        return false;
    }
    
    // 3. Verifica se il punto è ostruito dal globo usando raycasting
    const raycaster = new THREE.Raycaster();
    raycaster.set(camera.position, pointDirection);
    
    // Trova il mesh del globo nel gruppo
    const globeMesh = group.children[0]; // Assumendo che il globo sia il primo elemento del gruppo
    
    // Esegui il raycast solo contro il globo per verificare le intersezioni
    const intersects = raycaster.intersectObject(globeMesh);
    
    if (intersects.length > 0) {
        // Se c'è un'intersezione, calcola la distanza tra la camera e il punto
        const distanceToPoint = camera.position.distanceTo(pointPosition);
        
        // Calcola la distanza tra la camera e l'intersezione più vicina
        const distanceToIntersection = intersects[0].distance;
        
        // Se la distanza all'intersezione è minore della distanza al punto,
        // significa che il punto è ostruito dal globo
        if (distanceToIntersection < distanceToPoint) {
            return false;
        }
    }
    
    // Se siamo arrivati qui, il punto è visibile
    return true;
}





