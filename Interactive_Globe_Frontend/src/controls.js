import gsap from 'gsap';

/**
 * Configura i controlli utente per il globo (zoom, trascinamento, etc.)
 */
export function setupControls(camera, group, autoRotateController) {
    // Configurazione zoom
    const minZoom = 8;
    const maxZoom = 30;
    
    const globeContainer = document.querySelector('.globe-container');


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
    const dragSpeed = 0.005; // Ridotto per movimenti più controllati
    const previousMousePosition = {
        x: 0,
        y: 0
    };
    
    // Velocità di inerzia
    const inertia = {
        x: 0,
        y: 0
    };
    
    // Fattori di decelerazione e smorzamento
    const dampingFactor = 0.92; // Più alto = più inerzia
    const sensitivity = 1.2; // Fattore di sensibilità del movimento
    
    function onMouseDown(event) {
        // Verifica se il click è avvenuto all'interno del container del globo
        const globeContainer = document.querySelector('.globe-container');
        const rect = globeContainer.getBoundingClientRect();
        
        // Verifica se il click è all'interno del container del globo
        if (
            event.clientX >= rect.left && 
            event.clientX <= rect.right && 
            event.clientY >= rect.top && 
            event.clientY <= rect.bottom
        ) {
            isDragging = true;
            previousMousePosition.x = event.clientX;
            previousMousePosition.y = event.clientY;
            
            // Ferma l'inerzia quando inizia un nuovo trascinamento
            inertia.x = 0;
            inertia.y = 0;
            
            // Ferma qualsiasi animazione in corso
            gsap.killTweensOf(group.rotation);
            
            // Disabilita l'autorotazione
            if (autoRotateController && typeof autoRotateController.disable === 'function') {
                autoRotateController.disable();
            }
        }
    }
    
    function onMouseUp() {
        isDragging = false;
        
        // Applica inerzia solo se c'è una velocità significativa
        if (Math.abs(inertia.x) > 0.001 || Math.abs(inertia.y) > 0.001) {
            animateInertia();
        }
    }
    
    function animateInertia() {
        // Applica la decelerazione graduale
        function updateInertia() {
            if (isDragging) return;
            
            inertia.x *= dampingFactor;
            inertia.y *= dampingFactor;
            
            if (Math.abs(inertia.x) < 0.0001 && Math.abs(inertia.y) < 0.0001) {
                // Ripristina rotazione automatica se presente e l'inerzia si è esaurita
                if (autoRotateController && typeof autoRotateController.enable === 'function') {
                    autoRotateController.enable();
                }
                return;
            }
            
            group.rotation.y += inertia.x;
            group.rotation.x += inertia.y;
            
            // Limita la rotazione verticale
            group.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, group.rotation.x));
            
            requestAnimationFrame(updateInertia);
        }
        
        requestAnimationFrame(updateInertia);
    }
    
    function onMouseMove(event) {
        if (!isDragging) return;
        
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        
        // Aggiorna l'inerzia in base al movimento attuale
        inertia.x = deltaMove.x * dragSpeed * sensitivity;
        inertia.y = deltaMove.y * dragSpeed * sensitivity;
        
        // Applica rotazione immediata con GSAP per un movimento fluido
        gsap.to(group.rotation, {
            y: group.rotation.y + inertia.x,
            x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, group.rotation.x + inertia.y)),
            duration: 0.1,
            ease: "power1.out"
        });
        
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
        
        // Disattiva la rotazione automatica
        if (autoRotateController && typeof autoRotateController.disable === 'function') {
            autoRotateController.disable();
        }
    }
    
    // Gestione eventi touch per dispositivi mobili
    function onTouchStart(event) {
        if (event.touches.length === 1) {
            isDragging = true;
            previousMousePosition.x = event.touches[0].clientX;
            previousMousePosition.y = event.touches[0].clientY;
            
            // Reset dell'inerzia
            inertia.x = 0;
            inertia.y = 0;
            
            // Ferma animazioni in corso
            gsap.killTweensOf(group.rotation);
        }
    }
    
    function onTouchMove(event) {
        if (isDragging && event.touches.length === 1) {
            const touch = event.touches[0];
            
            const deltaMove = {
                x: touch.clientX - previousMousePosition.x,
                y: touch.clientY - previousMousePosition.y
            };
            
            // Aggiorna l'inerzia
            inertia.x = deltaMove.x * dragSpeed * sensitivity;
            inertia.y = deltaMove.y * dragSpeed * sensitivity;
            
            // Applica rotazione con GSAP
            gsap.to(group.rotation, {
                y: group.rotation.y + inertia.x,
                x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, group.rotation.x + inertia.y)),
                duration: 0.1,
                ease: "power1.out"
            });
            
            previousMousePosition.x = touch.clientX;
            previousMousePosition.y = touch.clientY;
            
            // Previeni lo scrolling della pagina
            event.preventDefault();
            
            // Disattiva la rotazione automatica
            if (autoRotateController && typeof autoRotateController.disable === 'function') {
                autoRotateController.disable();
            }
        }
    }
    
    function onTouchEnd() {
        if (isDragging) {
            isDragging = false;
            
            // Applica inerzia
            if (Math.abs(inertia.x) > 0.001 || Math.abs(inertia.y) > 0.001) {
                animateInertia();
            }
        }
    }
    
    // Aggiungi gli event listener
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp);
    
    // Aggiungi supporto touch
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    
    return {
        cleanup: () => {
            document.removeEventListener('wheel', onWheel);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mouseleave', onMouseUp);
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        }
    };
}