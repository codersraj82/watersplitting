import * as THREE from "three";
import * as CANNON from "cannon-es";

export default class CableComponent {
  constructor(scene, world, options = {}) {
    this.scene = scene;
    this.world = world;

    this.length = options.length || 2;
    this.numSegments = options.numSegments || 20;
    this.radius = options.radius || 0.05;
    this.color = options.color || 0xff0000;
    this.startPosition = options.startPosition || [0, 1, 0];
    this.endPosition = options.endPosition || [5, 1, 0];

    this.createCable();
  }

  createCable() {
    const cableLength = this.length;
    const numSegments = this.numSegments;
    const radius = this.radius;
    const height = cableLength / numSegments;
    const segmentMass = 0; // Light weight for segments
    const segmentStiffness = 1000; // Higher value for more rigidity
    const damping = 1; // Increased damping for stability
    const startPos = new THREE.Vector3(...this.startPosition);
    const endPos = new THREE.Vector3(...this.endPosition);

    this.segments = [];

    for (let i = 0; i < numSegments; i++) {
      const t = i / (numSegments - 1);
      const position = new THREE.Vector3().lerpVectors(startPos, endPos, t);

      const cylinderShape = new CANNON.Cylinder(radius, radius, height, 16);
      const cylinderBody = new CANNON.Body({
        mass: segmentMass,
        position: new CANNON.Vec3(position.x, position.y, position.z),
      });
      cylinderBody.addShape(cylinderShape);
      cylinderBody.linearDamping = damping; // Increased damping
      cylinderBody.angularDamping = damping; // Optional: Angular damping for rotation stability
      this.world.addBody(cylinderBody);

      const cylinderGeometry = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        16
      );
      const cylinderMaterial = new THREE.MeshStandardMaterial({
        color: this.color,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinderMesh.rotation.x = Math.PI / 2;
      this.scene.add(cylinderMesh);

      this.segments.push({ body: cylinderBody, mesh: cylinderMesh });

      if (i > 0) {
        const previousSegment = this.segments[i - 1];
        const currentSegment = this.segments[i];

        const constraint = new CANNON.DistanceConstraint(
          previousSegment.body,
          currentSegment.body,
          height
        );
        constraint.stiffness = segmentStiffness; // Increased stiffness
        this.world.addConstraint(constraint);
      }
    }

    // Attach cable ends to the fixed positions
    const startAnchorBody = new CANNON.Body({
      mass: 0, // Static body
      position: new CANNON.Vec3(...startPos.toArray()),
    });
    this.world.addBody(startAnchorBody);

    const endAnchorBody = new CANNON.Body({
      mass: 0, // Static body
      position: new CANNON.Vec3(...endPos.toArray()),
    });
    this.world.addBody(endAnchorBody);

    const startAttachment = new CANNON.PointToPointConstraint(
      this.segments[0].body,
      new CANNON.Vec3(0, -height / 2, 0),
      startAnchorBody,
      new CANNON.Vec3(0, 0, 0)
    );
    this.world.addConstraint(startAttachment);

    const endAttachment = new CANNON.PointToPointConstraint(
      this.segments[this.segments.length - 1].body,
      new CANNON.Vec3(0, height / 2, 0),
      endAnchorBody,
      new CANNON.Vec3(0, 0, 0)
    );
    this.world.addConstraint(endAttachment);
  }

  update() {
    this.segments.forEach((segment) => {
      segment.mesh.position.copy(segment.body.position);
      segment.mesh.quaternion.copy(segment.body.quaternion);
    });
  }
}
