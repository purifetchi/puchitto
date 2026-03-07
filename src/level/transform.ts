import { Quaternion, Vector3 } from "three";
import { JsonTransform } from "./jsonTransform";

/**
 * An entity transform.
 */
export interface Transform {
    position: Vector3,
    rotation: Quaternion,
    scale: Vector3
}

/**
 * Returns a new zero transform.
 * @returns A zero-transform
 */
export function zeroTransform() : Transform {
    return {
        position: new Vector3(0, 0, 0),
        rotation: new Quaternion().identity(),
        scale: new Vector3(1, 1, 1)
    }
}

/**
 * Transforms a JSON-based transform into a regular transform.
 * @param json The JSON transform.
 * @returns The regular transform.
 */
export function jsonTransformToRegularTransform(json: JsonTransform): Transform {
    return {
        position: new Vector3(
            json.position[0],
            json.position[1],
            -json.position[2]
        ),
        rotation: new Quaternion(
            -json.rotation[0],
            -json.rotation[1],
            json.rotation[2],
            json.rotation[3]
        ),
        scale: new Vector3(
            json.scale[0],
            json.scale[1],
            json.scale[2]
        )
    };
}
