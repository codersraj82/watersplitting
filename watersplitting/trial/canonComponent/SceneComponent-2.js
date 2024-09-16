import * as THREE from "three";
import * as CANNON from "cannon-es";
import CylinderComponent from "../../exxperiment-setup/CylinderComponent"; // Adjust the path as needed

export default class SceneComponent {
  constructor(scene, camera, world, renderer) {
    if (!(world instanceof CANNON.World)) {
      throw new Error("World must be an instance of CANNON.World");
    }
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.renderer = renderer;
    this.objects = [];
    this.bubbles = [];

    this.init();
  }

  init() {
    this.createJar();
    this.createCover();
    this.createElectrodes();
    this.createCylinder(); // Calls method to create cylinder
    this.setupPhysics();
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
  }

  setupPhysics() {
    // Add physics setup if necessary
  }

  updatePhysics() {
    // Update physics step
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.world.step(1 / 60);
    this.updatePhysics();

    this.renderer.render(this.scene, this.camera);
  }
}
