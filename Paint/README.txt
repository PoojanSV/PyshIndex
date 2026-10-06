# Paint — Mobile

A mobile-friendly MS Paint-style drawing app built only with HTML, CSS and JavaScript.

## Included
- Pencil, brush, eraser, fill bucket, color picker, spray
- Line, rectangle, rounded rectangle, ellipse, triangle, polygon
- Text tool
- Select/crop workflow
- Undo/redo
- New canvas and resize
- Rotate left/right, flip horizontal/vertical
- 40-color palette + custom color picker
- Primary/secondary color behavior (right-click on desktop; palette secondary support is built into the UI logic)
- Opacity, brush size, outline/fill mode
- Zoom, fit-to-screen, grid mode
- Drag/drop image opening
- PNG export
- Browser autosave
- Installable PWA with offline caching

## Run
For full PWA installation/offline support, serve the folder from HTTPS or localhost.

Examples:
- VS Code Live Server
- `python -m http.server 8000`
- Any static hosting such as GitHub Pages

Opening `index.html` directly from `file://` still lets the editor work, but service-worker installation is restricted by browsers.
