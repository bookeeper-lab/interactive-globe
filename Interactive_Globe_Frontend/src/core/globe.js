import * as THREE from 'three';

/**
 * Crea il globo 3D 
 */
export function createGlobe({ scene, vertexShader, fragmentShader }) {

    // Crea il globo
     const globe = new THREE.Mesh(
        new THREE.SphereGeometry(5, 50, 50),
        new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                globeTexture: {
                    value: new THREE.TextureLoader().load('../assets/texture/map2.jpg')
                },
                lightPosition: { value: new THREE.Vector3(10, 5, 5) },
                lightColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) }, // Colore bianco
                 ambientStrength: { value: 0.4 }
            }
        })
    ); 
    
    // Crea un gruppo per gestire il globo e i punti
    const group = new THREE.Group();
    group.add(globe);
    scene.add(group);
    
    return { globe, group };
}