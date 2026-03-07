import AlfMount from "./alf/alfMount.js"
import AlfPackage from "./alf/alfPackage.js"

/**
 * The manager for currently loaded data.
 */
export default class DataManager {
    /**
     * The current package.
     */
    private _currentPackage?: AlfPackage

    /**
     * The current mount.
     */
    private _mount?: AlfMount

    /**
     * The alf mount.
     */
    get mount(): AlfMount {
        if (this._mount === undefined) {
            throw new Error("[DataManager::get_mount] No file mounted.")
        }

        return this._mount
    }

    /**
     * Loads a new package.
     * @param path The path to the package
     */
    async loadPackage(path: string) {
        this._currentPackage?.dispose()
        this._mount?.dispose()

        console.log(`[DataManager::loadPackage] Loading ${path}...`)
        this._currentPackage = await AlfPackage.fetch(path)
        this._mount = new AlfMount(this._currentPackage)
    }

    /**
     * Gets the string lump data.
     * @param path The path to the lump.
     */
    getStringLumpData(path: string): string {
        if (this._currentPackage === undefined) {
            throw new Error("[DataManager::getStringLumpData] No file mounted.")
        }

        const lump = this._currentPackage.getLump(path)
        if (lump === undefined) {
            throw new Error(`[EntityFactory::getStringLumpData] Lump ${path} wasn't found.`)
        }

        const data = this._currentPackage.read(lump)
        const decoder = new TextDecoder('utf-8')
        const stringData = decoder.decode(data)

        return stringData
    }
} 