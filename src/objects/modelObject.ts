import { MTLLoader, OBJLoader } from "three/examples/jsm/Addons.js";
import { ClampToEdgeWrapping, Mesh, MeshToonMaterial } from "three";
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
                        const oldMaterial = child.material;
                        const toonMaterial = new MeshToonMaterial({
                            map: oldMaterial.map || null,
                            color: oldMaterial.color || null
                        });
                        toonMaterial.transparent = opts.transparent

                        if (toonMaterial.map !== null && opts.clamp) {
                            toonMaterial.map.wrapS = ClampToEdgeWrapping
                            toonMaterial.map.wrapT = ClampToEdgeWrapping
                        }

                        child.material = toonMaterial
                    }
                })

                this._attach()
            })
        })
    }
}
