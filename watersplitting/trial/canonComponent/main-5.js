import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PSUComponent } from "./PSUComponent.js";
import CableComponent from "./CableComponent-1"; // Import the CableComponent

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
  endPosition: [1.6, 4.3, 0], // Ending position of the cable
});
/************* experiment setup************** */
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
const slotWidth = 0.2;
const slotHeight = 1;
const slotDepth = 0.5;
const slotGeometry = new THREE.BoxGeometry(slotWidth, slotHeight, slotDepth);
const slotMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

// cover physics
// Create cover physics body
const coverShape = new CANNON.Cylinder(3.2, 3.2, 0.5, 32); // Note: Cannon.js uses radii
const coverBody = new CANNON.Body({
  mass: 0, // Set mass for dynamics
  position: new CANNON.Vec3(
    cover.position.x,
    cover.position.y,
    cover.position.z
  ), // Initial position
  type: CANNON.Body.DYNAMIC,
});
coverBody.addShape(coverShape);
world.addBody(coverBody);

console.log("Cover Position:", cover.position);
console.log("Cover Rotation:", cover.rotation);
console.log("Cover Body Position:", coverBody.position);
console.log("Cover Body Rotation:", coverBody.rotation);

function updateVisualObjectFromPhysics(visualObject, physicsObject) {
  if (visualObject && physicsObject) {
    visualObject.position.set(
      physicsObject.position.x,
      physicsObject.position.y,
      physicsObject.position.z
    );
    visualObject.quaternion.set(
      physicsObject.quaternion.x,
      physicsObject.quaternion.y,
      physicsObject.quaternion.z,
      physicsObject.quaternion.w
    );
  }
}

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

// Add symbol

function addSymbols() {
  if (!font) return;

  // Create positive symbol ( + ) for red electrode
  const positiveGeometry = new TextGeometry(" + ", {
    font: font,
    size: 0.5,
    height: 0.1,
  });
  const positiveMaterial = new THREE.MeshStandardMaterial({ color: 0xbf0a30 });
  const positiveText = new THREE.Mesh(positiveGeometry, positiveMaterial);
  positiveText.position.set(2, 4.5, 0); // Adjust position as needed
  positiveText.rotation.x = -Math.PI; // Rotate to face upwards
  scene.add(positiveText);

  // Create negative symbol ( - ) for blue electrode
  const negativeGeometry = new TextGeometry(" - ", {
    font: font,
    size: 0.5,
    height: 0.1,
  });
  const negativeMaterial = new THREE.MeshStandardMaterial({ color: 0x002868 });
  const negativeText = new THREE.Mesh(negativeGeometry, negativeMaterial);
  negativeText.position.set(-1, 4.5, 0); // Adjust position as needed
  negativeText.rotation.x = -Math.PI; // Rotate to face upwards
  scene.add(negativeText);
}

// Bubble logic

// Bubble properties
const BUBBLE_INTERVAL = 0.001; // Time between bubble creations
const MAX_BUBBLES = 1000; // Maximum number of bubbles
const BUBBLE_SPEED = 0.07; // Speed of bubble movement
const BUBBLE_RADIUS = 0.1; // Radius of bubbles

// Increase the density of white bubbles
const ELECTRODE_BUBBLE_DENSITY = 0.1; // Density of bubbles around electrodes (unchanged)
const CENTER_BUBBLE_DENSITY = 0.9; // Increased density for white bubbles, making them more frequent

const bubbleGeometry = new THREE.SphereGeometry(BUBBLE_RADIUS, 16, 16);
const blueBubbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x0000ff, // Blue color
  opacity: 0.8,
  transparent: true,
  depthWrite: false,
  clearcoat: 1,
  reflectivity: 0.7,
  transmission: 1,
});
const redBubbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff0000, // Red color
  opacity: 0.8,
  transparent: true,
  depthWrite: false,
  clearcoat: 1,
  reflectivity: 0.7,
  transmission: 1,
});
const whiteBubbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, // White color
  opacity: 0.8,
  transparent: true,
  depthWrite: false,
  clearcoat: 1,
  reflectivity: 0.7,
  transmission: 1,
});

let bubbles = [];
let lastBubbleTime = 0;

// Function to generate bubbles (including white bubbles along the width of the bottom edges of electrodes)
// Increase the density of blue and red bubbles
const BLUE_BUBBLE_DENSITY = 1; // Increase density for blue bubbles
const RED_BUBBLE_DENSITY = 2; // Double density for red bubbles

