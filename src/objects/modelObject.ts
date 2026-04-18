import { FBXLoader, MTLLoader, OBJLoader } from "three/examples/jsm/Addons.js";
import { ClampToEdgeWrapping, Group, LoadingManager, Material, Mesh, MeshToonMaterial, Object3DEventMap } from "three";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";
import { Serialized } from "../serialization";

/**
 * A model.
 */
export class ModelObject extends GameObject {
    @Serialized("path")
    accessor path!: string

    @Serialized("transparent")
    accessor transparent!: boolean

    @Serialized("clamp")
    accessor clamp!: boolean

    private _materials: Record<string, Material> = {}

    private _loader?: LoadingManager

    /**
     * Gets a material by its name
     * @param name The name of the material
     */
    getMaterialByName(name: string): Material | undefined {
        return this._materials[name]
    }

    /**
     * Constructs a new model object.
     * @param opts The options.
     */
    constructor(opts: GameObjectOptions) {
        super(opts)

        const { loader } = opts
        this._loader = loader
    }

    /**
     * Called when a serialized property has changed.
     */
    onSerializedPropertyChanged(name: string): void {
        if (name === "path" && this.path !== undefined) {
            this._load(this.path, this._loader)
        }
    }

    /**
     * Loads a model based on its file extension.
     * @param path The path to the model.
     * @param loader The asset loader.
     */
    private _load(path: string, loader: LoadingManager | undefined) {
        const split = path.split('.')
        const extension = split[split.length - 1].trim()

        switch (extension) {
            case "obj":
                this._loadObj(path, loader)
                break

            case "fbx":
                this._loadFbx(path, loader)
                break

            default:
                throw new Error(`[ModelObject::_load] Failed to load the model. Unknown format: ${extension}`)
        }
    }

    /**
     * Loads an OBJ format model.
     * @param path The path to the file.
     * @param loader The asset loader.
     */
    private _loadObj(path: string, loader: LoadingManager | undefined) {
        const objLoader = new OBJLoader(loader)
        const mtlLoader = new MTLLoader(loader)

        mtlLoader.load(path.replace(".obj", ".mtl"), data => {
            objLoader.setMaterials(data)

            objLoader.load(path, data => this._setupModel(data))
        })
    }

    /**
     * Loads an FBX format model.
     * @param path The path to the file.
     * @param loader The asset loader.
     */
    private _loadFbx(path: string, loader: LoadingManager | undefined) {
        const fbxLoader = new FBXLoader(loader)
        fbxLoader.load(path, data => this._setupModel(data))
    }

    /**
     * Sets up the model.
     * @param data The model data.
     */
    private _setupModel(data: Group<Object3DEventMap>) {
        this.threeObject = data

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

        this._attach()
    }
}
