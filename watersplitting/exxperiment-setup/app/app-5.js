// Import necessary modules
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  World,
  Body,
  Plane,
  Vec3,
  Box,
  Sphere,
  LockConstraint,
} from "cannon-es";

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
const jarHeight = 2;
const wallThickness = 0.05; // Thin walls

// Create the walls (outer shell, no inner physics interaction)
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

// Create the bottom (closed base)
const jarBottomGeometry = new THREE.CylinderGeometry(
  jarOuterRadius - wallThickness, // Slightly smaller to avoid clipping
  jarOuterRadius - wallThickness,
  0.1,
  32
);
const jarBottom = new THREE.Mesh(jarBottomGeometry, jarWallMaterial);
jarBottom.position.set(0, -jarHeight / 2 + 0.05, 0); // Move to the base of the jar
scene.add(jarBottom);

// Position the jar slightly above the ground
jarWalls.position.set(0, jarHeight / 2, 0);

// Create a transparent liquid filling 2/3 of the jar
const liquidHeight = (jarHeight * 2) / 3;
const liquidGeometry = new THREE.CylinderGeometry(
  jarOuterRadius * 0.95,
  jarOuterRadius * 0.95,
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

// Physics body for the outer jar walls (static)
const jarWallShape = new Box(
  new Vec3(jarOuterRadius, jarHeight / 2, wallThickness)
);
const jarWallBody = new Body({
  mass: 0, // Static
  position: new Vec3(0, jarHeight / 2, 0),
});
jarWallBody.addShape(jarWallShape, new Vec3(jarOuterRadius, 0, 0)); // Right wall
jarWallBody.addShape(jarWallShape, new Vec3(-jarOuterRadius, 0, 0)); // Left wall
world.addBody(jarWallBody);

// Physics body for the bottom of the jar (static)
const jarBottomShape = new Box(
  new Vec3(jarOuterRadius - wallThickness, 0.05, jarOuterRadius - wallThickness)
);
const jarBottomBody = new Body({
  mass: 0, // Static
  position: new Vec3(0, -jarHeight / 2 + 0.05, 0),
});
jarBottomBody.addShape(jarBottomShape);
world.addBody(jarBottomBody);

// Lock the jar bottom to the jar walls using a LockConstraint
const lockConstraint = new LockConstraint(jarWallBody, jarBottomBody, {
  localPivotA: new Vec3(0, -jarHeight / 2 + wallThickness, 0),
  localPivotB: new Vec3(0, 0, 0),
});
world.addConstraint(lockConstraint);

// Physics body for the ground (static)
const groundShape = new Plane();
const groundBody = new Body({ mass: 0, shape: groundShape });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to lie flat
groundBody.position.set(0, 0, 0);
world.addBody(groundBody);

// Create falling plastic balls
const ballMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffcc00,
  metalness: 0.2,
  roughness: 0.8,
});
const balls = [];
const ballBodies = [];

// Function to create balls
function createBall() {
  const ballRadius = 0.1;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  scene.add(ball);
  balls.push(ball);

  const ballBody = new Body({
    mass: 0.1, // Lightweight ball
    position: new Vec3((Math.random() - 0.5) * 2, 5, (Math.random() - 0.5) * 2),
    shape: new Sphere(ballRadius),
  });
  world.addBody(ballBody);
  ballBodies.push(ballBody);
}

// Continuously create balls every second
setInterval(createBall, 1000);

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
  liquid.position.copy(jarWallBody.position);
  liquid.quaternion.copy(jarWallBody.quaternion);

  // Sync jar walls
  jarWalls.position.copy(jarWallBody.position);
  jarWalls.quaternion.copy(jarWallBody.quaternion);

  // Sync jar bottom
  jarBottom.position.copy(jarBottomBody.position);
  jarBottom.quaternion.copy(jarBottomBody.quaternion);

  // Sync balls with physics bodies
  balls.forEach((ball, index) => {
    ball.position.copy(ballBodies[index].position);
    ball.quaternion.copy(ballBodies[index].quaternion);
  });

  // Update controls
  controls.update();

  // Step physics world
  world.step(1 / 60);

  // Render the scene
  renderer.render(scene, camera);
}

animate();
