// Import necessary modules
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createKnob } from "./Knob.js";
import { createBananaFemaleConnector } from "./BananaFemaleConnector.js";
// Scene, Camera, Renderer setup
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
renderer.shadowMap.enabled = true;

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping for smoother controls
controls.dampingFactor = 0.05; // Damping factor for smooth movement
controls.enablePan = false; // Disable panning (optional)
controls.maxPolarAngle = Math.PI / 2; // Prevent the camera from rotating below the horizon
controls.update();

// Create a rectangular box (PSU)
const psuGeometry = new THREE.BoxGeometry(10, 2, 6); // Longer width (10), shorter height (2), longer depth (6)
const psuMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 }); // Grey-white color
const psu = new THREE.Mesh(psuGeometry, psuMaterial);
psu.castShadow = true;

// Position the PSU and rotate it 90 degrees to the left
psu.position.set(0, 0, -3); // Centered and moved along z-axis
psu.rotation.y = Math.PI / 2; // Rotate to face the longer width towards z-axis

// Rotate the box 90 degrees to the left (counterclockwise)
psu.rotation.y -= Math.PI / 2; // Rotate around y-axis

scene.add(psu);

// Create a rectangular display component with padding
const displayWidth = 6;
const displayHeight = 1.5;
const displayDepth = 0.2;
const displayGeometry = new THREE.BoxGeometry(
  displayWidth,
  displayHeight,
  displayDepth
); // Adjusted size
const displayMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black color for the display
const display = new THREE.Mesh(displayGeometry, displayMaterial);

// Position the display within the front face of the PSU
display.position.set(0, 0, 0); // Flush with front face, accounting for depth
display.rotation.set(0, Math.PI, 0); // Correct rotation to face outward

// Add the display to the scene
scene.add(display);

// Load Font
const loader = new FontLoader();
let font;

// Function to create text labels
function createLabel(text, position, baseSize = 0.4, color = 0xffffff) {
  const textGeometry = new TextGeometry(text, {
    font: font,
    size: baseSize,
    height: 0.05,
    curveSegments: 12,
  });
  textGeometry.computeBoundingBox();
  const textMaterial = new THREE.MeshStandardMaterial({ color: color });
  const label = new THREE.Mesh(textGeometry, textMaterial);

  // Center the text within the display
  const bbox = textGeometry.boundingBox;
  if (bbox) {
    const width = bbox.max.x - bbox.min.x;
    const height = bbox.max.y - bbox.min.y;
    label.position.set(
      position.x - width / 2,
      position.y - height / 2,
      position.z
    );
  }

  scene.add(label);
  return label;
}

// Function to update the display values
function updateDisplay(voltage, current) {
  if (font) {
    const voltageText = `${voltage.toFixed(2)} V`;
    const currentText = `${current.toFixed(2)} A`;

    // Remove old labels if they exist
    if (voltageLabel) scene.remove(voltageLabel);
    if (currentLabel) scene.remove(currentLabel);

    // Create new labels
    voltageLabel = createLabel(
      voltageText,
      { x: 0, y: 0.25, z: displayDepth / 2 + 0.01 }, // Adjusted position
      0.4,
      0x00ff00
    );
    currentLabel = createLabel(
      currentText,
      { x: 0, y: -0.25, z: displayDepth / 2 + 0.01 }, // Adjusted position
      0.4,
      0xff0000
    );
  }
}

// Update the display values initially
updateDisplay(5.0, 1.0);

// Variables to store text labels
let voltageLabel, currentLabel;

// Create knobs for voltage and current adjustment
function setupKnobs() {
  if (!font) return;

  // Define knob size
  const knobSize = 0.3; // Adjust size as needed

  const voltageKnob = createKnob(
    new THREE.Vector3(
      displayWidth / 1.5, // Adjusted position to fit within PSU
      0.6, // Height position relative to the display
      displayDepth / 2 + 0.05 // Slightly in front of the display
    ),
    "V",
    font,
    knobSize
  );

  const currentKnob = createKnob(
    new THREE.Vector3(
      displayWidth / 1.5, // Adjusted position to fit within PSU
      -0.6, // Height position relative to the display
      displayDepth / 2 + 0.05 // Slightly in front of the display
    ),
    "A",
    font,
    knobSize
  );

  // Add knobs to the scene
  scene.add(voltageKnob);
  scene.add(currentKnob);

  // Raycaster and mouse vector
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedKnob = null;
  let previousMouseY = 0;

  // Variables to store knob values
  let voltageValue = 0;
  let currentValue = 0;

  // Handle mouse down event
  window.addEventListener("mousedown", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([voltageKnob, currentKnob]);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (clickedObject === voltageKnob) {
        // Update voltage value and cycle from 0 to 12
        voltageValue = (voltageValue + 1) % 13; // Wrap around 0 to 12
        updateDisplay(voltageValue, currentValue);
      } else if (clickedObject === currentKnob) {
        // Update current value and cycle from 0 to 5
        currentValue = (currentValue + 1) % 6; // Wrap around 0 to 5
        updateDisplay(voltageValue, currentValue);
      }
    }
  });

  // Create banana female connector rings
  const ringOffsetX = -4; // Position the rings to the left of the display
  const ringOffsetY = 0; // Center vertically
  const ringPositionZ = displayDepth / 2 + 0.01; // Slightly in front of the display

  const redRing = createBananaFemaleConnector(
    new THREE.Vector3(ringOffsetX, 0.3, ringPositionZ),
    0.1, // Outer radius
    0.05, // Inner radius (thickness)
    0xff0000 // Red color
  );
  const blueRing = createBananaFemaleConnector(
    new THREE.Vector3(ringOffsetX, -0.3, ringPositionZ),
    0.1, // Outer radius
    0.05, // Inner radius (thickness)
    0x0000ff // Blue color
  );

  // Rotate rings by 90 degrees around the Y-axis
  redRing.rotation.x = Math.PI; // 90 degrees in radians
  blueRing.rotation.x = Math.PI; // 90 degrees in radians

  // Add rings to the scene
  scene.add(redRing);
  scene.add(blueRing);

  // Add AxesHelper to visualize the coordinate system
  const axesHelper = new THREE.AxesHelper(5); // Adjust size as needed
  scene.add(axesHelper);

  // Lighting
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
  scene.add(ambientLight);

  // Adjust the camera position
  camera.position.set(0, 5, 15); // Adjusted camera position to view the PSU

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update orbit controls
    renderer.render(scene, camera);
  }
  animate();
}

// Load Font and setup knobs
loader.load("/fonts/helvetiker_bold.typeface.json", function (loadedFont) {
  font = loadedFont;
  // Create and update display after font is loaded
  updateDisplay(12.34, 5.67);
  // Setup knobs after font is loaded
  setupKnobs();
});
