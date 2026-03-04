import type { AnimationAction, AnimationClip, AnimationMixer } from "three";

export default class AnimatorComponent {
    /**
     * The main animation mixer.
     */
    private _mixer : AnimationMixer

    /**
     * The currently playing clip.
     */
    private _currentClip? : AnimationAction

    /**
     * The list of clips.
     */
    private _clips : { [key: string]: AnimationAction } = {}

    constructor(opts : {
        mixer : AnimationMixer,
        animations: AnimationClip[]
    }) {
        const { mixer, animations } = opts
        this._mixer = mixer

        this.buildClipList(animations)
    }

    /**
     * Builds a set of animations.
     * @param animations The animations.
     */
    private buildClipList(animations: AnimationClip[]) : void {
        for (const anim of animations) {
            const clip = this._mixer.clipAction(anim)
            this._clips[anim.name] = clip
        }
    }

    /**
     * Plays an animation.
     * @param name The name of the animation
     */
    play(name: string) : void {
        const clip = this._clips[name]

        if (clip === undefined) {
            console.error(`[AnimatorComponent::play] Could not find a clip of name ${name}!`)
            return
        }

        if (clip == this._currentClip) {
            return
        }

        clip.reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .play()

        if (this._currentClip !== undefined) {
            this._currentClip.crossFadeTo(clip, 0.3)
        }

        this._currentClip = clip
    }

    /**
     * Stops an animation.
     * @param name The name of the animation
     */
    stop() : void {
        if (this._currentClip === undefined) {
            console.error(`[AnimatorComponent::stop] No clip playing!`)
            return
        }

        this._currentClip.stop()
    }

    /**
     * Updates the animator.
     * @param dt The delta time.
     */
    update(dt : number) : void {
        this._mixer.update(dt)
    }
}