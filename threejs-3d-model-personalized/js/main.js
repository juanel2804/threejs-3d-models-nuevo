import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();

let camera, scene, renderer, stats, object, loader, guiMorphsFolder;
let mixer;

const clock = new THREE.Clock();

const params = {
    asset: 'Breakdance 1990(1)'
};

const animations = [
    'Breakdance 1990(1)',
    'Soccer Trip',
    'Jog In Circle',
    'Jump',
    'Zombie Biting'
];

init();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader(manager);
    loadAsset(params.asset);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    // NUEVO: Detectar teclas del 1 al 5
    window.addEventListener('keydown', function (event) {
        const key = event.key;
        if (key >= '1' && key <= '5') {
            const index = parseInt(key) - 1;
            if (animations[index]) {
                loadAsset(animations[index]);
            }
        }
    });

    stats = new Stats();
    container.appendChild(stats.dom);

    const gui = new GUI();
    gui.add(params, 'asset', animations).onChange(function (value) {
        loadAsset(value);
    });

    guiMorphsFolder = gui.addFolder('Morphs').hide();
}

function loadAsset(asset) {

    loader.load('../models/fbx/' + asset + '.fbx', function (group) {

        if (object) {
            object.traverse(function (child) {
                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                }
                if (child.geometry) child.geometry.dispose();
            });
            scene.remove(object);
        }

        object = group;

        object.position.set(0, 0, 0);  // Mueve el modelo a (X=0, Y=0, Z=0)

        if (object.animations && object.animations.length) {
            mixer = new THREE.AnimationMixer(object);
            const action = mixer.clipAction(object.animations[0]);
            action.play();
        } else {
            mixer = null;
        }

        guiMorphsFolder.children.forEach((child) => child.destroy());
        guiMorphsFolder.hide();

        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(object);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
    stats.update();
}
