/**
 * An easing function that smoothly bounces out the value.
 * @param t The current time.
 */
export const easeOutBounce = (t: number): number => {
    const n1 = 7.5625
    const d1 = 2.75

    if (t < 1 / d1) {
        return n1 * t * t
    } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
}