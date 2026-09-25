import { DoubleSide, FrontSide, LoadingManager, Material, MeshBasicMaterial, MeshPhongMaterial, MeshToonMaterial, ShaderMaterial } from "three";
import { AssetManager } from "../data/assetManager";
import { MaterialShader, MaterialVariable, PuchittoMaterialDefinition } from "./data/puchittoMaterialDefinition";

/**
 * Loader for puchitto's material format.
 */
export class MaterialLoader {
    /**
     * The asset manager for caching textures.
     */
    private _assetManager: AssetManager

    /**
     * The THREE.js loading manager.
     */
    private _loader: LoadingManager

    constructor(loader: LoadingManager, assetManager: AssetManager) {
        this._assetManager = assetManager
        this._loader = loader
    }

    /**
     * Loads the puchitto material asynchronously
     */
    async loadAsync(path: string): Promise<Material> {
        const url = this._loader.resolveURL(path)
        const response = await fetch(url)
        if (!response.ok) {
            // TODO: What should we do here?
            throw new Error("Failed to load material.")
        }

        const def = response.json() as unknown as PuchittoMaterialDefinition
        const base = await this._constructBasisMaterialFromShader(def.shader)

        base.transparent = def.transparent
        base.side = def.doubleSided ? DoubleSide : FrontSide

        for (const matVar of def.variables) {
            this._setVariableForMaterial(base, matVar)
        }

        base.needsUpdate = true

        return base
    }

    /**
     * Sets a material variable.
     * @param mat The material.
     * @param variable The variable to set.
     */
    private _setVariableForMaterial(mat: Material, variable: MaterialVariable) {
        const key = variable.name as keyof Material

        switch (variable.type) {
            case "float":
                mat[key] = variable.name
                return
        }
    }

    /**
     * Constructs a basis material from a shader.
     * @param shader The shader definition.
     */
    private async _constructBasisMaterialFromShader(shader: MaterialShader): Promise<Material> {
        switch (shader.type) {
            case "basic":
                return new MeshBasicMaterial()
            case "phong":
                return new MeshPhongMaterial()
            case "toon":
                return new MeshToonMaterial()
            case "shader":
                {
                    const vtx = await (await fetch(this._loader.resolveURL(shader.vertex))).text()
                    const frag = await (await fetch(this._loader.resolveURL(shader.fragment))).text()

                    return new ShaderMaterial({
                        vertexShader: vtx,
                        fragmentShader: frag
                    })
                }
        }
    }
}
