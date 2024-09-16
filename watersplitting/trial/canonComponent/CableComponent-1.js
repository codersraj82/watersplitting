import * as THREE from "three";
import * as CANNON from "cannon-es";

export default class CableComponent {
  constructor(scene, world, options = {}) {
    this.scene = scene;
    this.world = world;

    // Default parameters for cable customization
    this.length = options.length || 2;
    this.numSegments = options.numSegments || 20;
    this.radius = options.radius || 0.05;
    this.color = options.color || 0xff0000;
    this.startPosition = options.startPosition || [0, 1, 0];
    this.endPosition = options.endPosition || [5, 1, 0];

    // Create the cable
    this.createCable();
  }

  createCable() {
    const { length, numSegments, radius, startPosition, endPosition } = this;
    const height = length / numSegments;
    const mass = 10;
    const startPos = new THREE.Vector3(...startPosition);
    const endPos = new THREE.Vector3(...endPosition);

    this.segments = [];

    for (let i = 0; i < numSegments; i++) {
      const t = i / (numSegments - 1);
      const position = new THREE.Vector3().lerpVectors(startPos, endPos, t);

      const cylinderShape = new CANNON.Cylinder(radius, radius, height, 8);
      const cylinderBody = new CANNON.Body({
        mass,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: cylinderShape,
      });

      cylinderBody.linearDamping = 0.01;
      this.world.addBody(cylinderBody);

      const cylinderGeometry = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        8
      );
      const cylinderMaterial = new THREE.MeshStandardMaterial({
        color: this.color,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinderMesh.rotation.x = Math.PI / 2; // Rotate to align with Y-axis

      this.scene.add(cylinderMesh); // Ensure each segment is added to the scene

      this.segments.push({ body: cylinderBody, mesh: cylinderMesh });

      // Connect the current segment to the previous one using a DistanceConstraint
      if (i > 0) {
        const previousSegment = this.segments[i - 1];
        const currentSegment = this.segments[i];
        const constraint = new CANNON.DistanceConstraint(
          previousSegment.body,
          currentSegment.body,
          height
        );
        this.world.addConstraint(constraint);
      }
    }

    // Create and add anchor bodies at the start and end positions
    this.startAnchor = new CANNON.Body({
      position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z),
      mass: 0, // Static anchor
    });
    this.world.addBody(this.startAnchor);

    this.endAnchor = new CANNON.Body({
      position: new CANNON.Vec3(endPos.x, endPos.y, endPos.z),
      mass: 0, // Static anchor
    });
    this.world.addBody(this.endAnchor);

    // Connect the first and last segments to the start and end anchors
    const firstSegmentBody = this.segments[0].body;
    const lastSegmentBody = this.segments[this.segments.length - 1].body;

    const startConstraint = new CANNON.PointToPointConstraint(
      firstSegmentBody,
      new CANNON.Vec3(0, -height / 2, 0), // Point at the bottom of the first segment
      this.startAnchor,
      new CANNON.Vec3(0, 0, 0) // Anchor point
    );
    this.world.addConstraint(startConstraint);

    const endConstraint = new CANNON.PointToPointConstraint(
      lastSegmentBody,
      new CANNON.Vec3(0, height / 2, 0), // Point at the top of the last segment
      this.endAnchor,
      new CANNON.Vec3(0, 0, 0) // Anchor point
    );
    this.world.addConstraint(endConstraint);
  }

  update() {
    // Update Three.js meshes based on Cannon.js bodies
    this.segments.forEach((segment) => {
      segment.mesh.position.copy(segment.body.position);
      segment.mesh.quaternion.copy(segment.body.quaternion);
    });
  }
}
