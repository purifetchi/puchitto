import { EffectComposer } from "three/examples/jsm/Addons.js"
import { Game } from ".."

/**
 * A generic game system ran every frame.
 */
export interface GameSystem {
    /**
     * Registers the game.
     * @param game The game.
     */
    registerGame: (game: Game) => void

    /**
     * Registers the effects for the effect composer.
     * @param composer The effect composer.
     */
    registerComposerEffects: (composer: EffectComposer) => void

    /**
     * Ticks this system.
     * @param dt The delta time since the last frame.
     */
    tick: (dt: number) => void
}
