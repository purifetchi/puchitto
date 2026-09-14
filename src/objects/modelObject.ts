import { ClampToEdgeWrapping, Group, Material, Mesh, MeshToonMaterial, Object3DEventMap } from "three";
import { GameObject } from "./gameObject";
import { Serialized } from "../serialization";
import { AssetLoading } from "./mixins/assetLoading";

/**
 * A model.
 */
export class ModelObject extends AssetLoading(GameObject) {
    @Serialized("path")
    accessor path!: string

    @Serialized("transparent")
    accessor transparent: boolean = false

    @Serialized("clamp")
    accessor clamp: boolean = false

    private _materials: Record<string, Material> = {}

    /**
     * Gets a material by its name
     * @param name The name of the material
     */
    getMaterialByName(name: string): Material | undefined {
        return this._materials[name]
    }

    /**
     * Called when a serialized property has changed.
     */
    onSerializedPropertyChanged(name: string): void {
        if (name === "path" && this.path !== undefined) {
            this.loadAssetSync<Group>(this.path, group => this._setupModel(group))
        }
    }

    /**
     * Sets up the model.
     * @param data The model data.
     */
    private _setupModel(data: Group<Object3DEventMap>) {
        data.traverse(child => {
            if (child instanceof Mesh) {
                const wasArray = Array.isArray(child.material)
                const oldMaterials: any[] = wasArray
                    ? child.material
                    : [child.material]

                const materials = oldMaterials.map(mat => {
                    const toon = new MeshToonMaterial({
                        alphaTest: mat.alphaTest || 0,

                        opacity: mat.opacity || 1,
                        transparent: mat.transparent || false,

                        name: mat.name || undefined,
                        map: mat.map || null,
                        color: mat.color || undefined,
                        emissive: mat.emissive || undefined,
                        emissiveMap: mat.emissiveMap || null,
                        emissiveIntensity: mat.emissiveIntensity || 1,
                        lightMap: mat.lightMap || null,
                        lightMapIntensity: mat.lightMapIntensity || 1
                    })

                    toon.transparent = this.transparent
                    if (toon.map !== null && this.clamp) {
                        toon.map.wrapS = ClampToEdgeWrapping
                        toon.map.wrapT = ClampToEdgeWrapping
                    }

                    this._materials[toon.name] = toon

                    return toon
                })

                child.material = wasArray
                    ? materials
                    : materials.pop()
            }
        })

        this.clearAttachments()
        this.attachThreeObject(data)
    }
}
