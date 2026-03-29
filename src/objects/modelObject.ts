import { FBXLoader, MTLLoader, OBJLoader } from "three/examples/jsm/Addons.js";
import { ClampToEdgeWrapping, Group, LoadingManager, Material, Mesh, MeshToonMaterial, Object3DEventMap } from "three";
import { GameObject } from "./gameObject";
import { ModelEntityData } from "../level/entities/modelEntityData";
import { GameObjectOptions } from "./gameObjectOptions";

/**
 * A model.
 */
export class ModelObject extends GameObject<ModelEntityData> {
    private _materials: Record<string, Material> = {}

    private _modelData: GameObjectOptions & ModelEntityData

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
    constructor(opts: GameObjectOptions & ModelEntityData) {
        super(opts)

        this._modelData = opts

        const { path, loader } = opts
        this._load(path, loader)
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
        const { transform } = this._modelData
        data.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)
        data.position.set(transform.position.x, transform.position.y, transform.position.z)
        data.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)

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

                    toon.transparent = this._modelData.transparent
                    if (toon.map !== null && this._modelData.clamp) {
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
