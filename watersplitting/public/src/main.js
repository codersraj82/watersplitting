import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PSUComponent } from "./PSUComponent";
import CableComponent from "./CableComponent"; // Import the CableComponent
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// Set up the basic Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x818589);

// Set up camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(1, 3, 12);

// Set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Set up lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 5, 10);
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
const groundGeometry = new THREE.PlaneGeometry(100, 75);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xa0522d });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, -1, 0);
ground.rotation.x = -Math.PI / 2; // Rotate to be flat
//ground.receiveShadow = true;

// function to give name to objects of three.js

// Function to add object to scene and track its name
const trackedObjects = {};
function addObjectToScene(name, object) {
  object.name = name; // Assign a name to the object
  scene.add(object); // Add object to the scene
  trackedObjects[name] = object; // Store reference in trackedObjects
  console.log(`Added object: ${name}`);
}
// scene.add(ground);
addObjectToScene("ground", ground);
ground.position.set(0, -3, 0);
// Add AxesHelper (X: red, Y: green, Z: blue)
const axesHelper = new THREE.AxesHelper(10); // Increase size of the axes to 10 units
//scene.add(axesHelper);

// Add GridHelper (optional) to make the ground plane more visible
const gridHelper = new THREE.GridHelper(100, 100); // Size and divisions
//scene.add(gridHelper);
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
  1.23,
  0.5,
  new THREE.Vector3(10, 6.5, -10), // Position it at (0, 1, 0)
  1
);
scene.add(psu);

const psuLockConstraint = new CANNON.LockConstraint(psu.psuBody, psuAnchorBody);
world.addConstraint(psuLockConstraint);

// Add cable
const cable = new CableComponent(scene, world, {
  length: 2, // Custom length of the cable
  numSegments: 300, // Number of segments
  radius: 0.15, // Radius of the cable
  color: 0xff0000, // Cable color (red)
  startPosition: [-6.4, 7.1, -11], // Starting position of the cable
  endPosition: [1.5, 4, 0], // Ending position of the cable
});
// Add cable
const cable1 = new CableComponent(scene, world, {
  length: 2, // Custom length of the cable
  numSegments: 300, // Number of segments
  radius: 0.15, // Radius of the cable
  color: 0x0000ff, // Cable color (blue)
  startPosition: [-6.3, 6.1, -12], // Starting position of the cable
  endPosition: [-10, 4, 0.15], // Ending position of the cable
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
//jar.castShadow = true;
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
      gl_FragColor = vec4(0.2, 0.4, 0.6, 0.4); // Slight pale yellow with transparency
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
//cover.add(slot1);

const slot2 = new THREE.Mesh(slotGeometry, slotMaterial);
slot2.position.set(1.5, 1, 0);
//cover.add(slot2);

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
octahedron.position.y = -1.5; // Position it at the bottom of the jar
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
  metalness: 1,
  roughness: 0.3,
});
const negativePlate = new THREE.Mesh(
  negativePlateGeometry,
  negativePlateMaterial
);
negativePlate.position.set(-10, 1, 0); // Position it inside the liquid, extending through the slot
negativePlate.castShadow = true;
negativePlate.receiveShadow = true;
scene.add(negativePlate);

const positivePlateGeometry = new THREE.BoxGeometry(0.1, 6, 2);
const positivePlateMaterial = new THREE.MeshStandardMaterial({
  color: 0xbf0a30, // Brighter red color
  metalness: 1,
  roughness: 0.3,
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
        liquid.position.y + liquid.geometry.parameters.height / 4;
      const liquidBottom =
        liquid.position.y - liquid.geometry.parameters.height / 4;

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

      if (mesh.position.y > 0.5) {
        scene.remove(mesh);
        bubbles.splice(index, 1);
      }
    } else {
      // Move colored bubbles towards their respective electrodes
      const direction = new THREE.Vector3()
        .subVectors(target, mesh.position)
        .normalize();
      mesh.position.add(direction.multiplyScalar(BUBBLE_SPEED));

      if (mesh.position.distanceTo(target) < 0.3 /* BUBBLE_SPEED */) {
        scene.remove(mesh);
        bubbles.splice(index, 1);
      }
    }
  });
}
/************ Rack *********** */

