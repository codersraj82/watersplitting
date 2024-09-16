import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // Ensure the path is correct

export default class CylinderComponent {
  constructor(container) {
    this.container = container;
    this.init();
  }

  init() {
    // Set up Cannon.js world
    this.world = new CANNON.World();
    this.world.gravity.set(0, 0, 0); // Gravity is zero to avoid falling

    // Create Cannon.js ground plane
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({ mass: 0 });
    this.groundBody.addShape(groundShape);
    this.groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.world.addBody(this.groundBody);

    // Set up Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Ensure only the renderer's canvas is added
    this.container.innerHTML = ""; // Clear any previous content
    this.container.appendChild(this.renderer.domElement);

    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 15;

    // Create cylinders
    this.createCylinders();

    // Adjust camera position
    this.camera.position.z = 7;

    // Start animation loop
    this.animate();
  }

  createCylinders() {
    // Create the cylinder geometry
    const cylinderGeometry = new THREE.CylinderGeometry(0, 1, 2, 32); // Top radius 0, bottom radius 1, height 2

    // Create white plastic material
    const plasticMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White color
      metalness: 0.1, // Low metalness for plastic
      roughness: 0.5, // Moderate roughness for plastic
      emissive: 0xffffff, // Optional: add slight emissive glow
      emissiveIntensity: 0.1, // Adjust the intensity for glow
    });

    // Create the first cylinder
    this.cylinderMesh1 = new THREE.Mesh(cylinderGeometry, plasticMaterial);

    // Create the second cylinder
    this.cylinderMesh2 = new THREE.Mesh(cylinderGeometry, plasticMaterial);

    // Position the cylinders so that their bottoms are connected
    this.cylinderMesh1.position.set(0, 1, 0);
    this.cylinderMesh2.position.set(0, -1, 0);
    this.cylinderMesh2.rotation.z = Math.PI; // Rotate the second cylinder to point opposite

    // Group both cylinders into one object
    this.cylinderGroup = new THREE.Group();
    this.cylinderGroup.add(this.cylinderMesh1);
    this.cylinderGroup.add(this.cylinderMesh2);

    // Add the group to the scene
    this.scene.add(this.cylinderGroup);

    // Rotate the group 90 degrees along the z-axis
    this.cylinderGroup.rotation.z = Math.PI / 2;

    // Place the cylinder group above the ground
    this.cylinderGroup.position.set(0, 4, 0);

    // Add a directional light to illuminate the cylinders
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    this.scene.add(light);

    // Add an ambient light to soften shadows
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    this.scene.add(ambientLight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Step physics world
    this.world.step(1 / 60);

    // Update rotation and vibration
    const time = Date.now() * 0.001; // Time in seconds
    this.cylinderGroup.rotation.y += 0.01; // Rotate around the y-axis
    this.cylinderGroup.position.x = Math.sin(time) * 2; // Vibrate along the x-axis

    // Update controls and render
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
