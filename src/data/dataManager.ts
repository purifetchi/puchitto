import { LoadingManager } from "three"
import { AlfPackage } from "./alf/alfPackage"
import { DataProvider } from "./dataProvider"
import { AlfProvider } from "./providers/alfProvider"

/**
 * The manager for currently loaded data.
 */
export class DataManager {
    /**
     * The loading manager exposed by this data manager.
     */
    public loader : LoadingManager

    /**
     * The list of providers
     */
    private _providers: DataProvider[] = []

    /**
     * Constructs a new data manager.
     */
    constructor() {
        this.loader = new LoadingManager()
        this.loader.setURLModifier((url) => this._resolveUrlFromProviders(url))
    }

    /**
     * Adds a new data provider.
     * @param provider The provider.
     */
    addProvider(provider: DataProvider) {
        // Insert as first in the provider chain.
        this._providers = [provider, ...this._providers]
    }

    /**
     * Loads a new package.
     * @param path The path to the package
     */
    async loadPackage(path: string) {
        // TODO: We should not dispose all packages every time we do this.
        //       Should packages have some sort of tag, so for example we only dispose scene ones?
        this._disposeProviders()

        console.log(`[DataManager::loadPackage] Loading ${path}...`)

        const alfPackage = await AlfPackage.fetch(path)
        this.addProvider(new AlfProvider(alfPackage))
    }

    /**
     * Loads a new package from a buffer.
     * @param buffer The buffer.
     */
    async loadPackageFromBuffer(buffer: ArrayBufferLike) {
        this._disposeProviders()

        const alfPackage = new AlfPackage(buffer, "")
        this.addProvider(new AlfProvider(alfPackage))
    }

    /**
     * Gets the string lump data.
     * @param path The path to the lump.
     */
    async getStringData(path: string): Promise<string> {
        const url = this.loader.resolveURL(path)
        const data = await fetch(url)
        const stringData = await data.text()
        return stringData
    }

    /**
     * Disposes the providers.
     */
    private _disposeProviders() {
        for (const provider of this._providers) {
            provider.dispose()
        }

        this._providers = []
    }

    /**
     * Resolves an asset's url from the list of providers.
     * @param url The URL to resolve.
     */
    private _resolveUrlFromProviders(url: string): string {
        let relativePath = url
        if (relativePath.startsWith(".")) {
            relativePath = relativePath.substring(1)
        }

        for (const provider of this._providers) {
            const maybeResolved = provider.getUrl(relativePath)

            if (maybeResolved !== undefined) {
                return maybeResolved
            }
        }

        // Fallback to just relying on the current href to resolve it.
        try {
            const urlObj = new URL(url, window.location.href)
            if (urlObj.origin === window.location.origin) {
                relativePath = urlObj.pathname.substring(1)
            }
        } catch (e) {

        }

        relativePath = decodeURIComponent(relativePath)
        if (!relativePath.startsWith("/")) {
            relativePath = "/" + relativePath
        }

        return url
    }
}
