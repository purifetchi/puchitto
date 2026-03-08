import { Vector2 } from "three";

/**
 * The class responsible for handling input.
 */
export class Input {
    /**
     * The position of the pointer.
     */
    _pointer : Vector2 = new Vector2()

    /**
     * Was the left mouse button pressed?
     */
    _lmbPressed : boolean = false

    /**
     * Constructs a new input class.
     */
    constructor() {
        window.addEventListener('pointermove', this._updatePointer.bind(this))
        window.addEventListener('mousedown', this._mouseDown.bind(this))
        window.addEventListener('touchend', this._tapEnd.bind(this))
    }

    /**
     * Updates the position of the pointer.
     * @param evt The mouse event.
     */
    private _updatePointer(evt : MouseEvent) : void {
        this._pointer.x = evt.clientX
        this._pointer.y = evt.clientY
    }

    /**
     * Sets the mouse button as pressed.
     * @param evt The mouse event.
     */
    private _mouseDown(evt : MouseEvent) : void {
        this._lmbPressed = true
    }

    /**
     * Handles tapping.
     * @param evt The touch event.
     */
    private _tapEnd(evt: TouchEvent): void {
        const [touch] = evt.changedTouches
        if (touch === undefined) {
            return
        }

        this._pointer.x = touch.clientX
        this._pointer.y = touch.clientY
        this._lmbPressed = true
    }

    /**
     * Resets the input data.
     */
    reset() : void {
        this._lmbPressed = false
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
}
