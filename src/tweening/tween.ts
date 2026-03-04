import type Game from "../game.js";
import type TweenContract from "./tweenContract.js";

/**
 * A tween.
 */
export default class Tween<T> implements TweenContract {
    /**
     * The duration, in seconds, of the tween.
     */
    private _duration: number
    
    /**
     * The current value.
     */
    private _value : T

    /**
     * The start value.
     */
    private _startValue : T

    /**
     * The end value.
     */
    private _endValue : T

    /**
     * The accumulator.
     */
    private _acc : number = 0

    /**
     * The function used for interpolating the tween.
     */
    private _interpolator : (start: T, end: T, t: number) => T

    /**
     * The function called when we update the tween.
     */
    private _onUpdate? : (value : T) => void

    /**
     * The function called when we end the tween.
     */
    private _onEnd? : () => void

    /**
     * Whether this tween is active.
     */
    private _active : boolean = true

    /**
     * Constructs a new tween.
     * @param opts The options to pass.
     */
    constructor(opts: {
        startValue: T,
        endValue: T,
        duration: number,
        interpolator: (start: T, end: T, t: number) => T,
        onUpdate?: (value: T) => void,
        onEnd?: () => void
    }) {
        const { duration, startValue, endValue, interpolator, onUpdate, onEnd } = opts

        this._duration = duration
        this._value = startValue
        this._startValue = startValue
        this._endValue = endValue
        this._interpolator = interpolator
        this._onUpdate = onUpdate
        this._onEnd = onEnd
    }

    /**
     * Binds a tween to a game.
     * @param game The game.
     */
    bind(game: Game) : void {
        game.addTween(this)
    }

    /**
     * Gets whether this tween is active.
     */
    get active() : boolean {
        return this._active
    }

    /**
     * Gets the value of the tween.
     */
    get value() : T {
        return this._value
    }

    /**
     * Kills this tween.
     */
    kill(finish: boolean = true) : void {
        this._active = false

        if (finish) {
            this._value = this._endValue
            if (this._onEnd !== undefined) {
                this._onEnd()
            }
        }
    }

    /**
     * Steps a tween by the delta time.
     * @param dt The delta time.
     */
    step(dt: number) : void {
        if (!this._active) {
            return
        }

        this._acc += dt / this._duration
        if (this._acc >= 1) {
            this._acc = 1
        }
        
        this._value = this._interpolator(
            this._startValue,
            this._endValue,
            this._acc
        )

        if (this._onUpdate !== undefined) {
            this._onUpdate(this._value)
        }

        if (this._acc >= 1) {
            this._active = false
            if (this._onEnd !== undefined) {
                this._onEnd()
            }
        }
    }
}