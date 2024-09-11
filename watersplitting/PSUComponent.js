// Import necessary modules
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createKnob } from "./Knob.js";
import { createBananaFemaleConnector } from "./BananaFemaleConnector.js";

class PSUComponent {
  constructor(
    container = document.body,
    voltage = 12.34,
    current = 5.67,
    position = new THREE.Vector3(0, 0, 0),
    scale = 1
  ) {
    this.container = container;
    this.voltage = voltage;
    this.current = current;
    this.font = null;
    this.voltageLabel = null;
    this.currentLabel = null;
    this.position = position;
    this.scale = scale;

    this.init();
  }

  init() {
    // Scene, Camera, Renderer setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    this.renderer.shadowMap.enabled = true;

    // Add OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.update();

    // Create the PSU box
    this.psuGroup = new THREE.Group();
    const psuGeometry = new THREE.BoxGeometry(10, 2, 6);
    const psuMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
    const psu = new THREE.Mesh(psuGeometry, psuMaterial);
    psu.castShadow = true;
    psu.position.set(0, 0, 0);
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
    this.loader = new FontLoader();
    this.loader.load("/fonts/helvetiker_bold.typeface.json", (loadedFont) => {
      this.font = loadedFont;
      this.updateDisplay(this.voltage, this.current);
      this.setupKnobs();
    });

    // Lighting setup
    this.setupLighting();

    // Camera position
    this.camera.position.set(0, 5, 15);

    // Handle mouse events
    window.addEventListener("mousedown", (event) => this.onMouseDown(event));

    this.animate();
  }

  setupLighting() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
  }

  createLabel(text, position, baseSize = 0.4, color = 0xffffff) {
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

      if (this.voltageLabel) this.psuGroup.remove(this.voltageLabel);
      if (this.currentLabel) this.psuGroup.remove(this.currentLabel);

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

  setupKnobs() {
    if (!this.font) return;

    const knobSize = 0.3;

    this.voltageKnob = createKnob(
      new THREE.Vector3(3.5, 0.6, 3.05),
      "V",
      this.font,
      knobSize
    );

    this.currentKnob = createKnob(
      new THREE.Vector3(3.5, -0.6, 3.05),
      "A",
      this.font,
      knobSize
    );

    this.psuGroup.add(this.voltageKnob);
    this.psuGroup.add(this.currentKnob);

    // Create connectors
    const redRing = createBananaFemaleConnector(
      new THREE.Vector3(-4, 0.3, 3.05),
      0.1,
      0.05,
      0xff0000
    );
    const blueRing = createBananaFemaleConnector(
      new THREE.Vector3(-4, -0.3, 3.05),
      0.1,
      0.05,
      0x0000ff
    );

    redRing.rotation.x = Math.PI;
    blueRing.rotation.x = Math.PI;

    this.psuGroup.add(redRing);
    this.psuGroup.add(blueRing);
  }

  onMouseDown(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects([
      this.voltageKnob,
      this.currentKnob,
    ]);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (clickedObject === this.voltageKnob) {
        this.voltage = (this.voltage + 1) % 13; // Cycle voltage from 0 to 12
        console.log(`Voltage Knob Clicked: New Voltage = ${this.voltage}`); // Debugging
        this.updateDisplay(this.voltage, this.current);
      } else if (clickedObject === this.currentKnob) {
        this.current = (this.current + 1) % 6; // Cycle current from 0 to 5
        console.log(`Current Knob Clicked: New Current = ${this.current}`); // Debugging
        this.updateDisplay(this.voltage, this.current);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

export default PSUComponent;
