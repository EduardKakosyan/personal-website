# Cabin scene art

Source for the arrival preview at `/preview/arrival` (redesign step 4).

- `arrival.blend` is the editable scene. Open it in Blender 5.2+. Collections: `Set`, `Eduard`, `Hiker`, `Rusty`, `Cow`, `Hugo`, and `Preview` (the game camera and sun, not exported). The `GameCamera` matches the website's view.
- `scripts/build_arrival.py` rebuilds the whole scene from code and exports the models. Edits made only in the `.blend` file are overwritten the next time the script runs. Either change the script, or stop using it and export from Blender by hand.
- `scripts/optimize_models.sh` compresses the exported `.glb` files. Run it after every build.
- `scripts/render_previews.py` renders the game-camera view and a turnaround of each character, so you can check them without the website.

## The layout

The property follows Eduard's sketch: the gravel road on the west, the blueberry field (with the solar panels), a north–south strip of trees, the driveway that leaves the road in the south-west and U-turns north to the cabin, the grass field, and the brook along the east edge. Around the cabin it follows his second sketch: the long wall with the door and window faces east onto the deck, the barn doors face south where the driveway ends, the seats are east of the deck and the fire south-east of it, the shower is behind (north of) the cabin, the woodshed is further south-east, and a path runs east from the camp to the stairs at the brook. The cabin and deck are modelled facing -Y and turned by `CABIN_ROT`. Distances around the cabin are squeezed so the walk stays short; the buildings are life-size. The blueberry field is not squeezed: it's about 2 acres, like the real one, so the road and the start of the driveway are far to the west. All of it is set by the constants at the top of `build_arrival.py`.

The ground is painted by `ground-mask.png` (written by the script into `public/models/cabin/`): red = gravel, green = long meadow grass, blue = blueberry field. The website turns it into pixel-art patches (`src/components/features/cabin/pixel-look.tsx`).

## Rebuild

Headless, from `personal-website/`:

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --python art/cabin/scripts/build_arrival.py
bash art/cabin/scripts/optimize_models.sh
```

Or inside a running Blender (this is how the MCP runs it; it clears the scene without resetting Blender, so the MCP add-on stays on):

```python
p = "/full/path/to/art/cabin/scripts/build_arrival.py"
exec(compile(open(p).read(), p, "exec"), {"__file__": p, "__name__": "__main__"})
```

## The look

Blender's viewport shows the models with smooth shading on round shapes (`SMOOTH_ANGLE` in `lib.py`) and crisp edges on boxes. How the world is drawn is decided on the website (`src/components/features/cabin/pixel-look.tsx`), with three looks to compare via `?look=`:

- `pixel`: drawn about 230 pixels tall, light in three flat steps, one-pixel outlines.
- `soft` (the default, Eduard's pick): the same at about 460 rows, so the pixels and outlines are finer.
- `smooth`: full resolution, soft light and shadows, no outlines; closest to Animal Crossing.

## Conventions the website relies on

- Characters face **-Y** in Blender, which becomes **+Z** in three.js. North (+Y in Blender) is **-Z** in three.js.
- Animated parts are separate objects with their pivot at the joint, named like `Eduard_ArmR`, `Rusty_Tail` or `Hugo_AntennaL`. The website finds them by name (`src/components/features/cabin/arrival-scene.tsx`), so renaming a part breaks its animation.
- `Eduard_Beard` and `Eduard_Mustache` are the two face options. Both are exported; the website shows the beard unless the URL has `?face=mustache`.
- `Rusty_Mouth` is an empty that marks where the plush cow sits.
- Object names `Ground`, `Brook` and `StringLights` are special on the website (painted ground, no shadows).
- Colours come from the palette in `scripts/lib.py`: the "bit brighter" row sampled from Eduard's photos, plus a few neutrals.
- Obstacles and spots on the website (`src/components/features/cabin/world.ts`) are copied from the script by hand. If you move something in the script, move it there too.
