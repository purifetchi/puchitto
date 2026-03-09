import type { Object3D } from "three"
import { EventEmitter } from "@mary/events"
import type { AnticsDefinition, AnticsOn } from "./anticsDefinition"
import { Game } from "../game"
import { MiniAnticsEnvironment, MiniAnticsScript } from "../scripting"
import { ObjectAntics } from "./objectAntics"
import { GameObjectOptions } from "./gameObjectOptions"
import { NetworkReader, NetworkWriter } from "../networking"
import { InternalPacketTypes } from "../networking/packets/internal/internalPacketTypes"

/**
 * The base game object.
 */
export class GameObject<TEntityData> {
    /**
     * The ID of this game object.
     */
    id : string

    /**
     * The tag this object has.
     */
    tag?: string | undefined

    /**
     * The underlying THREE object.
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
     * @param name The name of the antics script to execute.
     */
    runAntics(on: AnticsOn, name?: string) {
        for (const antic of this._objectAntics) {
            if (antic.on !== on) {
                continue
            }

            if (name !== undefined && antic.name !== name) {
                continue
            }

            antic.script.run(this._environment!)
        }
    }

    /**
     * Handles an incoming RPC.
     * @param name The name of the RPC.
     * @param nr The network reader.
     */
    handleRpc(name: string, nr: NetworkReader) {
        this._environment.set("reader", nr)
        this.runAntics("rpc", name)
        this._environment.set("reader", undefined)
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
                name: def.name ?? "",
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
     * Allows the object to set its own MiniAntics values.
     * @param env The environment.
     */
    protected setupCustomMiniAnticsEnvironment(env: MiniAnticsEnvironment) {

    }

    /**
     * Sets up the MiniAntics environment.
     */
    private _setupMiniAntics() : void {
        this._environment = this.game.makeChildEnvironment()
        this._environment.set("self", this)
        this._environment.set("invoke-rpc", (name: string) => {
            return this._beginMiniAnticsRpcCall(name)
        })
        this._environment.set("send", (nw: NetworkWriter) => {
            this._finishMiniAnticsRpcCall(nw)
        })
        this.setupCustomMiniAnticsEnvironment(this._environment)
    }

    /**
     * Begins a MiniAntics RPC call.
     * @param name The name of the RPC.
     */
    private _beginMiniAnticsRpcCall(name: string): NetworkWriter {
        const nw = this.game._networkManager.beginManualSend(InternalPacketTypes.MINIANTICS_RPC)
        nw.writeString(this.id) // TODO: This should be a number.
        nw.writeString(name)

        return nw
    }

    /**
     * Finishes a MiniAntics RPC call.
     * @param nw The network writer.
     */
    private _finishMiniAnticsRpcCall(nw: NetworkWriter) {
        this.game._networkManager.finishManualSend(nw)
    }

    /**
     * Attaches this object to the THREE scene.
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
