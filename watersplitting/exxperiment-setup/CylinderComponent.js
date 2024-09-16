// Import necessary modules
import * as THREE from "three";
import * as CANNON from "cannon-es";

export default class CylinderComponent {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

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

    // Create cylinders with reduced size
    this.createCylinders();

    // Start animation loop
    this.animate();
  }

  createCylinders() {
    // Create the cylinder geometry with reduced size
    const cylinderGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 32); // Adjusted dimensions

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

    // Position the cylinders so that their bottoms are attached
    this.cylinderMesh1.position.set(0, 0.25, 0); // Centered at 0.25 units above origin
    this.cylinderMesh2.position.set(0, -0.25, 0); // Centered at -0.25 units below origin

    // Group both cylinders into one object
    this.cylinderGroup = new THREE.Group();
    this.cylinderGroup.add(this.cylinderMesh1);
    this.cylinderGroup.add(this.cylinderMesh2);

    // Rotate the group 90 degrees along the z-axis
    this.cylinderGroup.rotation.z = Math.PI / 2;

    // Place the cylinder group inside the jar at the bottom
    this.cylinderGroup.position.set(0, -0.7, 0); // Adjusted position to fit in the jar

    // Add the cylinder group to the scene
    this.scene.add(this.cylinderGroup);

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
    this.renderer.render(this.scene, this.camera);
  }
}
