import * as THREE from "three";
import * as CANNON from "cannon-es";

export default class SceneComponent {
  constructor(scene, camera, world, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.world = world; // Ensure this is an instance of CANNON.World
    this.renderer = renderer; // Added renderer as a parameter
    this.objects = [];
    this.bubbles = [];

    this.init();
  }

  init() {
    this.createJar();
    this.createCover();
    this.createElectrodes();
    this.createCylinder(); // Updated method name
    this.setupPhysics();
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
    // Replaces the octahedron with a cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.5,
    });

    this.cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    this.cylinder.position.set(0, -2.5, 0);
    this.cylinder.castShadow = true;
    this.cylinder.receiveShadow = true;

    this.scene.add(this.cylinder);
  }

  setupPhysics() {
    if (!(this.world instanceof CANNON.World)) {
      console.error("World is not an instance of CANNON.World");
      return;
    }

    // Set up physics for jar, cover, and electrodes
    const jarShape = new CANNON.Cylinder(3, 3, 5, 32);
    this.jarBody = new CANNON.Body({
      position: new CANNON.Vec3(0, 0, 0),
      mass: 1,
    });
    this.jarBody.addShape(jarShape);
    this.world.addBody(this.jarBody);

    const coverShape = new CANNON.Cylinder(3.2, 3.2, 0.5, 32);
    this.coverBody = new CANNON.Body({
      position: new CANNON.Vec3(0, 2.75, 0),
      mass: 1,
    });
    this.coverBody.addShape(coverShape);
    this.world.addBody(this.coverBody);

    // Use Box instead of Cylinder for electrodes for simplicity
    const electrodeShape = new CANNON.Box(new CANNON.Vec3(0.1, 3, 1));

    this.negativePlateBody = new CANNON.Body({
      position: new CANNON.Vec3(-1.5, 1, 0),
      mass: 1,
    });
    this.negativePlateBody.addShape(electrodeShape);
    this.world.addBody(this.negativePlateBody);

    this.positivePlateBody = new CANNON.Body({
      position: new CANNON.Vec3(1.5, 1, 0),
      mass: 1,
    });
    this.positivePlateBody.addShape(electrodeShape);
    this.world.addBody(this.positivePlateBody);

    // Add physics for cylinder
    const cylinderShape = new CANNON.Cylinder(1, 1, 2, 32);
    this.cylinderBody = new CANNON.Body({
      position: new CANNON.Vec3(0, -2.5, 0),
      mass: 1,
    });
    this.cylinderBody.addShape(cylinderShape);
    this.world.addBody(this.cylinderBody);
  }

  updatePhysics() {
    this.jar.position.copy(this.jarBody.position);
    this.jar.rotation.copy(this.jarBody.rotation);

    this.cover.position.copy(this.coverBody.position);
    this.cover.rotation.copy(this.coverBody.rotation);

    this.negativePlate.position.copy(this.negativePlateBody.position);
    this.negativePlate.rotation.copy(this.negativePlateBody.rotation);

    this.positivePlate.position.copy(this.positivePlateBody.position);
    this.positivePlate.rotation.copy(this.positivePlateBody.rotation);

    this.cylinder.position.copy(this.cylinderBody.position);
    this.cylinder.rotation.copy(this.cylinderBody.rotation);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // No rotation for cylinder
    // this.cylinder.rotation.x += 0.01;
    // this.cylinder.rotation.z += 0.01;

    this.world.step(1 / 60);
    this.updatePhysics();

    this.renderer.render(this.scene, this.camera);
  }
}
