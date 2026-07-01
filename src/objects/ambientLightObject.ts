import { AmbientLight, Color } from "three";
import { Serialized } from "../serialization";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";

/**
 * The ambient light object.
 */
export class AmbientLightObject extends GameObject {
    /**
     * The color of the light.
     */
    @Serialized("color")
    accessor color: number[] = [1, 1, 1, 1]

    /**
     * The intensity of the ambient light
     */
    @Serialized("intensity")
    accessor intensity: number = 1

    /**
     * The three.js light object.
     */
    private _light: AmbientLight

    /**
     * Constructs a new light object.
     */
    constructor(opts: GameObjectOptions) {
        super(opts)

        this._light = new AmbientLight()
        this.attachThreeObject(this._light)
    }

    /**
     * Called when a serialized property has changed.
     */
    onSerializedPropertyChanged(): void {
        this._light.color = new Color(
            this.color[0],
            this.color[1],
            this.color[2],
        );
        this._light.intensity = this.intensity
    }
}
