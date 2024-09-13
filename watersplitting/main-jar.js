import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as dat from "dat.gui";
import PSUComponent from "./PSUComponent-main.js";

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 9;
camera.position.y = 6;
camera.position.x = 6;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x808080); // Gray background
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);
directionalLight.target.position.set(1, 0, 0);
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

// Load the font and create PSUComponent
const fontLoader = new FontLoader();
let font;

fontLoader.load("./helvetiker_bold.typeface.json", (loadedFont) => {
  font = loadedFont;

  // Create PSUComponent after font is loaded
  const psu = new PSUComponent(
    scene,
    camera,
    document.body,
    12.34,
    5.67,
    new THREE.Vector3(9, 0, 0),
    1
  );
  psu.font = font;
  psu.updateDisplay(psu.voltage, psu.current);
  psu.setupKnobs();

  // Now get the ring positions
  const positions = psu.getRingPositions();
  console.log(positions);

  let x_ring, y_ring, z_ring, rx_ring, ry_ring, rz_ring;
  let blueRingPosition, redRingPosition;

  if (positions && positions.length > 0) {
    x_ring = positions[0].x;
    y_ring = positions[0].y;
    z_ring = positions[0].z;
    rx_ring = positions[0].rx;
    ry_ring = positions[0].ry;
    rz_ring = positions[0].rz;

    blueRingPosition = new THREE.Vector3(x_ring, y_ring, z_ring);
    redRingPosition = new THREE.Vector3(x_ring, y_ring, z_ring);
  }

  // Set up GUI controls for voltage and current
  const gui = new dat.GUI();
  const controlsFolder = gui.addFolder("Controls");
  controlsFolder.add(psu, "voltage", 0, 20).onChange(() => {
    psu.updateDisplay(psu.voltage, psu.current);
  });
  controlsFolder.add(psu, "current", 0, 10).onChange(() => {
    psu.updateDisplay(psu.voltage, psu.current);
  });
  controlsFolder.open();

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    //liquidMaterial.uniforms.time.value += 0.01;
    renderer.render(scene, camera);
  }

  animate();
});
