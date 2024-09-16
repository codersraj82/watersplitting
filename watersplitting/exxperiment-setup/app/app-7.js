// Import necessary modules
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  World,
  Body,
  Plane,
  Vec3,
  Cylinder,
  Sphere,
  LockConstraint,
} from "cannon-es";
import { waveShader } from "./waveShader"; // Import the wave shader

// Define jar dimensions
const jarOuterRadius = 1;
const jarInnerRadius = 0.95; // Inner radius of the jar
const jarHeight = 2;

// Setup Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set gray background color
scene.background = new THREE.Color(0x808080); // Gray color

// Create a glass jar with an open top
const jarWallGeometry = new THREE.CylinderGeometry(
  jarOuterRadius,
  jarOuterRadius,
  jarHeight,
  32,
  1,
  true
);
const jarWallMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00aaff, // Light blue color
  transparent: true,
  opacity: 0.25,
  roughness: 0.05, // For glossy look
  metalness: 0.05, // Slight metalness
  reflectivity: 0.95, // High reflectivity for glass effect
  side: THREE.DoubleSide, // Ensure both sides are rendered
});
const jarWalls = new THREE.Mesh(jarWallGeometry, jarWallMaterial);

// Add a wireframe to visualize the edges of the jar walls
const jarWallWireframeGeometry = new THREE.WireframeGeometry(jarWallGeometry);
const jarWallWireframeMaterial = new THREE.LineBasicMaterial({
  color: 0xff0000,
}); // Red color for edges
const jarWallWireframe = new THREE.LineSegments(
  jarWallWireframeGeometry,
  jarWallWireframeMaterial
);
jarWalls.add(jarWallWireframe);

scene.add(jarWalls);

// Create the transparent bottom (closed base)
const jarBottomGeometry = new THREE.CylinderGeometry(
  jarInnerRadius,
  jarInnerRadius,
  0.1,
  32
);
const jarBottomMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff0000, // Red color to make it visible
  transparent: true,
  opacity: 0.5, // Semi-transparent
});
const jarBottom = new THREE.Mesh(jarBottomGeometry, jarBottomMaterial);

// Add a wireframe to visualize the edges of the jar bottom
const jarBottomWireframeGeometry = new THREE.WireframeGeometry(
  jarBottomGeometry
);
const jarBottomWireframeMaterial = new THREE.LineBasicMaterial({
  color: 0x00ff00,
}); // Green color for edges
const jarBottomWireframe = new THREE.LineSegments(
  jarBottomWireframeGeometry,
  jarBottomWireframeMaterial
);
jarBottom.add(jarBottomWireframe);

jarBottom.position.set(0, -jarHeight / 2 + 0.05, 0); // Move to the base of the jar
scene.add(jarBottom);

// Position the jar slightly above the ground
jarWalls.position.set(0, jarHeight / 2, 0);
jarBottom.position.set(0, -jarHeight / 2 + 0.05, 0);

// Create a wooden ground plane using just color
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Brown color for wood
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to lie flat
scene.add(ground);

// Camera and light setup
camera.position.set(0, 3, 5);
camera.lookAt(jarWalls.position);

// Add lighting for reflections and shadows
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Cannon-es physics world
const world = new World();
world.gravity.set(0, -9.82, 0); // Earth gravity

// Physics body for the jar walls (static, open-top jar)
const jarWallShape = new Cylinder(
  jarInnerRadius,
  jarInnerRadius,
  jarHeight,
  32
);
const jarWallBody = new Body({
  mass: 0, // Static
  position: new Vec3(0, jarHeight - 0.5, 0),
});
world.addBody(jarWallBody);

// Physics body for the jar bottom (static)
const jarBottomShape = new Cylinder(jarInnerRadius, jarInnerRadius, 0.1, 32); // Bottom shape
const jarBottomBody = new Body({
  mass: 0,
  position: new Vec3(0, jarHeight - 1.5, 0),
  shape: jarBottomShape,
});
world.addBody(jarBottomBody);

// Lock the jar bottom to the jar walls using a LockConstraint
const lockConstraint = new LockConstraint(jarWallBody, jarBottomBody);
world.addConstraint(lockConstraint);

// Physics body for the ground (static)
const groundShape = new Plane();
const groundBody = new Body({ mass: 0, shape: groundShape });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to lie flat
groundBody.position.set(0, 0, 0);
world.addBody(groundBody);

