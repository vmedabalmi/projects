# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of browser-based games, each in its own folder. Games are single HTML files with no external dependencies — all rendering, logic, and assets are self-contained using HTML5 Canvas and vanilla JavaScript.

## Structure

- `shooter/` — Top-down 2D retro shooter (arrow keys + mouse aiming, 5 levels, 3 enemy types + boss)

## Development

Games are plain HTML files. To run or test, open them directly in a browser:
```
open shooter/shooter.html
```

No build step, no package manager, no dependencies.

## Conventions

- Each game lives in its own folder
- All sprites/graphics are drawn programmatically on canvas (no image assets)
- Games use `requestAnimationFrame` for the game loop
- Input handling: keyboard state map + mouse tracking
- Style: 2D retro pixel-art aesthetic
