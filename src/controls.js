import gsap from 'gsap';

/**
 * Configura i controlli utente per il globo (zoom, trascinamento, etc.)
 */
export function setupControls(camera, group, autoRotateController) {
    // Configurazione zoom
    const minZoom = 8;
    const maxZoom = 30;
    
    function onWheel(event) {
        event.preventDefault();
        
        const zoomSpeed = 0.8;
        const delta = event.deltaY * zoomSpeed;
        
        const newZ = Math.min(
            Math.max(camera.position.z + delta * 0.01, minZoom),
            maxZoom
        );
        
        gsap.to(camera.position, {
            z: newZ,
            duration: 0.5,
            ease: "power2.out"
        });
    }
    
    document.addEventListener('wheel', onWheel, { passive: false });
    
    // Configurazione trascinamento
    let isDragging = false;
    const dragSpeed = 0.01;
    const previousMousePosition = {
        x: 0,
        y: 0
    };
    
    function onMouseDown(event) {
        isDragging = true;
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
    }
    
    function onMouseUp() {
        isDragging = false;
    }
    
    function onMouseMove(event) {
        if (!isDragging) return;
        
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        
        // Aggiorna la rotazione del globo
        group.rotation.y += deltaMove.x * dragSpeed;
        group.rotation.x += deltaMove.y * dragSpeed;
        
        // Limita la rotazione verticale
        group.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, group.rotation.x));
        
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
        
        // Disattiva la rotazione automatica
        autoRotateController.disable();
    }


    
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp);
    
    return {
        cleanup: () => {
            document.removeEventListener('wheel', onWheel);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mouseleave', onMouseUp);
        }
    };
}