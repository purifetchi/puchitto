import { Game } from "../game";
import type { CreateEntityPacket } from "../networking/packets/internal/createEntityPacket";
import { CameraObject } from "../objects";
import type { AnticsDefinition } from "../objects/anticsDefinition";
import { AudioObject } from "../objects/audioObject";
import { GameObject } from "../objects/gameObject";
import { GameObjectOptions } from "../objects/gameObjectOptions";
import { LightObject } from "../objects/lightObject";
import { MarkerObject } from "../objects/markerObject";
import { ModelObject } from "../objects/modelObject";
import { SerializedMetadataProps } from "../serialization";
import { LevelEntityDefinition } from "./levelEntityDefinition";
import { jsonTransformToRegularTransform, zeroTransform, type TransformData } from "./transformData";

/**
 * Defines the constructor of a game object.
 */
type EntityConstructor<T> = new (opts: GameObjectOptions) => T;

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
    private _factoryMap: Record<string, (ent: EntityDefintionForCreation) => GameObject> = {
        "model": (ent: EntityDefintionForCreation) => this._constructFromEntityType<ModelObject>(ModelObject, ent),
        "light": (ent: EntityDefintionForCreation) => this._constructFromEntityType<LightObject>(LightObject, ent),
        "audio": (ent: EntityDefintionForCreation) => this._constructFromEntityType<AudioObject>(AudioObject, ent),
        "marker": (ent: EntityDefintionForCreation) => this._constructFromEntityType<MarkerObject>(MarkerObject, ent),
        "camera": (ent: EntityDefintionForCreation) => this._constructFromEntityType<CameraObject>(CameraObject, ent)
    }

    /**
     * Constructs a new entity factory.
     */
    constructor(game: Game) {
        this._game = game
    }

    /**
     * Registers an entity within the factory.
     * @param type The type of the entity, as string
     * @param ctor The constructor.
     */
    registerEntity<T extends GameObject>(type: string, ctor: EntityConstructor<T>) {
        this._factoryMap[type] = (ent) => this._constructFromEntityType<T>(ctor, ent)
    }

    create<T extends GameObject>(type: string, id: number, data: Record<string, any>): T | undefined {
        const createFn = this._factoryMap[type]
        if (createFn === undefined) {
            console.error(`[EntityFactory::createFromLevelDefinition] Could not find create function for entity type ${type}.`)
            return
        }

        return createFn({
            id: id,
            name: "New Entity",
            antics: [],
            transform: zeroTransform(),
            visible: true,
            data: data
        }) as T
    }

    /**
     * Creates an entity from the level definition.
     * @param ent The entity definition.
     * @returns The game object.
     */
    createFromLevelDefinition(ent: LevelEntityDefinition): GameObject | undefined {
        const createFn = this._factoryMap[ent.type]
        if (createFn === undefined) {
            console.error(`[EntityFactory::createFromLevelDefinition] Could not find create function for entity type ${ent.type}.`)
            return
        }

        return createFn({
            id: ent.id,
            name: ent.name,
            tag: ent.tag,
            antics: ent.antics,
            transform: jsonTransformToRegularTransform(ent.transform),
            visible: ent.visible,
            data: ent.data
        })
    }

    /**
     * Creates an entity from the create entity packet.
     * @param packet The packet.
     */
    createFromCreateEntityPacket(packet: CreateEntityPacket): GameObject | undefined {
        const createFn = this._factoryMap[packet.entityName]
        if (createFn === undefined) {
            console.error(`[EntityFactory::createFromLevelDefinition] Could not find create function for entity type ${packet.entityName}.`)
            return
        }

        return createFn({
            id: packet.id,
            transform: {
                position: packet.position,
                rotation: packet.rotation,
                scale: packet.scale
            },
            hasAuthority: packet.isOwner,
            visible: true,
            data: JSON.parse(packet.jsonEntityData)
        })
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
                const key = propName as keyof T
                obj[key] = ent.data[path]
            }
        }

        this._game.addObject(obj)

        return obj
    }
}
