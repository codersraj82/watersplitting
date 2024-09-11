// main.js
import * as THREE from "three";
import WaterSplittingModule from "./WaterSplittingModule.js";

// Set up container
const container = document.getElementById("container");

// Create an external scene
const myScene = new THREE.Scene();

// Initialize WaterSplittingModule
// document.addEventListener("DOMContentLoaded", () => {
let waterSplittingModule = new WaterSplittingModule();
// });
// Extract the scene from WaterSplittingModule and add it to myScene
myScene.add(waterSplittingModule.scene);

// Create the camera for the external scene
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 5, 10);

// Create the renderer for the external scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting to the external scene
const externalLight = new THREE.DirectionalLight(0xffffff, 1);
externalLight.position.set(5, 10, 5);
myScene.add(externalLight);

// Render the combined scene (external scene + WaterSplittingModule's scene)
function animate() {
  requestAnimationFrame(animate);

  // Update WaterSplittingModule animation
  waterSplittingModule.animate();

  // Render the combined scene with the external camera
  renderer.render(myScene, camera);
}

animate();