// Create a cylinder to simulate liquid inside the jar
const liquidHeight = (jarHeight * 2) / 3; // Liquid height (2/3 of jar height)
const liquidGeometry = new THREE.CylinderGeometry(
  jarInnerRadius * 0.95,
  jarInnerRadius * 0.95,
  liquidHeight,
  32
);
const liquidMaterial = new THREE.ShaderMaterial(waveShader); // Use custom wave shader
liquidMaterial.uniforms.resolution.value.set(
  window.innerWidth,
  window.innerHeight
);
const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);

// Place liquid inside the jar so that it touches the bottom and fills 2/3 of the jar
liquid.position.set(0, liquidHeight - 0.1, 0);
scene.add(liquid);

// Create falling plastic balls
const ballMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffcc00,
  metalness: 0.2,
  roughness: 0.8,
});
const balls = [];
const ballBodies = [];

function createBall() {
  const ballRadius = 0.1;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  scene.add(ball);
  balls.push(ball);

  const ballBody = new Body({
    mass: 0.1, // Lightweight ball
    position: new Vec3((Math.random() - 0.5) * 2, 5, (Math.random() - 0.5) * 2),
    shape: new Sphere(ballRadius),
  });
  world.addBody(ballBody);
  ballBodies.push(ballBody);
}

// Continuously create balls every second
setInterval(createBall, 1000);

// Create vibrators at the bottom of the jar
const vibratorRadius = 0.2; // Radius of the vibrator
const vibratorHeight = 0.1; // Height of the vibrator

const vibratorGeometry = new THREE.CylinderGeometry(
  0,
  vibratorRadius,
  vibratorHeight,
  32
);
const vibratorMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00ff00, // Green color for vibrators
});
const vibrator1 = new THREE.Mesh(vibratorGeometry, vibratorMaterial);
const vibrator2 = new THREE.Mesh(vibratorGeometry, vibratorMaterial);

vibrator1.position.set(
  -jarInnerRadius / 2,
  -jarHeight / 2 + vibratorHeight / 2,
  0
);
vibrator2.position.set(
  jarInnerRadius / 2,
  -jarHeight / 2 + vibratorHeight / 2,
  0
);

scene.add(vibrator1);
scene.add(vibrator2);

// Create physics bodies for the vibrators
const vibratorShape = new Cylinder(0, vibratorRadius, vibratorHeight, 32);
const vibrator1Body = new Body({
  mass: 0, // Static
  position: new Vec3(
    -jarInnerRadius / 2,
    -jarHeight / 2 + vibratorHeight / 2,
    0
  ),
});
const vibrator2Body = new Body({
  mass: 0, // Static
  position: new Vec3(
    jarInnerRadius / 2,
    -jarHeight / 2 + vibratorHeight / 2,
    0
  ),
});
world.addBody(vibrator1Body);
world.addBody(vibrator2Body);

// Lock the vibrators to the jar bottom
const lockConstraint1 = new LockConstraint(jarBottomBody, vibrator1Body);
const lockConstraint2 = new LockConstraint(jarBottomBody, vibrator2Body);
world.addConstraint(lockConstraint1);
world.addConstraint(lockConstraint2);

// OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth the movement
controls.dampingFactor = 0.05;

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  liquidMaterial.uniforms.resolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
});

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  // Sync jar walls
  jarWalls.position.copy(jarWallBody.position);
  jarWalls.quaternion.copy(jarWallBody.quaternion);

  // Sync jar bottom
  jarBottom.position.copy(jarBottomBody.position);
  jarBottom.quaternion.copy(jarBottomBody.quaternion);

  // Sync liquid
  // liquid.position.copy(jarWallBody.position);
  //liquid.quaternion.copy(jarWallBody.quaternion);

  // Sync balls with physics bodies
  balls.forEach((ball, index) => {
    ball.position.copy(ballBodies[index].position);
    ball.quaternion.copy(ballBodies[index].quaternion);

    // Trigger wave effect on collision with the liquid
    if (ballBodies[index].position.y < liquid.position.y) {
      liquidMaterial.uniforms.time.value += 0.1; // Update the shader to create wave effect
    }
  });

  // Sync vibrators
  vibrator1.position.copy(vibrator1Body.position);
  vibrator1.quaternion.copy(vibrator1Body.quaternion);

  vibrator2.position.copy(vibrator2Body.position);
  vibrator2.quaternion.copy(vibrator2Body.quaternion);

  // Update controls
  controls.update();

  // Step physics world
  world.step(1 / 60);

  // Render the scene
  renderer.render(scene, camera);
}

animate();
