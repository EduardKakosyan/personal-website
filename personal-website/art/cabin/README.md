# Cabin scene art

Source for the arrival preview at `/preview/arrival` (redesign step 4).

- `arrival.blend` is the editable scene. Open it in Blender 5.2+. Collections: `Set`, `CabinParts`, `SeeThrough`, `Props`, `Eduard`, `Hiker`, `Hiker2`, `Rusty`, `Cow`, `Hugo`, and `Preview` (the game camera and sun, not exported). The `GameCamera` matches the website's view.
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
import sys; [sys.modules.pop(m, None) for m in ("lib", "shapes", "rusty_model", "eduard_model", "guest_model", "brook_model")]  # pick up changes (Blender keeps the old modules loaded)
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
- Eduard is built in `scripts/eduard_model.py` (A107) from the same smoothed, lofted shapes as Rusty (`scripts/shapes.py`): the hair and the beard are shells over his head, cut along a hairline and a beard line. `Eduard_Beard` and `Eduard_Mustache` are the two face options. Both are exported; the website shows the beard unless the URL has `?face=mustache`. `Eduard_Board` is a deck board in his left hand, hidden in Blender; the website shows it while he carries one from the lumber pile.
- Rusty is built in `scripts/rusty_model.py` (A105): each moving part (`Rusty_Body`, the four `Rusty_Leg*`, `Rusty_Head`, `Rusty_Tail`) is one smoothed surface lofted through cross-sections, painted by region before smoothing, with the eyes, nose and whisker spots placed on the head's surface by ray. The pivots are the same as the old model, so the website's animations carry over. `Rusty_Mouth` is an empty that marks where the plush cow sits; `Rusty_Tag` (now on the body, where the collar's tags hang) marks where his name tag hangs.
- Object names `Ground`, `Brook` and `StringLights` are special on the website (painted ground, no shadows). The website also goes by material: anything in `GroundPaint` gets the painted ground, and the one mesh in `water` (`BrookWater`) gets the website's own water.
- **The brook (scene 6)** is built in `scripts/brook_model.py` from photo 03: the channel is a finer strip of ground of its own (`GroundBrook`, in the ground's paint, so the banks are real banks; the coarse ground skips that stretch), the water surface (`BrookWater`), stones on the bed (seen through the water), mossy rocks, a riffle with foam, grass and roots on the banks, alders, birches and fallen wood, the stairs and the landing at the foot of them, the fishing hole, and the tap with its pipe and the blue jug. The numbers the website walks on (the brook's line, the stairs, the landing, the hole, the tap) are in `src/components/features/cabin/brook.ts`: keep the two in step. `build_arrival.py`'s `brook()` still draws (and throws away) the first pass's random numbers, so the forest and the plants after it stay where they were.
- The cabin is in parts so the guest can go inside. `Cabin` (floor and the walls that stay) and `Cabin_Interior` go in `set.glb`. The parts the website moves or fades are in the `CabinParts` collection and exported to `cabin-parts.glb` without merging: `Cabin_Roof`, `Cabin_SouthWall` and `StringLights` dissolve when the guest is inside, and `Cabin_Door` swings open on its hinge. The walls, floor heights, door route and where the résumé and to-do list are live in `src/components/features/cabin/world.ts`.
- Things that can hide the guest from the camera (the woodshed, the stand of trees by it, the saplings in the field, and the alders and birches on the field side of the brook near the stairs, `BankAlder*`/`BankBirch*`) are in the `SeeThrough` collection and exported to `see-through.glb` without merging, so the website can fade each one on its own while it's in the way.
- Things the guest can use are in the `Props` collection and exported to `props.glb` without merging, so each can glow on its own: `Resume`, `TodoList`, `MushroomBasket`, `StriperRod`, `TackleBox`, `ChoppingBlock`, `BlockAxe` (hidden on the website while the guest holds the axe), `Log`, `LogHalfA`/`LogHalfB` (hidden in Blender; the splitting game shows them), the brook's `BrookTap` and `BrookRod` (the rod leaning on the handrail at the foot of the stairs; the website hides it while the guest is fishing), and the six project boxes `Crate_0`…`Crate_5`, each with a `Crate_N_Lid` child hinged along its back edge and a `Crate_N_Item` child (hidden in Blender; the website lifts it out). The order of the things in the boxes is `CRATE_ITEMS` in the build script, which must match `BENCH_SLUGS` in `src/app/preview/arrival/page.tsx`.
- `Hiker` and `Hiker2` are the two characters the guest can pick from (`hiker.glb`, `hiker-2.glb`); both have the same parts with their own prefix, plus a `_Axe` in the right hand, hidden until the splitting game. `render_portraits.py` renders the two faces for the picker (`guest-1.png`, `guest-2.png`).
- **The compressor folds a dequantisation offset and scale into each leaf node's transform**, so on the website a leaf node's position and scale can't be overwritten and its origin isn't where it was in Blender. Anything the website moves, turns or scales (the door, the lids, the things in the boxes, the log and its halves, the guest's axe) is wrapped in a pivot group first (`pivotWrap` in `arrival-scene.tsx`), with the pivot given in the parent's frame (the hinge, the base of the log, the hand).
- Colours come from the palette in `scripts/lib.py`: the "bit brighter" row sampled from Eduard's photos, plus a few neutrals.
- Obstacles and spots on the website (`src/components/features/cabin/world.ts`) are copied from the script by hand. If you move something in the script, move it there too.
