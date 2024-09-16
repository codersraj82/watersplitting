import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import { PSUComponent } from "./PSUComponent.js"; // Adjust path as necessary // Assuming PSUComponent is in the same directory
import Cable from "./Cable"; // Adjust path as needed

// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(10, 5, 5);
camera.lookAt(0, 0, 0);

// Initialize the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Add lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040); // Soft ambient light
scene.add(ambientLight);

// Initialize Cannon.js physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Create a ground plane for physics (Cannon.js)
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
  mass: 0, // Static body
  position: new CANNON.Vec3(0, 0, 0),
});
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to horizontal
world.addBody(groundBody);

// Create a ground mesh in Three.js (to visualize the ground)
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Add the PSUComponent with physics
const psuComponent = new PSUComponent(world, camera); // Pass the physics world to the component
psuComponent.position.set(0, 5, 0); // Set the position in the Three.js scene
scene.add(psuComponent);

/********** Scoket *********** */
// Create start and end points
const start = new THREE.Vector3(0, 0, 0);
const end = new THREE.Vector3(1, 1, 1);

// Create a Cable instance
const cable = new Cable(scene, world, start, end);

// Render loop
function animate() {
  world.step(1 / 60); // Advance the physics simulation with a fixed time step
  psuComponent.updatePhysics(); // Sync PSUComponent with Cannon.js physics body
  controls.update(); // Update orbit controls
  cable.update;
  //bananaSocket.updatePhysics();
  renderer.render(scene, camera); // Render the Three.js scene
  requestAnimationFrame(animate); // Request the next frame
}

// Update cable's end position

// Adjust camera and renderer when the window is resized
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the animation loop
animate();
