import { LoadingManager } from "three";
import { GameObject } from "../gameObject";

/**
 * A generic constructor type that accepts any arguments and returns an instance of T.
 * @template T - The base type to construct
 */
export type GConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Interface defining the contract for objects that manage asset loading.
 */
export interface AssetLoading {
    /**
     * Type marker indicating this class implements asset loading sentinel behavior.
     * */
    IS_ASSET_LOADING: 'true';

    /**
     * Optional LoadingManager instance for managing asset loads.
     * */
    loader?: LoadingManager;

    /**
     * Signals the beginning of an asset load operation.
     * Increments the internal pending asset counter.
     */
    beginAssetLoad(): void;

    /**
     * Signals the completion of an asset load operation.
     * Decrements the internal pending asset counter and emits 'loadedAssets'
     * event when the counter reaches zero.
     */
    finishAssetLoad(): void;
}

/**
 * Mixin that adds asset loading sentinel behavior to a GameObject subclass.
 * Tracks pending asset loads and emits a 'loadedAssets' event when all assets
 * have finished loading.
 *
 * @template T The base class to extend
 * @param Base The base class to mix into (must extend GameObject)
 * @returns A new class with asset loading capabilities
 */
export function AssetLoading<T extends GConstructor<GameObject>>(Base: T): T & GConstructor<AssetLoading> {
    const Klass = class extends Base implements AssetLoading {
        /**
         * Type marker for asset loading sentinel.
         * */
        IS_ASSET_LOADING: "true" = 'true'

        /**
         * LoadingManager for managing asset loading.
         * */
        private _loader?: LoadingManager

        /**
         * Counter for pending asset load operations.
         * */
        private _pendingAssets: number = 0

        /**
         * Creates an AssetLoading instance.
         * @param args - Arguments passed to the base class constructor
         */
        constructor(...args: any[]) {
            super(...args)

            const opts = args[0]
            if (opts?.loader) {
                this._loader = opts.loader
            }
        }

        /**
         * Gets the associated LoadingManager instance.
         * @returns The LoadingManager if provided, undefined otherwise
         */
        get loader() {
            return this._loader
        }

        /**
         * Increments the pending asset counter.
         * Call this before starting an asset load operation.
         */
        beginAssetLoad() {
            this._pendingAssets++
        }

        /**
         * Decrements the pending asset counter.
         * When the counter reaches zero, emits the 'loadedAssets' event.
         * Will not decrement below zero.
         */
        finishAssetLoad() {
            this._pendingAssets = Math.max(this._pendingAssets - 1, 0)
            if (this._pendingAssets <= 0) {
                this.eventStream.emit('loadedAssets')
            }
        }
    }

    return Klass as any
}
