import { Game } from "../game";
import type { CreateEntityPacket } from "../networking/packets/internal/createEntityPacket";
import { CameraObject } from "../objects";
import { AmbientLightObject } from "../objects/ambientLightObject";
import type { AnticsDefinition } from "../objects/anticsDefinition";
import { AudioObject } from "../objects/audioObject";
import { GameObject } from "../objects/gameObject";
import { GameObjectOptions } from "../objects/gameObjectOptions";
import { LightObject } from "../objects/lightObject";
import { MarkerObject } from "../objects/markerObject";
import { ModelObject } from "../objects/modelObject";
import { SerializedMetadataProps } from "../serialization";
import { LevelEntityDefinition } from "./levelEntityDefinition";
import { jsonTransformToRegularTransform, unityJsonTransformToRegularTransform, zeroTransform, type TransformData } from "./transformData";

/**
 * Defines the constructor of a game object.
 */
type EntityConstructor<T> = new (opts: GameObjectOptions) => T

/**
 * Defines the type of the unknown entity handler.
 */
export type UnknownEntityHandlerType = (opts: GameObjectOptions, type: string, data: Record<string, any>) => GameObject

/**
 * The entity creation definition.
 */
interface EntityDefintionForCreation {
    id: number,
    name?: string
    tag?: string,
    antics?: AnticsDefinition[],
    hasAuthority?: boolean
    transform: TransformData,
    visible: boolean,
    data: any
}

/**
 * The entity factory responsible for creating entities.
 */
export class EntityFactory {
    /**
     * The currently active game.
     */
    private _game: Game

    /**
     * The map of factories.
     */
    private _factoryMap: Record<string, (ent: EntityDefintionForCreation) => GameObject> = {}

    /**
     * The reverse map from the type of the constructor to the internal type.
     */
    private _typeMap: Record<string, string> = {}

    /**
     * Called if we encounter an unknown entity.
     */
    private _unknownEntityHandler?: UnknownEntityHandlerType

    /**
     * Constructs a new entity factory.
     */
    constructor(game: Game) {
        this._game = game
        this._registerInternalTypes()
    }

    /**
     * Registers internal types.
     */
    private _registerInternalTypes() {
        this.registerEntity<ModelObject>("model", ModelObject)
        this.registerEntity<LightObject>("light", LightObject)
        this.registerEntity<AudioObject>("audio", AudioObject)
        this.registerEntity<MarkerObject>("marker", MarkerObject)
        this.registerEntity<CameraObject>("camera", CameraObject)
        this.registerEntity<AmbientLightObject>("light_ambient", AmbientLightObject)
    }

    /**
     * Resolves the type for a given GameObject.
     * @param obj The game object.
     */
    resolveType(obj: GameObject): string | undefined {
        return this._typeMap[obj.constructor.name]
    }

    /**
     * Registers a handler to run when creating an entity we do not know about.
     * @param handler The handler.
     */
    registerUnknownEntityHandler(handler: UnknownEntityHandlerType) {
        this._unknownEntityHandler = handler
    }

    /**
     * Registers an entity within the factory.
     * @param type The type of the entity, as string
     * @param ctor The constructor.
     */
    registerEntity<T extends GameObject>(type: string, ctor: EntityConstructor<T>) {
        this._factoryMap[type] = (ent) => this._constructFromEntityType<T>(ctor, ent)
        this._typeMap[ctor.name] = type
    }

    create<T extends GameObject>(type: string, id: number, data: Record<string, any>): T | undefined {
        const definition = {
            id: id,
            name: "New Entity",
            antics: [],
            transform: zeroTransform(),
            visible: true,
            data: data
        }

        const createFn = this._factoryMap[type]
        if (createFn === undefined) {
            const maybeUnknownEntity = this._constructUnknownEntity(definition, type)
            if (maybeUnknownEntity !== undefined) {
                return maybeUnknownEntity as T
            }

            console.error(`[EntityFactory::createFromLevelDefinition] Could not find create function for entity type ${type}.`)
            return
        }

        return createFn(definition) as T
    }

