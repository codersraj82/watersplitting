import * as THREE from "three";
import { Body, Vec3, Cylinder, PointToPointConstraint, Plane } from "cannon-es";

class Cable {
  constructor(scene, world, options = {}) {
    this.scene = scene;
    this.world = world;

    // Store start and end points
    this.startPoint = new Vec3(
      options.startPoint?.x || 0,
      options.startPoint?.y || 3, // Default to 3 units above the ground
      options.startPoint?.z || 0
    );
    this.endPoint = new Vec3(
      options.endPoint?.x || 10,
      options.endPoint?.y || 3, // Default to 3 units above the ground
      options.endPoint?.z || 0
    );
    this.numSegments = options.numSegments || 10;
    this.radius = options.radius || 0.1;
    this.color = options.color || 0xff0000;

    // Define dimensions and colors for the connectors and clips
    this.bananaConnectorSize = options.bananaConnectorSize || {
      radius: 0.2,
      height: 0.5,
    };
    this.crocodileConnectorSize = options.crocodileConnectorSize || {
      width: 0.5,
      height: 0.1,
      depth: 0.1,
    };
    this.connectorColor = options.connectorColor || 0xffff00; // Default yellow
    this.clipColor = options.clipColor || 0xff0000; // Default red for clip

    this.segments = [];
    this.segmentBodies = [];
    this.connectors = []; // To keep track of connectors

    // Create the ground plane once, assuming it's static
    this.createGround();
    this.createCable(); // Create the initial cable
  }

  // Create the cable by dividing it into segments
  createCable() {
    // Remove previous cable segments
    this.segments.forEach((segment) => this.scene.remove(segment));
    this.segmentBodies.forEach((body) => this.world.removeBody(body));

    this.segments = [];
    this.segmentBodies = [];

    const startVec = this.startPoint;
    const endVec = this.endPoint;
    const cableLength = startVec.distanceTo(endVec);

    const directionVec = new Vec3(
      (endVec.x - startVec.x) / cableLength,
      (endVec.y - startVec.y) / cableLength,
      (endVec.z - startVec.z) / cableLength
    );

    const segmentLength = cableLength / this.numSegments;

    for (let i = 0; i < this.numSegments; i++) {
      const segmentPosition = new Vec3(
        startVec.x + directionVec.x * segmentLength * i,
        startVec.y + directionVec.y * segmentLength * i,
        startVec.z + directionVec.z * segmentLength * i
      );

      // Choose geometry based on segment position (tip segments)
      const isTipSegment = i === 0 || i === this.numSegments - 1;
      const segmentRadius = isTipSegment ? this.radius * 1.1 : this.radius; // Slightly larger radius for border effect
      const geometry = new THREE.CylinderGeometry(
        segmentRadius,
        segmentRadius,
        segmentLength,
        8
      );

      // Create materials for tips with colors
      const segmentMaterial = new THREE.MeshBasicMaterial({
        color: isTipSegment
          ? i === 0
            ? this.connectorColor
            : this.clipColor
          : this.color,
      });

      const segment = new THREE.Mesh(geometry, segmentMaterial);
      segment.position.set(
        segmentPosition.x,
        segmentPosition.y,
        segmentPosition.z
      );
      segment.rotation.z = Math.PI / 2; // Rotate cylinder to align correctly
      this.scene.add(segment);
      this.segments.push(segment);

      const segmentBody = new Body({
        mass: 1,
        position: new Vec3(
          segmentPosition.x,
          segmentPosition.y,
          segmentPosition.z
        ),
      });

      const cylinderShape = new Cylinder(
        segmentRadius,
        segmentRadius,
        segmentLength,
        8
      );
      segmentBody.addShape(cylinderShape);
      this.world.addBody(segmentBody);
      this.segmentBodies.push(segmentBody);

      if (i > 0) {
        // Re-create constraints between segments
        const constraint = new PointToPointConstraint(
          this.segmentBodies[i - 1],
          new Vec3(0, -segmentLength / 2, 0),
          this.segmentBodies[i],
          new Vec3(0, segmentLength / 2, 0)
        );
        this.world.addConstraint(constraint);
      }
    }

    // Create connectors
    this.createConnectors();
  }

  // Create connectors at the start and end of the cable
  createConnectors() {
    // Define connector geometries
    const bananaGeometry = new THREE.CylinderGeometry(
      this.bananaConnectorSize.radius,
      this.bananaConnectorSize.radius,
      this.bananaConnectorSize.height,
      8
    );
    const crocodileGeometry = new THREE.BoxGeometry(
      this.crocodileConnectorSize.width,
      this.crocodileConnectorSize.height,
      this.crocodileConnectorSize.depth
    );

    // Replace the start and end segments with connector shapes
    this.segments[0].geometry.dispose();
    this.segments[this.numSegments - 1].geometry.dispose();

    this.segments[0].geometry = bananaGeometry;
    this.segments[this.numSegments - 1].geometry = crocodileGeometry;

    // Position the connectors
    this.segments[0].position.copy(this.startPoint);
    this.segments[this.numSegments - 1].position.copy(this.endPoint);

    // Set the connector colors
    this.segments[0].material = new THREE.MeshBasicMaterial({
      color: this.connectorColor, // Color for the banana connector
    });
    this.segments[this.numSegments - 1].material = new THREE.MeshBasicMaterial({
      color: this.clipColor, // Color for the crocodile clip
    });

    // Add connectors to the scene
    // No need to separately add connectors as they are already in the segments array
  }

  // Create a ground plane for the cable to rest on
  createGround() {
    const groundBody = new Body({
      mass: 0, // Static body
      shape: new Plane(),
      position: new Vec3(0, 0, 0),
    });

    groundBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);
  }

  // Update the cable with new start and end points
  updateCable(startPoint, endPoint) {
    this.startPoint.copy(startPoint);
    this.endPoint.copy(endPoint);

    this.createCable(); // Recreate cable with new start and end points
  }

  // Sync the physics engine bodies with Three.js objects
  update() {
    for (let i = 0; i < this.numSegments; i++) {
      this.segments[i].position.copy(this.segmentBodies[i].position);
      this.segments[i].quaternion.copy(this.segmentBodies[i].quaternion);
    }

    // Update connector positions
    if (this.connectors.length > 0) {
      this.connectors[0].position.copy(this.startPoint);
      this.connectors[1].position.copy(this.endPoint);
    }
  }

  // Accessor methods for connector dimensions
  getBananaConnectorSize() {
    return this.bananaConnectorSize;
  }

  getCrocodileConnectorSize() {
    return this.crocodileConnectorSize;
  }

  // Update connector sizes
  setBananaConnectorSize(size) {
    this.bananaConnectorSize = size;
    if (this.segments[0]) {
      const geometry = new THREE.CylinderGeometry(
        size.radius,
        size.radius,
        size.height,
        8
      );
      this.segments[0].geometry.dispose();
      this.segments[0].geometry = geometry;
    }
  }

  setCrocodileConnectorSize(size) {
    this.crocodileConnectorSize = size;
    if (this.segments[this.numSegments - 1]) {
      const geometry = new THREE.BoxGeometry(
        size.width,
        size.height,
        size.depth
      );
      this.segments[this.numSegments - 1].geometry.dispose();
      this.segments[this.numSegments - 1].geometry = geometry;
    }
  }
}

export default Cable;
