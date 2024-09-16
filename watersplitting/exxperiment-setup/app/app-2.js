// Import necessary modules
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { World, Body, Plane, Vec3, Cylinder, LockConstraint } from "cannon-es";

// Setup Three.js scene, camera, and renderer
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

// Set gray background color
scene.background = new THREE.Color(0x808080); // Gray color

// Create a glass jar with an open top
const jarOuterRadius = 1;
const jarInnerRadius = 0.95;
const jarHeight = 2;

// Jar walls
const jarWallGeometry = new THREE.CylinderGeometry(
  jarOuterRadius,
  jarOuterRadius,
  jarHeight,
  32,
  1,
  true
);
const jarWallMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00aaff, // Light blue color
  transparent: true,
  opacity: 0.25,
  roughness: 0.05, // For glossy look
  metalness: 0.05, // Slight metalness
  reflectivity: 0.95, // High reflectivity for glass effect
  side: THREE.DoubleSide, // Ensure both sides are rendered
});
const jarWalls = new THREE.Mesh(jarWallGeometry, jarWallMaterial);
scene.add(jarWalls);

// Create the thick bottom (closed base)
const jarBottomGeometry = new THREE.CylinderGeometry(
  jarInnerRadius,
  jarInnerRadius,
  0.1,
  32
);
const jarBottom = new THREE.Mesh(jarBottomGeometry, jarWallMaterial);
jarBottom.position.set(0, -jarHeight / 2 + 0.05, 0); // Move to the base of the jar
scene.add(jarBottom);

// Position the jar slightly above the ground
jarWalls.position.set(0, jarHeight / 2, 0);
jarBottom.position.set(0, 0.05, 0);

// Create a transparent liquid filling 2/3 of the jar
const liquidHeight = (jarHeight * 2) / 3;
const liquidGeometry = new THREE.CylinderGeometry(
  jarInnerRadius * 0.95,
  jarInnerRadius * 0.95,
  liquidHeight,
  32
);
const liquidMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00ffaa, // Light greenish liquid
  transparent: true,
  opacity: 0.5,
  roughness: 0.2,
  metalness: 0.1,
});
const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
liquid.position.set(0, liquidHeight / 2 - jarHeight / 2, 0); // Place liquid inside the jar
scene.add(liquid);

// Create a wooden ground plane using just color
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Brown color for wood
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to lie flat
scene.add(ground);

// Camera and light setup
camera.position.set(0, 3, 5);
camera.lookAt(jarWalls.position);

// Add lighting for reflections and shadows
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Cannon-es physics world
const world = new World();
world.gravity.set(0, -9.82, 0); // Earth gravity

// Physics body for the jar walls (static)
const jarShape = new Cylinder(jarInnerRadius, jarInnerRadius, jarHeight, 32); // Approximate shape for physics
const jarBody = new Body({
  mass: 0,
  position: new Vec3(0, jarHeight / 2, 0),
  shape: jarShape,
});
world.addBody(jarBody);

// Physics body for the jar bottom (static)
const jarBottomShape = new Cylinder(jarInnerRadius, jarInnerRadius, 0.1, 32); // Bottom shape
const jarBottomBody = new Body({
  mass: 0,
  position: new Vec3(0, 0.05, 0),
  shape: jarBottomShape,
});
world.addBody(jarBottomBody);

// Lock the jar bottom to the jar walls using a LockConstraint
const lockConstraint = new LockConstraint(jarBody, jarBottomBody);
world.addConstraint(lockConstraint);

// Physics body for the liquid (dynamic)
const liquidShape = new Cylinder(
  jarInnerRadius * 0.95,
  jarInnerRadius * 0.95,
  liquidHeight,
  32
);
const liquidBody = new Body({
  mass: 1,
  position: new Vec3(0, liquidHeight / 2, 0),
  shape: liquidShape,
});
world.addBody(liquidBody);

// Physics body for the ground (static)
const groundShape = new Plane();
const groundBody = new Body({ mass: 0, shape: groundShape });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to lie flat
groundBody.position.set(0, 0, 0);
world.addBody(groundBody);

// OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth the movement
controls.dampingFactor = 0.05;

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  // Sync Three.js liquid position with Cannon-es physics body
  liquid.position.copy(liquidBody.position);
  liquid.quaternion.copy(liquidBody.quaternion);

  // Sync jar walls
  jarWalls.position.copy(jarBody.position);
  jarWalls.quaternion.copy(jarBody.quaternion);

  // Sync jar bottom
  jarBottom.position.copy(jarBottomBody.position);
  jarBottom.quaternion.copy(jarBottomBody.quaternion);

  // Update controls
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

animate();
