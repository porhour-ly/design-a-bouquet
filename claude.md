@AGENTS.md

## Lessons Learned

### @use-gesture/react pinch + wheel gotcha on mobile Safari
Do NOT add `onWheel`/`onWheelEnd` handlers to the same `useGesture` call that has `onPinch` when using `target`. On mobile Safari, registering wheel gesture handlers on the canvas causes touch event interference that prevents child components (like DraggableFlower) from rendering. Keep pinch and wheel gestures in separate `useGesture` calls if both are needed.

Similarly, do NOT use `pointer: { touch: true }` on the canvas gesture config — it also breaks flower rendering on mobile Safari.

### @use-gesture pinch rotation limitations
- **Desktop Chrome/Firefox**: Trackpad pinch uses `wheel` events internally, which carry zero rotation data. `offset[1]` is always 0. Rotation via pinch is impossible on these browsers.
- **Desktop Safari**: Uses `GestureEvent` which provides both scale and rotation.
- **Mobile**: Use `movement[1]` (angle delta) + a stored base rotation ref instead of `offset[1]`, and set `from` to `[currentScale, 0]`. This avoids issues with `from[1]` not being respected consistently across event types (GestureEvent vs PointerEvent). Confirmed working on mobile Safari.

### Desktop rotation handle with @use-gesture
When a child element (rotation handle) lives inside a parent that has `@use-gesture` drag bound via `target: ref`, React synthetic events (`onPointerDown`) on the child will NOT reliably prevent the parent's drag from firing. You MUST use raw DOM `addEventListener("pointerdown", ...)` on the child element via a ref + `useEffect`, and call `e.stopPropagation()` there. This stops the event before it bubbles to the parent's gesture listener.

**Critical**: if the child is conditionally rendered (e.g. `{isSelected && <Handle ref={handleRef} />}`), you MUST include the condition (`isSelected`) in the `useEffect` dependency array. Otherwise the effect runs once on mount when the ref is null and never re-runs when the element appears.

### Counter-scaling child elements inside a scaled parent
Use `useTransform(motionScale, s => 1/s)` from framer-motion to create an inverse scale motion value. Apply it to the child's `scale` style so it stays a fixed visual size regardless of the parent's zoom level.

### Detecting touch vs desktop
Use `window.matchMedia("(pointer: coarse)").matches` inside a `useEffect` to detect touch devices. Gate desktop-only UI (like the rotation handle) behind this check. Do not use user-agent sniffing.
