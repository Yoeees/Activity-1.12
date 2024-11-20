import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

let scene, camera, renderer, gui, controls;
let cursorLight;
let spheres = [];
let textureLoader;
let currentTextureIndex = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Image textures from 1.png to 8.png in your folder
const textureFiles = [];
for (let i = 1; i <= 8; i++) {
    textureFiles.push(`textures/matcaps/${i}.png`);
}

function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 30);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Cursor-controlled light
    cursorLight = new THREE.PointLight(0xffffff, 1, 50);
    scene.add(cursorLight);

    // Texture loader
    textureLoader = new THREE.TextureLoader();

    // Create multiple spheres
    for (let i = 0; i < 50; i++) {
        createSphereWithSpacing();
    }

    // 3D Text
    const fontLoader = new FontLoader();
    fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new TextGeometry('Papasara ko sir!', {
            font: font,
            size: 2,
            height: 0.5,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(-15, 20, 0);
        scene.add(textMesh);
    });

    // GUI setup
    gui = new GUI();

    // Cursor Light settings
    const lightFolder = gui.addFolder('Cursor Light');
    lightFolder.addColor({ color: '#ffffff' }, 'color').onChange((value) => {
        cursorLight.color.set(value);
    });
    lightFolder.add(cursorLight, 'intensity', 0, 2).name('Intensity');
    lightFolder.open();

    // Sphere settings
    const sphereFolder = gui.addFolder('Spheres');
    sphereFolder.addColor({ color: '#0077ff' }, 'color').onChange((value) => {
        spheres.forEach((sphere) => {
            sphere.material.color.set(value);
        });
    });

    // Texture changer
    sphereFolder
        .add(
            {
                changeTexture: () => {
                    currentTextureIndex = (currentTextureIndex + 1) % textureFiles.length;
                    spheres.forEach((sphere) => {
                        const newTexture = textureLoader.load(textureFiles[currentTextureIndex]);
                        sphere.material.map = newTexture;
                        sphere.material.needsUpdate = true;
                    });
                },
            },
            'changeTexture'
        )
        .name('Change Texture');
    sphereFolder.open();

    // OrbitControls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Event listener for mouse movement
    window.addEventListener('mousemove', onMouseMove);

    // Start the animation loop
    animate();
}

// Update light position based on mouse movement
function onMouseMove(event) {
    // Normalize mouse coordinates to [-1, 1]
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Use raycaster to get the direction from the camera to the mouse
    raycaster.setFromCamera(mouse, camera);

    // Reset the material of all spheres
    spheres.forEach((sphere) => {
        sphere.material.emissive = new THREE.Color(0x000000); // Turn off emissive glow
    });

    // Check intersections
    const intersects = raycaster.intersectObjects(spheres);
    if (intersects.length > 0) {
        const intersectedSphere = intersects[0].object;
        intersectedSphere.material.emissive = new THREE.Color(0xffffff); // Add emissive glow
    }
}


// Function to create a sphere with proper spacing
function createSphereWithSpacing() {
    const randomSize = Math.random() * 2 + 0.5;
    let position;

    do {
        const randomX = (Math.random() - 0.5) * 50;
        const randomY = (Math.random() - 0.5) * 50;
        const randomZ = (Math.random() - 0.5) * 50;
        position = new THREE.Vector3(randomX, randomY, randomZ);
    } while (!isPositionValid(position, randomSize));

    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077ff,
        map: textureLoader.load(textureFiles[currentTextureIndex]),
    });

    const sphereGeometry = new THREE.SphereGeometry(randomSize, 32, 32);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(position);
    spheres.push(sphere);
    scene.add(sphere);
}

// Function to check if a position is valid
function isPositionValid(position, size) {
    const MIN_DISTANCE = 3;
    for (let sphere of spheres) {
        const distance = position.distanceTo(sphere.position);
        if (distance < MIN_DISTANCE + size) {
            return false;
        }
    }
    return true;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

init();
