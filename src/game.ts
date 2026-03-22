import * as THREE from 'three';
import * as events from "@mary/events";
import { zeroTransform } from './level/transform';
import { InternalPacketTypes } from './networking/packets/internal/internalPacketTypes';
import { readHelloPacket } from './networking/packets/internal/helloPacket';
import { writeJoinPacket, type JoinPacket } from './networking/packets/internal/joinPacket';
import { readLoadPacket } from './networking/packets/internal/loadPacket';
import { writeLoadStatePacket, type LoadStatePacket } from './networking/packets/internal/loadStatePacket';
import { LoadState } from './networking/packets/internal/loadState/loadState';
import { readCreateEntityPacket } from './networking/packets/internal/createEntityPacket';
import { readRemoveEntityPacket } from './networking/packets/internal/removeEntityPacket';
import { CameraObject } from './objects/cameraObject';
import { GameObject } from './objects/gameObject';
import { TweenContract } from './tweening/tweenContract';
import { Input } from './input';
import { EntityFactory } from './level/entityFactory';
import { DataManager } from './data/dataManager';
import { NetworkManager, NetworkReader, NetworkWriter } from './networking';
import { MiniAnticsEnvironment } from './scripting';
import { GameLoader } from '.';
import { CSS3DRenderer, EffectComposer, OutlinePass, OutputPass, RenderPass } from 'three/examples/jsm/Addons.js';

/**
 * The main class for the game.
 */
export abstract class Game {
    /**
     * This game's scene.
     */
    _scene! : THREE.Scene

    /**
     * This game's camera.
     */
    _camera! : CameraObject

    /**
     * The renderer responsible for rendering the scene.
     */
    _renderer! : THREE.WebGLRenderer

    _css3D!: CSS3DRenderer

    /**
     * The clock used for getting the delta time.
     */
    _clock! : THREE.Clock

    /**
     * The objects within this scene.
     */
    _objects : GameObject<unknown>[] = []

    /**
     * The tweens within this scene.
     */
    _tweens : TweenContract[] = []

    /**
     * The raycaster.
     */
    _raycaster! : THREE.Raycaster

    /**
     * The input class.
     */
    _input! : Input

    /**
     * The entity factory.
     */
    _entityFactory! : EntityFactory

    /**
     * The data manager.
     */
    _dataManager! : DataManager

    /**
     * The WebSocket listener.
     */
    _networkManager! : NetworkManager

    /**
     * The base MiniAntics environment.
     */
    private _baseEnvironment : MiniAnticsEnvironment

    /**
     * The effect composer.
     */
    private _composer! : EffectComposer

    /**
     * The outline pass.
     */
    private _outlinePass! : OutlinePass

    /**
     * An event stream for objects to subscribe to.
     */
    eventStream = new events.EventEmitter<{
        connecting: [],
        connected: [],
        connectionFailure: [event: Event],
        loading: [percent: number],
        loaded: [],
        objectAdded: [object: GameObject<unknown>]
    }>()

    /**
     * Constructs a new game.
     * @param opts The options to pass for this game.
     */
    constructor() {
        this._baseEnvironment = this._makeBaseEnvironment()
    }

    /**
     * Runs the game.
     * @param opts The options.
     */
    run(opts: {
        element: HTMLElement,
        server: string
    }) {
        const { element, server } = opts

        this._setupThree()
        this._startNetwork(server)
        this._baseEnvironment = this._makeBaseEnvironment()

        this._renderer.domElement.style.position = "absolute"
        this._css3D.domElement.style.position = "absolute"
        element.appendChild(this._css3D.domElement)
        element.appendChild(this._renderer.domElement)
    }

