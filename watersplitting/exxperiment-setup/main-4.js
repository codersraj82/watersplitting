import * as CANNON from "cannon-es";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Set up Cannon.js world
const world = new CANNON.World();
world.gravity.set(0, 0, 0); // Gravity is zero to avoid falling

// Ground plane in Cannon.js
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Set up Three.js scene
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

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 15;

// Ground plane in Three.js
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshBasicMaterial({
  color: 0x555555,
  side: THREE.DoubleSide,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Helper function to add labels
function createLabel(text, position) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = "Bold 20px Arial";
  context.fillStyle = "white";
  context.fillText(text, 10, 20);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1, 0.5, 1); // Scale the label
  sprite.position.copy(position);
  return sprite;
}

// Create the first cylinder with top radius zero
const cylinderGeometry = new THREE.CylinderGeometry(0, 1, 2, 32); // Top radius 0, bottom radius 1, height 2
const cylinderMaterial1 = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});
const cylinderMesh1 = new THREE.Mesh(cylinderGeometry, cylinderMaterial1);

// Labels for the first cylinder
const label1Top = createLabel("Top - Cylinder 1", new THREE.Vector3(0, 1.5, 0)); // Top surface
const label1Bottom = createLabel(
  "Bottom - Cylinder 1",
  new THREE.Vector3(0, -1.5, 0)
); // Bottom surface
cylinderMesh1.add(label1Top);
cylinderMesh1.add(label1Bottom);

// Add AxesHelper to the first cylinder
const cylinderAxesHelper1 = new THREE.AxesHelper(1); // Size of 1 meter
cylinderMesh1.add(cylinderAxesHelper1);

// Create the second cylinder with top radius zero
const cylinderMaterial2 = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});
const cylinderMesh2 = new THREE.Mesh(cylinderGeometry, cylinderMaterial2);

// Labels for the second cylinder
const label2Top = createLabel("Top - Cylinder 2", new THREE.Vector3(0, 1.5, 0)); // Top surface
const label2Bottom = createLabel(
  "Bottom - Cylinder 2",
  new THREE.Vector3(0, -1.5, 0)
); // Bottom surface
cylinderMesh2.add(label2Top);
cylinderMesh2.add(label2Bottom);

// Add AxesHelper to the second cylinder
const cylinderAxesHelper2 = new THREE.AxesHelper(1); // Size of 1 meter
cylinderMesh2.add(cylinderAxesHelper2);

// Position the cylinders so that their bottoms are connected
cylinderMesh1.position.set(0, 1, 0); // First cylinder at y = 1
cylinderMesh2.position.set(0, -1, 0); // Second cylinder below first, at y = -1
cylinderMesh2.rotation.z = Math.PI; // Rotate the second cylinder to point opposite

// Group both cylinders into one object
const cylinderGroup = new THREE.Group();
cylinderGroup.add(cylinderMesh1);
cylinderGroup.add(cylinderMesh2);

// Add the group to the scene
scene.add(cylinderGroup);

// Ensure tops point outward and bottoms are connected
camera.position.z = 7;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Step physics world
  world.step(1 / 60);

  controls.update();
  renderer.render(scene, camera);
}

animate();
