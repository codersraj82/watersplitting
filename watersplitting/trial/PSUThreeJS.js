import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { createKnob } from "./Knob.js";
import { createBananaFemaleConnector } from "./BananaFemaleConnector.js";

class PSUComponent extends THREE.Object3D {
  constructor(
    voltage = 12.34,
    current = 5.67,
    position = new THREE.Vector3(0, 0, 0),
    scale = 1
  ) {
    super(); // Call the Object3D constructor

    this.voltage = voltage;
    this.current = current;
    this.font = null;
    this.voltageLabel = null;
    this.currentLabel = null;
    this.position.copy(position);
    this.scale.set(scale, scale, scale);
    this.knobMap = new Map(); // Use Map for knob lookups

    this.init();
  }

  async init() {
    // Create the PSU box
    const psuGeometry = new THREE.BoxGeometry(10, 2, 6);
    const psuMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
    const psu = new THREE.Mesh(psuGeometry, psuMaterial);
    psu.castShadow = true;
    this.add(psu); // Add to Object3D (this)

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
    this.add(display); // Add to Object3D (this)

    // Load Font and setup knobs
    const loader = new FontLoader();
    loader.load(
      "./helvetiker_bold.typeface.json",
      async (loadedFont) => {
        this.font = loadedFont;
        this.updateDisplay(this.voltage, this.current);
        this.setupKnobs();
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the font:", error);
      }
    );

    // Setup lighting if needed (you can skip this if lighting is already in the scene)
    this.setupLighting();

    // Handle mouse events
    window.addEventListener("mousedown", (event) => this.onMouseDown(event));

    // Start animation loop (if necessary)
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate()); // Schedule the next frame
  }

  setupLighting() {
    // If lighting is not added to the scene, add it to this component
    if (!this.getObjectByName("ambientLight")) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      this.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0x404040);
      ambientLight.name = "ambientLight";
      this.add(ambientLight);
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

    this.add(label); // Add to Object3D (this)
    return label;
  }

  updateDisplay(voltage, current) {
    if (this.font) {
      const voltageText = `${voltage.toFixed(2)} V`;
      const currentText = `${current.toFixed(2)} A`;

      // Remove previous labels if they exist
      if (this.voltageLabel) this.remove(this.voltageLabel);
      if (this.currentLabel) this.remove(this.currentLabel);

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
    console.log("Setting up knobs...");
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
      this.add(this.voltageKnob);
      this.add(this.currentKnob);

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

      this.add(this.redRing);
      this.add(this.blueRing);
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
          this.updateDisplay(this.voltage, this.current);
        } else if (knobType === "current") {
          this.current = (this.current + 1) % 6; // Cycle current from 0 to 5
          this.updateDisplay(this.voltage, this.current);
        }
      }
    }
  }
}

export default PSUComponent;
