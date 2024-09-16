import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import * as CANNON from "cannon-es";

let font = null;

// Load the font asynchronously
async function loadFont() {
  const loader = new FontLoader();
  return new Promise((resolve, reject) => {
    loader.load("./helvetiker_bold.typeface.json", resolve, undefined, reject);
  });
}

async function createBananaSocket(
  world,
  position,
  label = "",
  color = 0xff0000,
  size = 0.1
) {
  // Load the font if not loaded
  if (!font) {
    try {
      font = await loadFont();
    } catch (error) {
      console.error("Failed to load font:", error);
      return null;
    }
  }

  // Create the outer ring for the socket (Three.js visual part)
  const outerGeometry = new THREE.TorusGeometry(size, size * 0.2, 16, 100);
  const outerMaterial = new THREE.MeshStandardMaterial({ color: color });
  const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
  outerRing.rotation.x = Math.PI / 2;

  // Create a cylindrical socket (Three.js visual part)
  const innerGeometry = new THREE.CylinderGeometry(
    size * 0.5,
    size * 0.5,
    size * 2,
    32
  );
  const innerMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const innerCylinder = new THREE.Mesh(innerGeometry, innerMaterial);
  innerCylinder.rotation.x = Math.PI / 2;

  // Group them together
  const socketGroup = new THREE.Group();
  socketGroup.add(outerRing);
  socketGroup.add(innerCylinder);

  // Create label if provided
  if (label) {
    const labelGeometry = new TextGeometry(label, {
      font: font,
      size: size * 0.5,
      height: 0.05,
      curveSegments: 12,
    });

    const labelMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

    // Center the label
    labelGeometry.computeBoundingBox();
    const bbox = labelGeometry.boundingBox;
    if (bbox) {
      const width = bbox.max.x - bbox.min.x;
      labelMesh.position.set(-width / 2, 0.2, 0); // Center above socket
      labelMesh.rotation.x = -Math.PI / 2; // Rotate to make the label visible
    }

    socketGroup.add(labelMesh);
  }

  // Cannon.js physics body
  const socketShape = new CANNON.Cylinder(size * 0.5, size * 0.5, size * 2, 16);
  const socketBody = new CANNON.Body({
    mass: 0, // Static object, no gravity effect
    position: new CANNON.Vec3(position.x, position.y, position.z),
  });
  socketBody.addShape(socketShape);
  world.addBody(socketBody);

  // Return the Three.js group and the physics body
  return {
    socketGroup,
    socketBody, // Access physics body
    getPosition: () =>
      new THREE.Vector3(
        socketBody.position.x,
        socketBody.position.y,
        socketBody.position.z
      ), // Get physics body position
    updatePhysics: () => {
      // Sync Three.js position with Cannon.js body
      socketGroup.position.copy(socketBody.position);
      socketGroup.quaternion.copy(socketBody.quaternion);
    },
  };
}

export { createBananaSocket };
