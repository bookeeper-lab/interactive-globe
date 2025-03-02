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
        this.createPulsatingEffect();
    }

    createMesh() {
        const group = new THREE.Group();
        
        // Colore del marker
        const markerColor = 0xff0000; // Rosso, puoi cambiare se preferisci
        
        // Materiale principale con ombreggiatura più realistica
        const material = new THREE.MeshBasicMaterial({ 
            color: markerColor,
            transparent: true,
            opacity: 0.9
        });
        
        // Materiale per l'effetto ombra/highlight
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6666, // Versione più chiara del rosso
            transparent: true,
            opacity: 0.7
        });

        // Creiamo la goccia combinando una sfera e un cono
        
        // 1. La testa del marker (sfera)
        const sphereGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(0, 0.12, 0);
        
        // 2. Aggiungiamo un highlight sulla sfera per dare effetto 3D
        const smallerSphereGeom = new THREE.SphereGeometry(0.08, 12, 12);
        const highlight = new THREE.Mesh(smallerSphereGeom, highlightMaterial);
        highlight.position.set(-0.04, 0.16, -0.04); // Posizionato leggermente spostato per dare effetto luce
        
        // 3. Il corpo a punta (cono)
        const coneGeometry = new THREE.ConeGeometry(0.12, 0.25, 16);
        const cone = new THREE.Mesh(coneGeometry, material);
        cone.position.set(0, -0.06, 0);
        cone.rotation.x = Math.PI; // Ruotato per far puntare la punta verso il basso
        
        // Aggiungiamo tutti gli elementi al gruppo
        group.add(sphere);
        group.add(highlight);
        group.add(cone);

        // Converti coordinate geografiche in posizione 3D
        const phi = (90 - this.lat) * (Math.PI / 180);
        const theta = (this.lng + 180) * (Math.PI / 180);
        const radius = 5;

        group.position.x = -(radius * Math.sin(phi) * Math.cos(theta));
        group.position.z = (radius * Math.sin(phi) * Math.sin(theta));
        group.position.y = (radius * Math.cos(phi));

        // Allinea il marker perpendicolare alla superficie del globo
        group.lookAt(new THREE.Vector3(0, 0, 0));
        
        // Aggiungiamo un offset di rotazione per far puntare la punta esattamente sulla coordinata
        // e far "galleggiare" la parte sferica sopra il punto
        group.rotateX(Math.PI/2);
        
        return group;
    }

    createPulsatingEffect() {
        

        // Effetto di opacità sulla sfera principale
        gsap.to(this.mesh.children[0].material, {
            opacity: 0.6,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        
        // Effetto complementare sull'highlight per enfatizzare l'effetto 3D
        gsap.to(this.mesh.children[1].material, {
            opacity: 0.9,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 0.2 // Leggero ritardo per creare un effetto più interessante
        });
    }
}

// Il resto delle funzioni rimane invariato
export function createPoints(group) {
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