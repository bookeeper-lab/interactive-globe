import * as THREE from 'three';

/**
 * Crea il globo 3D e le componenti associate (atmosfera, stelle)
 */
export function createGlobe({ scene, vertexShader, fragmentShader, atmosferaVertex, atmosferaFragment }) {

    
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
    
    // Crea l'atmosfera
    const atmosfera = new THREE.Mesh(
        new THREE.SphereGeometry(5, 50, 50),
       
         new THREE.ShaderMaterial({
            vertexShader: atmosferaVertex,
            fragmentShader: atmosferaFragment,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        }) 
    );
    
    atmosfera.scale.set(1.1, 1.1, 1.1);
    //scene.add(atmosfera);
    
    // Crea le stelle
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff
    });
    
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = -Math.random() * 2000;
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    //scene.add(stars);

    return { globe, group, atmosfera, stars };
}