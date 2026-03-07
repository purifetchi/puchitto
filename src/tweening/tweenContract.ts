/**
 * The default contract for a tween.
 */
export interface TweenContract {
    /**
     * Steps a tween.
     * @param dt The delta time.
     */
    step: (dt: number) => void,

    /**
     * Whether this tween is active
     */
    active : boolean
}
