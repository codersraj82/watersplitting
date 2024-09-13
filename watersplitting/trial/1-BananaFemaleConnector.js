// BananaFemaleConnector.js
import * as THREE from "three";

/**
 * Creates a banana female connector ring mesh.
 * @param {THREE.Vector3} position - The position of the connector.
 * @param {number} ringRadius - The radius of the ring.
 * @param {number} thickness - The thickness of the ring.
 * @param {THREE.Color | number} ringColor - The color of the connector ring.
 * @returns {THREE.Mesh} - The banana female connector ring mesh.
 */
function createBananaFemaleConnector(
  position,
  ringRadius = 0.2,
  thickness = 0.05,
  ringColor = 0x999999 // Default grey color for the ring
) {
  // Create the ring geometry
  const ringGeometry = new THREE.TorusGeometry(ringRadius, thickness, 16, 100);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: ringColor });
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

  // Position the ring
  ringMesh.position.copy(position);
  ringMesh.rotation.x = Math.PI / 2; // Align the torus

  return ringMesh;
}

export { createBananaFemaleConnector };
