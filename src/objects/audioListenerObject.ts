import { AudioListener } from "three";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";
import { CameraObject } from ".";

/**
 * An internal entity acting as the audio listener.
 */
export class AudioListenerObject extends GameObject {
    /**
     * The listener.
     */
    readonly listener: AudioListener

    /**
     * Constructs the audio listener.
     * @param opts The game object options.
     */
    constructor(opts: GameObjectOptions) {
        super(opts)

        this.listener = new AudioListener()
        this.attachThreeObject(this.listener)
    }

    /**
     * Reparents the audio listener to another camera object.
     * @param camera The camera object.
     */
    parent(camera: CameraObject): void {
        this.threeObject.parent = camera.threeObject
    }
}