// Function to create a two-shelf metallic rack
function createRack() {
  const rackGroup = new THREE.Group();

  // Create rack material
  const darkGreenMaterial = new THREE.MeshStandardMaterial({
    color: 0x004d00, // Dark green
    metalness: 0.8, // Metallic look
    roughness: 0.2,
  });

  // Rack dimensions
  const rackHeight = 9; // 1.5 units tall
  const shelfWidth = 12; // 1 unit wide
  const shelfDepth = 6; // 0.5 unit deep
  const legRadius = 0.3; // Small radius for metallic legs
  const legHeight = rackHeight; // Height of the legs

  // Create vertical legs
  const legGeometry = new THREE.CylinderGeometry(
    legRadius,
    legRadius,
    legHeight,
    32
  );
  const leg1 = new THREE.Mesh(legGeometry, darkGreenMaterial);
  const leg2 = new THREE.Mesh(legGeometry, darkGreenMaterial);
  const leg3 = new THREE.Mesh(legGeometry, darkGreenMaterial);
  const leg4 = new THREE.Mesh(legGeometry, darkGreenMaterial);

  // Position legs at corners
  leg1.position.set(-shelfWidth / 2, legHeight / 2, -shelfDepth / 2);
  leg2.position.set(shelfWidth / 2, legHeight / 2, -shelfDepth / 2);
  leg3.position.set(-shelfWidth / 2, legHeight / 2, shelfDepth / 2);
  leg4.position.set(shelfWidth / 2, legHeight / 2, shelfDepth / 2);

  // Add legs to rack group
  rackGroup.add(leg1, leg2, leg3, leg4);

  // Create shelves
  const shelfGeometry = new THREE.BoxGeometry(shelfWidth, 0.05, shelfDepth);
  const shelf1 = new THREE.Mesh(shelfGeometry, darkGreenMaterial);
  const shelf2 = new THREE.Mesh(shelfGeometry, darkGreenMaterial);

  // Position shelves
  shelf1.position.set(0, rackHeight / 2 - 4, 0); // Lower shelf
  shelf2.position.set(0, rackHeight / 2 - 0.25, 0); // Upper shelf

  // Add shelves to rack group
  rackGroup.add(shelf1, shelf2);

  return rackGroup;
}

// Adding the rack to your scene
const rack = createRack();
// Set position and rotation
rack.position.set(10, 6, -10); // Position the rack in the scene

scene.add(rack);
rack.rotation.x = Math.PI; // No rotation on the X-axis
rack.rotation.y = 0; // 45 degrees rotation on the Y-axis
rack.rotation.z = 0; // No rotation on the Z-axis
/****** psuGroup************* */

const psuGroup = new THREE.Group();
psuGroup.add(rack);
psuGroup.add(psu);
scene.add(psuGroup);
psuGroup.position.set(-12, 0, -4);
/******* Copy right*********** */

// Load the Font for 3D Text
const loader = new FontLoader();

