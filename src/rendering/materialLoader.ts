import { DoubleSide, FrontSide, LoadingManager, Material, MeshBasicMaterial, MeshPhongMaterial, MeshToonMaterial, ShaderMaterial, Texture } from "three";
import { AssetManager } from "../data/assetManager";
import { MaterialShader, MaterialVariable, PuchittoMaterialDefinition } from "./data/puchittoMaterialDefinition";
import { Logger } from "../logging";

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

    /**
     * The logger for this material loader.
     */
    private _logger: Logger = new Logger("Data", "MaterialLoader")

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
            await this._setVariableForMaterial(base, matVar)
        }

        base.needsUpdate = true

        return base
    }

    /**
     * Sets a material variable.
     * @param mat The material.
     * @param variable The variable to set.
     */
    private async _setVariableForMaterial(mat: Material, variable: MaterialVariable): Promise<void> {
        if (!(variable.name in mat)) {
            this._logger.warn(`Property ${variable.name} doesn't exist on shader.`)
            return
        }

        const writableMat = mat as unknown as Record<string, unknown>
        const key = variable.name

        switch (variable.type) {
            case "float":
            case "vec2":
            case "vec3":
            case "bool":
            case "color":
                writableMat[key] = variable.value
                return

            case "texture":
                const tex = await this._assetManager.load<Texture>(variable.value)
                writableMat[key] = tex
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
