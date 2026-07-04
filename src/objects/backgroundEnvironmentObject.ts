import { CubeTexture, CubeTextureLoader } from "three";
import { Serialized } from "../serialization";
import { GameObject } from "./gameObject";
import { AssetLoading } from "./mixins";

/**
 * The env_background object controlling the scene background.
 */
export class BackgroundEnvironmentObject extends AssetLoading(GameObject) {
    /**
     * The type of the background.
     */
    @Serialized("type")
    accessor type: "css" | "cubeSkybox" = "cubeSkybox"

    /**
     * The positive X axis of the skybox.
     */
    @Serialized("posX")
    accessor skyboxPosX: string | undefined = undefined

    /**
     * The negative X axis of the skybox.
     */
    @Serialized("negX")
    accessor skyboxNegX: string | undefined = undefined

    /**
     * The positive Y axis of the skybox.
     */
    @Serialized("posY")
    accessor skyboxPosY: string | undefined = undefined

    /**
     * The negative Y axis of the skybox.
     */
    @Serialized("negY")
    accessor skyboxNegY: string | undefined = undefined

    /**
     * The positive Z axis of the skybox.
     */
    @Serialized("posZ")
    accessor skyboxPosZ: string | undefined = undefined

    /**
     * The negative Z axis of the skybox.
     */
    @Serialized("negZ")
    accessor skyboxNegZ: string | undefined = undefined

    /**
     * The skybox texture.
     */
    private _skybox?: CubeTexture = undefined

    /**
     * Called when any of the serialized properties change.
     */
    onSerializedPropertyChanged(path: string): void {
        if (!this.isLoading) {
            this._loadBackground()
        }
    }

    /**
     * Loads the background.
     */
    private _loadBackground(): void {
        console.log('loadBackground')
        switch (this.type) {
            case 'cubeSkybox':
                this._buildSkybox().then(asset => {
                    this.finishAssetLoad()

                    // If the asset is missing then it's probably broken
                    if (asset === undefined) {
                        return
                    }

                    this.game._scene.background = asset
                    this._skybox?.dispose()
                    this._skybox = asset
                })
                break

            default:
                console.warn(`[BackgroundEnvironmentObject:_loadBackground] Background type ${this.type} is not supported yet.`)
                break

        }
    }

    /**
     * Builds the skybox texture.
     */
    private _buildSkybox(): Promise<CubeTexture | undefined> {
        this.beginAssetLoad()

        const loader = new CubeTextureLoader(this.loader)

        // Ensure we have all the neccessary textures.
        if (
            this.skyboxPosX === undefined ||
            this.skyboxPosY === undefined ||
            this.skyboxPosZ === undefined ||
            this.skyboxNegX === undefined ||
            this.skyboxNegY === undefined ||
            this.skyboxNegZ === undefined
        ) {
            console.warn(`[BackgroundEnvironmentObject::_buildSkybox] Skybox incomplete.`)
            return Promise.resolve(undefined)
        }

        console.log('loading assets')
        return loader.loadAsync([this.skyboxPosX, this.skyboxNegX, this.skyboxPosY, this.skyboxNegY, this.skyboxPosZ, this.skyboxNegZ])
    }
}
