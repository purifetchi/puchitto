import { Color, PointLight } from "three";
import { GameObjectOptions } from "./gameObjectOptions";
import { GameObject } from "./gameObject";
import { Serialized } from "../serialization/serialized";

/**
 * The light object.
 */
export class LightObject extends GameObject {
    /**
     * The color of the light.
     */
    @Serialized("color")
    accessor color!: number[]

    /**
     * The intensity of the light.
     */
    @Serialized("intensity")
    accessor intensity!: number

    /**
     * The range of the light.
     */
    @Serialized("range")
    accessor range!: number

    /**
     * The three.js light object.
     */
    private _light: PointLight

    /**
     * Constructs a new light object.
     */
    constructor(opts: GameObjectOptions) {
        super(opts)

        this._light = new PointLight()
        this.attachThreeObject(this._light)
    }

    /**
     * Called when a serialized property has changed.
     */
    onSerializedPropertyChanged(): void {
        this._light.color = new Color(this.color[0], this.color[1], this.color[2])
        this._light.intensity = this.intensity * 50
        this._light.distance = this.range
    }
}