loader.load("/fonts/helvetiker_bold.typeface.json", function (font) {
  // Create Text Geometry for "Concept and Copyright..."
  const copyrightTextGeometry = new TextGeometry("© Dr. Jasmin Shaikh", {
    font: font,
    size: 0.7,
    height: 0.1, // depth of the text
    curveSegments: 12,
    bevelEnabled: false,
  });

  // Create Text Geometry for "Program developed by..."
  const developedByTextGeometry = new TextGeometry(
    "Program developed by Sarafaraj Shaikh",
    {
      font: font,
      size: 0.4,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
    }
  );
  const oxygenTextGeometry = new TextGeometry("Oxygen", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const CarbondioxideTextGeometry = new TextGeometry("Carbon dioxide", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const OERTextGeometry = new TextGeometry("OER", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const ECRTextGeometry = new TextGeometry("ECR", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const PEMTextGeometry = new TextGeometry("PEM", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const C1C2extGeometry = new TextGeometry("Liquid C1C2 product", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const gasproductextGeometry = new TextGeometry("Gas Product (CO)", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });
  const glassElectrodetextGeometry = new TextGeometry("Reference Electrode", {
    font: font,
    size: 0.4,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
  });

  // Create Material for the text
  const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffc300 });

  // Create Mesh for both texts
  const copyrightTextMesh = new THREE.Mesh(copyrightTextGeometry, textMaterial);
  const oxygenTextMesh = new THREE.Mesh(oxygenTextGeometry, textMaterial);
  const carbondioxideTextMesh = new THREE.Mesh(
    CarbondioxideTextGeometry,
    textMaterial
  );
  const PEMTextMesh = new THREE.Mesh(PEMTextGeometry, textMaterial);
  const OERTextMesh = new THREE.Mesh(OERTextGeometry, textMaterial);
  const ECRTextMesh = new THREE.Mesh(ECRTextGeometry, textMaterial);
  const C1C2TextMesh = new THREE.Mesh(C1C2extGeometry, textMaterial);
  const gasproductTextMesh = new THREE.Mesh(
    gasproductextGeometry,
    textMaterial
  );
  const glasselectrodeTextMesh = new THREE.Mesh(
    glassElectrodetextGeometry,
    textMaterial
  );
  const developedByTextMesh = new THREE.Mesh(
    developedByTextGeometry,
    textMaterial
  );

  // Position the meshes
  copyrightTextMesh.position.set(-10, -1, -8); // Adjust position as needed
  developedByTextMesh.position.set(-20, 4, -8); // Adjust position as needed

  // Add the text meshes to the scene
  scene.add(copyrightTextMesh);
  scene.add(oxygenTextMesh);
  scene.add(carbondioxideTextMesh);
  scene.add(PEMTextMesh);
  scene.add(OERTextMesh);
  scene.add(ECRTextMesh);
  scene.add(gasproductTextMesh);
  scene.add(glasselectrodeTextMesh);
  scene.add(C1C2TextMesh);
  // Text label positions
  oxygenTextMesh.position.set(-14, 3, 0);
  carbondioxideTextMesh.position.set(3, 2.1, 3);
  PEMTextMesh.position.set(-2, -2, 1);
  OERTextMesh.position.set(-10, 4.5, 0);
  ECRTextMesh.position.set(1, 4.5, 0);
  gasproductTextMesh.position.set(5, 3, 0);
  glasselectrodeTextMesh.position.set(3.5, 3.5, -1);
  C1C2TextMesh.position.set(7, -2, 0);

  copyrightTextMesh.rotation.y = Math.PI / 4;
  // scene.add(developedByTextMesh);

  // Optional: Adjust rotation, scale or any other properties of the meshes
  // Example: copyrightTextMesh.rotation.y = Math.PI / 4;
});

// create group

// Create a group for all components
const jargroup = new THREE.Group();
jargroup.add(jar);
jargroup.add(bottom);
jargroup.add(liquid);
jargroup.add(cover);
jargroup.add(octahedron);
//group.add(positivePlate);
//group.add(negativePlate);
scene.add(jargroup);

jargroup.remove(octahedron);
//group.remove(negativePlate);

/**  Tube formation */
// Function to create a hollow glass tube with one end curved

function createThickHollowStraightTube(
  outerRadius,
  innerRadius,
  length,
  segments
) {
  const outerGeometry = new THREE.CylinderGeometry(
    outerRadius,
    outerRadius,
    length,
    segments,
    1,
    true
  );
  const outerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    transmission: 1,

    opacity: 0.2,
    side: THREE.DoubleSide,
    roughness: 0,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0,
    reflectivity: 0.9,
    depthWrite: false,
  });

  const innerGeometry = new THREE.CylinderGeometry(
    innerRadius,
    innerRadius,
    length,
    segments,
    1,
    true
  );
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0xbdcbfe,
    transparent: true,
    //transmission: 1,
    opacity: 0.5, // Less transparent

    side: THREE.DoubleSide,
    roughness: 0,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0,
    reflectivity: 0.9,
    depthWrite: false,
  });

  const tube = new THREE.Mesh(outerGeometry, outerMaterial);
  const innerTube = new THREE.Mesh(innerGeometry, innerMaterial);
  innerTube.position.z = 0; // Position correctly
  tube.add(innerTube);

  return tube;
}

