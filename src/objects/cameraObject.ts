import { AudioListener, Camera, OrthographicCamera, PerspectiveCamera, Vector3 } from "three";
import { GameObject } from "./gameObject";
import { Serialized } from "../serialization";

export class CameraObject extends GameObject {
    /**
     * The width of the camera.
     */
    @Serialized("width")
    accessor width: number = 1280

    /**
     * The height of the camera.
     */
    @Serialized("height")
    accessor height: number = 720

    /**
     * The type of the camera.
     */
    @Serialized("type")
    accessor type: "orthographic" | "perspective" | undefined = "perspective"

    /**
     * The near clipping plane.
     */
    @Serialized("near")
    accessor near: number = 0.1

    /**
     * The far clipping plane.
     */
    @Serialized("far")
    accessor far: number = 1000

    /**
     * The FOV of the perspective camera.
     */
    @Serialized("fov")
    accessor fov: number = 90

    /**
     * The zoom of the ortographic camera.
     */
    @Serialized("zoom")
    accessor zoom: number = 6

    /**
     * The THREE camera.
     */
    private _camera! : Camera

    onGameSet(): void {
        this._camera = this._makeCamera()
        this.attachThreeObject(this._camera)
    }

    onSerializedPropertyChanged(name: string): void {
        if (name === "type") {
            this._camera.remove()
            this._camera = this._makeCamera()
            this.attachThreeObject(this._camera)
            return
        }

        if (this.camera instanceof PerspectiveCamera) {
            this.camera.fov = this.fov
            this.camera.near = this.near
            this.camera.far = this.far
        }
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
            this._camera.left = -this.zoom * aspect
            this._camera.right = this.zoom * aspect
            this._camera.top = this.zoom
            this._camera.bottom = -this.zoom
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
            return new PerspectiveCamera(this.fov, aspect, this.near, this.far)
        }

        return new OrthographicCamera(
            -this.zoom * aspect, this.zoom * aspect, this.zoom, -this.zoom, this.near, this.far
        )
    }
}
