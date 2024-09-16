import * as CANNON from "cannon-es";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Function to create a double-cone shape using ConvexPolyhedron in Cannon.js
function createHorizontalDoubleConeShape() {
  const vertices = [
    // Left cone vertices
    new CANNON.Vec3(0, 0, -1), // Tip of left cone
    new CANNON.Vec3(1, 0, 0), // Base of left cone
    new CANNON.Vec3(0, 1, 0), // Base of left cone
    new CANNON.Vec3(-1, 0, 0), // Base of left cone
    new CANNON.Vec3(0, -1, 0), // Base of left cone

    // Right cone vertices
    new CANNON.Vec3(0, 0, 1), // Tip of right cone
    new CANNON.Vec3(1, 0, 0), // Base of right cone
    new CANNON.Vec3(0, 1, 0), // Base of right cone
    new CANNON.Vec3(-1, 0, 0), // Base of right cone
    new CANNON.Vec3(0, -1, 0), // Base of right cone
  ];

  const faces = [
    // Left cone faces
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 1],

    // Right cone faces
    [5, 6, 7],
    [5, 7, 8],
    [5, 8, 9],
    [5, 9, 6],

    // Base faces connecting left and right cones
    [1, 2, 7],
    [1, 7, 6],
    [2, 3, 8],
    [2, 8, 7],
    [3, 4, 9],
    [3, 9, 8],
    [4, 1, 6],
    [4, 6, 9],
  ];

  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

// Set up Cannon.js world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Ground plane in Cannon.js
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Double-cone body (using two cones connected at their base horizontally)
const doubleConeBody = new CANNON.Body({ mass: 1 });
doubleConeBody.addShape(createHorizontalDoubleConeShape());
doubleConeBody.position.set(0, 0.5, 0); // Centered between the cones
world.addBody(doubleConeBody);

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

// Create double-cone mesh in Three.js using two cylinders
const coneGeometry = new THREE.CylinderGeometry(0, 1, 2, 32); // Adjust height to make the cone longer

// Left cone with green color
const leftConeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});
const leftCone = new THREE.Mesh(coneGeometry, leftConeMaterial);
leftCone.rotation.z = Math.PI / 2; // Rotate to lay horizontally
leftCone.position.set(-0.5, 0.5, 0); // Position to the left (0.5 meters from the center)
scene.add(leftCone);

// Right cone with red color
const rightConeMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});
const rightCone = new THREE.Mesh(coneGeometry, rightConeMaterial);
rightCone.rotation.z = Math.PI / 2; // Rotate to lay horizontally
rightCone.position.set(0.5, 0.5, 0); // Position to the right (0.5 meters from the center)
scene.add(rightCone);

camera.position.z = 5;

// Animate and sync physics with Three.js
function animate() {
  requestAnimationFrame(animate);

  // Step physics world
  world.step(1 / 60);

  // Sync Three.js mesh with Cannon.js body
  leftCone.position.copy(doubleConeBody.position);
  leftCone.position.x -= 0.5; // Adjust position to match the actual cone placement
  leftCone.quaternion.copy(doubleConeBody.quaternion);

  rightCone.position.copy(doubleConeBody.position);
  rightCone.position.x += 0.5; // Adjust position to match the actual cone placement
  rightCone.quaternion.copy(doubleConeBody.quaternion);

  controls.update();
  renderer.render(scene, camera);
}

animate();
