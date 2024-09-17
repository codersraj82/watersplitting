// Import necessary modules from Three.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add light to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Create the glass jar
const jarHeight = 4;
const outerRadius = 1;
const innerRadius = 0.9;
const jarWallThickness = outerRadius - innerRadius;

// Create the jar walls (open at the top)
const jarGeometry = new THREE.CylinderGeometry(
  outerRadius,
  outerRadius,
  jarHeight,
  32,
  1,
  true
);
const jarMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00aaff,
  transparent: true,
  opacity: 0.25,
  roughness: 0.05,
  metalness: 0.05,
  reflectivity: 0.95,
  side: THREE.DoubleSide, // Make sure both inside and outside are rendered
});
const jarWalls = new THREE.Mesh(jarGeometry, jarMaterial);
scene.add(jarWalls);

// Create the closed bottom for the jar
const jarBottomGeometry = new THREE.CircleGeometry(innerRadius, 32);
const jarBottomMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00aaff,
  transparent: true,
  opacity: 0.25,
  roughness: 0.05,
  metalness: 0.05,
  reflectivity: 0.95,
  side: THREE.DoubleSide, // Render both sides
});
const jarBottom = new THREE.Mesh(jarBottomGeometry, jarBottomMaterial);
jarBottom.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
jarBottom.position.y = -jarHeight / 2; // Place at the bottom of the jar
scene.add(jarBottom);

// Position the camera
camera.position.set(0, 3, 6);

// Add controls to orbit around the jar
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth controls
controls.dampingFactor = 0.1;

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
