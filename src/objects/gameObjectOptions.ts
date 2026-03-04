import type { LoadingManager } from "three";
import { type Transform } from "../level/transform.js";
import type { AnticsDefinition } from "./anticsDefinition.js";

export default interface GameObjectOptions {
    id? : string | undefined,
    tag? : string | undefined,
    hasAuthority? : boolean | undefined,
    loader? : LoadingManager | undefined,
    antics? : AnticsDefinition[] | undefined,
    transform: Transform
}