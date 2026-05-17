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

## Bouquet Geometry System

The bouquet wrapper is NOT just a visual decoration.

It defines the structure, composition boundaries, and interaction model of the bouquet editor.

The experience should NOT behave like:

* an infinite canvas
* a generic sticker editor
* a design tool

Instead, the bouquet should behave like a guided composition system.

### Bouquet Regions

#### Bouquet Composition Zone

The upper bouquet opening area where flowers and greenery can exist.

This is the editable interaction space.

Flowers should:

* emerge upward from the bouquet opening
* cluster naturally
* overlap organically
* visually layer like real bouquet arrangements

The system should subtly guide users toward aesthetically pleasing compositions.

#### Wrapper Handle Zone

The lower wrapped portion of the bouquet.

This area:

* is non-editable
* should not contain flowers
* visually anchors the bouquet
* creates natural composition constraints

### Composition Rules

* Flowers should remain mostly within bouquet boundaries
* Slight overflow is allowed for realism
* Placement should feel forgiving
* Subtle snapping and positional assistance are encouraged
* The system should quietly help users create attractive arrangements

Avoid:

* chaotic free placement
* excessive precision requirements
* rigid design-tool behavior

### Interaction Goals

Users should feel:

* creative
* relaxed
* visually guided
* naturally successful at arranging bouquets

The app should help users make aesthetically pleasing bouquets even without design skills.
