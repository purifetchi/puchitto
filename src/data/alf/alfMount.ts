import * as THREE from 'three';
import { AlfPackage } from './alfPackage';

/**
 * The ALF mounting manager, that allows for loading assets from ALF files.
 */
export class AlfMount {
    /**
     * The loading manager for THREE.
     */
    public manager: THREE.LoadingManager;

    /**
     * The cache for blobs.
     */
    private blobCache: Map<string, string> = new Map();

    /**
     * Constructs a new ALF mount helper.
     * @param packageData The ALF package.
     */
    constructor(private packageData: AlfPackage) {
        this.manager = new THREE.LoadingManager();
        this.manager.setURLModifier((url) => this._resolveURL(url));
    }

    /**
     * Resolves the URL into the ALF blobs, if it exists.
     * @param url The URL we're trying to load.
     * @returns The actual URL.
     */
    private _resolveURL(url: string): string {
        let relativePath = url;

        // TODO: what
        if (relativePath.startsWith(".")) {
            relativePath = relativePath.substring(1)
        }

        if (!relativePath.startsWith("/")) {
            relativePath = "/" + relativePath
        }

        if (this.blobCache.has(relativePath)) {
            return this.blobCache.get(relativePath)!;
        }

        const lump = this.packageData.getLump(relativePath);
        if (lump) {
            const data = this.packageData.read(lump);
            const type = this._getMimeType(relativePath);
            const blob = new Blob([data as unknown as BlobPart], { type });
            const blobUrl = URL.createObjectURL(blob);

            this.blobCache.set(relativePath, blobUrl);
            return blobUrl;
        }

        try {
            const urlObj = new URL(url, window.location.href);
            if (urlObj.origin === window.location.origin) {
                relativePath = urlObj.pathname.substring(1);
            }
        } catch (e) {

        }

        relativePath = decodeURIComponent(relativePath);
        if (!relativePath.startsWith("/")) {
            relativePath = "/" + relativePath
        }

        return url;
    }

    /**
     * Tries to guess the MIME type of a lump.
     * @param filename The file name.
     * @returns The MIME type.
     */
    private _getMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch(ext) {
            case 'png': return 'image/png';
            case 'jpg':
            case 'jpeg': return 'image/jpeg';
            case 'obj': return 'text/plain';
            case 'mtl': return 'text/plain';
            case 'json': return 'application/json';
            default: return 'application/octet-stream';
        }
    }

    /**
     * Disposes the ALF mount.
     */
    public dispose() {
        this.blobCache.forEach((url) => URL.revokeObjectURL(url));
        this.blobCache.clear();
    }
}
