// Import necessary modules
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createKnob } from "./Knob.js";
import { createBananaFemaleConnector } from "./BananaFemaleConnector.js";

class PSUComponent {
  constructor(
    scene,
    camera,
    container = document.body,
    voltage = 12.34,
    current = 5.67,
    position = new THREE.Vector3(0, 0, 0),
    scale = 1
  ) {
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    this.voltage = voltage;
    this.current = current;
    this.font = null;
    this.voltageLabel = null;
    this.currentLabel = null;
    this.position = position;
    this.scale = scale;
    this.knobMap = new Map(); // Use Map for knob lookups
    this.init();
  }

  init() {
    // Create the PSU box
    this.psuGroup = new THREE.Group();
    const psuGeometry = new THREE.BoxGeometry(10, 2, 6);
    const psuMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
    const psu = new THREE.Mesh(psuGeometry, psuMaterial);
    psu.castShadow = true;
    this.psuGroup.add(psu);

    // Create the display
    const displayWidth = 6;
    const displayHeight = 1.5;
    const displayDepth = 0.2;
    const displayGeometry = new THREE.BoxGeometry(
      displayWidth,
      displayHeight,
      displayDepth
    );
    const displayMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const display = new THREE.Mesh(displayGeometry, displayMaterial);
    display.position.set(0, 0, 3 - displayDepth / 2);
    this.psuGroup.add(display);

    // Position and scale the PSU
    this.psuGroup.position.copy(this.position);
    this.psuGroup.scale.set(this.scale, this.scale, this.scale);
    this.scene.add(this.psuGroup);

    // Load Font and setup knobs
    const loader = new FontLoader();
    loader.load(
      "./helvetiker_bold.typeface.json",
      (loadedFont) => {
        this.font = loadedFont;
        this.updateDisplay(this.voltage, this.current);
        this.setupKnobs();
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the font:", error);
      }
    );

    // Setup lighting in main scene
    this.setupLighting();

    // Handle mouse events
    window.addEventListener("mousedown", (event) => this.onMouseDown(event));

    // Start animation loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate()); // Schedule the next frame

    // Update controls (if using OrbitControls)
    if (this.controls) {
      this.controls.update();
    }
  }

  setupLighting() {
    if (!this.scene.getObjectByName("ambientLight")) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      this.scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0x404040);
      ambientLight.name = "ambientLight";
      this.scene.add(ambientLight);
    }
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

    this.psuGroup.add(label);
    return label;
  }

  updateDisplay(voltage, current) {
    if (this.font) {
      const voltageText = `${voltage.toFixed(2)} V`;
      const currentText = `${current.toFixed(2)} A`;

      // Remove previous labels if they exist
      if (this.voltageLabel) this.psuGroup.remove(this.voltageLabel);
      if (this.currentLabel) this.psuGroup.remove(this.currentLabel);

      // Create new voltage and current labels
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
    if (!this.font) return;

    const knobSize = 0.3;

    try {
      // Create knobs
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

      // Add knobs to the PSU group
      this.psuGroup.add(this.voltageKnob);
      this.psuGroup.add(this.currentKnob);

      // Map knobs for quick lookup
      this.knobMap.set(this.voltageKnob, "voltage");
      this.knobMap.set(this.currentKnob, "current");

      // Create connectors
      this.redRing = createBananaFemaleConnector(
        new THREE.Vector3(-4, 0.3, 3.05),
        0.1,
        0.05,
        0xff0000
      );
      this.blueRing = createBananaFemaleConnector(
        new THREE.Vector3(-4, -0.3, 3.05),
        0.1,
        0.05,
        0x0000ff
      );

      this.redRing.rotation.x = Math.PI;
      this.blueRing.rotation.x = Math.PI;

      this.psuGroup.add(this.redRing);
      this.psuGroup.add(this.blueRing);
    } catch (error) {
      console.error("Error setting up knobs:", error);
    }
  }

  getRingPositions() {
    // Ensure the rings are set up before accessing
    if (this.redRing && this.blueRing) {
      return {
        redRingPosition: this.redRing.position.clone(),
        blueRingPosition: this.blueRing.position.clone(),
      };
    } else {
      console.warn("Rings are not set up yet.");
      return null;
    }
  }

  onMouseDown(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // Check for intersections with the knobs
    const intersects = raycaster.intersectObjects([...this.knobMap.keys()]);

    console.log("Intersects:", intersects); // Log intersections for debugging

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (this.knobMap.has(clickedObject)) {
        const knobType = this.knobMap.get(clickedObject);

        if (knobType === "voltage") {
          this.voltage = (this.voltage + 1) % 13; // Cycle voltage from 0 to 12
          console.log(`Voltage Knob Clicked: New Voltage = ${this.voltage}`);
          this.updateDisplay(this.voltage, this.current);
        } else if (knobType === "current") {
          this.current = (this.current + 1) % 6; // Cycle current from 0 to 5
          console.log(`Current Knob Clicked: New Current = ${this.current}`);
          this.updateDisplay(this.voltage, this.current);
        }
      } else {
        console.log("Clicked object is not a knob");
      }
    } else {
      console.log("No intersections detected");
    }
  }
}

export default PSUComponent;
