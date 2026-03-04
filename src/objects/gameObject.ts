import type { Object3D } from "three"
import type GameObjectOptions from "./gameObjectOptions.js"
import type Game from "../game.js"
import { EventEmitter } from "@mary/events"
import MiniAnticsEnvironment from "../scripting/miniAnticsEnvironment.js"
import type { AnticsDefinition, AnticsOn } from "./anticsDefinition.js"
import type ObjectAntics from "./objectAntics.js"
import MiniAnticsScript from "../scripting/miniAnticsScript.js"

/**
 * The base game object.
 */
export default class GameObject<TEntityData> {
    /**
     * The ID of this game object.
     */
    id : string

    /**
     * The tag this object has.
     */
    tag?: string | undefined

    /**
     * The underlying THREE.JS object.
     */
    threeObject! : Object3D

    /**
     * 
     */
    game! : Game

    /**
     * Does this local player have authority over the object?
     */
    hasAuthority : boolean

    /**
     * Is this object clickable?
     */
    clickable : boolean = false

    /**
     * Is the current object attached.
     */
    attached : boolean = false

    /**
     * The event stream for this object.
     */
    eventStream = new EventEmitter<{
        attached: []
    }>()

    /**
     * I hate type erasure.
     */
    _dummy? : TEntityData

    /**
     * The MiniAntics environment.
     */
    _environment! : MiniAnticsEnvironment

    /**
     * The antics of this object.
     */
    _objectAntics : ObjectAntics[]

    /**
     * Constructs the game object.
     */
    constructor(opts?: GameObjectOptions & TEntityData) {
        // TODO: IDs should be required not optional!
        this.id = opts?.id!
        this.tag = opts?.tag
        this.hasAuthority = opts?.hasAuthority ?? false
        
        this._objectAntics = this._parseAntics(opts?.antics)

        console.log(`[GameObject::constructor] Constructed object with id ${this.id} and authority ${this.hasAuthority}`)
    }

    /**
     * Runs the antics for this object.
     * @param on The type of antics to execute.
     */
    runAntics(on: AnticsOn) {
        for (const antic of this._objectAntics) {
            if (antic.on !== on) {
                continue
            }

            antic.script.run(this._environment!)
        }
    }

    /**
     * Parses the antics of this object.
     * @param defs The definitions.
     * @returns The list of object antics.
     */
    private _parseAntics(defs: AnticsDefinition[] | undefined) : ObjectAntics[] {
        const antics : ObjectAntics[] = []
        if (defs === undefined) {
            return antics
        }

        for (const def of defs) {
            antics.push({
                on: def.on,
                script: new MiniAnticsScript(def.script)
            })

            // Ensure we make the object clickable if it has any click antics
            if (def.on == "click") {
                this.clickable = true
            }
        }

        return antics
    }

    /**
     * Sets up the MiniAntics environment.
     */
    private _setupMiniAntics() : void {
        this._environment = this.game.makeChildEnvironment()
        this._environment.set("self", this)
    }

    /**
     * Attaches this object to the THREE.JS scene.
     */
    protected _attach() : void {
        this.attached = true
        this.threeObject.userData["id"] = this.id
        this.threeObject.userData["clickable"] = this.clickable
        this.game._scene.add(this.threeObject)
        this.eventStream.emit('attached')

        this.runAntics("attach")
    }

    /**
     * Sets the game for this object.
     * @param game The game.
     */
    setGame(game: Game) {
        this.game = game
        this._setupMiniAntics()
    }
    
    /**
     * Called when the object gets added to the scene.
     */
    onSceneAdded() : void {

    }

    /**
     * Ticks this object's behavior.
     * @param dt The delta tine.
     */
    tick(dt: number) : void {

    }

    /**
     * Called when the object is being destroyed.
     */
    destroy() : void {

    }
}