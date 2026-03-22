import { MTLLoader, OBJLoader } from "three/examples/jsm/Addons.js";
import { ClampToEdgeWrapping, Material, Mesh, MeshToonMaterial } from "three";
import { GameObject } from "./gameObject";
import { ModelEntityData } from "../level/entities/modelEntityData";
import { GameObjectOptions } from "./gameObjectOptions";

export class ModelObject extends GameObject<ModelEntityData> {
    constructor(opts: GameObjectOptions & ModelEntityData) {
        super(opts)

        const { path, transform } = opts
        const objLoader = new OBJLoader(opts.loader)
        const mtlLoader = new MTLLoader(opts.loader)
        mtlLoader.load(path.replace(".obj", ".mtl"), data => {
            objLoader.setMaterials(data)

            objLoader.load(path, data => {
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
                                name: mat.name || undefined,
                                map: mat.map || null,
                                color: mat.color || undefined,
                                emissive: mat.emissive || undefined,
                                emissiveMap: mat.emissiveMap || null,
                                emissiveIntensity: mat.emissiveIntensity || undefined
                            })

                            toon.transparent = opts.transparent
                            if (toon.map !== null && opts.clamp) {
                                toon.map.wrapS = ClampToEdgeWrapping
                                toon.map.wrapT = ClampToEdgeWrapping
                            }

                            return toon
                        })

                        child.material = wasArray
                            ? materials
                            : materials.pop()
                    }
                })

                this._attach()
            })
        })
    }
}
