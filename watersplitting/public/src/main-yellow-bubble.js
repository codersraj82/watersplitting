import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PSUComponent } from "./PSUComponent";
import CableComponent from "./CableComponent"; // Import the CableComponent
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// Set up the basic Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

// Set up camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(2, 2, 10);

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
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xa0522d });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be flat
ground.receiveShadow = true;

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

const slot1 = new THREE.Mesh(slotGeometry, slotMaterial);
slot1.position.set(-1.5, 1, 0);
//cover.add(slot1);

const slot2 = new THREE.Mesh(slotGeometry, slotMaterial);
slot2.position.set(1.5, 1, 0);
//cover.add(slot2);

scene.add(cover);

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
const yellowBubbleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffff00, // Red color
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

// Create thick hollow transparent tube
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
    color: 0x00ffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
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
    color: 0x808080,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
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
  outerColor = 0x00ffff,
  innerColor = 0x808080,
  outerOpacity = 0.5,
  innerOpacity = 0.5,
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
  0, // innerRadius
  0.2, // length
  64, // segments
  0xff0000, // outerColor (red)
  0xffffff, // innerColor (blue)
  1, // outerOpacity (70% opacity)
  1, // innerOpacity (30% opacity)
  false
);
scene.add(membrane);

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
    color: color,
    transparent: transparency,
    opacity: opacity,
    side: THREE.DoubleSide,
    metalness: 1,
    roughness: 0.3,
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Rotate the tube to make it vertical
  mesh.rotation.z = Math.PI / 2; // Rotate 90 degrees around Z axis

  return mesh;
}

// Usage example
const lShapedTube = createVerticalHollowLShapedTube(0.2, 1, 2, 0.1, 32);
const rShapedTube = createVerticalHollowLShapedTube(0.2, 1, 1, 0.1, 32);
const cO2ShapedTube = createVerticalHollowLShapedTube(
  0.2,
  1,
  4,
  0.1,
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
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 1, 10).normalize();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Step the physics world
  world.step(1 / 120);

  // Generate and update bubbles
  generateBubbles();
  updateBubbles();

  // Update sceneComponent if necessary

  // Render the scene
  renderer.render(scene, camera);
}

animate();
