import gsap from 'gsap';

export class UIManager {
    constructor() {
        this.elementsToHide = [
            '.search-comune-container', 
            '.helper',
            '.zoom-controls'
        ];
        
        this.mapElements = [
            '.mappe-info',
            '.close-map', 
            '.mappe-name',
            '.esplora'
        ];
    }

    toggleHTMLElements(hide = true) {
        this.elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                if (hide) {
                    // Nasconde con animazione fade-out
                    gsap.to(element, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out",
                        onComplete: () => {
                            element.style.pointerEvents = 'none';
                        }
                    });
                } else {
                    // Mostra con animazione fade-in
                    element.style.pointerEvents = 'auto';
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

    toggleMapElements(show, numeroMappe = 0) {
        if (show) {
            // Aggiorna il numero di mappe
            const numeroMappeSpan = document.getElementById('numero-mappe');
            if (numeroMappeSpan) {
                numeroMappeSpan.textContent = numeroMappe;
            }
            
            // Mostra elementi con animazione fade-in
            this.mapElements.forEach(selector => {
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
            this.mapElements.forEach(selector => {
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

    showHTMLElements() {
        this.toggleHTMLElements(false);
    }

    hideHTMLElements() {
        this.toggleHTMLElements(true);
    }

    showMapElements(numeroMappe = 0) {
        this.toggleMapElements(true, numeroMappe);
    }

    hideMapElements() {
        this.toggleMapElements(false);
    }
}