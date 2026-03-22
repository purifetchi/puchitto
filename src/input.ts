import { Vector2 } from "three";

/**
 * The class responsible for handling input.
 */
export class Input {
    /**
     * The position of the pointer.
     */
    private _pointer : Vector2 = new Vector2()

    /**
     * Was the left mouse button pressed?
     */
    private _lmbPressed : boolean = false

    /**
     * Has the mouse been moved since the last frame?
     */
    private _movedMouse : boolean = false

    /**
     * Is input enabled?
     */
    private _enabled : boolean = true

    /**
     * Constructs a new input class.
     */
    constructor() {
        window.addEventListener('pointermove', this._updatePointer.bind(this))
        window.addEventListener('mousedown', this._mouseDown.bind(this))
        window.addEventListener('touchend', this._tapEnd.bind(this))
    }

    /**
     * Sets whether the input should be enabled.
     * @param enabled Whether input is enabled.
     */
    setEnabledInput(enabled: boolean) {
        this._enabled = enabled

        // Reset everything
        this.reset()
    }

    /**
     * Updates the position of the pointer.
     * @param evt The mouse event.
     */
    private _updatePointer(evt : MouseEvent) : void {
        if (!this._enabled) {
            return
        }

        this._pointer.x = evt.clientX
        this._pointer.y = evt.clientY

        this._movedMouse = true
    }

    /**
     * Sets the mouse button as pressed.
     * @param evt The mouse event.
     */
    private _mouseDown(evt : MouseEvent) : void {
        if (!this._enabled) {
            return
        }

        this._lmbPressed = true
    }

    /**
     * Handles tapping.
     * @param evt The touch event.
     */
    private _tapEnd(evt: TouchEvent): void {
        if (!this._enabled) {
            return
        }

        const [touch] = evt.changedTouches
        if (touch === undefined) {
            return
        }

        this._pointer.x = touch.clientX
        this._pointer.y = touch.clientY
        this._lmbPressed = true
        this._movedMouse = true
    }

    /**
     * Resets the input data.
     */
    reset() : void {
        this._lmbPressed = false
        this._movedMouse = false
    }

    /**
     * Gets the position of the pointer.
     */
    get pointerPosition() : Vector2 {
        return this._pointer
    }

    /**
     * Checks if the mouse was pressed this frame.
     */
    get mousePressed() : boolean {
        return this._lmbPressed
    }

    /**
     * Checks whether the mouse has been moved since the last frame.
     */
    get hasMovedMouse() : boolean {
        return this._movedMouse
    }
}
