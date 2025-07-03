import * as THREE from 'three';
import { createGlobe } from './core/globe.js';
import { createPoints, rotateGlobeToPoint } from './core/marker.js';
import { setupControls } from './core/controls.js';
import { createImageLabels } from './components/createImageLabels.js';
import { UIManager } from './managers/uiManager.js';
import { CameraManager } from './managers/cameraManager.js';
import { InteractionManager } from './managers/interactionManager.js';
import { SceneManager } from './managers/sceneManager.js';
import vertexShader from './shader/vertex.glsl';
import fragmentShader from './shader/fragment.glsl';


class GlobeApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.group = null;
        this.points = [];
        this.imageLabels = null;
        this.autoRotateController = null;
        this.controls = null;
        
        // Managers
        this.uiManager = new UIManager();
        this.cameraManager = null;
        this.interactionManager = null;
        this.sceneManager = null;
    }

    async init() {
        try {
            // Setup base scene
            this.setupScene();
            
            // Initialize managers
            this.sceneManager = new SceneManager(this.scene);
            this.cameraManager = new CameraManager(this.camera, this.renderer);
            
            // Create globe
            this.createGlobe();
            
            // Load points
            await this.loadPoints();

            // Setup controls
            this.setupControls();

            //this.updateInteractionManagerControls();
            
            // Setup interaction
            this.setupInteraction();


            this.setupUIInteractionPrevention();
            
            // Setup lighting
            this.sceneManager.setupLighting();
            
            // Setup background
            this.sceneManager.setupBackground();
            
            // Start animation loop
            this.startAnimationLoop();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loader
            this.hideLoader();

            this.interactionManager.handleClickCloseMap();

            
        } catch (error) {
            this.handleError(error);
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        
        const globeContainer = document.querySelector('.globe-container');
        const containerWidth = globeContainer.clientWidth;
        const containerHeight = globeContainer.clientHeight;

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 12;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.querySelector('canvas')
        });
        this.renderer.setSize(containerWidth, containerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    createGlobe() {
        const globeData = createGlobe({
            scene: this.scene,
            vertexShader,
            fragmentShader,
        });
        this.group = globeData.group;
    }

    async loadPoints() {
        this.points = await createPoints(this.group);
        this.imageLabels = createImageLabels();
    }

    setupInteraction() {
        this.autoRotateController = {
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

        this.interactionManager = new InteractionManager({
            camera: this.camera,
            scene: this.scene,
            group: this.group,
            points: this.points,
            imageLabels: this.imageLabels,
            autoRotateController: this.autoRotateController,
            uiManager: this.uiManager,
            cameraManager: this.cameraManager,
            controls: this.controls
        });
    }

    updateInteractionManagerControls() {
    if (this.interactionManager) {
        this.interactionManager.controls = this.controls;
    }
}

    setupControls() {
         this.controls = setupControls(this.camera, this.group, this.autoRotateController);
    }

    startAnimationLoop() {
        const animate = () => {
            this.imageLabels.updateLabels(this.camera, this.group);
            this.renderer.render(this.scene, this.camera);
            this.cameraManager.resizeRendererToDisplaySize(this.renderer);
        };

        this.renderer.setAnimationLoop(animate);
    }

    setupEventListeners() {
        //Usa solo il canvas per gli eventi, non window
        const canvas = document.querySelector('#maps-globe-canvas');
        
        // Click events - SOLO sul canvas
        canvas.addEventListener('click', (event) => {
            this.interactionManager.handleClick(event);
        });

        // Pointer move events - SOLO sul canvas
        canvas.addEventListener('pointermove', (event) => {
            this.interactionManager.handlePointerMove(event);
        });

        // Resize events - mantieni su window
        window.addEventListener('resize', () => {
            this.cameraManager.handleResize();
        });

        // Keyboard events - mantieni su document
        document.addEventListener('keydown', (event) => {
            this.interactionManager.handleKeyDown(event);
        });
    }

    setupUIInteractionPrevention() {
        // Lista di selettori per tutti gli elementi UI che non dovrebbero permettere il drag del globo
        const uiSelectors = [
            '.search-comune-container',
            '.helper',
            '.zoom-controls',
            '.close-map',
            '.mappe-name',
            '.mappe-info',
            '.esplora',
            '.header',
            '.main-nav',
            '#search-dropdown',
            '#search-input',
            '.zoom-btn',
            '.controls',
            '.reposition',
            '.viewAll'
        ];

        // Per ogni selettore UI
        uiSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.preventGlobeDragOnElement(element);
            });
        });
    }

    preventGlobeDragOnElement(element) {
        // Eventi da intercettare per prevenire il drag del globo
        const events = ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel'];
        
        events.forEach(eventType => {
            element.addEventListener(eventType, (event) => {
                // Ferma la propagazione per prevenire che raggiunga i controlli del globo
                event.stopPropagation();
                
                // Disabilita temporaneamente i controlli durante l'interazione con l'UI
                // SOLO se non stiamo visualizzando una mappa
                if (this.controls && (eventType === 'mousedown' || eventType === 'touchstart')) {
                    if (this.interactionManager && this.interactionManager.canEnableControls()) {
                        this.controls.enabled = false;
                        
                        // Riabilita i controlli dopo un breve delay, ma solo se possiamo farlo
                        setTimeout(() => {
                            if (this.controls && this.interactionManager && this.interactionManager.canEnableControls()) {
                                this.controls.enabled = true;
                            }
                        }, 100);
                    }
                }
            }, { capture: true });
        });

        // Gestione speciale per gli hover sui pulsanti
        element.addEventListener('mouseenter', () => {
            // Disabilita solo se non stiamo visualizzando una mappa
            if (this.controls && this.interactionManager && this.interactionManager.canEnableControls()) {
                this.controls.enabled = false;
            }
        });

        element.addEventListener('mouseleave', () => {
            // Riabilita solo se non stiamo visualizzando una mappa
            if (this.controls && this.interactionManager && this.interactionManager.canEnableControls()) {
                this.controls.enabled = true;
            }
        });
    }

    hideLoader() {
        const loaderDiv = document.getElementById('loader');
        if (loaderDiv) {
            loaderDiv.style.opacity = '0';
            setTimeout(() => loaderDiv.style.display = 'none', 500);
        }
    }

    handleError(error) {
        console.error("Errore durante l'inizializzazione:", error);
        
        const errorElement = document.createElement('div');
        errorElement.style.position = 'absolute';
        errorElement.style.top = '50%';
        errorElement.style.left = '50%';
        errorElement.style.transform = 'translate(-50%, -50%)';
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '20px';
        errorElement.textContent = 'Si è verificato un errore. Ricarica la pagina.';
        document.body.appendChild(errorElement);
    }
}

// Initialize app
const app = new GlobeApp();
app.init();