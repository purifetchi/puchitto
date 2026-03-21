import { Game } from "../game";
import type { CreateEntityPacket } from "../networking/packets/internal/createEntityPacket";
import type { AnticsDefinition } from "../objects/anticsDefinition";
import { AudioObject } from "../objects/audioObject";
import { GameObject } from "../objects/gameObject";
import { GameObjectOptions } from "../objects/gameObjectOptions";
import { LightObject } from "../objects/lightObject";
import { MarkerObject } from "../objects/markerObject";
import { ModelObject } from "../objects/modelObject";
import { LevelEntityDefinition } from "./levelEntityDefinition";
import { jsonTransformToRegularTransform, type Transform } from "./transform";

/**
 * Extracts the data type of the game object.
 */
type ExtractDataType<T> = T extends GameObject<infer C> ? C : never;

/**
 * Defines the constructor of a game object.
 */
type EntityConstructor<T> = new (opts: GameObjectOptions & ExtractDataType<T>) => T;

/**
 * The entity creation definition.
 */
interface EntityDefintionForCreation {
    id: number,
    name?: string
    tag?: string,
    antics?: AnticsDefinition[],
    hasAuthority?: boolean
    transform: Transform,
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
    private _factoryMap : Record<string, (ent: EntityDefintionForCreation) => GameObject<unknown>> = {
        "model":  (ent: EntityDefintionForCreation) => this._constructFromEntityType<ModelObject>(ModelObject, ent),
        "light":  (ent: EntityDefintionForCreation) => this._constructFromEntityType<LightObject>(LightObject, ent),
        "audio":  (ent: EntityDefintionForCreation) => this._constructFromEntityType<AudioObject>(AudioObject, ent),
        "marker": (ent: EntityDefintionForCreation) => this._constructFromEntityType<MarkerObject>(MarkerObject, ent)
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
    registerEntity<T extends GameObject<Record<string, any>>>(type: string, ctor: EntityConstructor<T>) {
        this._factoryMap[type] = (ent) => this._constructFromEntityType<T>(ctor, ent)
    }

    /**
     * Creates an entity from the level definition.
     * @param ent The entity definition.
     * @returns The game object.
     */
    createFromLevelDefinition(ent: LevelEntityDefinition): GameObject<unknown> | undefined {
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
            data: ent.data
        })
    }

    /**
     * Creates an entity from the create entity packet.
     * @param packet The packet.
     */
    createFromCreateEntityPacket(packet: CreateEntityPacket): GameObject<unknown> | undefined {
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
            data: JSON.parse(packet.jsonEntityData)
        })
    }

    /**
     * Constructs an entity given its type, constructor and entity data.
     * @param ctor The constructor of the entity.
     * @param ent The entity data.
     * @returns The constructed entity.
     */
    private _constructFromEntityType<T extends GameObject<Record<string, any>>>(
        ctor: EntityConstructor<T>,
        ent: EntityDefintionForCreation
    ) : T {
        const data = ent.data as ExtractDataType<T>
        const obj = new ctor({
            id: ent.id,
            name: ent.name,
            tag: ent.tag,
            antics: ent.antics,
            loader: this._game._dataManager.mount.manager,
            transform: ent.transform,
            hasAuthority: ent.hasAuthority,
            ...data
        })

        this._game.addObject(obj)

        return obj
    }
}
