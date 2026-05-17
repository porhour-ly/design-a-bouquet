# Digital Bouquet Builder — PRD

## Product Overview

A cozy mobile-first web app where users can arrange digital flower bouquets and share them with others through a link.

The core experience is not gifting flowers itself, but the relaxing and satisfying experience of arranging flowers digitally.

The interaction model should feel similar to Instagram Story editing:
- drag
- resize
- rotate
- layer objects intuitively

The app should feel playful, tactile, emotional, and visually delightful.


---

# Bouquet Composition System

The bouquet wrapper is the central composition structure of the experience.

Instead of arranging flowers on a completely open canvas, users arrange flowers within a guided bouquet composition zone.

The bouquet is divided into two regions:

## 1. Bouquet Composition Zone

The upper/opening portion of the bouquet where flowers and greenery can exist.

This is the editable interaction area.

Flowers should:

* emerge upward from the bouquet opening
* naturally cluster together
* visually layer like a real bouquet
* remain mostly within bouquet boundaries
* slightly overflow naturally when appropriate

The system should subtly guide users toward aesthetically pleasing bouquet arrangements.

## 2. Wrapper Handle Zone

The lower wrapped stem area of the bouquet.

This area is NOT editable and should not contain flowers.

The handle zone exists to:

* preserve bouquet realism
* visually anchor the bouquet
* prevent awkward placements
* create natural composition constraints


---

# Core Experience

Users should be able to:
1. Select flowers and greenery from a tray
2. Arrange flowers within the bouquet composition zone
3. Drag flowers naturally within bouquet boundaries
4. Resize and rotate flowers intuitively
5. Create layered bouquet compositions
6. Customize bouquet wrappers
7. Add a short message card
8. Share the bouquet via link


---

# Composition Philosophy

The experience should feel guided rather than fully freeform.

Users should feel naturally assisted toward creating beautiful bouquets through:

* spatial constraints
* layering behavior
* bouquet structure
* subtle snapping and clustering

The experience should feel more like arranging a real bouquet and less like editing a generic sticker canvas.


---

# Product Goals

The experience should:
- feel relaxing and cozy
- encourage creative expression
- feel satisfying even without sending
- work smoothly on mobile web
- feel intuitive with touch gestures

The bouquet arranging experience is the main product value.


---

# MVP Scope

## Included
- Mobile-first canvas
- Add flower stickers
- Drag flowers
- Resize flowers
- Rotate flowers
- Layer flowers
- Bouquet wrapper/background
- Short text note
- Generate shareable link

## Excluded
- Accounts/login
- AI generation
- Payments
- Multiplayer
- Social feed
- Notifications
- Advanced flower physics


---

# Interaction Model

## Mobile
- **Drag**: one-finger drag to move flowers
- **Resize + Rotate**: two-finger pinch gesture to scale and rotate simultaneously
- Tapping a flower makes it the active target for pinch gestures

## Desktop
- **Drag**: click and drag to move flowers
- **Select**: clicking a flower selects it (brings to front, shows rotation handle)
- **Rotate**: drag the rotation handle below the selected flower in a circular motion
- **Resize**: trackpad pinch to scale the active flower
- **Deselect**: click the canvas background to deselect
- The rotation handle stays a fixed visual size regardless of flower zoom level
- The rotation handle is idle (white) by default and turns purple while actively rotating


---

# Interaction Principles

- Interactions should feel direct and responsive
- Gestures should feel forgiving
- Motion should feel soft and springy
- Editing should feel playful, not technical
- Users should not need tutorials


---

# Visual Direction

The visual style should feel:
- soft
- cozy
- tactile
- emotionally warm

Inspirations:
- Instagram Story editor
- Animal Crossing
- cozy mobile games
- sticker books
- scrapbooking


---

# Technical Direction

## Frontend
- Next.js
- TypeScript
- TailwindCSS
- Framer Motion

## Gesture Handling
- @use-gesture/react

## Storage
- Local state initially
- Supabase later if needed


---

# Success Criteria

The MVP is successful if:
- arranging flowers feels enjoyable
- touch gestures feel smooth on mobile
- users naturally experiment with layouts
- the experience feels emotionally delightful


---

# First Milestone

Build a mobile canvas where:
- users can add flowers
- drag flowers smoothly
- resize flowers
- rotate flowers

No backend required.
