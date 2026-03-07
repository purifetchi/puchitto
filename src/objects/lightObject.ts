import { Color, PointLight } from "three";
import { GameObjectOptions } from "./gameObjectOptions";
import { GameObject } from "./gameObject";
import { LightEntityData } from "../level/entities/lightEntityData";

export class LightObject extends GameObject<LightEntityData> {
    constructor(opts: GameObjectOptions & LightEntityData) {
        super(opts)

        const { color, intensity, range, transform } = opts
        const col = new Color(color[0], color[1], color[2])
        this.threeObject = new PointLight(col, intensity * 80, range)
        this.threeObject.position.set(
            transform.position.x,
            transform.position.y,
            transform.position.z
        )
    }

    onSceneAdded(): void {
        this._attach()
    }
}
