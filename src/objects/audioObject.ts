import { PositionalAudio, Audio, AudioLoader, LoadingManager } from "three";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";
import { MiniAnticsEnvironment } from "../scripting";
import { Serialized } from "../serialization";

/**
 * The audio playback object.
 */
export class AudioObject extends GameObject {
    /**
     * The path to the audio data.
     */
    @Serialized("path")
    accessor path!: string

    /**
     * Is the audio 3D?
     */
    @Serialized("is3D")
    accessor is3D!: boolean

    /**
     * Should the audio autoplay?
     */
    @Serialized("autoplay")
    accessor autoplay!: boolean

    /**
     * Is the audio looping?
     */
    @Serialized("looping")
    accessor looping!: boolean

    /**
     * The volume of the audio?
     */
    @Serialized("volume")
    accessor volume!: number

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
    constructor(opts: GameObjectOptions) {
        super(opts)
        this._loader = opts.loader
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
        const audio = this.is3D
            ? new PositionalAudio(this.game._camera.listener)
            : new Audio(this.game._camera.listener)

        const loader = new AudioLoader(this._loader)
        loader.load(this.path, (data) => {
            audio.setBuffer(data)
            audio.setVolume(this.volume)
            audio.setLoop(this.looping)

            this.threeObject = audio
            this._attach()

            if (this.autoplay) {
                audio.play()
            }
        })

        this._audio = audio
    }
}
