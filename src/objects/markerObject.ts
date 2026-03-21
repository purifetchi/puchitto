import { Object3D } from "three";
import { BlankEntityData } from "../level";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";

/**
 * The marker object, signifying a position in 3D space.
 */
export class MarkerObject extends GameObject<BlankEntityData> {
    constructor(opts: GameObjectOptions & BlankEntityData) {
        super(opts)

        const { transform } = opts

        const threeObject = new Object3D()
        threeObject.position.copy(transform.position)
        threeObject.quaternion.copy(transform.rotation)
        threeObject.scale.copy(transform.scale)

        this.threeObject = threeObject
    }

    onSceneAdded(): void {
        this._attach()
    }
}
