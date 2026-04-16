import { EffectComposer, OutlinePass } from "three/examples/jsm/Addons.js";
import { Game, Input, MOUSE_LEFT } from "..";
import { GameSystem } from "./gameSystem";

/**
 * The system responsible for interacting with objects in the scene marked as interactable.
 */
export class InteractableObjectSystem implements GameSystem {
    /**
     * The game.
     */
    private _game!: Game

    /**
     * The game's input system.
     */
    private _input!: Input

    /**
     * The outline pass.
     */
    private _outlinePass! : OutlinePass

    /**
     * Registers the game and caches the input.
     */
    registerGame(game: Game): void {
        this._game = game
        this._input = game.input
    }
    /**
     * Registers the outline pass.
     */
    registerComposerEffects(composer: EffectComposer): void {
        this._outlinePass?.dispose()
        this._outlinePass = new OutlinePass(
            this._game._getResolution(),
            this._game._scene,
            this._game._camera.camera
        )

        composer.addPass(this._outlinePass)
    }

    /**
     * Ticks this system, handing clickable entities.
     */
    tick(): void {
        this._handleClickableEntities()
    }

    /**
     * Handles clickable entities.
     */
    private _handleClickableEntities() {
        if (!this._input.hasMovedMouse) {
            if (this._input.mousePressed(MOUSE_LEFT) && this._outlinePass.selectedObjects.length > 0) {
                const [ threeObject ] = this._outlinePass.selectedObjects
                const gameObject = this._game.getObjectById(threeObject.userData["id"])

                try {
                    gameObject?.runAntics("click")
                } catch (e) {
                    console.error(e, "Caught error while running antics script on click!")
                }
            }
            return
        }

        let gameObject
        for (const obj of this._game.raycast()) {
            let actualObj = obj.object
            if (actualObj.type == "Mesh" && actualObj.parent !== null) {
                actualObj = actualObj.parent
            }

            if (actualObj.userData["clickable"] !== true) {
                continue
            }

            gameObject = this._game.getObjectById(actualObj.userData["id"])
            if (gameObject === undefined) {
                continue
            }

            const threeObject = gameObject.threeObject
            if (this._outlinePass.selectedObjects.length < 1 || this._outlinePass.selectedObjects[0] !== threeObject) {
                this._outlinePass.selectedObjects = [threeObject]
            }

            break
        }

        if (gameObject) {
            if (this._input.mousePressed(MOUSE_LEFT)) {
                try {
                    gameObject?.runAntics("click")
                } catch (e) {
                    console.error(e, "Caught error while running antics script on click!")
                }
            }
        } else {
            if (this._outlinePass.selectedObjects.length > 0) {
                this._outlinePass.selectedObjects = []
            }
        }
    }
}
