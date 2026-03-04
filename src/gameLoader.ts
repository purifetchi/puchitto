import * as THREE from 'three';
import type Game from "./game.js";
import type Level from "./level/level.js";
import type LightData from "./level/lightData.js";

/**
 * The level parser.
 */
export default class GameLoader {
    /**
     * The game to load the entities to.
     */
    private _game : Game

    /**
     * The amount of entities we're currently waiting on.
     */
    private _awaitedEntities : number = 0

    /**
     * The total number of entities in the world.
     */
    private _totalEntities : number = 0

    /**
     * Constructs a new level parser for a game.
     * @param game The game.
     */
    constructor(game: Game) {
        this._game = game
    }

    /**
     * Loads a level from the ALF path.
     * @param path The path.
     */
    async load() {
        this._game.eventStream.emit("loading", 0)

        const jsonString = this._game._dataManager.getStringLumpData("/level.json")
        const level = JSON.parse(jsonString) as Level

        this._loadLevel(level)
    }

    /**
     * Loads a level.
     * @param level The level.
     */
    private _loadLevel(level: Level) {
        this._setAmbient(level.ambient)

        this._totalEntities = level.ents.length
        this._awaitedEntities = this._totalEntities

        for (const ent of level.ents) {
            const createdEntity = this._game._entityFactory.createFromLevelDefinition(ent)
            if (createdEntity !== undefined && !createdEntity.attached) {
                const cleanup = createdEntity.eventStream.on("attached", () => {
                    this._tickOneLoadedEntity()
                    cleanup()
                })
            } else {
                this._tickOneLoadedEntity()
            }
        }
    }

    /**
     * Ticks off one more loaded entity.
     */
    private _tickOneLoadedEntity() {
        if (this._awaitedEntities == 0) {
            return
        }

        this._awaitedEntities -= 1
        if (this._awaitedEntities == 0) {
            this._game.eventStream.emit("loaded")
        } else {
            const loadedEnts = this._totalEntities - this._awaitedEntities
            const percentage = loadedEnts / this._totalEntities
            
            this._game.eventStream.emit("loading", percentage)
        }
    }

    /**
     * Sets the ambient light.
     * @param data The ambient light data.
     */
    private _setAmbient(data: LightData) {
        const { color, intensity } = data
        const col = new THREE.Color(color[0], color[1], color[2])
        this._game._scene.add(new THREE.AmbientLight(col, intensity))
    }
}