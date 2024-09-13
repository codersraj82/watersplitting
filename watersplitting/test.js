import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import WaterSplittingModule from "./WaterSplittingModule";

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

camera.position.z = 5;

const loader = new FontLoader();
loader.load(
  "./helvetiker_bold.typeface.json",
  (font) => {
    console.log("Font loaded successfully");
    const textGeometry = new TextGeometry("Hello Three.js!", {
      font: font,
      size: 1,
      height: 0.1,
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    scene.add(textMesh);
  },
  undefined,
  (error) => {
    console.error("An error happened while loading the font:", error);
  }
);
// Initialize the WaterSplittingModule
const waterSplittingModule = new WaterSplittingModule();

function animate() {
  requestAnimationFrame(animate);
  waterSplittingModule.animate();
  renderer.render(scene, camera);
}
animate();