// Add the thick hollow transparent tube to the scene
const tube = createThickHollowStraightTube(0.6, 0.4, 4, 64);
tube.rotation.x = Math.PI / 2; // Rotate to place horizontally
tube.rotation.z = Math.PI / 2; // Rotate to place horizontally
tube.position.set(4.7, -1, 0);
scene.add(tube);
const o2Ltube = createThickHollowStraightTube(0.2, 0.1, 1, 64);
const co2Rtube = createThickHollowStraightTube(0.2, 0.1, 1, 64);
//scene.add(o2Ltube);
scene.add(co2Rtube);
tube.position.set(4.7, -1, 0);
co2Rtube.rotation.x = Math.PI / 2; // Rotate to place horizontally
co2Rtube.rotation.z = Math.PI / 2; // Rotate to place horizontally
co2Rtube.position.set(6, -2, 0);
o2Ltube.rotation.x = Math.PI / 2; // Rotate to place horizontally
o2Ltube.rotation.z = Math.PI / 2; // Rotate to place horizontally
o2Ltube.position.set(-13, -2, 0);

// Create hollow glass ring
// Create hollow glass ring with length parameter
function createHollowGlassRing(
  outerRadius,
  innerRadius,
  length,
  segments,
  outerColor = 0xffffff,
  innerColor = 0xffffff,
  outerOpacity = 0.3,
  innerOpacity = 0.3,
  transpnt = true
) {
  // Outer ring geometry and material
  const outerGeometry = new THREE.CylinderGeometry(
    outerRadius,
    outerRadius,
    length,
    segments,
    1,
    true
  );
  const outerMaterial = new THREE.MeshStandardMaterial({
    color: outerColor, // Use the outerColor parameter
    transparent: transpnt,
    opacity: outerOpacity, // Use the outerOpacity parameter
    side: THREE.DoubleSide,
  });

  // Inner ring geometry and material
  const innerGeometry = new THREE.CylinderGeometry(
    innerRadius,
    innerRadius,
    length,
    segments,
    1,
    true
  );
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: innerColor, // Use the innerColor parameter
    transparent: transpnt,
    opacity: innerOpacity, // Use the innerOpacity parameter
    side: THREE.DoubleSide,
  });

  // Create outer and inner ring meshes
  const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
  const innerRing = new THREE.Mesh(innerGeometry, innerMaterial);
  innerRing.position.z = 0;

  // Create a group and add both outer and inner rings
  const ringGroup = new THREE.Group();
  ringGroup.add(outerRing);
  ringGroup.add(innerRing);

  return ringGroup;
}

const hollowRing = createHollowGlassRing(1.2, 0.4, 0.3, 64); // Adjust thickness of the ring

scene.add(hollowRing);
hollowRing.position.set(6.7, -1, 0);
hollowRing.rotation.z = Math.PI / 2;
// create group for tube and ring
const tubeRing = new THREE.Group();
tubeRing.add(tube);
tubeRing.add(hollowRing);
scene.add(tubeRing);
// Add OrbitControls for better camera movement
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Clone of the groups
function deepCloneGroupWithUniqueElements(originalGroup) {
  const newGroup = new THREE.Group();

  originalGroup.children.forEach((child) => {
    const clonedChild = child.clone();

    // Clone the geometry and material to ensure unique elements
    clonedChild.geometry = child.geometry.clone();
    clonedChild.material = child.material.clone();

    // If the material has textures, clone those too
    if (child.material.map) {
      clonedChild.material.map = child.material.map.clone();
      clonedChild.material.map.needsUpdate = true;
    }

    // Copy position, rotation, and scale for proper transformation
    clonedChild.position.copy(child.position);
    clonedChild.rotation.copy(child.rotation);
    clonedChild.scale.copy(child.scale);

    newGroup.add(clonedChild);
  });

  return newGroup;
}

const jarClone = deepCloneGroupWithUniqueElements(jargroup);
console.log(jarClone.children); // Inspect the cloned elements
//const jarClone = group.clone();
scene.add(jarClone);
jarClone.remove(negativePlate);
//jarClone.position.x = 12;
const tubeRingClone = tubeRing.clone();
//const tubeRingClone = deepCloneGroupWithUniqueElements(tubeRing);
scene.add(tubeRingClone);
// Membrane

