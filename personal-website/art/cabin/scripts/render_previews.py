"""Render quick previews of arrival.blend: the game-camera view and a turnaround per character.

Run from personal-website/:
    /Applications/Blender.app/Contents/MacOS/Blender -b art/cabin/arrival.blend \
        --python art/cabin/scripts/render_previews.py -- <output-dir>
"""

import math
import os
import sys

import bpy
from mathutils import Vector

out_dir = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/cabin-previews"
os.makedirs(out_dir, exist_ok=True)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.film_transparent = False
scene.view_settings.view_transform = "Standard"
scene.render.resolution_percentage = 100

CHARACTERS = {
    "Eduard": 1.5,
    "Hiker": 1.5,
    "Rusty": 0.9,
    "Cow": 0.45,
    "Hugo": 1.0,
}


def render(path, w, h):
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def set_visible(names):
    for c in bpy.data.collections:
        if c.name == "Preview":
            continue
        c.hide_render = c.name not in names


cam = bpy.data.objects["GameCamera"]

# 1. the game camera view of the whole arrival
set_visible({"Set", "Eduard", "Hiker", "Rusty", "Cow", "Hugo"})
render(os.path.join(out_dir, "scene-game-camera.png"), 1280, 800)

# 2. a closer three-quarter view of the cabin and deck
cam.location = (5.5, -9.5, 4.2)
cam.rotation_euler = (math.radians(70), 0, math.radians(32))
render(os.path.join(out_dir, "scene-cabin-close.png"), 1280, 800)

# 3. turnarounds: each character alone, at the origin, four angles
for name, size in CHARACTERS.items():
    set_visible({name})
    root = bpy.data.objects[name]
    saved = (root.location.copy(), root.rotation_euler.copy())
    root.location = (0, 0, 0)
    root.rotation_euler = (0, 0, 0)
    target = Vector((0, 0, size * 0.5))
    dist = size * 2.6
    for i, ang in enumerate((0, 45, 90, 180)):
        a = math.radians(-90 - ang)
        cam.location = target + Vector((math.cos(a) * dist, math.sin(a) * dist, size * 0.55))
        direction = target - cam.location
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        render(os.path.join(out_dir, f"turn-{name.lower()}-{i}.png"), 480, 560)
    root.location, root.rotation_euler = saved

print("PREVIEWS_OK", out_dir)
