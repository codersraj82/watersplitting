import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FlexibleCable } from "../FlexibleCable.js";
import PSUComponent from "../PSUComponent.js";

// Create the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 15);

// Create the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add some basic lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping for smoother controls
controls.dampingFactor = 0.05; // Damping factor for smooth movement
controls.enablePan = false; // Disable panning (optional)
controls.maxPolarAngle = Math.PI / 2; // Prevent the camera from rotating below the horizon

// Create an instance of FlexibleCable
const cable = new FlexibleCable({
  cableColor: 0xff0000,
  clipColor: 0x00ff00,
  connectorColor: 0x00ff00,
  length: 1,
  segments: 20,
  radius: 0.05,
  startPoint: new THREE.Vector3(0, 0, 0),
  endPoint: new THREE.Vector3(-5, 0, 2),
});

// Add the cable to the scene
cable.addToScene(scene);

// Instantiate the PSUComponent
const psu = new PSUComponent(
  scene,
  camera,
  document.body,
  7.0,
  2.0,
  new THREE.Vector3(0, 0, 0),
  3
);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update OrbitControls
  controls.update();

  // Update the cable's physics/geometry
  cable.update();

  // Render the scene
  renderer.render(scene, camera);
}

animate();

// Adjust camera aspect ratio on window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