    /**
     * Creates an entity from the level definition.
     * @param ent The entity definition.
     * @param version The level definition version.
     * @returns The game object.
     */
    createFromLevelDefinition(ent: LevelEntityDefinition, version: number = 1): GameObject | undefined {
        let transform: TransformData
        if (version < 2) {
            transform = unityJsonTransformToRegularTransform(ent.transform)
        } else {
            transform = jsonTransformToRegularTransform(ent.transform)
        }

        const definition = {
            id: ent.id,
            name: ent.name,
            tag: ent.tag,
            antics: ent.antics,
            transform: transform,
            visible: ent.visible,
            data: ent.data
        }

        const createFn = this._factoryMap[ent.type]
        if (createFn === undefined) {
            const maybeUnknownEntity = this._constructUnknownEntity(definition, ent.type)
            if (maybeUnknownEntity !== undefined) {
                return maybeUnknownEntity
            }

            console.error(`[EntityFactory::createFromLevelDefinition] Could not find create function for entity type ${ent.type}.`)
            return
        }

        return createFn(definition)
    }

    /**
     * Creates an entity from the create entity packet.
     * @param packet The packet.
     */
    createFromCreateEntityPacket(packet: CreateEntityPacket): GameObject | undefined {
        const definition = {
            id: packet.id,
            transform: {
                position: packet.position,
                rotation: packet.rotation,
                scale: packet.scale
            },
            hasAuthority: packet.isOwner,
            visible: true,
            data: JSON.parse(packet.jsonEntityData)
        }

        const createFn = this._factoryMap[packet.entityName]
        if (createFn === undefined) {
            const maybeUnknownEntity = this._constructUnknownEntity(definition, packet.entityName)
            if (maybeUnknownEntity !== undefined) {
                return maybeUnknownEntity
            }

            console.error(`[EntityFactory::createFromLevelDefinition] Could not find create function for entity type ${packet.entityName}.`)
            return
        }

        return createFn(definition)
    }

    /**
     * Constructs an unknown entity.
     * @param ent The entity.
     */
    private _constructUnknownEntity(
        ent: EntityDefintionForCreation,
        type: string
    ): GameObject | undefined {
        if (this._unknownEntityHandler === undefined) {
            return undefined
        }

        const obj = this._unknownEntityHandler({
            id: ent.id,
            name: ent.name,
            tag: ent.tag,
            antics: ent.antics,
            loader: this._game._dataManager.loader,
            transform: ent.transform,
            visible: ent.visible,
            hasAuthority: ent.hasAuthority
        }, type, ent.data)

        this._game.addObject(obj)
        return obj
    }

    /**
     * Constructs an entity given its type, constructor and entity data.
     * @param ctor The constructor of the entity.
     * @param ent The entity data.
     * @returns The constructed entity.
     */
    private _constructFromEntityType<T extends GameObject>(
        ctor: EntityConstructor<T>,
        ent: EntityDefintionForCreation
    ): T {
        const obj = new ctor({
            id: ent.id,
            name: ent.name,
            tag: ent.tag,
            antics: ent.antics,
            loader: this._game._dataManager.loader,
            transform: ent.transform,
            visible: ent.visible,
            hasAuthority: ent.hasAuthority
        })

        const metadata = obj.constructor[Symbol.metadata]
        const serializedProps = metadata?.serializedProps as SerializedMetadataProps | undefined
        if (serializedProps !== undefined) {
            for (const [propName, path] of Object.entries(serializedProps)) {
                // Skip over uninit properties, let them default.
                if (ent.data[path] === undefined) {
                    continue
                }

                const key = propName as keyof T
                obj[key] = ent.data[path]
            }
        }

        this._game.addObject(obj)

        return obj
    }
}
