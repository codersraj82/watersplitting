import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { createKnob } from "./Knob.js";
//import { createBananaFemaleConnector } from "./BananaFemaleConnector.js";
import * as CANNON from "cannon-es";

class PSUComponent extends THREE.Object3D {
  constructor(
    world, // Cannon.js physics world
    camera, // PerspectiveCamera or OrthographicCamera
    voltage = 12.34,
    current = 5.67,
    position = new THREE.Vector3(0, 0, 0),
    scale = 1
  ) {
    super();

    this.world = world;
    this.camera = camera; // Store the camera reference
    this.voltage = Number(voltage) || 0;
    this.current = Number(current) || 0;
    this.position.copy(position);
    this.scale.set(scale, scale, scale);
    this.knobMap = new Map();

    this.init();
  }

  async init() {
    // Create the PSU box in Three.js
    const psuGeometry = new THREE.BoxGeometry(10, 2, 6);
    const psuMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
    const psu = new THREE.Mesh(psuGeometry, psuMaterial);
    psu.castShadow = true;
    this.add(psu);

    // Create the PSU box in Cannon.js (physics body)
    const shape = new CANNON.Box(new CANNON.Vec3(5, 1, 3)); // Half extents
    this.psuBody = new CANNON.Body({
      mass: 1, // You can adjust the mass
      position: new CANNON.Vec3(
        this.position.x,
        this.position.y,
        this.position.z
      ),
    });
    this.psuBody.addShape(shape);
    this.world.addBody(this.psuBody);

    // Create the display in Three.js
    const displayGeometry = new THREE.BoxGeometry(6, 1.5, 0.2);
    const displayMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const display = new THREE.Mesh(displayGeometry, displayMaterial);
    display.position.set(0, 0, 3 - 0.1);
    this.add(display);

    // Load Font and setup knobs
    const loader = new FontLoader();
    loader.load(
      "./helvetiker_bold.typeface.json",
      async (loadedFont) => {
        this.font = loadedFont;
        this.updateDisplay(this.voltage, this.current);
        await this.setupKnobs(); // Ensure knobs are set up before using them
        this.updatePhysics(); // Update positions after setup (previously `this.update()`)
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the font:", error);
      }
    );

    window.addEventListener("mousedown", (event) => this.onMouseDown(event));
  }

  setupLighting(scene) {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
  }

  createLabel(text, position, baseSize = 0.4, color = 0xffffff) {
    if (!this.font) return;

    const textGeometry = new TextGeometry(text, {
      font: this.font,
      size: baseSize,
      height: 0.05,
      curveSegments: 12,
    });
    textGeometry.computeBoundingBox();
    const textMaterial = new THREE.MeshStandardMaterial({ color: color });
    const label = new THREE.Mesh(textGeometry, textMaterial);

    const bbox = textGeometry.boundingBox;
    if (bbox) {
      const width = bbox.max.x - bbox.min.x;
      const height = bbox.max.y - bbox.min.y;
      label.position.set(
        position.x - width / 2,
        position.y - height / 2,
        position.z
      );
    }

    this.add(label);
    return label;
  }

  updateDisplay(voltage, current) {
    if (this.font) {
      // Ensure voltage and current are numbers
      const voltageValue = typeof voltage === "number" ? voltage : 0;
      const currentValue = typeof current === "number" ? current : 0;

      const voltageText = `${voltageValue.toFixed(2)} V`;
      const currentText = `${currentValue.toFixed(2)} A`;

      if (this.voltageLabel) this.remove(this.voltageLabel);
      if (this.currentLabel) this.remove(this.currentLabel);

      this.voltageLabel = this.createLabel(
        voltageText,
        { x: 0, y: 0.25, z: 3.01 },
        0.4,
        0x00ff00
      );
      this.currentLabel = this.createLabel(
        currentText,
        { x: 0, y: -0.25, z: 3.01 },
        0.4,
        0xff0000
      );
    }
  }

  async setupKnobs() {
    const knobSize = 0.3;

    try {
      this.voltageKnob = await createKnob(
        new THREE.Vector3(3.5, 0.6, 3.05),
        "V",
        knobSize
      );
      this.currentKnob = await createKnob(
        new THREE.Vector3(3.5, -0.6, 3.05),
        "A",
        knobSize
      );

      this.add(this.voltageKnob);
      this.add(this.currentKnob);

      this.knobMap.set(this.voltageKnob, "voltage");
      this.knobMap.set(this.currentKnob, "current");
    } catch (error) {
      console.error("Error setting up knobs:", error);
    }
  }

  updatePhysics() {
    // Sync Three.js position and rotation with Cannon.js body
    this.position.copy(this.psuBody.position);
    this.quaternion.copy(this.psuBody.quaternion);
  }

  onMouseDown(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera); // Use the camera passed in constructor

    const intersects = raycaster.intersectObjects([...this.knobMap.keys()]);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (this.knobMap.has(clickedObject)) {
        const knobType = this.knobMap.get(clickedObject);

        if (knobType === "voltage") {
          this.voltage = (this.voltage + 1) % 13;
          this.updateDisplay(this.voltage, this.current);
        } else if (knobType === "current") {
          this.current = (this.current + 1) % 6;
          this.updateDisplay(this.voltage, this.current);
        }
      }
    }
  }
}

export default PSUComponent;
