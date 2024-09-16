import * as THREE from "three";
import * as CANNON from "cannon-es";

class Cable {
  constructor(scene, world, start, end, color = 0xff0000) {
    this.scene = scene;
    this.world = world;
    this.start = start;
    this.end = end;
    this.color = color;

    this.createCable();
  }

  createCable() {
    // Create geometry and material
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 16);
    const material = new THREE.MeshStandardMaterial({ color: this.color });

    this.cableMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.cableMesh);

    // Create physics body
    const shape = new CANNON.Cylinder(0.02, 0.02, 1, 16);
    this.cableBody = new CANNON.Body({
      mass: 1,
      position: this.start.clone(),
    });
    this.cableBody.addShape(shape);
    this.world.addBody(this.cableBody);

    // Adjust cable
    this.update();
  }

  update() {
    // Calculate length and direction
    const length = this.start.distanceTo(this.end);
    const direction = new THREE.Vector3().subVectors(this.end, this.start);

    // Update cable mesh
    this.cableMesh.scale.set(1, length / 2, 1); // Adjust scale for the cable
    this.cableMesh.position.copy(this.start).lerp(this.end, 0.5);
    this.cableMesh.lookAt(this.end);

    // Update physics body
    this.cableBody.position.copy(this.start);
    this.cableBody.velocity.set(0, 0, 0); // Reset velocity to avoid unwanted motion

    // Calculate orientation
    const angle = Math.atan2(direction.y, direction.x);
    this.cableMesh.rotation.z = angle;
    this.cableBody.quaternion.setFromEuler(0, 0, angle);
  }

  setEnd(end) {
    this.end.copy(end);
    this.update();
  }
}

export default Cable;
