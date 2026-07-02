import { CameraObject } from ".";
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
    accessor defaultCamera: number = 0;

    /**
     * Called when a serialized property has changed.
     */
    onSerializedPropertyChanged(name: string): void {
        const camera = this.game.getObjectById(this.defaultCamera)
        if (camera !== undefined && camera instanceof CameraObject) {
            this.game.setMainCamera(camera)
        }
    }
}
