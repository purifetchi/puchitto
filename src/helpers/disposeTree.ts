import { Group, Mesh, SkinnedMesh } from "three";

/**
 * Recursively disposes assets.
 * @param asset The asset.
 */
export const disposeTree = (asset: Group) => {
    asset.traverse((node) => {
        if (node instanceof Mesh) {
            node.geometry.dispose()

            const materials = Array.isArray(node.material)
                ? node.material
                : [node.material]

            for (const mat of materials) {
                // Dispose any texture uniforms/properties on the material
                for (const key of Object.keys(mat)) {
                    const value = mat[key]
                    maybeDisposeTexture(value)
                }

                // Dispose custom shader uniform textures if present
                if (mat.uniforms) {
                    for (const key of Object.keys(mat.uniforms)) {
                        const uniformVal = mat.uniforms[key]?.value
                        maybeDisposeTexture(uniformVal)
                    }
                }

                mat.dispose()
            }
        }

        if (node instanceof SkinnedMesh) {
            node.skeleton.dispose()
        }
    })
}

/**
 * Disposes the object if it is a texture.
 * @param obj The object.
 */
const maybeDisposeTexture = (obj: any) => {
    if (obj && typeof obj === "object" && "minFilter" in obj) {
        obj.dispose()
    }
}
