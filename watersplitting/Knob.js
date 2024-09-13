import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

let font = null;

function loadFont() {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader();
    loader.load("./helvetiker_bold.typeface.json", resolve, undefined, reject);
  });
}

async function createKnob(position, label = "", size = 0.5) {
  // Load the font if it hasn't been loaded yet
  if (!font) {
    try {
      font = await loadFont();
    } catch (error) {
      console.error("Failed to load font:", error);
      return new THREE.Mesh(); // Return an empty mesh on error
    }
  }

  // Create a cylindrical knob with the specified size
  const knobGeometry = new THREE.CylinderGeometry(size, size, 0.2, 32);
  const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 }); // Grey color
  const knob = new THREE.Mesh(knobGeometry, knobMaterial);
  knob.position.copy(position);
  knob.rotation.x = Math.PI / 2; // Rotate the cylinder to stand upright

  // Create label geometry if a label is provided
  if (label) {
    const labelGeometry = new TextGeometry(label, {
      font: font,
      size: size * 0.4, // Adjust font size relative to knob size
      height: 0.02,
      curveSegments: 12,
    });

    const labelMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Bright yellow color
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

    // Compute the bounding box of the label to center it on the knob's top surface
    labelGeometry.computeBoundingBox();
    const bbox = labelGeometry.boundingBox;
    if (bbox) {
      const width = bbox.max.x - bbox.min.x;
      const height = bbox.max.y - bbox.min.y;

      // Position label on top surface of the knob
      labelMesh.position.set(
        0, // Center horizontally on the knob
        0.2 / 2 + height / 2, // Center vertically on top surface
        0 // Keep label in the same z position as knob
      );

      // Ensure the label faces the camera
      labelMesh.rotation.x = -Math.PI / 2; // Rotate to make the label visible from above
    }

    knob.add(labelMesh);
  }

  return knob;
}

export { createKnob };
