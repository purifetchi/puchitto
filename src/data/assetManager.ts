import { Logger } from "../logging"
import { AudioLoader, Group, LoadingManager } from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { disposeTree } from "../helpers/disposeTree"

/**
 * A single asset definition.
 */
export interface AssetDefinition<T> {
    /**
     * The extensions this definition accepts.
     */
    extensions: string[]

    /**
     * The method invoked to load the asset.
     * @param path The path to the asset.
     * @param ctx The loading context.
     * @returns The promise of the asset.
     */
    loader: (path: string, ctx: AssetContext<T>) => Promise<T>

    /**
     * Instantiates an asset from the definition.
     * @param asset The asset.
     * @returns The instantiated asset.
     */
    instantiate?: (asset: T) => T

    /**
     * Destroys the asset.
     * @param asset The asset.
     */
    destroy?: (asset: T) => void
}

/**
 * The asset context.
 */
export type AssetContext<T> = {
    /**
     * The associated loading manager.
     */
    loader: LoadingManager
}

/**
 * The class responsible for deduplicating loaded assets.
 */
export class AssetManager {
    private readonly _logger = new Logger('Data', 'AssetManager')

    /**
     * The list of registered handlers.
     */
    private _handlers: AssetDefinition<any>[] = []

    /**
     * The list of loads per object.
     */
    private _loads: Map<string, Promise<any>> = new Map()

    /**
     * The loading manager.
     */
    private _loader: LoadingManager

    /**
     * Constructs a new asset manager.
     * @param loader The loading manager.
     */
    constructor(loader: LoadingManager) {
        this._loader = loader

        this._registerDefaultAssetTypes()
    }

    /**
     * Registers the default asset types.
     */
    private _registerDefaultAssetTypes() {
        this.register<Group>({
            extensions: ["obj"],
            loader: async (path, { loader }) => {
                const mtl = await new MTLLoader(loader).loadAsync(path.replace(".obj", ".mtl"))
                const obj = new OBJLoader(loader)
                obj.setMaterials(mtl)
                return obj.loadAsync(path)
            },
            instantiate: master => master.clone(),
            destroy: master => disposeTree(master)
        })

        this.register<Group>({
            extensions: ["fbx"],
            loader: async (path, { loader }) => {
                const obj = new FBXLoader(loader)
                return obj.loadAsync(path)
            },
            instantiate: master => master.clone(),
            destroy: master => disposeTree(master)
        })

        this.register<AudioBuffer>({
            extensions: ["wav", "ogg", "mp3", "flac"],
            loader: async (path, { loader }) => {
                const obj = new AudioLoader(loader)
                return obj.loadAsync(path)
            }
        })
    }

    /**
     * Registers a handler for an asset type.
     * @param definition The definition of the asset loader.
     */
    register<TAsset>(definition: AssetDefinition<TAsset>) {
        this._handlers.push(definition)
    }

    /**
     * Loads a given asset from a path.
     * @param path The path to the asset.
     */
    async load<TAsset>(path: string): Promise<TAsset> {
        // Try to first get the handler
        const handler = this._getHandlerFor<TAsset>(path)
        if (handler === undefined) {
            throw new Error(`Cannot load asset [${path}], as it has no loader defined.`)
        }

        // Look up the pending loads first
        let pending: Promise<TAsset>
        if (this._loads.has(path)) {
            pending = this._loads.get(path)!

            this._logger.log(`Cache hit for ${path}`)
        } else {
            pending = handler.loader(path, { loader: this._loader })

            this._loads.set(path, pending)
            this._logger.warn(`Cache miss for ${path}`)
        }

        const value = await pending

        // If we don't have an instantiation method, it defaults to identity.
        return handler.instantiate !== undefined
            ? handler.instantiate(value)
            : value
    }

    /**
     * Clears the loaded assets.
     */
    clear() {
        for (const load of this._loads.entries()) {
            const [path, promise] = load
            promise.then(p => {
                const handler = this._getHandlerFor(path)
                if (handler.destroy !== undefined) {
                    handler.destroy(p)
                }
            })
        }

        this._logger.log(`Disposed ${this._loads.size} cached assets.`)
        this._loads.clear()
    }

    /**
     * Gets an extension for a path.
     * @param path The path.
     * @returns The extension.
     */
    private _getExtension(path: string): string {
        const parts = path.split('.')
        const extension = parts[parts.length - 1].toLowerCase().trim()
        return extension
    }

    /**
     * Gets a typed handler for an asset by its extension.
     * @param path The path.
     * @returns The handler.
     */
    private _getHandlerFor<TAsset>(path: string): AssetDefinition<TAsset> {
        const extension = this._getExtension(path)
        const handler = this._handlers.find(h => {
            return h.extensions.indexOf(extension) >= 0
        })

        return handler as AssetDefinition<TAsset>
    }
}