    /**
     * Sets up THREE
     */
    _setupThree() : void {
        this._scene = new THREE.Scene()

        this._camera = new CameraObject({
            id: 0, // The level always begins with id=1, so the camera can be id=0.
            width: window.innerWidth,
            height: window.innerHeight,
            transform: zeroTransform(),
            visible: true
        })

        this._renderer = new THREE.WebGLRenderer()
        this._css3D = new CSS3DRenderer()
        this._css3D.setSize(window.innerWidth, window.innerHeight)
        this._renderer.setClearColor(0x000000, 0)
        this._clock = new THREE.Clock(true);

        this._renderer.setSize(window.innerWidth, window.innerHeight)
        this._renderer.setAnimationLoop(this.render.bind(this))
        this._setupEffectPipeline()

        this._input = new Input()
        this._raycaster = new THREE.Raycaster()
        this._dataManager = new DataManager()
        this._entityFactory = new EntityFactory(this)
        this.registerCustomEntities(this._entityFactory)

        this._addDefaultEventStreamListeners()

        window.addEventListener('resize', this._resize.bind(this))
    }

    /**
     * Sets up the effect pipeline.
     */
    private _setupEffectPipeline() {
        this._outlinePass = new OutlinePass(this._getResolution(), this._scene, this._camera.camera)
        this._composer = new EffectComposer(this._renderer)
        this._composer.addPass(new RenderPass(this._scene, this._camera.camera))
        this._composer.addPass(this._outlinePass)
        this.addCustomPasses(this._composer)
        this._composer.addPass(new OutputPass())
    }

    /**
     * Invoked to add custom passes. Added after the render and outline passes have been added.
     * @param composer The effect composer.
     */
    protected addCustomPasses(composer: EffectComposer) {

    }

    /**
     * Called when we want to register custom entities within the entity factory.
     * @param factory The entity factory.
     */
    protected registerCustomEntities(factory: EntityFactory) {

    }

    /**
     * Starts the network stack.
     */
    _startNetwork(url: string) : void {
        this._networkManager = new NetworkManager({
            url: url,
            game: this
        })

        this._addDefaultPacketHandlers()

        this.eventStream.emit("connecting")
        this._networkManager.start()
    }

    /**
     * Called when the viewport resizes.
     */
    _resize() : void {
        const { x, y } = this._getResolution()
        this._camera.resize(x, y)
        this._css3D.setSize(x, y)
        this._renderer.setSize(x, y)
        this._composer.setSize(x, y)
    }

    /**
     * Gets the current resolution of the window.
     * @returns The resolution.
     */
    _getResolution() : THREE.Vector2 {
        return new THREE.Vector2(window.innerWidth, window.innerHeight)
    }

    /**
     * Adds a new game object.
     * @param object The object to add.
     */
    addObject<T extends GameObject<unknown>>(object : T) : T | undefined {
        if (this.getObjectById(object.id) !== undefined) {
            return
        }

        this._objects = [ ...this._objects, object ]
        object.setGame(this)

        if (object.threeObject !== undefined) {
            this._scene.add(object.threeObject)
        }

        this.eventStream.emit('objectAdded', object)
        object.onSceneAdded()

        return object
    }

    /**
     * Gets an object by its id.
     * @param id The ID.
     */
    getObjectById(id: number) : GameObject<unknown> | undefined {
        const obj = this._objects.find(o => o.id == id)
        return obj
    }

    /**
     * Gets an object by its name.
     * @param id The name.
     */
    getObjectByName(name: string) : GameObject<unknown> | undefined {
        const obj = this._objects.find(o => o.name == name)
        return obj
    }

    /**
     * Removes an object from the scene.
     * @param object The object to remove.
     */
    removeObject(object : GameObject<unknown>) : void {
        this._objects = this._objects.filter(o => o.id != object.id)
        this._scene.remove(object.threeObject)
        object.destroy()
    }

    /**
     * Casts a ray into the scene and gets the objects that have been intersected with.
     * @returns The list of intersected objects
     */
    raycast() : THREE.Intersection[] {
        const pointer = new THREE.Vector2(
            (this.input.pointerPosition.x / window.innerWidth) * 2 - 1,
            -(this.input.pointerPosition.y / window.innerHeight) * 2 + 1
        )

        this._raycaster.setFromCamera(
            pointer,
            this._camera.camera
        )

        const intersects = this._raycaster.intersectObjects(
            this._scene.children
        )

        return intersects
    }

    /**
     * Adds a tween.
     * @param tween The tween to add.
     */
    addTween(tween : TweenContract) : void {
        this._tweens.push(tween)
    }

