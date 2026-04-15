import { AudioListener, Camera, OrthographicCamera, PerspectiveCamera, Vector3 } from "three";
import { GameObject } from "./gameObject";
import { CameraEntityData } from "../level/entities/cameraEntityData";
import { GameObjectOptions } from "./gameObjectOptions";

export class CameraObject extends GameObject<CameraEntityData> {
    /**
     * The audio listener.
     */
    listener: AudioListener

    /**
     * The zoom level.
     */
    private _zoom = 6

    /**
     * The THREE camera.
     */
    private _camera : Camera

    constructor(opts : GameObjectOptions & CameraEntityData) {
        super(opts)

        this._camera = this._makeCamera(opts)
        this._camera.position.set(4, 4, 4)
        this._camera.lookAt(new Vector3(0, 0, 0))

        this.listener = new AudioListener()
        this._camera.attach(this.listener)

        this.threeObject = this._camera
    }

    /**
     * Resizes the camera's aspect ratio.
     * @param width The width of the viewport.
     * @param height The height of the viewport.
     */
    resize(width: number, height: number) : void {
        const aspect = width / height

        if (this._camera instanceof OrthographicCamera)
        {
            this._camera.left = -this._zoom * aspect
            this._camera.right = this._zoom * aspect
            this._camera.top = this._zoom
            this._camera.bottom = -this._zoom
            this._camera.updateProjectionMatrix()
        }
        else if (this._camera instanceof PerspectiveCamera)
        {
            this._camera.aspect = aspect
            this._camera.updateProjectionMatrix()
        }
    }

    /**
     * Gets the THREE camera.
     */
    get camera() {
        return this._camera
    }

    /**
     * Creates the camera.
     */
    private _makeCamera(opts: CameraEntityData): Camera {
        const aspect = opts.width / opts.height

        if (opts.type === "perspective")
        {
            return new PerspectiveCamera(90, aspect, 0.1, 1000)
        }

        return new OrthographicCamera(
            -this._zoom * aspect, this._zoom * aspect, this._zoom, -this._zoom, -10, 1000
        )
    }
}
