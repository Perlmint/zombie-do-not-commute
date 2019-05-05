const isPointerEventSupported = typeof PointerEvent !== "undefined";
const isTouchEventSupported = typeof TouchEvent !== "undefined";

export interface IPointerHandlers {
    onPointerDown?: () => void;
    onPointerUp?: () => void;
    onPointerLeave?: () => void;
    onPointerCancel?: () => void;
}

export interface IPollyfillHandlers {
    onPointerDown?: () => void;
    onPointerUp?: () => void;
    onPointerLeave?: () => void;
    onPointerCancel?: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    onMouseLeave?: () => void;
    onMouseCancel?: () => void;
    onTouchStart?: () => void;
    onTouchEnd?: () => void;
    onTouchCancel?: () => void;
}

function pointerHandlerFallback(handlers: IPointerHandlers): IPollyfillHandlers {
    const ret: IPollyfillHandlers = {};

    if (handlers.onPointerDown) {
        if (isTouchEventSupported) {
            ret.onTouchStart = handlers.onPointerDown;
        } else {
            ret.onMouseDown = handlers.onPointerDown;
        }
    }
    if (handlers.onPointerUp) {
        if (isTouchEventSupported) {
            ret.onTouchEnd = handlers.onPointerUp;
        } else {
            ret.onMouseUp = handlers.onPointerUp;
        }
    }
    if (handlers.onPointerLeave) {
        if (isTouchEventSupported) {
            ret.onTouchCancel = handlers.onPointerLeave;
        } else {
            ret.onMouseLeave = handlers.onPointerLeave;
        }
    }
    if (handlers.onPointerCancel) {
        if (isTouchEventSupported) {
            ret.onTouchCancel = handlers.onPointerCancel;
        } else {
            ret.onMouseCancel = handlers.onPointerCancel;
        }
    }

    return ret;
}

function pointerHandlerDummy(handlers: IPointerHandlers): IPollyfillHandlers {
    return handlers;
}

/**
 * PointerEvent handler polyfill.
 *
 * Automatically use mouse event or touch event.
 */
export const pointerHandlerPolyfill = isPointerEventSupported ? pointerHandlerDummy : pointerHandlerFallback;
