import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

class WaterSplittingModule {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.bubbles = [];
    this.lastBubbleTime = 0;
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(-5, 4, 5);

    // Get the container element
    this.container = document.getElementById("container");

    if (!this.container) {
      console.error("Element with ID 'container' not found.");
      return;
    }

    // Create and set up the scene, renderer, etc.
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x808080);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    // Call createControls method
    this.createControls();
    this.setupLights();
    this.createObjects();
    this.loadFontAndAddSymbols();
    this.generateBubbles();
    // Start animation
    this.animate = this.animate.bind(this); // Bind animate method to class instance
    this.animate();
    this.setupResizeHandler();
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  createObjects() {
    this.createJar();
    this.createLiquid();
    this.createCover();
    this.createOctahedron();
    this.createElectrodes();
    this.createPlane();
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
    this.jar.castShadow = true;
    this.jar.receiveShadow = true;
    this.scene.add(this.jar);

    const bottom = new THREE.Mesh(bottomGeometry, thickGlassMaterial);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -2.5;
    this.scene.add(bottom);
  }

  createLiquid() {
    const waveShader = {
      vertexShader: `
        varying vec2 vUv;
        uniform float time;

        void main() {
          vUv = uv;
          vec3 newPosition = position;
          newPosition.z += sin(position.x * 1.0 + time * 0.5) * 0.05;
          newPosition.z += cos(position.y * 1.0 + time * 0.5) * 0.05;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;

        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1);
        }
      `,
    };

    const liquidGeometry = new THREE.CylinderGeometry(2.9, 2.9, 3.75, 32);
    this.liquidMaterial = new THREE.ShaderMaterial({
      vertexShader: waveShader.vertexShader,
      fragmentShader: waveShader.fragmentShader,
      uniforms: { time: { value: 0.0 } },
      transparent: true,
    });

    this.liquid = new THREE.Mesh(liquidGeometry, this.liquidMaterial);
    this.liquid.position.y = -0.625;
    this.liquid.castShadow = true;
    this.liquid.receiveShadow = true;
    this.scene.add(this.liquid);
  }

  createCover() {
    const coverGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.5, 32);
    const coverMaterial = new THREE.MeshBasicMaterial({ color: 0xa9a9a9 });
    const cover = new THREE.Mesh(coverGeometry, coverMaterial);
    cover.position.y = 2.75;
    cover.castShadow = true;
    cover.receiveShadow = true;

    const slotGeometry = new THREE.BoxGeometry(0.2, 1, 0.5);
    const slotMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const slot1 = new THREE.Mesh(slotGeometry, slotMaterial);
    slot1.position.set(-1.5, 1, 0);
    cover.add(slot1);

    const slot2 = new THREE.Mesh(slotGeometry, slotMaterial);
    slot2.position.set(1.5, 1, 0);
    cover.add(slot2);

    this.scene.add(cover);
  }

  createOctahedron() {
    const octahedronGeometry = new THREE.OctahedronGeometry(0.75, 2);
    const octahedronMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.5,
    });

    this.octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial);
    this.octahedron.rotation.x = Math.PI / 2;
    this.octahedron.scale.set(0.5, 1, 0.5);
    this.octahedron.position.y = -2.5;
    this.octahedron.castShadow = true;
    this.octahedron.receiveShadow = true;
    this.scene.add(this.octahedron);
  }

  createElectrodes() {
    const electrodeMaterial = new THREE.MeshStandardMaterial({
      metalness: 1,
      roughness: 0.3,
    });

    const negativePlateMaterial = new THREE.MeshStandardMaterial({
      color: 0x002868,
      ...electrodeMaterial,
    });
    this.negativePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 6, 2),
      negativePlateMaterial
    );
    this.negativePlate.position.set(-1.5, 1, 0);
    this.negativePlate.castShadow = true;
    this.negativePlate.receiveShadow = true;
    this.scene.add(this.negativePlate);

    const positivePlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xbf0a30,
      ...electrodeMaterial,
    });
    this.positivePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 6, 2),
      positivePlateMaterial
    );
    this.positivePlate.position.set(1.5, 1, 0);
    this.positivePlate.castShadow = true;
    this.positivePlate.receiveShadow = true;
    this.scene.add(this.positivePlate);
  }

  createPlane() {
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -5;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  loadFontAndAddSymbols() {
    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://unpkg.com/three@0.147.0/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const addText = (text, color, x, y, z) => {
          const textGeometry = new TextGeometry(text, {
            font: font,
            size: 0.5,
            height: 0.1,
          });
          const textMaterial = new THREE.MeshStandardMaterial({ color });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.position.set(x, y, z);
          textMesh.rotation.x = -Math.PI;
          this.scene.add(textMesh);
        };

        addText(" + ", 0xbf0a30, 2, 4.5, 0);
        addText(" - ", 0x002868, -1, 4.5, 0);
      }
    );
  }

  generateBubbles() {
    // Bubble properties
    const BUBBLE_INTERVAL = 0.001; // Time between bubble creations
    const MAX_BUBBLES = 1000; // Maximum number of bubbles
    const BUBBLE_SPEED = 0.07; // Speed of bubble movement
    const BUBBLE_RADIUS = 0.1; // Radius of bubbles

    // Increase the density of white bubbles
    const ELECTRODE_BUBBLE_DENSITY = 0.1; // Density of bubbles around electrodes (unchanged)
    const CENTER_BUBBLE_DENSITY = 0.9; // Increased density for white bubbles, making them more frequent

    const bubbleGeometry = new THREE.SphereGeometry(BUBBLE_RADIUS, 16, 16);
    const blueBubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0000ff, // Blue color
      opacity: 0.8,
      transparent: true,
      depthWrite: false,
      clearcoat: 1,
      reflectivity: 0.7,
      transmission: 1,
    });
    const redBubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff0000, // Red color
      opacity: 0.8,
      transparent: true,
      depthWrite: false,
      clearcoat: 1,
      reflectivity: 0.7,
      transmission: 1,
    });
    const whiteBubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // White color
      opacity: 0.8,
      transparent: true,
      depthWrite: false,
      clearcoat: 1,
      reflectivity: 0.7,
      transmission: 1,
    });

    let bubbles = [];
    let lastBubbleTime = 0;

    const currentTime = Date.now();
    if (currentTime - lastBubbleTime > BUBBLE_INTERVAL * 10) {
      lastBubbleTime = currentTime;

      if (bubbles.length < MAX_BUBBLES) {
        // Generate white bubbles near the bottom width of both electrodes
        const numBubblesPerEdge = 15; // Increase number of bubbles along the width of each electrode

        [this.negativePlate, this.positivePlate].forEach((electrode) => {
          for (let i = 0; i < numBubblesPerEdge; i++) {
            const widthFraction = i / numBubblesPerEdge - 0.5; // Distribute bubbles along the width
            const x = electrode.position.x;
            const y =
              electrode.position.y - electrode.geometry.parameters.height / 2; // Bottom edge
            const z =
              electrode.position.z +
              widthFraction * electrode.geometry.parameters.depth;

            const whiteBubble = new THREE.Mesh(
              bubbleGeometry,
              whiteBubbleMaterial
            );
            whiteBubble.position.set(x, y, z);
            this.scene.add(whiteBubble);

            // Add random upward and outward spread to cover more area
            const randomTargetX = x + (Math.random() - 0.5) * 2;
            const randomTargetZ = z + (Math.random() - 0.5) * 4;

            bubbles.push({
              mesh: whiteBubble,
              target: new THREE.Vector3(randomTargetX, 4, randomTargetZ), // Move up with more randomness
              color: "white",
            });
          }
        });

        // Increase the number of blue and red bubbles by generating more frequently
        const liquidTop =
          this.liquid.position.y + this.liquid.geometry.parameters.height / 2;
        const liquidBottom =
          this.liquid.position.y - this.liquid.geometry.parameters.height / 2;

        // Increased density for more blue and red bubbles
        const blueBubbleDensity = 0.3; // Increase the density for blue bubbles
        const redBubbleDensity = 0.6; // Make red bubbles twice as frequent as blue bubbles

        const electrodes = [
          {
            color: "blue",
            electrode: this.negativePlate,
            density: blueBubbleDensity,
          },
          {
            color: "red",
            electrode: this.positivePlate,
            density: redBubbleDensity,
          },
        ];

        electrodes.forEach(({ color, electrode, density }) => {
          for (let i = 0; i < 5; i++) {
            // Increase the number of attempts to generate bubbles
            if (Math.random() < density) {
              const x = electrode.position.x + (Math.random() - 0.5) * 2;
              const y =
                liquidBottom + Math.random() * (liquidTop - liquidBottom); // Constrain within liquid height
              const z =
                electrode.position.z +
                (Math.random() - 0.5) * electrode.geometry.parameters.depth;

              const bubbleMaterial =
                color === "blue" ? blueBubbleMaterial : redBubbleMaterial;
              const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
              bubble.position.set(x, y, z);
              this.scene.add(bubble);

              const target = new THREE.Vector3(
                electrode.position.x + (Math.random() - 0.5) * 0.5,
                y, // Bubble will remain within the liquid height range
                electrode.position.z + (Math.random() - 0.5) * 0.5
              );

              bubbles.push({
                mesh: bubble,
                target,
                color,
              });
            }
          }
        });
      }
    }
  }

  // Update bubbles function for spreading upwards
  updateBubbles() {
    this.bubbles.forEach((bubble, index) => {
      const { mesh, target, color } = bubble;

      // Move white bubbles up with more spread as they ascend
      if (color === "white") {
        const randomOffsetX = (Math.random() - 0.5) * 0.1; // Random horizontal motion
        const randomOffsetZ = (Math.random() - 0.5) * 0.1; // Random horizontal motion
        mesh.position.x += randomOffsetX;
        mesh.position.z += randomOffsetZ;
        mesh.position.y += BUBBLE_SPEED;

        if (mesh.position.y > 2) {
          this.scene.remove(mesh);
          this.bubbles.splice(index, 1);
        }
      } else {
        // Move colored bubbles towards their respective electrodes
        const direction = new THREE.Vector3()
          .subVectors(target, mesh.position)
          .normalize();
        mesh.position.add(direction.multiplyScalar(BUBBLE_SPEED));

        if (mesh.position.distanceTo(target) < BUBBLE_SPEED) {
          this.scene.remove(mesh);
          this.bubbles.splice(index, 1);
        }
      }
    });
  }

  createControls() {
    // Setup orbit controls or any interaction logic if needed
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();

    // Update animation for octahedron, liquid, and bubbles
    this.octahedron.rotation.y += 0.01;
    this.liquidMaterial.uniforms.time.value += 0.01;
    this.updateBubbles();

    this.renderer.render(this.scene, this.camera);
  }

  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}

export default WaterSplittingModule;
