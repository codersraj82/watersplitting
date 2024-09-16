import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PSUComponent } from "./PSUComponent.js";
import CableComponent from "./CableComponent"; // Import the CableComponent

// Set up the basic Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Set up camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// Set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Set up lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040); // soft ambient light
scene.add(ambientLight);

// Create the Cannon.js physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Earth's gravity

//Physics
// Physics settings
world.solver.iterations = 5;
world.defaultContactMaterial.friction = 0.05;
world.broadphase = new CANNON.NaiveBroadphase();

// Add a ground plane in Cannon.js
const groundBody = new CANNON.Body({
  mass: 0, // Static object
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to be flat
world.addBody(groundBody);

// Add a ground plane in Three.js
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be flat
ground.receiveShadow = true;
scene.add(ground);

// Create PSUComponent and add it to the scene
// Add a static anchor body in Cannon.js
const psuAnchorBody = new CANNON.Body({
  mass: 0, // Static object, will not move
  position: new CANNON.Vec3(0, 1, 0), // Position the anchor at the PSU's position
});
world.addBody(psuAnchorBody);

// Create PSUComponent and add it to the scene
const psu = new PSUComponent(
  world,
  camera,
  12,
  5,
  new THREE.Vector3(0, 1, 0), // Position it at (0, 1, 0)
  1
);
scene.add(psu);

// Lock PSUComponent's physics body to the static anchor body
const psuLockConstraint = new CANNON.LockConstraint(psu.psuBody, psuAnchorBody);
world.addConstraint(psuLockConstraint);
// add cable

// Create the CableComponent
const cable = new CableComponent(scene, world, {
  length: 2, // Custom length of the cable
  numSegments: 100, // Number of segments
  radius: 0.05, // Radius of the cable
  color: 0x00ff00, // Cable color (green)
  startPosition: [3, 3, 1], // Starting position of the cable
  endPosition: [-3, 3, 5], // Ending position of the cable
});

// Add OrbitControls for better camera movement
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Step the physics world
  world.step(1 / 60);

  // Update the PSU and cable physics
  psu.updatePhysics();
  cable.update();
  // Render the scene
  renderer.render(scene, camera);
}

animate();
