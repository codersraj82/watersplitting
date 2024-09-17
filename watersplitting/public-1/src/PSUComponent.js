import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { createKnob } from "./Knob.js";
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
    const psuMaterial = new THREE.MeshStandardMaterial({ color: 0x00a36c });
    this.psu = new THREE.Mesh(psuGeometry, psuMaterial);
    this.psu.castShadow = true;
    this.add(this.psu);

    // Create the PSU box in Cannon.js (physics body)
    const shape = new CANNON.Box(new CANNON.Vec3(5, 1, 3)); // Half extents
    this.psuBody = new CANNON.Body({
      mass: 0, // You can adjust the mass
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
    display.position.set(0, 0, 2.9); // Adjusted position for display
    this.psu.add(display);

    // Load Font and setup knobs and sockets
    const loader = new FontLoader();
    loader.load(
      "/fonts/helvetiker_bold.typeface.json",
      async (loadedFont) => {
        this.font = loadedFont;
        this.updateDisplay(this.voltage, this.current);
        await this.setupKnobs(); // Ensure knobs are set up before using them
        await this.setupSockets(); // Ensure sockets are set up
        this.updatePhysics(); // Update positions after setup
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

    this.psu.add(label);
    return label;
  }

  updateDisplay(voltage, current) {
    if (this.font) {
      // Ensure voltage and current are numbers
      const voltageValue = typeof voltage === "number" ? voltage : 0;
      const currentValue = typeof current === "number" ? current : 0;

      const voltageText = `${voltageValue.toFixed(2)} V`;
      const currentText = `${currentValue.toFixed(2)} A`;

      if (this.voltageLabel) this.psu.remove(this.voltageLabel);
      if (this.currentLabel) this.psu.remove(this.currentLabel);

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

      this.psu.add(this.voltageKnob);
      this.psu.add(this.currentKnob);

      this.knobMap.set(this.voltageKnob, "voltage");
      this.knobMap.set(this.currentKnob, "current");
    } catch (error) {
      console.error("Error setting up knobs:", error);
    }
  }

  async setupSockets() {
    const socketGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16);

    // Create the materials for the sockets
    const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });

    // Create two banana female sockets on the front face of PSU box
    const createSocket = (position, material) => {
      const socket = new THREE.Mesh(socketGeometry, material);
      socket.position.copy(position);
      socket.rotation.x = Math.PI / 2; // Face the Z-axis
      this.psu.add(socket); // Attach socket to the PSU box

      // Create socket's physics body
      const shape = new CANNON.Cylinder(0.1, 0.1, 0.2, 16);
      const socketBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(
          this.psu.position.x + position.x,
          this.psu.position.y + position.y,
          this.psu.position.z + position.z
        ),
        // Fixed position to ensure it doesn't move relative to PSU
      });
      socketBody.addShape(shape);
      this.world.addBody(socketBody);

      return { socket, socketBody };
    };

    // Positions for the banana female sockets on the front face of PSU box
    const frontFaceZ = 3; // Position on the Z-axis of the PSU box
    const displayWidth = 6; // Width of the display
    const offsetX = -4.5; // Negative X position for left of the display
    const offsetY = 0.5; // Vertical positioning

    const leftSocketPosition1 = new THREE.Vector3(
      offsetX, // X position
      offsetY, // Y position
      frontFaceZ
    ); // Z position on the front face

    const leftSocketPosition2 = new THREE.Vector3(
      offsetX, // X position
      -offsetY, // Y position
      frontFaceZ
    ); // Z position on the front face

    this.socket1 = createSocket(leftSocketPosition1, redMaterial);
    this.socket2 = createSocket(leftSocketPosition2, blueMaterial);

    // Attach sockets' physics bodies to PSU box physics body
    this.psuBody.addShape(
      new CANNON.Cylinder(0.1, 0.1, 0.2, 16),
      new CANNON.Vec3(
        leftSocketPosition1.x,
        leftSocketPosition1.y,
        leftSocketPosition1.z
      )
    );
    this.psuBody.addShape(
      new CANNON.Cylinder(0.1, 0.1, 0.2, 16),
      new CANNON.Vec3(
        leftSocketPosition2.x,
        leftSocketPosition2.y,
        leftSocketPosition2.z
      )
    );
  }

  updatePhysics() {
    // Sync Three.js position and rotation with Cannon.js body
    this.position.copy(this.psuBody.position);
    this.quaternion.copy(this.psuBody.quaternion);

    // Ensure the sockets' positions are updated accordingly
    if (this.socket1 && this.socket2) {
      this.socket1.socket.position.copy(
        this.psu.position.clone().add(new THREE.Vector3(-4.5, 0.5, 3))
      );
      this.socket2.socket.position.copy(
        this.psu.position.clone().add(new THREE.Vector3(-4.5, -0.5, 3))
      );
    }
  }

  onMouseDown(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera); // Use the camera passed in constructor

    const intersects = raycaster.intersectObjects([
      ...this.knobMap.keys(),
      this.socket1.socket,
      this.socket2.socket,
    ]);

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
      } else if (clickedObject === this.socket1.socket) {
        console.log("Socket 1 clicked");
      } else if (clickedObject === this.socket2.socket) {
        console.log("Socket 2 clicked");
      }
    }
  }
}

export { PSUComponent };
