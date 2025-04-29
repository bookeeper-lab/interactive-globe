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
        //this.createPulsatingEffect();
    }

    createMesh() {
        const group = new THREE.Group();
        
        const markerColor = 0xcd2d1b;

        //colori da provare : 
        // 0xFFE84D
        
        
        // Materiale principale con effetto metallico dorato
        const material = new THREE.MeshPhongMaterial({ 
            color: markerColor,
            transparent: true,
            opacity: 1,
            specular: 0x943126,
            shininess: 40,
            //emissive: 0xfff111,
            emissiveIntensity: 0.6 
        });
        

        // Creiamo la goccia combinando una sfera e un cono
        
        // 1. La sfera sarà ora nella parte superiore del marker
        const sphereGeometry = new THREE.SphereGeometry(0.2, 20, 20);
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(0, 0.19, 0); // Spostata in alto
    
        
        // 3. Il cono sarà nella parte inferiore con la punta rivolta verso il basso
        const coneGeometry = new THREE.ConeGeometry(0.18, 0.3, 20);
        const cone = new THREE.Mesh(coneGeometry, material);
        cone.position.set(0, -0.05, 0); // Spostato in basso
        // Il cono per default ha la punta verso l'alto, quindi lo ruotiamo
        cone.rotation.x = Math.PI; // Questa rotazione fa puntare la punta verso il basso
        
        // Aggiungiamo tutti gli elementi al gruppo
        group.add(sphere);
        //group.add(highlight); // Commentato come nel tuo codice originale
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
        const floatDistance = 0.18; // Distanza dal globo
        const direction = new THREE.Vector3().copy(group.position).normalize();
        group.position.add(direction.multiplyScalar(floatDistance));

        // Allinea il marker perpendicolare alla superficie del globo
        group.lookAt(new THREE.Vector3(0, 0, 0));
        
        // Non è necessaria un'ulteriore rotazione di 90 gradi
        group.rotateX(-Math.PI/2); // Rimuoviamo questa rotazione
        
        return group;
    }

    createPulsatingEffect() {
        
        // Leggera oscillazione per dare vita al marker
        gsap.to(this.mesh.position, {
            y: this.mesh.position.y + 0.05,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }
}

// Il resto delle funzioni rimane invariato
/* export function createPoints(group) {
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
} */


    // Modifica in points.js nella funzione createPoints
export async function createPoints(group) {
    try {
        const municipalityId = localStorage.getItem('selectedMunicipalityId') || 1;
        
        const apiUrl = `${import.meta.env.VITE_BACKEND_PORT}/api/maps/${municipalityId}`;
        console.log('Fetching maps from:', apiUrl);
        
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
            const imageUrl = `${import.meta.env.VITE_BACKEND_PORT}/api/maps/${map.id}/image`;
            
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
    // Ottieni la posizione del punto
    const pointPosition = new THREE.Vector3().copy(point.mesh.position);
    
    // Calcola la posizione target
    const targetPosition = new THREE.Vector3(0, 0, -1).normalize();
    targetPosition.multiplyScalar(pointPosition.length());
    
    // Imposta lo stato attuale
    const currentState = {
        rotationY: group.rotation.y,
        rotationX: group.rotation.x
    };
    
    // Calcola gli angoli di rotazione necessari
    const horizontalAngle = Math.atan2(pointPosition.x, pointPosition.z);
    const distance = Math.sqrt(pointPosition.x * pointPosition.x + pointPosition.z * pointPosition.z);
    const verticalAngle = Math.atan2(pointPosition.y, distance);
    
    // Anima la rotazione
    gsap.to(currentState, {
        rotationY: -horizontalAngle,
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