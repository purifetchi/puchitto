import { Object3D } from "three";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";

/**
 * The marker object, signifying a position in 3D space.
 */
export class MarkerObject extends GameObject {
    constructor(opts: GameObjectOptions) {
        super(opts)

        this.threeObject = new Object3D()
    }

    onSceneAdded(): void {
        this._attach()
    }
}