// Paper membrane
//(1.2, 0.4, 0.3, 64)
const membrane = createHollowGlassRing(
  1.2, // outerRadius
  0.5, // innerRadius
  0.2, // length
  120, // segments
  0xff0000, // outerColor (red)
  0xff0000, // innerColor (blue)
  1, // outerOpacity (70% opacity)
  1, // innerOpacity (30% opacity)
  true
);
scene.add(membrane);
// Paper disc
// Function to create a vertically placed blue paper disc
function createBluePaperDisc() {
  const geometry = new THREE.CircleGeometry(1, 32); // Create a circle geometry with radius 1 and 32 segments
  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff, // Blue color
    side: THREE.DoubleSide, // Ensure the disc is visible from both sides
  });

  const disc = new THREE.Mesh(geometry, material);

  // Set rotation to place the disc vertically (on the YZ plane)
  disc.rotation.x = Math.PI;
  disc.rotation.y = Math.PI / 2;

  // Add the disc to the scene
  scene.add(disc);

  return disc;
}

// Example usage:
const blueDisc = createBluePaperDisc();
blueDisc.position.set(-3.5, -1.5, 0); // Position the disc as needed

// positions of groups
jargroup.position.set(-10, -1, 0);
jarClone.position.set(3, -1, 0);
tubeRing.position.set(-10, -1, 0);
tubeRingClone.position.set(3, -1, 0);
membrane.position.set(-3.5, -2, 0);

// Bridge group

const bridgeGroup = new THREE.Group();
bridgeGroup.add(tubeRing);
bridgeGroup.add(tubeRingClone);
bridgeGroup.add(membrane);
scene.add(bridgeGroup);
bridgeGroup.position.set(0, 0.5, 0);

// rotations of grups

tubeRingClone.rotation.y = Math.PI / 2;
tubeRingClone.rotation.y = Math.PI;
membrane.rotation.z = Math.PI / 2;
jarClone.rotation.y = Math.PI / 2;
jarClone.rotation.y = Math.PI;

function createVerticalHollowLShapedTube(
  radius,
  length1,
  length2,
  thickness,
  segments,
  color = 0x00ffff, // Default color
  transparency = true, // Default to transparent
  opacity = 0.5 // Default opacity
) {
  // Create the cross-section shape using circles
  const outerRadius = radius;
  const innerRadius = radius - thickness;

  const shape = new THREE.Shape();

  // Outer circle
  const outerCircle = new THREE.Path();
  outerCircle.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  shape.add(outerCircle);

  // Inner circle (hole)
  const innerCircle = new THREE.Path();
  innerCircle.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(innerCircle);

  // Define the path for extrusion (L shape)
  const path = new THREE.CurvePath();
  path.add(
    new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, length1, 0)
    )
  );
  path.add(
    new THREE.LineCurve3(
      new THREE.Vector3(0, length1, 0),
      new THREE.Vector3(length2, length1, 0)
    )
  );

  // Define extrusion settings
  const extrudeSettings = {
    steps: segments,
    bevelEnabled: false,
    extrudePath: path,
  };

  // Create the geometry
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Create material with parameters
  const material = new THREE.MeshStandardMaterial({
    //color: color,
    color: color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    reflectivity: 0.5,
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Rotate the tube to make it vertical
  mesh.rotation.z = Math.PI / 2; // Rotate 90 degrees around Z axis

  return mesh;
}

// Usage example
const lShapedTube = createVerticalHollowLShapedTube(0.2, 1, 1.5, 0.05, 32);
const rShapedTube = createVerticalHollowLShapedTube(0.2, 1, 1.5, 0.05, 32);
const cO2ShapedTube = createVerticalHollowLShapedTube(
  0.2,
  1,
  4,
  0.05,
  32,
  0xff0000, // Custom color (red)
  true, // Transparency
  0.5 // Opacity
);
scene.add(lShapedTube);
scene.add(rShapedTube);
scene.add(cO2ShapedTube);

lShapedTube.rotation.x = Math.PI;
lShapedTube.castShadow = true;
lShapedTube.position.set(6, 2.7, 0);
rShapedTube.rotation.x = Math.PI;
rShapedTube.castShadow = true;
rShapedTube.rotation.y = Math.PI;
rShapedTube.position.set(-13, 2.7, 0);
cO2ShapedTube.rotation.x = Math.PI;
cO2ShapedTube.castShadow = true;
cO2ShapedTube.rotation.y = Math.PI / 2;
cO2ShapedTube.position.set(3, 2.7, 3);
//lShapedTube.rotation.z = 1 * Math.PI;
//***** Yellow bubbles */
let yBubbles = [];

// Function to create a transparent yellow ybubble
function createYBubble() {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.3,
  });
  const ybubble = new THREE.Mesh(geometry, material);

  // Set initial position at path start
  ybubble.position.set(-10, -1.5, 0); // Assuming path starts at (-50, 0, 0)

  scene.add(ybubble);
  return ybubble;
}

