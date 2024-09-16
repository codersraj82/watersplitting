import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PSUComponent } from "./PSUComponent.js";
import CableComponent from "./CableComponent";

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
world.gravity.set(0, 0, 0); // Earth's gravity

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
ground.position.set(0, -3, 0);

// Add AxesHelper (X: red, Y: green, Z: blue)
const axesHelper = new THREE.AxesHelper(10); // Increase size of the axes to 10 units
scene.add(axesHelper);

// Add GridHelper (optional) to make the ground plane more visible
const gridHelper = new THREE.GridHelper(100, 100); // Size and divisions
scene.add(gridHelper);
gridHelper.position.set(0, -3, 0);

// Create PSUComponent and add it to the scene
const psuAnchorBody = new CANNON.Body({
  mass: 0, // Static object
  position: new CANNON.Vec3(0, 1, 0), // Position the anchor at the PSU's position
});
world.addBody(psuAnchorBody);

const psu = new PSUComponent(
  world,
  camera,
  12,
  5,
  new THREE.Vector3(10, -2, -3), // Position it at (0, 1, 0)
  1
);
scene.add(psu);

const psuLockConstraint = new CANNON.LockConstraint(psu.psuBody, psuAnchorBody);
world.addConstraint(psuLockConstraint);

// Add cable
const cable = new CableComponent(scene, world, {
  length: 2, // Custom length of the cable
  numSegments: 200, // Number of segments
  radius: 0.1, // Radius of the cable
  color: 0xff0000, // Cable color (red)
  startPosition: [5.5, -1.5, 0], // Starting position of the cable
  endPosition: [-3, 5, 3], // Ending position of the cable
});

// Create jar with less transparent bottom face
const jarGeometry = new THREE.CylinderGeometry(3, 3, 5, 32, 1, true);
const bottomGeometry = new THREE.CircleGeometry(3, 32);
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 1,
  opacity: 0.3, // Less transparent
  transparent: true,
  roughness: 0,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0,
  reflectivity: 0.9,
  depthWrite: false,
});
const thickGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 1,
  opacity: 0.6, // Increased opacity for thick glass look
  transparent: true,
  roughness: 0.1, // Slight roughness to simulate thick glass
  metalness: 0.1,
  clearcoat: 1,
  clearcoatRoughness: 0,
  reflectivity: 0.9,
  refractionRatio: 0.9, // Refraction index for thick glass effect
});

// Create jar
const jar = new THREE.Mesh(jarGeometry, glassMaterial);
jar.castShadow = true;
jar.receiveShadow = true;
scene.add(jar);

// Create bottom face with thick glass material
const bottom = new THREE.Mesh(bottomGeometry, thickGlassMaterial);
bottom.rotation.x = -Math.PI / 2;
bottom.position.y = -2.5;
scene.add(bottom);

// Create liquid with wave effect
const waveShader = {
  vertexShader: `
    varying vec2 vUv;
    uniform float time;

    void main() {
      vUv = uv;
      vec3 newPosition = position;
      // Reduce the amplitude and adjust frequency for a more subtle wave
      newPosition.z += sin(position.x * 1.0 + time * 0.5) * 0.05;
      newPosition.z += cos(position.y * 1.0 + time * 0.5) * 0.05;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;

    void main() {
      // Use a subtle color and transparency for a water-like appearance
      gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1); // Slight pale yellow with transparency
    }
  `,
};
const liquidHeight = 3.75;
const liquidGeometry = new THREE.CylinderGeometry(2.9, 2.9, liquidHeight, 32);
const liquidMaterial = new THREE.ShaderMaterial({
  vertexShader: waveShader.vertexShader,
  fragmentShader: waveShader.fragmentShader,
  uniforms: {
    time: { value: 0.0 },
  },
  transparent: true,
});
const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
liquid.position.y = -2.5 + liquidHeight / 2;
liquid.castShadow = true;
liquid.receiveShadow = true;
scene.add(liquid);