    /**
     * Removes a tween.
     * @param tween The tween to remove.
     */
    removeTween(tween : TweenContract) : void {
        this._tweens.filter(t => t != tween)
    }

    /**
     * Makes a child environment from a parent MiniAntics environment.
     * @returns The new child environment.
     */
    makeChildEnvironment() : MiniAnticsEnvironment {
        const newEnv = new MiniAnticsEnvironment(this._baseEnvironment)
        return newEnv
    }

    /**
     * Gets the input system.
     */
    get input() : Input {
        return this._input
    }

    /**
     * Steps all the tweens in the scene.
     */
    private _stepTweens(dt: number) : void {
        const tweensToRemove = []
        for (const tween of this._tweens) {
            tween.step(dt)

            if (!tween.active) {
                tweensToRemove.push(tween)
            }
        }

        for (const tween of tweensToRemove) {
            this.removeTween(tween)
        }
    }

    /**
     * Called by the game when it wants to register custom MiniAntics methods.
     * @param env The MiniAntics environment.
     */
    protected registerCustomMiniAnticsMethods(env: MiniAnticsEnvironment) {

    }

    /**
     * Makes the base MiniAntics environment.
     */
    private _makeBaseEnvironment() : MiniAnticsEnvironment {
        const environment = new MiniAnticsEnvironment()

        environment.set("progn", (...args : any[]) => args.length > 1 ? args[args.length - 1] : undefined)
        environment.set("pass", () => {})

        environment.set("+", (a: any, b: any) => a + b)
        environment.set("-", (a: any, b: any) => a - b)
        environment.set("*", (a: any, b: any) => a * b)
        environment.set("/", (a: any, b: any) => a / b)
        environment.set("not", (a: any) => !a)
        environment.set("null?", (a: any) => a === undefined || a === null)
        environment.set("equal?", (a: any, b: any) => a == b)
        environment.set("different?", (a: any, b: any) => a !== b)
        environment.set("print", (a: string) => console.log(`[MiniAntics] ${a}`))

        environment.set("get-obj-by-name", (name: string) => this.getObjectByName(name))
        environment.set("get-obj-by-id", (id: number) => this.getObjectById(id))

        this._registerClientSpecificMiniAnticsActions(environment)
        this._registerNetworkSpecificMiniAnticsActions(environment)

        this.registerCustomMiniAnticsMethods(environment)

        return environment
    }

    /**
     * Registers the MiniAntics methods specific to the client.
     */
    private _registerClientSpecificMiniAnticsActions(environment : MiniAnticsEnvironment) {
        environment.set("get-dom", (a: string) => document.getElementById(a))

        environment.set("get-saved", (key: string) => localStorage.getItem(key))
        environment.set("set-saved", (key: string, value: string) => localStorage.setItem(key, value))
    }

    /**
     * Registers network-specific MiniAntics methods.
     * @param environment The MiniAntics environment.
     */
    private _registerNetworkSpecificMiniAnticsActions(environment : MiniAnticsEnvironment) {
        environment.set("net-write-i32", (value: number, nw: NetworkWriter) => {
            nw.writeInt32(value)
            return nw
        })

        environment.set("net-write-bool", (value: boolean, nw: NetworkWriter) => {
            nw.writeBoolean(value)
            return nw
        })

        environment.set("net-write-f32", (value: number, nw: NetworkWriter) => {
            nw.writeFloat(value)
            return nw
        })

        environment.set("net-write-str", (value: string, nw: NetworkWriter) => {
            nw.writeString(value)
            return nw
        })

        environment.set("net-read-i32", (nr: NetworkReader) => nr.readInt32())
        environment.set("net-read-bool", (nr: NetworkReader) => nr.readBoolean())
        environment.set("net-read-f32", (nr: NetworkReader) => nr.readFloat())
        environment.set("net-read-str", (nr: NetworkReader) => nr.readString())
    }

    /**
     * Called when the game wants to register custom event handlers.
     */
    protected registerCustomEventStreamHandlers() {

    }

