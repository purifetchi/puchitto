import { AlfPackage } from "../alf";
import { DataProvider } from "../dataProvider";

/**
 * A data provider for ALF package-backed data.
 */
export class AlfProvider implements DataProvider {
    /**
     * The cache for blobs.
     */
    private blobCache: Map<string, string> = new Map()

    /**
     * The ALF package backing this provider.
     */
    private packageData: AlfPackage

    /**
     * Constructs a new ALF data provider.
     * @param packageData The ALF package to load.
     */
    constructor(packageData: AlfPackage) {
        this.packageData = packageData
    }

    /**
     * Resolves an asset's url from the list of providers.
     * @param url The URL to resolve.
     */
    getUrl(assetPath: string): string | undefined {
        if (!assetPath.startsWith("/")) {
            assetPath = "/" + assetPath
        }

        if (this.blobCache.has(assetPath)) {
            return this.blobCache.get(assetPath)!;
        }

        const lump = this.packageData.getLump(assetPath)
        if (lump) {
            const data = this.packageData.read(lump)
            const type = this._getMimeType(assetPath)
            const blob = new Blob([data as unknown as BlobPart], { type })
            const blobUrl = URL.createObjectURL(blob)

            this.blobCache.set(assetPath, blobUrl)
            return blobUrl
        }

        return undefined
    }

    /**
     * Tries to guess the MIME type of a lump.
     * @param filename The file name.
     * @returns The MIME type.
     */
    private _getMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase()
        switch(ext) {
            case 'png': return 'image/png'
            case 'jpg':
            case 'jpeg': return 'image/jpeg'
            case 'obj': return 'text/plain'
            case 'mtl': return 'text/plain'
            case 'json': return 'application/json'
            default: return 'application/octet-stream'
        }
    }

    /**
     * Disposes the ALF mount.
     */
    dispose() {
        this.blobCache.forEach((url) => URL.revokeObjectURL(url))
        this.blobCache.clear()

        this.packageData.dispose()
    }
}
