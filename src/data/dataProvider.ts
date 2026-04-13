/**
 * A custom provider for the DataManager to load files from.
 */
export interface DataProvider {
    /**
     * Gets the url within this provider for a given asset path.
     * @param assetPath The asset path.
     * @returns Either the transformed path, or undefined, if it doesn't have it.
     */
    getUrl: (assetPath: string) => string | undefined

    /**
     * Disposes this data provider.
     */
    dispose: () => void
}