// Function to move a ybubble along a defined path
// Function to move a ybubble along a defined path
function moveYBubbleAlongPath(ybubble, pathStart, pathEnd, speed) {
  if (!ybubble || !ybubble.position) {
    console.error("ybubble or ybubble position is undefined.");
    return;
  }

  // Calculate direction from start to end
  const direction = new THREE.Vector3()
    .subVectors(pathEnd, pathStart)
    .normalize();

  // Update the ybubble position along the path
  ybubble.position.addScaledVector(direction, speed);

  // Check if ybubble has reached or passed the end position
  const distanceToEnd = ybubble.position.distanceTo(pathEnd);

  if (distanceToEnd < 0.1) {
    // Debug information
    console.log("Bubble reached the end:", ybubble.position);

    // Remove the ybubble from the scene if it reaches the end
    yBubbles = yBubbles.filter((yb) => yb !== ybubble); // Remove from yBubbles array
    scene.remove(ybubble); // Remove from the scene
  }
}

// Function to update all ybubbles and move them along the path
function updateYBubbles() {
  const pathStart = new THREE.Vector3(-10, -1.5, 0); // Starting position of the path
  const pathEnd = new THREE.Vector3(1.7, -1.5, 0); // End position of the path
  const speed = 0.1; // Speed of the ybubbles

  yBubbles.forEach((ybubble) => {
    moveYBubbleAlongPath(ybubble, pathStart, pathEnd, speed);
  });
}

// Main function to continuously generate ybubbles and manage their movement
function generateAndMoveYBubbles() {
  if (Math.random() < 0.25) {
    // Adjust probability to control bubble generation rate
    const ybubble = createYBubble();
    yBubbles.push(ybubble);
  }

  updateYBubbles(); // Update ybubble positions
}
// track the objects added to scene
// Function to log all objects with their names
function logSceneObjects() {
  console.log("Objects in the scene:");
  for (const name in trackedObjects) {
    if (trackedObjects.hasOwnProperty(name)) {
      console.log(`Name: ${name}, Object:`, trackedObjects[name]);
    }
  }
}

logSceneObjects();
//const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight1.position.set(10, 1, 10).normalize();
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(5, 7, 6).normalize();

/****** Referece electrode**** */

// Parameters
const height = 5; // Height of the entire electrode rod
const radius = 0.3; // Radius of the glass cylinder
const extrusionHeight = 0.2; // Height of the extruded part at the bottom
const plasticHeight = height / 4; // Height of the black plastic top
const wireRadius = 0.03; // Radius of the platinum wire

// Glass Cylinder
const glassGeometry = new THREE.CylinderGeometry(
  radius,
  radius,
  height - plasticHeight - extrusionHeight,
  32
);
const rodglassMaterial = new THREE.MeshStandardMaterial({
  color: 0xcbfafe,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
});
const glassCylinder = new THREE.Mesh(glassGeometry, rodglassMaterial);
scene.add(glassCylinder);

// Black Plastic Top
const plasticGeometry = new THREE.CylinderGeometry(
  radius,
  radius,
  plasticHeight,
  32
);
const plasticMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const plasticTop = new THREE.Mesh(plasticGeometry, plasticMaterial);
plasticTop.position.y = (height - plasticHeight) / 2; // Position it at the top
scene.add(plasticTop);

// Extruded Narrow Bottom
const extrudedGeometry = new THREE.CylinderGeometry(
  radius / 2,
  radius / 2,
  extrusionHeight,
  32
);
const extrudedMaterial = new THREE.MeshStandardMaterial({ color: 0xcbfafe });
const extrudedBottom = new THREE.Mesh(extrudedGeometry, extrudedMaterial);
extrudedBottom.position.y = -(height - extrusionHeight) / 2; // Position it at the bottom
scene.add(extrudedBottom);

