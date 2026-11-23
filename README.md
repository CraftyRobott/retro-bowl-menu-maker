# Retro Bowl Menu Maker

A browser-based visual editor for designing custom Retro Bowl menus.

## Use it

Open the GitHub Pages site, add a menu, then add buttons, text, images, and panels. Drag elements on the 853 × 480 canvas and edit their properties in the right panel.

- **Save project** downloads editable project JSON.
- **Load** restores a saved JSON project.
- **Export mod** downloads a JavaScript layout/helper export.

## v1 scope

This is a visual layout editor. It does not automatically patch a particular Retro Bowl build yet. The exported file exposes `window.RetroBowlMenuMaker` with the project, a canvas drawing helper, and button-action helper. Those helpers need to be connected to the appropriate game hooks for the target build.

## GitHub Pages

In the repository settings, open **Pages** and select **Deploy from a branch**, branch **main**, folder **/** (root). The site will be published at:

https://craftyrobott.github.io/retro-bowl-menu-maker/
