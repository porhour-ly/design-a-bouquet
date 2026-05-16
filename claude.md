@AGENTS.md

## Lessons Learned

### @use-gesture/react pinch + wheel gotcha on mobile Safari
Do NOT add `onWheel`/`onWheelEnd` handlers to the same `useGesture` call that has `onPinch` when using `target`. On mobile Safari, registering wheel gesture handlers on the canvas causes touch event interference that prevents child components (like DraggableFlower) from rendering. Keep pinch and wheel gestures in separate `useGesture` calls if both are needed.

Similarly, do NOT use `pointer: { touch: true }` on the canvas gesture config — it also breaks flower rendering on mobile Safari.

### @use-gesture pinch rotation limitations
- **Desktop Chrome/Firefox**: Trackpad pinch uses `wheel` events internally, which carry zero rotation data. `offset[1]` is always 0. Rotation via pinch is impossible on these browsers.
- **Desktop Safari**: Uses `GestureEvent` which provides both scale and rotation.
- **Mobile**: Use `movement[1]` (angle delta) + a stored base rotation ref instead of `offset[1]`, and set `from` to `[currentScale, 0]`. This avoids issues with `from[1]` not being respected consistently across event types (GestureEvent vs PointerEvent). Confirmed working on mobile Safari.
