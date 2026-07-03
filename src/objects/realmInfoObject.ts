import { Serialized } from "../serialization";
import { GameObject } from "./gameObject";

/**
 * The singleton realm info object.
 */
export class RealmInfoObject extends GameObject {
    /**
     * The default camera of this realm.
     */
    @Serialized("defaultCamera")
    accessor defaultCamera: number | undefined = undefined
}
