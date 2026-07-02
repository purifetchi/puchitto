import { PositionalAudio, Audio, AudioLoader, LoadingManager } from "three";
import { GameObject } from "./gameObject";
import { MiniAnticsEnvironment } from "../scripting";
import { Serialized } from "../serialization";
import { AssetLoading } from "./mixins/assetLoading";

/**
 * The audio playback object.
 */
export class AudioObject extends AssetLoading(GameObject) {
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
     * The audio.
     */
    private _audio? : Audio<any>

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
        const listener = this.game.audioListener?.listener
        if (listener === undefined) {
            console.warn(`[AudioObject::onGameSet] No audio listener!`)
            return
        }

        const audio = this.is3D
            ? new PositionalAudio(listener)
            : new Audio(listener)

        this.beginAssetLoad()

        const loader = new AudioLoader(this.loader)
        loader.load(this.path, (data) => {
            audio.setBuffer(data)
            audio.setVolume(this.volume)
            audio.setLoop(this.looping)

            this.attachThreeObject(audio)
            this.finishAssetLoad()

            if (this.autoplay) {
                audio.play()
            }
        })

        this._audio = audio
    }
}