// Create cover with slots
const coverGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.5, 32);
const coverMaterial = new THREE.MeshBasicMaterial({ color: 0xa9a9a9 });
const cover = new THREE.Mesh(coverGeometry, coverMaterial);
cover.position.y = 2.75;
cover.castShadow = true;
cover.receiveShadow = true;
scene.add(cover);

// Create and add longer octahedron
const octahedronGeometry = new THREE.OctahedronGeometry(0.75, 2); // More faces for smoother appearance
const octahedronMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff, // White color
  metalness: 0.6,
  roughness: 0.5,
});
const octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial);
octahedron.rotation.x = Math.PI / 2; // Rotate 90 degrees around the X-axis
octahedron.scale.set(0.5, 1, 0.5); // Scale to make it longer along the Y-axis
octahedron.position.y = -2.5; // Position it at the bottom of the jar
octahedron.castShadow = true;
octahedron.receiveShadow = true;
scene.add(octahedron);

// Create electrodes
const electrodeMaterial = new THREE.MeshStandardMaterial({
  metalness: 1,
  roughness: 0.3,
  color: 0x0000ff, // Blue color
});
const electrodeGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);

const electrodes = [];
const numElectrodes = 4; // Adjust this number as needed

for (let i = 0; i < numElectrodes; i++) {
  const electrode = new THREE.Mesh(electrodeGeometry, electrodeMaterial);
  electrode.position.set((i - numElectrodes / 2) * 0.3, -1, 0); // Positioning electrodes along the X-axis

  // Create physics body for electrode
  const electrodeBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(
      electrode.position.x,
      electrode.position.y,
      electrode.position.z
    ),
  });
  electrodeBody.addShape(new CANNON.Box(new CANNON.Vec3(0.05, 0.5, 0.05))); // Match geometry dimensions
  world.addBody(electrodeBody);

  electrodes.push({ mesh: electrode, body: electrodeBody });
  scene.add(electrode);
}

// Create jar physics
const jarBody = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(0, 1, 0), // Centered in the world
});
jarBody.addShape(
  new CANNON.Cylinder(3, 3, 5, 32) // Match geometry dimensions
);
world.addBody(jarBody);

// Create cover physics
const coverBody = new CANNON.Body({
  mass: 0, // Static object
  position: new CANNON.Vec3(0, 2.75, 0),
});
coverBody.addShape(
  new CANNON.Cylinder(3.2, 3.2, 0.5, 32) // Match geometry dimensions
);
world.addBody(coverBody);

// Update physics
function updatePhysics() {
  // Update physics world
  world.step(1 / 60);

  // Update Three.js objects from Cannon.js physics
  electrodes.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.rotation.copy(body.quaternion);
  });

  jar.position.copy(jarBody.position);
  jar.rotation.copy(jarBody.quaternion);

  cover.position.copy(coverBody.position);
  cover.rotation.copy(coverBody.quaternion);
}

// Function to generate bubbles
let bubbles = [];
function createBubble() {
  const bubbleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const bubbleMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.6,
  });
  const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
  bubble.position.set(
    Math.random() * 6 - 3,
    Math.random() * 2 + 1,
    Math.random() * 2 - 1
  );
  bubbles.push(bubble);
  scene.add(bubble);
}

// Function to update bubbles
function updateBubbles(deltaTime) {
  bubbles.forEach((bubble) => {
    bubble.position.y += deltaTime * 0.2; // Move upwards
    if (bubble.position.y > 3) {
      // Remove bubble when it goes above a certain height
      scene.remove(bubble);
    }
  });

  // Remove all null bubbles from the array
  bubbles = bubbles.filter((bubble) => bubble.parent !== null);
}

// Set up animation
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  // Update PSU and Cable components
  //psu.update(deltaTime);
  cable.update();

  // Update physics
  updatePhysics();

  // Update bubbles
  updateBubbles(deltaTime);

  // Render scene
  renderer.render(scene, camera);

  // Update physics world
  world.step(1 / 60);
}

animate();

// Set up controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
