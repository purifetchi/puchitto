import * as THREE from 'three';
import * as events from "@mary/events";
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
import { CSS3DRenderer, EffectComposer, OutputPass, RenderPass } from 'three/examples/jsm/Addons.js';
import { KeepAlivePacket } from './networking/packets/internal/keepAlivePacket';
import { NetworkListener } from './networking/networkListener';
import { GameSystem } from './systems/gameSystem';
import { InteractableObjectSystem } from './systems/interactableObjectSystem';
import { AudioListenerObject } from './objects/audioListenerObject';
import { RealmInfoObject } from './objects/realmInfoObject';

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
     * The objects within this scene.
     */
    _objects : GameObject[] = []

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
     * The renderer responsible for rendering the scene.
     */
    private _renderer! : THREE.WebGLRenderer

    /**
     * The CSS3D renderer. (TODO: This should be opt-in.)
     */
    private _css3D!: CSS3DRenderer

    /**
     * The clock used for getting the delta time.
     */
    private _clock! : THREE.Clock

    /**
     * The tweens within this scene.
     */
    private _tweens : TweenContract[] = []

    /**
     * The raycaster.
     */
    private _raycaster! : THREE.Raycaster

    /**
     * The input class.
     */
    private _input! : Input

    /**
     * The base MiniAntics environment.
     */
    private _baseEnvironment : MiniAnticsEnvironment

    /**
     * The effect composer.
     */
    private _composer? : EffectComposer

    /**
     * The parent element.
     */
    private _parentElement! : HTMLElement

    /**
     * The registered game systems.
     */
    private _gameSystems: GameSystem[] = []

    /**
     * The resize observer for the parent DOM element.
     */
    private _resizeObserver!: ResizeObserver

    /**
     * A helper map from IDs to the given game objects.
     */
    private _objectIdMap: Map<number, GameObject> = new Map<number, GameObject>()

    /**
     * The last internal id.
     */
    private _lastInternalId: number = 0

    /**
     * The audio listener.
     */
    private _listener?: AudioListenerObject

    /**
     * The default realm location as told by the server's hello packet.
     */
    private _defaultRealmLocation? : string

    /**
     * Whether we have already joined a realm.
     */
    private _hasJoined : boolean = false

    /**
     * An event stream for objects to subscribe to.
     */
    eventStream = new events.EventEmitter<{
        connecting: [],
        connected: [],
        connectionFailure: [event: Event],
        disconnected: [event: Event],
        loading: [percent: number],
        loaded: [],
        sceneCreated: [],
        objectAttached: [object: GameObject],
        objectRemoved: [object: GameObject]
    }>()

    /**
     * Constructs a new game.
     * @param opts The options to pass for this game.
     */
    constructor() {
        this._baseEnvironment = this._makeBaseEnvironment()
    }

    /**
     * Returns the parent element for the game.
     */
    get parentElement() : HTMLElement {
        return this._parentElement
    }

    /**
     * Runs the game.
     * @param opts The options.
     */
    run(opts: {
        element: HTMLElement,
        server: string,
        listenerFactory?: (url: string) => NetworkListener
    }) {
        const { element, server, listenerFactory } = opts

        this._parentElement = element

        this._setupThree()
        this._startNetwork(server, listenerFactory)
        this._baseEnvironment = this._makeBaseEnvironment()

        this._renderer.domElement.style.position = "absolute"
        this._css3D.domElement.style.position = "absolute"
        element.appendChild(this._css3D.domElement)
        element.appendChild(this._renderer.domElement)
    }

    /**
     * Creates a blank scene.
     */
    createScene() : void {
        if (this._objects.length > 0) {
            for (const obj of this._objects) {
                this._scene.remove(obj.threeObject)
                obj.destroy()
            }
        }

        this._objects = []
        this._objectIdMap.clear()
        this._lastInternalId = 0

        this._scene = new THREE.Scene()
        this._camera = this.createDefaultCamera()

        // Create the main audio listener
        this._listener = this._entityFactory.create("pch_audio_listener", this.getNextInternalId(), {})
        if (this._listener !== undefined) {
            this.addObject(this._listener)
        }

        this.eventStream.emit('sceneCreated')
    }

    /**
     * Gets the audio listener object.
     */
    get audioListener(): AudioListenerObject | undefined {
        return this._listener
    }

    /**
     * Sets the main camera.
     * @param camera The camera to use as the main camera.
     */
    setMainCamera(camera: CameraObject) {
        this._camera = camera
        this._listener?.parent(camera)

        // Resize the camera to fit the viewport.
        const res = this._getResolution()
        camera.resize(res.x, res.y)

        if (this._composer !== undefined) {
            this._composer.reset()
            this._composer.dispose()
        }

        this._setupEffectPipeline()
    }

    /**
     * Creates the default camera.
     */
    protected createDefaultCamera(): CameraObject {
        const camera = this._entityFactory.create("camera", this.getNextInternalId(), {})! as CameraObject
        this.addObject(camera)

        const res = this._getResolution()
        camera.resize(res.x, res.y)

        return camera
    }

    /**
     * Creates the default camera.
     */
    protected resolveMainCamera(): CameraObject {
        // First, check if we have a realm_info entity.
        const objects = this.getObjectsOfType("realm_info")
        if (objects.length < 1) {
            console.warn(`[Game::resolveMainCamera] No default camera found! Falling back to the default camera...`)
            return this._camera
        }

        const realmInfo = objects[0] as RealmInfoObject
        if (realmInfo.defaultCamera !== undefined) {
            const camera = this.getObjectById(realmInfo.defaultCamera)
            if (camera instanceof CameraObject) {
                return camera
            }
        }

        // Get the camera reference
        console.warn(`[Game::resolveMainCamera] Failed to resolve camera with id ${realmInfo.defaultCamera}, defaulting to first found...`)

        const potentialCameras = this.getObjectsOfType("camera")
        const firstCamera = potentialCameras.find(v => !v.isLocalObject) as CameraObject

        return firstCamera ?? this._camera
    }

    /**
     * Sets up THREE
     */
    _setupThree() : void {
        const res = this._getResolution()

        this._renderer = new THREE.WebGLRenderer()
        this._css3D = new CSS3DRenderer()
        this._css3D.setSize(res.x, res.y)
        this._renderer.setClearColor(0x000000, 0)
        this._clock = new THREE.Clock(true);

        this._renderer.setSize(res.x, res.y)
        this._renderer.setAnimationLoop(this.render.bind(this))

        this._input = new Input(this._renderer.domElement)
        this._raycaster = new THREE.Raycaster()
        this._dataManager = new DataManager()
        this._entityFactory = new EntityFactory(this)
        this.registerCustomEntities(this._entityFactory)

        this._addDefaultEventStreamListeners()
        this._resizeObserver = new ResizeObserver(() => {
            this._resize()
        })
        this._resizeObserver.observe(this._parentElement)

        this.registerCustomGameSystems()
        this.createScene()
    }

    /**
     * Sets up the effect pipeline.
     */
    private _setupEffectPipeline() {
        this._composer = new EffectComposer(this._renderer)
        this._composer.addPass(new RenderPass(this._scene, this._camera.camera))

        for (const system of this._gameSystems) {
            system.registerComposerEffects(this._composer)
        }

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
     * Registers custom game systems.
     */
    protected registerCustomGameSystems() {
        this.addGameSystem(new InteractableObjectSystem())
    }

    /**
     * Adds a game system into the game system stack.
     * @param system The game system.
     */
    addGameSystem(system: GameSystem) {
        system.registerGame(this)
        this._gameSystems.push(system)
    }

    /**
     * Begins connecting.
     */
    connect() {
        this.eventStream.emit("connecting")
        this._networkManager.start()
    }

    /**
     * Starts the network stack.
     */
    _startNetwork(
        url: string,
        listenerFactory?: (url: string) => NetworkListener
    ) : void {
        this._networkManager = new NetworkManager({
            url: url,
            game: this,
            listenerFactory: listenerFactory
        })

        this._addDefaultPacketHandlers()
        this.connect()
    }

    /**
     * Called when the viewport resizes.
     */
    _resize() : void {
        const { x, y } = this._getResolution()
        this._camera.resize(x, y)
        this._css3D.setSize(x, y)
        this._renderer.setSize(x, y)
        this._composer?.setSize(x, y)
    }

    /**
     * Gets the current resolution of the window.
     * @returns The resolution.
     */
    _getResolution() : THREE.Vector2 {
        return new THREE.Vector2(
            this._parentElement.clientWidth,
            this._parentElement.clientHeight
        )
    }

    /**
     * Adds a new game object.
     * @param object The object to add.
     */
    addObject<T extends GameObject>(object : T) : T | undefined {
        if (this.getObjectById(object.id) !== undefined) {
            return
        }

        this._objects.push(object)
        this._objectIdMap.set(object.id, object)
        object.setGame(this)
        object.onSceneAdded()

        return object
    }

    /**
     * Gets an object by its id.
     * @param id The ID.
     */
    getObjectById(id: number) : GameObject | undefined {
        return this._objectIdMap.get(id)
    }

    /**
     * Gets an object by its name.
     * @param id The name.
     */
    getObjectByName(name: string) : GameObject | undefined {
        const obj = this._objects.find(o => o.name == name)
        return obj
    }

    /**
     * Gets all the objects of a given type.
     * @param type The type.
     */
    getObjectsOfType(type: string): GameObject[] {
        const objs = this._objects.filter(o => {
            const objectType = this._entityFactory.resolveType(o)
            return objectType === type
        })

        return objs
    }

    /**
     * Removes an object from the scene.
     * @param object The object to remove.
     */
    removeObject(object : GameObject) : void {
        this._objects = this._objects.filter(o => o.id != object.id)
        this._objectIdMap.delete(object.id)

        this._scene.remove(object.threeObject)

        this.eventStream.emit("objectRemoved", object)

        object.destroy()
    }

    /**
     * Gets the NDC pointer position.
     * TODO: Should this be here?
     */
    getNdcPosition() {
        const res = this._getResolution()
        const rect = this._parentElement.getBoundingClientRect()

        return new THREE.Vector2(
            ((this.input.pointerPosition.x - rect.left) / res.x) * 2 - 1,
            -((this.input.pointerPosition.y - rect.top) / res.y) * 2 + 1
        )
    }

    /**
     * Casts a ray into the scene and gets the objects that have been intersected with.
     * @returns The list of intersected objects
     */
    raycast() : THREE.Intersection[] {
        const pointer = this.getNdcPosition()

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
        this._tweens = this._tweens.filter(t => t != tween)
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
     * Gets the next internal entity ID.
     * @returns The ID of the internal entity.
     */
    protected getNextInternalId(): number {
        return --this._lastInternalId
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
        environment.set("is-server", false)
        environment.set("join", (realm: string) => {
            this.joinRealm(realm)
        })

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
        this.eventStream.on("loaded", this._onRealmLoadedInternal.bind(this))

        this.registerCustomEventStreamHandlers()
    }

    /**
     * Called when the game wants to register custom packet handlers.
     */
    protected registerCustomPacketHandlers() : void {

    }

    /**
     * Called when the realm finished loading.
     */
    private _onRealmLoadedInternal(): void {
        const newCamera = this.resolveMainCamera()
        if (newCamera !== this._camera) {
            this.setMainCamera(newCamera)
        }

        this._networkManager.send<LoadStatePacket>({
            type: InternalPacketTypes.LOAD_STATE_UPDATE,
            state: LoadState.LOADED
        }, writeLoadStatePacket)
    }

    /**
     * Sends a join packet to the server. If no link is given, the server's
     * default realm is used when joining for the first time.
     * @param link The realm link to join.
     */
    joinRealm(link?: string) : void {
        const target = link ?? (this._hasJoined ? undefined : this._defaultRealmLocation)
        if (target === undefined) {
            throw new Error("[Game::joinRealm] No realm link was specified and we have no default realm to fall back to!")
        }

        this._hasJoined = true

        this._networkManager.send<JoinPacket>({
            type: InternalPacketTypes.JOIN,
            link: target
        }, writeJoinPacket)
    }

    /**
     * Adds the default packet handlers.
     */
    private _addDefaultPacketHandlers() {
        this._networkManager.addPacketHandler(InternalPacketTypes.HELLO, async (nr, game) => {
            const helloPacket = readHelloPacket(nr)
            console.log(`[Network::hello] Connected to ${helloPacket.branding} running ${helloPacket.gameRules}`)
            this._defaultRealmLocation = helloPacket.defaultRealmLocation

            this.eventStream.emit("connected")

            this.joinRealm(helloPacket.defaultRealmLocation)
        })

        this._networkManager.addPacketHandler(InternalPacketTypes.LOAD, async (nr, game) => {
            // Emit the initial loading event, to signify that we are, in fact, loading.
            this.eventStream.emit("loading", 0)

            const loadPacket = readLoadPacket(nr)
            console.log(`[Network::load] Server told us to load ${loadPacket.levelName}`)

            this._networkManager.send<LoadStatePacket>({
                type: InternalPacketTypes.LOAD_STATE_UPDATE,
                state: LoadState.STARTED
            }, writeLoadStatePacket)

            this.createScene()
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

        this._networkManager.addPacketHandler(InternalPacketTypes.KEEP_ALIVE, async (nr, game) => {
            this._networkManager.send<KeepAlivePacket>({
                type: InternalPacketTypes.KEEP_ALIVE
            }, (_, _1) => {})
        })

        this.registerCustomPacketHandlers()
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
        for (const system of this._gameSystems) {
            system.tick(dt)
        }

        this._composer?.render(dt)
        this._css3D.render(this._scene, this._camera.camera)
        this._input.reset()
    }
}
