import * as THREE from "three";
import { World, Body, Vec3, DistanceConstraint, Spring } from "cannon-es";

export class FlexibleCable {
  constructor({
    cableColor = 0xff0000,
    clipColor = 0x00ff00,
    connectorColor = 0xff0000,
    segments = 20,
    radius = 0.05,
    startPoint = new THREE.Vector3(),
    endPoint = new THREE.Vector3(),
  } = {}) {
    this.cableColor = cableColor;
    this.clipColor = clipColor;
    this.connectorColor = connectorColor;
    this.segments = segments;
    this.radius = radius;
    this.startPoint = startPoint;
    this.endPoint = endPoint;

    this.cableBodies = [];
    this.world = new World();
    this.world.gravity.set(0, 0, 0);

    this.createCable();
    this.createClip();
    this.createConnector();

    this.initializeMesh();
  }

  createCable() {
    const segmentLength = this.calculateSegmentLength();
    const mass = 0.1;
    const damping = 0.1;
    const stiffness = 0.9; // Adjust for cable stiffness
    const relaxation = 0.1;

    let previousBody = null;
    const direction = new THREE.Vector3()
      .subVectors(this.endPoint, this.startPoint)
      .normalize();

    for (let i = 0; i <= this.segments; i++) {
      const body = new Body({
        mass: i === 0 || i === this.segments ? 0 : mass,
        position: new Vec3().copy(
          this.startPoint
            .clone()
            .add(direction.clone().multiplyScalar(i * segmentLength))
        ),
        linearDamping: damping,
        angularDamping: damping,
      });

      this.world.addBody(body);
      this.cableBodies.push(body);

      if (previousBody) {
        const constraint = new Spring(previousBody, body, {
          restLength: segmentLength,
          stiffness: stiffness,
          relaxation: relaxation,
        });
        this.world.addConstraint(constraint);
      }
      previousBody = body;
    }

    // Attach the first and last bodies to start and end points
    const startBody = this.cableBodies[0];
    startBody.position.copy(new Vec3().copy(this.startPoint));
    const endBody = this.cableBodies[this.segments];
    endBody.position.copy(new Vec3().copy(this.endPoint));
  }

  calculateSegmentLength() {
    // Segment length based on the initial distance between start and end points
    return this.startPoint.distanceTo(this.endPoint) / this.segments;
  }

  initializeMesh() {
    this.updateMesh(); // Update mesh based on the current cable points
  }

  updateMesh() {
    const curve = new THREE.CatmullRomCurve3(this.getCablePoints());
    const geometry = new THREE.TubeGeometry(
      curve,
      this.segments,
      this.radius,
      8,
      false
    );
    const material = new THREE.MeshBasicMaterial({ color: this.cableColor });
    if (this.tubeMesh) {
      this.tubeMesh.geometry.dispose();
    }
    this.tubeMesh = new THREE.Mesh(geometry, material);
  }

  createClip() {
    const geometry = new THREE.BoxGeometry(0.5, 0.2, 0.1);
    const material = new THREE.MeshStandardMaterial({ color: this.clipColor });
    this.crocodileClip = new THREE.Mesh(geometry, material);
    this.crocodileClip.visible = true;
  }

  createConnector() {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.connectorColor,
    });
    this.bananaPin = new THREE.Mesh(geometry, material);
    this.bananaPin.rotation.x = Math.PI / 2;
    this.bananaPin.visible = true;
  }

  getCablePoints() {
    return this.cableBodies.map(
      (body) =>
        new THREE.Vector3(body.position.x, body.position.y, body.position.z)
    );
  }

  update() {
    // Update the cable's mesh and physics
    const curve = new THREE.CatmullRomCurve3(this.getCablePoints());
    this.tubeMesh.geometry.dispose();
    this.tubeMesh.geometry = new THREE.TubeGeometry(
      curve,
      this.segments,
      this.radius,
      8,
      false
    );

    // Update physics simulation
    this.world.step(1 / 60);
  }

  addToScene(scene) {
    scene.add(this.tubeMesh);

    // Align and Position Crocodile Clip
    this.crocodileClip.position.copy(this.startPoint);
    this.crocodileClip.lookAt(
      new THREE.Vector3(
        this.cableBodies[1].position.x,
        this.cableBodies[1].position.y,
        this.cableBodies[1].position.z
      )
    );
    scene.add(this.crocodileClip);

    // Align and Position Banana Connector
    const endCableBody = this.cableBodies[this.segments];
    this.bananaPin.position.copy(
      new THREE.Vector3(
        endCableBody.position.x,
        endCableBody.position.y,
        endCableBody.position.z
      )
    );
    this.bananaPin.lookAt(
      new THREE.Vector3(
        this.cableBodies[this.segments - 1].position.x,
        this.cableBodies[this.segments - 1].position.y,
        this.cableBodies[this.segments - 1].position.z
      )
    );
    scene.add(this.bananaPin);
  }
}
