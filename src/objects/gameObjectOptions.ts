import type { LoadingManager } from "three";
import { type TransformData } from "../level/transformData";
import type { AnticsDefinition } from "./anticsDefinition";

export interface GameObjectOptions {
    id : number,
    name? : string | undefined,
    tag? : string | undefined,
    hasAuthority? : boolean | undefined,
    loader? : LoadingManager | undefined,
    antics? : AnticsDefinition[] | undefined,
    transform: TransformData,
    visible: boolean
}
