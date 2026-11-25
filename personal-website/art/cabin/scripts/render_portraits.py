"""Render the two characters' portraits for the picker on the website.

Run from personal-website/ after build_arrival.py:
    /Applications/Blender.app/Contents/MacOS/Blender -b art/cabin/arrival.blend \
        --python art/cabin/scripts/render_portraits.py

Writes public/models/cabin/guest-1.png and guest-2.png: small, square,
transparent renders of each character's head and shoulders, seen from the front.
"""

import math
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "models", "cabin")

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"
scene.render.resolution_percentage = 100
scene.render.resolution_x = 96
scene.render.resolution_y = 96
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

cam = bpy.data.objects["GameCamera"]
cam.data.lens = 60


def show_only(names):
    for c in bpy.data.collections:
        if c.name == "Preview":
            continue
        c.hide_render = c.name not in names


for name, file in (("Hiker", "guest-1.png"), ("Hiker2", "guest-2.png")):
    show_only({name})
    root = bpy.data.objects[name]
    x, y, z = root.location
    # in front of the face (the preview turns the hikers to face +Y), level with the head
    cam.location = (x, y + 2.3, z + 1.05)
    cam.rotation_euler = (math.radians(88), 0, math.radians(180))
    scene.render.filepath = os.path.join(OUT, file)
    bpy.ops.render.render(write_still=True)
    print("PORTRAIT", file)
