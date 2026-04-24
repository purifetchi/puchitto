import { Quaternion, Vector3 } from "three";
import { GameObject } from "./gameObject";

/**
 * Contains the transform information for an object.
 */
export class Transform {
    /**
     * The gameobject for this transform.
     */
    private _obj : GameObject

    /**
     * Constructs a new transform.
     * @param obj The object this trasnform is pointing to.
     */
    constructor(obj: GameObject) {
        this._obj = obj
    }

    /**
     * Gets the position of this object.
     */
    get position() {
        return this._obj.threeObject.position
    }

    /**
     * Sets the position of this object.
     */
    set position(vec: Vector3) {
        this._obj.threeObject.position.copy(vec)
    }

    /**
     * Gets the quaternion rotation of this object.
     */
    get rotation() {
        return this._obj.threeObject.quaternion
    }

    /**
     * Sets the quaternion rotation of this object.
     */
    set rotation(quat: Quaternion) {
        this._obj.threeObject.quaternion.copy(quat)
    }

    /**
     * Gets the scale of this object.
     */
    get scale() {
        return this._obj.threeObject.scale
    }

    /**
     * Sets the position of this object.
     */
    set scale(vec: Vector3) {
        this._obj.threeObject.scale.copy(vec)
    }
}
