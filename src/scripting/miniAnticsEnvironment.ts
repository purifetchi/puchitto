/**
 * The execution environment for miniantics.
 */
export class MiniAnticsEnvironment {
    /**
     * The parent for this environment
     */
    parent?: MiniAnticsEnvironment

    /**
     * The values stored within this environment
     */
    globs: Record<string, any>

    constructor(parent? : MiniAnticsEnvironment) {
        this.parent = parent
        this.globs = {}
    }

    /**
     * Sets a value in the environment.
     * @param key The key
     * @param value The value
     */
    set(key: string, value: any) {
        this.globs[key] = value
    }

    /**
     * Gets a value from the environment, bubbling up the parent chain.
     * @param key The key.
     * @returns Either a value or undefined.
     */
    get(key: string) : any | undefined {
        if (key in this.globs) {
            return this.globs[key]
        }

        return this.parent?.get(key)
    }
}
