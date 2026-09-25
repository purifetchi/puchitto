import { ColorRepresentation, Vector2, Vector3 } from "three"

/**
 * The different shader types for the definition.
 */
export type MaterialShader =
    {
        type: "basic"
    }
    | {
        type: "phong"
    }
    | {
        type: "toon"
    }
    | {
        type: "shader"
        vertex: string,
        fragment: string
    }

/**
 * A single material variable.
 */
export type MaterialVariable =
    {
        type: "texture"
        name: string
        value: string
    }
    | {
        type: "float"
        name: string
        value: number
    }
    | {
        type: "color"
        name: string
        value: ColorRepresentation
    }
    | {
        type: "vec2"
        name: string
        value: Vector2
    }
    | {
        type: "vec3"
        name: string
        value: Vector3
    }
    | {
        type: "bool"
        name: string
        value: boolean
    }

/**
 * The material definition.
 */
export interface PuchittoMaterialDefinition {
    shader: MaterialShader
    transparent: boolean
    doubleSided: boolean
    variables: MaterialVariable[]
}
