import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 10;
camera.position.y = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x808080); // White background
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10); // Adjust position to better illuminate objects
directionalLight.castShadow = true;
scene.add(directionalLight);

// Ensure light targets the center of the scene
directionalLight.target.position.set(1, 0, 0);

// Update shadow properties for better lighting
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

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
  gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1); // Slight pale yellow with transparency //vec4(0.0, 0.3, 0.6, 0.4); // Adjust color and transparency as needed
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
const slotWidth = 0.2;
const slotHeight = 1;
const slotDepth = 0.5;
const slotGeometry = new THREE.BoxGeometry(slotWidth, slotHeight, slotDepth);
const slotMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const slot1 = new THREE.Mesh(slotGeometry, slotMaterial);
slot1.position.set(-1.5, 1, 0);
cover.add(slot1);

const slot2 = new THREE.Mesh(slotGeometry, slotMaterial);
slot2.position.set(1.5, 1, 0);
cover.add(slot2);

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
});

const negativePlateGeometry = new THREE.BoxGeometry(0.1, 6, 2);
const negativePlateMaterial = new THREE.MeshStandardMaterial({
  color: 0x002868, // Brighter blue color
  ...electrodeMaterial,
});
const negativePlate = new THREE.Mesh(
  negativePlateGeometry,
  negativePlateMaterial
);
negativePlate.position.set(-1.5, 1, 0); // Position it inside the liquid, extending through the slot
negativePlate.castShadow = true;
negativePlate.receiveShadow = true;
scene.add(negativePlate);

const positivePlateGeometry = new THREE.BoxGeometry(0.1, 6, 2);
const positivePlateMaterial = new THREE.MeshStandardMaterial({
  color: 0xbf0a30, // Brighter red color
  ...electrodeMaterial,
});
const positivePlate = new THREE.Mesh(
  positivePlateGeometry,
  positivePlateMaterial
);
positivePlate.position.set(1.5, 1, 0); // Position it on the opposite side of the liquid
positivePlate.castShadow = true;
positivePlate.receiveShadow = true;
scene.add(positivePlate);

// Create plane
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -5;
plane.receiveShadow = true;
scene.add(plane);

// AxesHelper
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

// Bubble properties
const BUBBLE_INTERVAL = 0.01; // Time between bubble creations
const MAX_BUBBLES = 500; // Maximum number of bubbles
const BUBBLE_SPEED = 0.05; // Speed of bubble movement
const BUBBLE_RADIUS = 0.1; // Radius of bubbles
const ELECTRODE_BUBBLE_DENSITY = 0.05; // Density of bubbles around electrodes
const CENTER_BUBBLE_DENSITY = 0.1; // Density of bubbles at the center of liquid

const bubbleGeometry = new THREE.SphereGeometry(BUBBLE_RADIUS, 16, 16);
const bubbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xe5f3fd,
  opacity: 0.5,
  transparent: true,
  roughness: 0.1,
  metalness: 0.1,
  clearcoat: 1,
  clearcoatRoughness: 0,
  reflectivity: 0.9,
});

let bubbles = [];
let bubbleTimer = 0;

// Function to generate bubbles
function generateBubbles() {
  if (bubbles.length < MAX_BUBBLES) {
    // Generate bubbles at the electrodes
    [negativePlate, positivePlate].forEach((electrode) => {
      for (let i = 0; i < ELECTRODE_BUBBLE_DENSITY * MAX_BUBBLES; i++) {
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial.clone());
        bubble.position.set(
          electrode.position.x + Math.random() * 0.5 - 0.25, // Random X within a small range around the electrode
          electrode.position.y + Math.random() * 0.5 - 0.25, // Random Y within a small range around the electrode
          electrode.position.z + Math.random() * 0.5 - 0.25 // Random Z within a small range around the electrode
        );

        // Ensure bubbles are inside the liquid
        if (bubble.position.y >= -2.5 && bubble.position.y <= 1.25) {
          scene.add(bubble);
          bubbles.push(bubble);
        }
      }
    });

    // Generate bubbles at the center of the liquid
    for (let i = 0; i < CENTER_BUBBLE_DENSITY * MAX_BUBBLES; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial.clone());
      bubble.position.set(
        Math.random() * 2.9 - 2.9, // Random X within the liquid width
        Math.random() * 3 - 1.5, // Random Y within the liquid height
        Math.random() * 2.9 - 2.9 // Random Z within the liquid depth
      );

      // Ensure bubbles are inside the liquid
      if (bubble.position.y >= -2.5 && bubble.position.y <= 1.25) {
        scene.add(bubble);
        bubbles.push(bubble);
      }
    }
  }
}

// Update function for bubbles
function updateBubbles() {
  bubbles.forEach((bubble) => {
    bubble.position.y += BUBBLE_SPEED; // Move bubbles upwards

    // Check if bubble is above the liquid
    if (bubble.position.y > 2.5) {
      scene.remove(bubble);
      bubbles.splice(bubbles.indexOf(bubble), 1);
      return;
    }

    // Ensure bubbles stay within the cylindrical liquid boundaries
    const radius = 2.9; // Liquid radius

    // Calculate the distance from the bubble to the center of the jar
    const distanceFromCenter = Math.sqrt(
      bubble.position.x ** 2 + bubble.position.z ** 2
    );

    // Clamp position to stay within cylindrical boundary
    if (distanceFromCenter > radius) {
      // Calculate the angle and clamp the position
      const angle = Math.atan2(bubble.position.z, bubble.position.x);
      bubble.position.x = radius * Math.cos(angle);
      bubble.position.z = radius * Math.sin(angle);
    }

    // Check if bubble is near an electrode
    [negativePlate, positivePlate].forEach((electrode) => {
      const distance = bubble.position.distanceTo(electrode.position);
      if (distance < 1) {
        bubble.material.color.set(electrode.material.color); // Change color to match the electrode
      }
    });
  });
}

// Animation loop
let time = 0;
function animate() {
  requestAnimationFrame(animate);

  // Update wave effect
  liquidMaterial.uniforms.time.value += 0.05;

  // Spin the octahedron
  octahedron.rotation.z += 0.3; // Continuous spinning around the Y-axis

  // Add vibration to the octahedron
  octahedron.position.y = -2.5 + Math.sin(time * 0.5) * 0.1; // Slight vertical vibration

  // Update bubbles
  bubbleTimer += 0.01; // Increase timer
  if (bubbleTimer > BUBBLE_INTERVAL) {
    generateBubbles();
    bubbleTimer = 0; // Reset timer
  }
  updateBubbles();

  // Update time
  time += 0.05;

  // Update controls
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

// Adjust canvas size on window resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Start animation
animate();
