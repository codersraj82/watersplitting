// src/main.js
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import ThreeSceneComponent from "./SceneComponent";

// Set up existing scene, camera, renderer, and world
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 5, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

// Initialize the existing scene and setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Create instance of ThreeSceneComponent
const threeSceneComponent = new ThreeSceneComponent(
  scene,
  camera,
  renderer,
  world
);

function animate() {
  requestAnimationFrame(animate);

  // Update physics world
  world.step(1 / 60);

  // Render the scene
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
