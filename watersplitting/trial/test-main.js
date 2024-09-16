import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
//import { FlexibleCable } from "../FlexibleCable.js"; // Adjust the path as necessary
import CableComponent from "./canonComponent/CableComponent";

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls for easier scene navigation
const controls = new OrbitControls(camera, renderer.domElement);

// Create an instance of FlexibleCable
const cable = new CableComponent(document.body, {
  length: 5, // Set cable length to 5 meters
  numSegments: 200, // Number of segments
  radius: 0.1, // Set radius of cable
  color: 0x00ff00, // Set color to green
  startPosition: [0, 1, 0], // Set custom start position
  endPosition: [5, 1, 0], // Set custom end position
});

// Set camera position
camera.position.z = 5;

// Add basic lighting
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Render the scene
  renderer.render(scene, camera);

  // Update controls
  controls.update();
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
