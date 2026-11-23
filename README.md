# Retro Bowl Menu Maker

A browser-based visual editor and source-backed menu hierarchy explorer for Retro Bowl College.

## Load the game source

1. Open the GitHub Pages app: https://craftyrobott.github.io/retro-bowl-menu-maker/
2. The source loader is prefilled with `ReznorsRevenge1/retro-bowl-college`, branch `main`.
3. Select **Load source**. The app fetches `html5game/RetroBowl.js` directly from GitHub and scans its GameMaker JavaScript.
4. Expand the discovered hierarchy to inspect screen-related functions, button callbacks, referenced room/screen builders, and menu-related GameMaker objects.
5. Select a discovered screen function and choose **Create editable menu workspace** to add a canvas for designing an override.

You can change the repository or branch in the loader to inspect another compatible GameMaker HTML5 build.

## What the hierarchy represents

The tree is generated from the actual source file, not a hand-written list of assumed screens. It currently groups source evidence into:
- Screen-related functions (GUI drawing, screen setup, title and room lifecycle functions).
- Room/screen builder functions referenced by button callbacks.
- Button callback functions grouped by their names and apparent feature area.
- GameMaker objects with menu/UI-related names.

These are source-discovery groups, not yet a fully verified runtime navigation graph. Some GameMaker rooms are created dynamically, and a callback can navigate indirectly through helper functions.

## Run the game and capture its live UI

1. Select **Run & capture** in the top bar.
2. The app opens an instrumented game frame using the selected repository and branch. It loads `html5game/RetroBowl.js` directly and calls `GameMaker_Init()` without the Poki startup wrapper.
3. Navigate through the game. The capture panel records room changes, button callback function names, room helper calls, text draw calls and coordinates, sprite draw calls, dynamically created instances, and pointer coordinates.
4. Use **Export capture JSON** to save the collected evidence for analysis.

The capture is observational: it does not modify the source repository or save game progress intentionally. The runner supplies the same no-op Poki SDK interface used by the project's no-Poki launcher, waits for the page load event, and then calls `GameMaker_Init()`. GameMaker's internal drawing pipeline is not fully converted into editable objects yet, so the runtime capture is evidence for the next extraction step rather than a pixel-perfect editable menu automatically. If the runner still fails, inspect the runtime event panel for script, asset, or boot errors.

## Visual editor

- Create menus and add buttons, text, images, and panels/shapes.
- Drag and resize elements on the 853 × 480 canvas.
- Edit positions, dimensions, colors, fonts, actions, image sources, and layer order.
- Save/load project JSON and export a JavaScript layout/helper mod.

The exported helpers still need to be connected to the correct runtime hooks for the specific game build.

## GitHub Pages

In repository settings, open **Pages** and select **Deploy from a branch**, branch **main**, folder **/** (root). The site URL is:

https://craftyrobott.github.io/retro-bowl-menu-maker/
