import { PositionalAudio, Audio, AudioLoader, LoadingManager } from "three";
import { AudioEntityData } from "../level/entities/audioEntityData";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";
import { MiniAnticsEnvironment } from "../scripting";

/**
 * The audio playback object.
 */
export class AudioObject extends GameObject<AudioEntityData> {
    /**
     * The entity data.
     */
    private _data : AudioEntityData

    /**
     * The data loader.
     */
    private _loader? : LoadingManager

    /**
     * The audio.
     */
    private _audio? : Audio<any>

    /**
     * Constructs a new Audio playback object.
     * @param opts The options.
     */
    constructor(opts: GameObjectOptions & AudioEntityData) {
        super(opts)
        this._data = opts
        this._loader = opts.loader

        // TODO: Position.
    }

    /**
     * Sets up the custom MiniAntics method for the audio entity.
     */
    protected setupCustomMiniAnticsEnvironment(env: MiniAnticsEnvironment): void {
        env.set("play", () => {
            this._audio?.stop()
            this._audio?.play()
        })

        env.set("stop", () => {
            this._audio?.stop()
        })
    }

    /**
     * Called when we set the game.
     */
    onGameSet(): void {
        console.log("hello")
        const audio = this._data.is3D
            ? new PositionalAudio(this.game._camera.listener)
            : new Audio(this.game._camera.listener)

        const loader = new AudioLoader(this._loader)
        loader.load(this._data.path, (data) => {
            audio.setBuffer(data)
            audio.setVolume(this._data.volume)
            audio.setLoop(this._data.looping)

            this.threeObject = audio
            this._attach()

            if (this._data.autoplay) {
                audio.play()
            }
        })

        this._audio = audio
    }
}
