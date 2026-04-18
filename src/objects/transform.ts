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
     * The stored position for later binding.
     */
    private _storedPosition? : Vector3

    /**
     * The stored scale for later binding.
     */
    private _storedScale? : Vector3

    /**
     * The stored rotation for later binding.
     */
    private _storedRotation? : Quaternion

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
        return this._obj.threeObject?.position ?? this._storedPosition
    }

    /**
     * Sets the position of this object.
     */
    set position(vec: Vector3) {
        if (this._obj.threeObject === undefined) {
            this._storedPosition = vec
            return
        }

        this._obj.threeObject.position.copy(vec)
    }

    /**
     * Gets the quaternion rotation of this object.
     */
    get rotation() {
        return this._obj.threeObject?.quaternion ?? this._storedRotation
    }

    /**
     * Sets the quaternion rotation of this object.
     */
    set rotation(quat: Quaternion) {
        if (this._obj.threeObject === undefined) {
            this._storedRotation = quat
            return
        }

        this._obj.threeObject.quaternion.copy(quat)
    }

    /**
     * Gets the scale of this object.
     */
    get scale() {
        return this._obj.threeObject?.scale ?? this._storedScale
    }

    /**
     * Sets the position of this object.
     */
    set scale(vec: Vector3) {
        if (this._obj.threeObject === undefined) {
            this._storedScale = vec
            return
        }

        this._obj.threeObject.scale.copy(vec)
    }

    /**
     * Binds the transform to the gameobject.
     */
    bind() {
        console.log(`[Transform::bind] Binding ${this._obj.name} with ${this._storedPosition} ${this._storedRotation} ${this._storedScale}`)
        this._obj.threeObject.position.copy(this._storedPosition!)
        this._obj.threeObject.quaternion.copy(this._storedRotation!)
        this._obj.threeObject.scale.copy(this._storedScale!)

        this._storedPosition = undefined
        this._storedRotation = undefined
        this._storedScale = undefined
    }
}