// Platinum Wire
const wireGeometry = new THREE.CylinderGeometry(
  wireRadius,
  wireRadius,
  height - plasticHeight,
  32
);
const wireGeometry1 = new THREE.CylinderGeometry(wireRadius, wireRadius, 1, 32);
const wireMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc }); // Platinum-like color
const wireMaterial1 = new THREE.MeshStandardMaterial({ color: 0xcccccc }); // Platinum-like color
const platinumWire = new THREE.Mesh(wireGeometry, wireMaterial);
const platinumWire1 = new THREE.Mesh(wireGeometry1, wireMaterial1);
platinumWire.position.y = 0; // Centered along the height
platinumWire1.position.set(3.5, 3, -0.8); // Centered along the height
scene.add(platinumWire);
scene.add(platinumWire1);

// Usage Example
const glassElectrodeGroup = new THREE.Group();
glassElectrodeGroup.add(glassCylinder);
glassElectrodeGroup.add(plasticTop);
glassElectrodeGroup.add(extrudedBottom);
glassElectrodeGroup.add(platinumWire);
// glassElectrodeGroup.add(platinumWire1);
scene.add(glassElectrodeGroup);
glassElectrodeGroup.position.set(3.5, 0.1, -0.8);

// Add lighting and camera setup here

// Camea movment for animation clip

// Variables for camera movement
let targetPosition = new THREE.Vector3(1, 2.5, 10); // Final fixed position
let orbitRadius = 10; // Radius for the orbiting camera
let orbitSpeed = 0.2; // Speed for orbiting around the center
let orbiting = false; // Initially, orbiting is false
let orbitStartTime = 0;
let orbitComplete = false; // To track if one full orbit is done

// Set initial camera position far away
camera.position.set(0, 50, 15);

// Function to move the camera from far away to the fixed position
function moveCameraToFixedPosition() {
  if (camera.position.distanceTo(targetPosition) > 0.1) {
    let direction = new THREE.Vector3()
      .subVectors(targetPosition, camera.position)
      .normalize();
    let cameraSpeed = 0.3; // Speed to move to the fixed position
    camera.position.addScaledVector(direction, cameraSpeed);
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the scene
  } else {
    // Once camera reaches the target position, stop moving and start orbiting
    camera.position.copy(targetPosition);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    orbiting = true; // Start orbiting after reaching the fixed position
    orbitStartTime = Date.now();
  }
}

// Function to make the camera orbit around the scene
function orbitCamera() {
  if (orbiting && !orbitComplete) {
    const time = (Date.now() - orbitStartTime) * 0.001; // Time since orbiting started
    const x = Math.sin(time * orbitSpeed) * orbitRadius;
    const z = Math.cos(time * orbitSpeed) * orbitRadius;
    camera.position.set(x, 5, z); // Keep camera orbiting at y = 5
    camera.lookAt(0, 0, 0); // Always look at the center

    // Check if a full orbit is complete (approximately 6.28 radians for a full circle)
    if (time * orbitSpeed >= Math.PI * 2) {
      orbitComplete = true;
      stopOrbiting();
    }
  }
}

// Function to stop orbiting and return to the fixed position
function stopOrbiting() {
  orbiting = false;
  orbitComplete = true;

  // Move the camera back to the final fixed position
  camera.position.copy(targetPosition);
  camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the scene
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Step the physics world
  world.step(1 / 120);

  // Update the PSU and cable physics
  psu.updatePhysics();
  cable.update();
  cable1.update();
  // Generate and update bubbles
  generateBubbles();

  updateBubbles();
  // Update bubble positions
  generateAndMoveYBubbles(); // Generate new ybubbles and update existing ones

  // Generate and update yellow bubbles
  //generateYellowBubbles();

  // Update octahedron rotation and vibration
  octahedron.rotation.x += 1;
  octahedron.rotation.z += 0.001;

  // camer movment update
  if (!orbiting && !orbitComplete) {
    // Move the camera from far to the fixed position initially
    moveCameraToFixedPosition();
  }

  // Start orbiting around the scene after reaching the fixed position
  if (orbiting && !orbitComplete) {
    orbitCamera();
  }

  // Update sceneComponent if necessary

  // Render the scene
  renderer.render(scene, camera);
}

animate();
