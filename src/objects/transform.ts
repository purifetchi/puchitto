import { Euler, Quaternion, Vector3 } from "three";
import { GameObject } from "./gameObject";
import { MathUtils } from "three/src/math/MathUtils.js";

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
     * Gets the euler angles of this object.
     */
    get euler() {
        return this._obj.threeObject.rotation
    }

    /**
     * Sets the euler angles of this object.
     */
    set euler(euler: Euler) {
        this._obj.threeObject.rotation.copy(euler)
    }

    /**
     * Gets the euler angles of this object, in degrees.
     */
    get eulerDeg() {
        return new Euler(
            this._obj.threeObject.rotation.x * MathUtils.RAD2DEG,
            this._obj.threeObject.rotation.y * MathUtils.RAD2DEG,
            this._obj.threeObject.rotation.z * MathUtils.RAD2DEG
        )
    }

    /**
     * Sets the euler angles of this object.
     */
    set eulerDeg(euler: Euler) {
        this.setRotationFromDegrees(euler.x, euler.y, euler.z)
    }

    /**
     * Sets the rotation from degree-based components
     * @param x The x rotation component.
     * @param y The y rotation component.
     * @param z The z rotation component.
     */
    setRotationFromDegrees(x: number, y: number, z: number): void {
        this._obj.threeObject.rotation.x = x * MathUtils.DEG2RAD
        this._obj.threeObject.rotation.y = y * MathUtils.DEG2RAD
        this._obj.threeObject.rotation.z = z * MathUtils.DEG2RAD
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

    /**
     * The forward vector.
     */
    get forward() {
        return new Vector3(0, 0, 1).applyQuaternion(this.rotation)
    }

    /**
     * The forward vector.
     */
    get up() {
        return new Vector3(0, 1, 0).applyQuaternion(this.rotation)
    }

    /**
     * The forward vector.
     */
    get right() {
        return new Vector3(1, 0, 0).applyQuaternion(this.rotation)
    }

    /**
     * Sets a uniform scale.
     * @param size The size of the scale.
     */
    setUniformScale(size: number) {
        this.scale.set(size, size, size)
    }

    /**
     * Makes this object look at another object.
     * @param object The other object.
     */
    lookAt(object: GameObject) {
        this._obj.threeObject.lookAt(object.transform.position)
    }
}