    /**
     * Adds the default event stream listeners.
     */
    private _addDefaultEventStreamListeners() {
        this.eventStream.on("loaded", () => {
            this._networkManager.send<LoadStatePacket>({
                type: InternalPacketTypes.LOAD_STATE_UPDATE,
                state: LoadState.LOADED
            }, writeLoadStatePacket)
        })

        this.registerCustomEventStreamHandlers()
    }

    /**
     * Called when the game wants to register custom packet handlers.
     */
    protected registerCustomPacketHandlers() : void {

    }

    /**
     * Adds the default packet handlers.
     */
    private _addDefaultPacketHandlers() {
        this._networkManager.addPacketHandler(InternalPacketTypes.HELLO, async (nr, game) => {
            const helloPacket = readHelloPacket(nr)
            console.log(`[Network::hello] Connected to ${helloPacket.branding} running ${helloPacket.gameRules}`)

            this.eventStream.emit("connected")

            this._networkManager.send<JoinPacket>({
                type: InternalPacketTypes.JOIN
            }, writeJoinPacket)
        })

        this._networkManager.addPacketHandler(InternalPacketTypes.LOAD, async (nr, game) => {
            const loadPacket = readLoadPacket(nr)
            console.log(`[Network::load] Server told us to load ${loadPacket.levelName}`)

            this._networkManager.send<LoadStatePacket>({
                type: InternalPacketTypes.LOAD_STATE_UPDATE,
                state: LoadState.STARTED
            }, writeLoadStatePacket)

            await this._dataManager.loadPackage(loadPacket.levelName)

            const gameLoader = new GameLoader(game)
            await gameLoader.load()
        })

        this._networkManager.addPacketHandler(InternalPacketTypes.CREATE_ENTITY, async (nr, game) => {
            const packet = readCreateEntityPacket(nr)
            this._entityFactory.createFromCreateEntityPacket(packet)
        })

        this._networkManager.addPacketHandler(InternalPacketTypes.REMOVE_ENTITY, async (nr, game) => {
            const packet = readRemoveEntityPacket(nr)
            const object = this.getObjectById(packet.id)
            if (object === undefined) {
                console.error(`[Network::removeEntity] Got told to remove non-existant entity ${packet.id}`)
                return
            }

            this.removeObject(object)
        })

        this._networkManager.addPacketHandler(InternalPacketTypes.MINIANTICS_RPC, async (nr, game) => {
            const id = nr.readInt32()
            const rpcName = nr.readString()
            const object = game.getObjectById(id)

            if (object === undefined) {
                console.error(`[Network::miniAnticsRpc] We were told to run RPC ${rpcName} for object ${id} that doesn't exist.`)
                return
            }

            object.handleRpc(rpcName, nr)
        })

        this.registerCustomPacketHandlers()
    }

    /**
     * Handles clickable entities.
     */
    private _handleClickableEntities() {
        if (!this.input.hasMovedMouse) {
            if (this.input.mousePressed && this._outlinePass.selectedObjects.length > 0) {
                const [ threeObject ] = this._outlinePass.selectedObjects
                const gameObject = this.getObjectById(threeObject.userData["id"])
                gameObject?.runAntics("click")
            }
            return
        }

        let gameObject
        for (const obj of this.raycast()) {
            let actualObj = obj.object
            if (actualObj.type == "Mesh" && actualObj.parent !== null) {
                actualObj = actualObj.parent
            }

            if (actualObj.userData["clickable"] !== true) {
                continue
            }

            gameObject = this.getObjectById(actualObj.userData["id"])
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
            if (this.input.mousePressed) {
                gameObject.runAntics("click")
            }
        } else {
            if (this._outlinePass.selectedObjects.length > 0) {
                this._outlinePass.selectedObjects = []
            }
        }
    }

    /**
     * Ticks all the objects and renders the scene.
     */
    render() : void {
        const dt = this._clock.getDelta()
        for (const object of this._objects) {
            object.tick(dt)
        }

        this._stepTweens(dt)
        this._handleClickableEntities()

        this._composer.render(dt)
        this._css3D.render(this._scene, this._camera.camera)
        this._input.reset()
    }
}
