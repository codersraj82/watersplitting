import * as CANNON from "cannon-es";

class CylinderComponent {
  constructor() {
    // Define the cylinder shape
    this.shape = new CANNON.Cylinder(1, 1, 2, 32); // radiusTop, radiusBottom, height, numSegments
    this.body = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(0, 0, 0),
    });
    this.body.addShape(this.shape);
  }

  getBody() {
    return this.body;
  }
}

export { CylinderComponent };