// Generate bubble function
function generateBubbles() {
  const currentTime = Date.now();
  if (currentTime - lastBubbleTime > BUBBLE_INTERVAL * 10) {
    lastBubbleTime = currentTime;

    if (bubbles.length < MAX_BUBBLES) {
      // Generate white bubbles near the bottom width of both electrodes
      const numBubblesPerEdge = 15; // Increase number of bubbles along the width of each electrode

      [negativePlate, positivePlate].forEach((electrode) => {
        for (let i = 0; i < numBubblesPerEdge; i++) {
          const widthFraction = i / numBubblesPerEdge - 0.5; // Distribute bubbles along the width
          const x = electrode.position.x;
          const y =
            electrode.position.y - electrode.geometry.parameters.height / 2; // Bottom edge
          const z =
            electrode.position.z +
            widthFraction * electrode.geometry.parameters.depth;

          const whiteBubble = new THREE.Mesh(
            bubbleGeometry,
            whiteBubbleMaterial
          );
          whiteBubble.position.set(x, y, z);
          scene.add(whiteBubble);

          // Add random upward and outward spread to cover more area
          const randomTargetX = x + (Math.random() - 0.5) * 2;
          const randomTargetZ = z + (Math.random() - 0.5) * 4;

          bubbles.push({
            mesh: whiteBubble,
            target: new THREE.Vector3(randomTargetX, 4, randomTargetZ), // Move up with more randomness
            color: "white",
          });
        }
      });

      // Increase the number of blue and red bubbles by generating more frequently
      const liquidTop =
        liquid.position.y + liquid.geometry.parameters.height / 2;
      const liquidBottom =
        liquid.position.y - liquid.geometry.parameters.height / 2;

      // Increased density for more blue and red bubbles
      const blueBubbleDensity = 0.3; // Increase the density for blue bubbles
      const redBubbleDensity = 0.6; // Make red bubbles twice as frequent as blue bubbles

      const electrodes = [
        { color: "blue", electrode: negativePlate, density: blueBubbleDensity },
        { color: "red", electrode: positivePlate, density: redBubbleDensity },
      ];

      electrodes.forEach(({ color, electrode, density }) => {
        for (let i = 0; i < 5; i++) {
          // Increase the number of attempts to generate bubbles
          if (Math.random() < density) {
            const x = electrode.position.x + (Math.random() - 0.5) * 2;
            const y = liquidBottom + Math.random() * (liquidTop - liquidBottom); // Constrain within liquid height
            const z =
              electrode.position.z +
              (Math.random() - 0.5) * electrode.geometry.parameters.depth;

            const bubbleMaterial =
              color === "blue" ? blueBubbleMaterial : redBubbleMaterial;
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            bubble.position.set(x, y, z);
            scene.add(bubble);

            const target = new THREE.Vector3(
              electrode.position.x + (Math.random() - 0.5) * 0.5,
              y, // Bubble will remain within the liquid height range
              electrode.position.z + (Math.random() - 0.5) * 0.5
            );

            bubbles.push({
              mesh: bubble,
              target,
              color,
            });
          }
        }
      });
    }
  }
}

// Update bubbles function for spreading upwards
function updateBubbles() {
  bubbles.forEach((bubble, index) => {
    const { mesh, target, color } = bubble;

    // Move white bubbles up with more spread as they ascend
    if (color === "white") {
      const randomOffsetX = (Math.random() - 0.5) * 0.1; // Random horizontal motion
      const randomOffsetZ = (Math.random() - 0.5) * 0.1; // Random horizontal motion
      mesh.position.x += randomOffsetX;
      mesh.position.z += randomOffsetZ;
      mesh.position.y += BUBBLE_SPEED;

      if (mesh.position.y > 2) {
        scene.remove(mesh);
        bubbles.splice(index, 1);
      }
    } else {
      // Move colored bubbles towards their respective electrodes
      const direction = new THREE.Vector3()
        .subVectors(target, mesh.position)
        .normalize();
      mesh.position.add(direction.multiplyScalar(BUBBLE_SPEED));

      if (mesh.position.distanceTo(target) < BUBBLE_SPEED) {
        scene.remove(mesh);
        bubbles.splice(index, 1);
      }
    }
  });
}

// Add OrbitControls for better camera movement
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Step the physics world
  world.step(1 / 120);

  // Update the PSU and cable physics
  // Update the Three.js visuals from the physics world
  updateVisualObjectFromPhysics(cover, coverBody);
  psu.updatePhysics();
  cable.update();
  // Generate and update bubbles
  generateBubbles();
  updateBubbles();

  // Update octahedron rotation and vibration
  octahedron.rotation.x += 1;
  octahedron.rotation.z += 0.001;

  // Update sceneComponent if necessary

  // Render the scene
  renderer.render(scene, camera);
}

animate();
