/* export class TutorialManager {
    constructor(steps) {
        this.steps = steps;
        this.current = 0;

        this.overlay = null;
        this.mask = null;
        this.box = null;

        this.init();
    }

    init() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-spotlight-mask"></div>
            <div class="tutorial-box">
                <h3 id="tutorial-title"></h3>
                <p id="tutorial-description"></p>
                <button id="tutorial-next">Prossimo ></button>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.mask = this.overlay.querySelector('.tutorial-spotlight-mask');
        this.box = this.overlay.querySelector('.tutorial-box');
        this.overlay.querySelector('#tutorial-next').addEventListener('click', () => this.next());
        
        this.showStep(0);
    }

    showStep(index) {
        const step = this.steps[index];
        if (!step) return;

        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-description').textContent = step.description;

        const el = document.querySelector(step.target);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = 150;

        const cx = (centerX / window.innerWidth) * 100;
        const cy = (centerY / window.innerHeight) * 100;

        this.mask.style.background = `radial-gradient(circle at ${cx}% ${cy}%, 
            transparent ${radius}px, 
            rgba(0, 0, 0, 0.65) ${radius + 10}px)`;
    }

    next() {
        this.current++;
        if (this.current >= this.steps.length) {
            this.end();
        } else {
            this.showStep(this.current);
        }
    }

    end() {
        this.overlay.remove();
    }
}

// Esempio di utilizzo
const tutorial = new SimpleTutorial([
    {
        title: "Ruota il Globo",
        description: "Trascina il globo con il mouse per esplorare.",
        target: "canvas"
    },
    {
        title: "Zoomma l'Area",
        description: "Usa i controlli + e - per avvicinarti.",
        target: ".zoom-controls"
    },
    {
        title: "Esplora le Località",
        description: "Clicca sui marker rossi per visualizzare le mappe.",
        target: ".globe-container"
    }
]); */
