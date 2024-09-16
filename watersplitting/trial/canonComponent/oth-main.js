import * as THREE from "three";
import * as CANNON from "cannon-es";
import { CylinderComponent } from "./CylinderComponent"; // Import the Cannon.js class

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

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.6,
  roughness: 0.5,
});
const cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinderMesh.rotation.x = Math.PI / 2;
cylinderMesh.position.set(0, -2.5, 0);
cylinderMesh.castShadow = true;
cylinderMesh.receiveShadow = true;
scene.add(cylinderMesh);

const cylinderComponent = new CylinderComponent();
const cylinderBody = cylinderComponent.getBody();
world.addBody(cylinderBody);

camera.position.z = 10;

function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);

  cylinderMesh.position.copy(cylinderBody.position);
  cylinderMesh.rotation.copy(cylinderBody.rotation);

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
