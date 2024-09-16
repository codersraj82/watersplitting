import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"; // Import OrbitControls
import CylinderComponent from "../../exxperiment-setup/CylinderComponent"; // Adjust the path as needed

export default class SceneComponent {
  constructor(initialPositions = {}) {
    this.objects = [];
    this.bubbles = [];
    this.initialPositions = initialPositions;
    this.init();
  }

  init() {
    // Set up Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Set up camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Set up lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    light.castShadow = true;
    this.scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040); // soft ambient light
    this.scene.add(ambientLight);

    // Create and add the jar, cover, electrodes, and cylinder
    this.createJar();
    this.createCover();
    this.createElectrodes();
    this.createCylinder();

    // Create Cannon.js physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0); // Earth's gravity
    this.world.solver.iterations = 5;
    this.world.defaultContactMaterial.friction = 0.05;
    this.world.broadphase = new CANNON.NaiveBroadphase();

    // Set up physics
    this.setupPhysics();

    // Add OrbitControls for better camera movement
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); // Correct usage of OrbitControls
    this.controls.update();

    // Start the animation loop
    this.animate();
  }

  createJar() {
    const jarGeometry = new THREE.CylinderGeometry(3, 3, 5, 32, 1, true);
    const bottomGeometry = new THREE.CircleGeometry(3, 32);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 1,
      opacity: 0.3,
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
      opacity: 0.6,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0,
      reflectivity: 0.9,
      refractionRatio: 0.9,
    });

    this.jar = new THREE.Mesh(jarGeometry, glassMaterial);
    this.bottom = new THREE.Mesh(bottomGeometry, thickGlassMaterial);

    this.jar.castShadow = true;
    this.jar.receiveShadow = true;
    this.bottom.rotation.x = -Math.PI / 2;
    this.bottom.position.y = -2.5;

    // Set initial position if provided
    if (this.initialPositions.jar) {
      this.jar.position.set(...this.initialPositions.jar);
    }

    if (this.initialPositions.bottom) {
      this.bottom.position.set(...this.initialPositions.bottom);
    }

    this.scene.add(this.jar);
    this.scene.add(this.bottom);
  }

  createCover() {
    const coverGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.5, 32);
    const coverMaterial = new THREE.MeshBasicMaterial({ color: 0xa9a9a9 });
    this.cover = new THREE.Mesh(coverGeometry, coverMaterial);
    this.cover.position.y = 2.75;
    this.cover.castShadow = true;
    this.cover.receiveShadow = true;

    const slotWidth = 0.2;
    const slotHeight = 1;
    const slotDepth = 0.5;
    const slotGeometry = new THREE.BoxGeometry(
      slotWidth,
      slotHeight,
      slotDepth
    );
    const slotMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const slot1 = new THREE.Mesh(slotGeometry, slotMaterial);
    slot1.position.set(-1.5, 1, 0);
    this.cover.add(slot1);

    const slot2 = new THREE.Mesh(slotGeometry, slotMaterial);
    slot2.position.set(1.5, 1, 0);
    this.cover.add(slot2);

    // Set initial position if provided
    if (this.initialPositions.cover) {
      this.cover.position.set(...this.initialPositions.cover);
    }

    this.scene.add(this.cover);
  }

  createElectrodes() {
    const electrodeMaterial = new THREE.MeshStandardMaterial({
      metalness: 1,
      roughness: 0.3,
    });

    const negativePlateGeometry = new THREE.BoxGeometry(0.1, 6, 2);
    const negativePlateMaterial = new THREE.MeshStandardMaterial({
      color: 0x002868,
      ...electrodeMaterial,
    });

    this.negativePlate = new THREE.Mesh(
      negativePlateGeometry,
      negativePlateMaterial
    );
    this.negativePlate.position.set(-1.5, 1, 0);
    this.negativePlate.castShadow = true;
    this.negativePlate.receiveShadow = true;

    const positivePlateGeometry = new THREE.BoxGeometry(0.1, 6, 2);
    const positivePlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xbf0a30,
      ...electrodeMaterial,
    });

    this.positivePlate = new THREE.Mesh(
      positivePlateGeometry,
      positivePlateMaterial
    );
    this.positivePlate.position.set(1.5, 1, 0);
    this.positivePlate.castShadow = true;
    this.positivePlate.receiveShadow = true;

    // Set initial position if provided
    if (this.initialPositions.negativePlate) {
      this.negativePlate.position.set(...this.initialPositions.negativePlate);
    }

    if (this.initialPositions.positivePlate) {
      this.positivePlate.position.set(...this.initialPositions.positivePlate);
    }

    this.scene.add(this.negativePlate);
    this.scene.add(this.positivePlate);
  }

  createCylinder() {
    // Create instance of CylinderComponent
    this.cylinderComponent = new CylinderComponent();

    // Check if CylinderComponent returns meshes
    if (
      !this.cylinderComponent.cylinderMesh1 ||
      !this.cylinderComponent.cylinderMesh2
    ) {
      console.error("CylinderComponent did not return valid meshes.");
      return;
    }

    // Add cylinderComponent's scene objects to this scene
    this.scene.add(this.cylinderComponent.cylinderMesh1);
    this.scene.add(this.cylinderComponent.cylinderMesh2);

    // Set initial position if provided
    if (this.initialPositions.cylinderMesh1) {
      this.cylinderComponent.cylinderMesh1.position.set(
        ...this.initialPositions.cylinderMesh1
      );
    }

    if (this.initialPositions.cylinderMesh2) {
      this.cylinderComponent.cylinderMesh2.position.set(
        ...this.initialPositions.cylinderMesh2
      );
    }
  }

  setupPhysics() {
    // Add any necessary physics setup here
  }

  updatePhysics() {
    // Update physics step if necessary
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.world.step(1 / 60);
    this.updatePhysics();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // Method to dynamically update object positions
  updatePosition(objectName, position) {
    if (this[objectName]) {
      this[objectName].position.set(...position);
    } else {
      console.error(`Object "${objectName}" not found.`);
    }
  }
}
