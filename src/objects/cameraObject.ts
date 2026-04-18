import { AudioListener, Camera, OrthographicCamera, PerspectiveCamera, Vector3 } from "three";
import { GameObject } from "./gameObject";
import { GameObjectOptions } from "./gameObjectOptions";
import { Serialized } from "../serialization";

export class CameraObject extends GameObject {
    /**
     * The width of the camera.
     */
    @Serialized("width")
    accessor width!: number

    /**
     * The height of the camera.
     */
    @Serialized("height")
    accessor height!: number

    /**
     * The type of the camera.
     */
    @Serialized("type")
    accessor type: "ortographic" | "perspective" | undefined

    /**
     * The audio listener.
     */
    listener!: AudioListener

    /**
     * The zoom level.
     */
    private _zoom = 6

    /**
     * The THREE camera.
     */
    private _camera! : Camera

    constructor(opts : GameObjectOptions) {
        super(opts)
    }

    onGameSet(): void {
        this._camera = this._makeCamera()
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
    private _makeCamera(): Camera {
        const aspect = this.width / this.height

        if (this.type === "perspective")
        {
            return new PerspectiveCamera(90, aspect, 0.1, 1000)
        }

        return new OrthographicCamera(
            -this._zoom * aspect, this._zoom * aspect, this._zoom, -this._zoom, -10, 1000
        )
    }
}
