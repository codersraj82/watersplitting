// Import necessary modules
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createKnob } from "./Knob.js";
import { createBananaFemaleConnector } from "./BananaFemaleConnector.js";

class PSU {
  constructor(
    scene,
    camera,
    renderer,
    size = { width: 10, height: 2, depth: 6 },
    position = { x: 0, y: 0, z: -3 }
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.size = size;
    this.position = position;
    this.font = null;
    this.voltageLabel = null;
    this.currentLabel = null;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.init();
  }

  // Initialize the scene, camera, and PSU components
  init() {
    this.setupScene();
    this.loadFontAndSetup();
    this.setupLighting();
    this.setupControls();
  }

  // Set up basic scene elements
  setupScene() {
    // Create a rectangular box (PSU)
    const psuGeometry = new THREE.BoxGeometry(10, 2, 6);
    const psuMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
    const psu = new THREE.Mesh(psuGeometry, psuMaterial);
    psu.castShadow = true;
    psu.position.set(0, 0, -3);
    psu.rotation.y = Math.PI / 2;
    psu.rotation.y -= Math.PI / 2;
    this.scene.add(psu);

    // Create a rectangular display component with padding
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
    display.position.set(0, 0, 0);
    display.rotation.set(0, Math.PI, 0);
    this.scene.add(display);

    // Update the display values initially
    this.updateDisplay(5.0, 1.0);

    // Create banana female connector rings
    this.setupConnectors(displayDepth);
  }

  // Set up banana connectors
  setupConnectors(displayDepth) {
    const ringOffsetX = -4;
    const ringPositionZ = displayDepth / 2 + 0.01;

    const redRing = createBananaFemaleConnector(
      new THREE.Vector3(ringOffsetX, 0.3, ringPositionZ),
      0.1,
      0.05,
      0xff0000
    );
    const blueRing = createBananaFemaleConnector(
      new THREE.Vector3(ringOffsetX, -0.3, ringPositionZ),
      0.1,
      0.05,
      0x0000ff
    );

    redRing.rotation.x = Math.PI;
    blueRing.rotation.x = Math.PI;

    this.scene.add(redRing);
    this.scene.add(blueRing);
  }

  // Load font and set up knobs after font loading
  loadFontAndSetup() {
    const loader = new FontLoader();
    loader.load("/fonts/helvetiker_bold.typeface.json", (loadedFont) => {
      this.font = loadedFont;
      this.updateDisplay(12.34, 5.67);
      this.setupKnobs();
    });
  }

  // Function to create and update display text
  createLabel(text, position, baseSize = 0.4, color = 0xffffff) {
    const textGeometry = new TextGeometry(text, {
      font: this.font,
      size: baseSize,
      height: 0.05,
      curveSegments: 12,
    });
    textGeometry.computeBoundingBox();
    const textMaterial = new THREE.MeshStandardMaterial({ color });
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

    this.scene.add(label);
    return label;
  }

  // Function to update the display values
  updateDisplay(voltage, current) {
    if (this.font) {
      const voltageText = `${voltage.toFixed(2)} V`;
      const currentText = `${current.toFixed(2)} A`;

      if (this.voltageLabel) this.scene.remove(this.voltageLabel);
      if (this.currentLabel) this.scene.remove(this.currentLabel);

      this.voltageLabel = this.createLabel(
        voltageText,
        { x: 0, y: 0.25, z: 0.11 },
        0.4,
        0x00ff00
      );
      this.currentLabel = this.createLabel(
        currentText,
        { x: 0, y: -0.25, z: 0.11 },
        0.4,
        0xff0000
      );
    }
  }

  // Function to setup knobs
  setupKnobs() {
    const displayDepth = 0.2;
    const displayWidth = 6;
    const knobSize = 0.3;

    const voltageKnob = createKnob(
      new THREE.Vector3(displayWidth / 1.5, 0.6, displayDepth / 2 + 0.05),
      "V",
      this.font,
      knobSize
    );
    const currentKnob = createKnob(
      new THREE.Vector3(displayWidth / 1.5, -0.6, displayDepth / 2 + 0.05),
      "A",
      this.font,
      knobSize
    );

    this.scene.add(voltageKnob);
    this.scene.add(currentKnob);

    // Add raycasting for knob interaction
    this.setupKnobInteraction(voltageKnob, currentKnob);
  }

  // Handle interaction with knobs
  setupKnobInteraction(voltageKnob, currentKnob) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let voltageValue = 0;
    let currentValue = 0;

    window.addEventListener("mousedown", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects([voltageKnob, currentKnob]);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (clickedObject === voltageKnob) {
          voltageValue = (voltageValue + 1) % 13;
          this.updateDisplay(voltageValue, currentValue);
        } else if (clickedObject === currentKnob) {
          currentValue = (currentValue + 1) % 6;
          this.updateDisplay(voltageValue, currentValue);
        }
      }
    });
  }

  // Setup basic lighting
  setupLighting() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
    this.scene.add(ambientLight);
  }

  // Setup orbit controls
  setupControls() {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.update();
  }

  // Animation loop
  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
}

export { PSU };
