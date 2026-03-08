/**
 * Linearly interpolates a float.
 * @param a Start value.
 * @param b End value.
 * @param t The time.
 */
export const lerpFloat = (a: number, b: number, t: number): number => {
    return a + (b - a) * t
}