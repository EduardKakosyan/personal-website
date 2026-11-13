"""Build the arrival scene (storyboard scene 3) and export it for the website.

v2: the layout follows Eduard's sketch (A55), the characters are rounder, and
Eduard has a short beard or a mustache (A54). The pixel look itself (low
resolution, stepped light, outlines) happens on the website.

Run it headless from the repo's personal-website/ folder:
    /Applications/Blender.app/Contents/MacOS/Blender -b --python art/cabin/scripts/build_arrival.py
or inside a running Blender (the MCP does this):
    exec(open(".../build_arrival.py").read(), {"__file__": ".../build_arrival.py", "__name__": "__main__"})

Writes:
    art/cabin/arrival.blend                    the editable source scene
    public/models/cabin/{set,eduard,hiker,rusty,cow,hugo}.glb
    public/models/cabin/ground-mask.png        where the gravel, meadow and blueberries are

Directions: +X is east, +Y is north. The road is on the west, the brook on the
east, and the cabin's long front wall faces south down the driveway. Characters
face -Y. Animated parts are separate objects with their pivot at the joint,
named like "Eduard_ArmR", so the website can rotate them by name.
"""

import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402
from lib import (  # noqa: E402
    box,
    collection,
    compound,
    cyl,
    deg,
    empty,
    ico,
    reset_scene,
    sphere,
    wedge,
)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))  # personal-website/
BLEND_PATH = os.path.join(ROOT, "art", "cabin", "arrival.blend")
MODEL_DIR = os.path.join(ROOT, "public", "models", "cabin")

rng = random.Random(7)

# ---------------------------------------------------------------- the property (from the sketch)
# Distances are squeezed so the walk stays short; the buildings are life-size.
CABIN_W, CABIN_D = 4.9, 3.6  # long wall (door + window) faces south
WALL_BASE, WALL_H, RIDGE = 0.2, 2.05, 0.42
WALL_TOP = WALL_BASE + WALL_H
FRONT_Y = -CABIN_D / 2
DOOR_X = (-1.45, -0.6)
WINDOW_X = (0.55, 1.55)

DECK_TOP = 0.3
DECK_X0, DECK_X1 = -2.35, 0.45
DECK_Y0, DECK_Y1 = FRONT_Y, FRONT_Y - 1.8

# The blueberry field is about 2 acres in real life (Eduard), so unlike the rest
# of the property it is NOT squeezed: about 61 m x 133 m, roughly 8,100 m2.
ROAD_X, ROAD_W = -78.0, 5.5
BLUEBERRY = (-74.0, -13.2, -31.0, 102.0)  # x0, x1, y0, y1
TREE_STRIP = (-12.6, -9.2, -33.5, 112.0)
# Driveway: leaves the road in the south-west, U-turns and runs north to the cabin.
DRIVEWAY = [
    (-76.0, -34.0),
    (-68.0, -40.5),
    (-50.0, -43.5),
    (-30.0, -44.0),
    (-12.0, -42.8),
    (-4.0, -41.6),
    (0.4, -37.0),
    (1.0, -28.0),
    (0.4, -18.0),
    (-0.4, -10.0),
    (-0.5, -5.2),
]
DRIVE_W = 3.2
# Eduard's second sketch: the cabin's long wall (door + window) faces east onto
# the deck; the barn doors face south, where the driveway ends.
CABIN_ROT = 90  # the cabin is modelled with its front facing -Y, then turned to face east
# gravel ellipses (centre x, y, radius x, radius y): parking by the barn doors,
# and the camp east of the cabin (deck, seats, fire)
PADS = [(0.3, -4.6, 4.2, 2.8), (5.0, -1.0, 3.8, 3.2)]
PATH = [(8.2, 0.4), (13.0, 0.8), (18.5, 0.1), (24.3, 0.2)]  # camp to the brook stairs
SHOWER = (2.9, 4.0)
WOODSHED = (5.8, -8.8)
# A small stand of trees between the driveway and the woodshed, wrapping along
# its south side (Eduard: "the woodshed sits partly behind them"). x, y, height, kind.
TREE_STAND = [
    (2.8, -7.6, 5.0, "spruce"),
    (3.3, -9.0, 6.2, "spruce"),
    (2.7, -10.3, 4.6, "birch"),
    (3.4, -11.5, 5.8, "spruce"),
    (2.9, -12.7, 5.2, "spruce"),
    (4.3, -13.0, 4.4, "birch"),
    (5.6, -13.3, 5.6, "spruce"),
    (7.0, -12.9, 4.8, "birch"),
    (8.2, -13.5, 5.4, "spruce"),
]
# young trees in the grass field: x, y, height, "spruce" or "blue" (blue spruce)
SAPLINGS = [
    (7.8, -5.6, 1.4, "spruce"),
    (11.0, -4.6, 1.1, "blue"),
    (14.5, -9.0, 2.0, "spruce"),
    (18.0, -3.2, 0.9, "blue"),
    (12.5, -16.0, 1.6, "spruce"),
    (20.0, -12.5, 2.3, "blue"),
    (16.0, -22.0, 1.3, "spruce"),
    (-6.5, -14.0, 2.2, "spruce"),
    (6.5, -24.0, 1.8, "blue"),
]
SEATS = [(5.6, 0.8, -20), (6.7, 1.1, 0), (7.7, 0.6, 20)]  # x, y, turn (they face the fire)
FIRE = (6.0, -2.6)
GROUND = (-110.0, -80.0, 200.0)  # x0, y0, size of the ground square and its mask


def brook_x(y):
    """The brook winds north-south along the east edge. The grass field between
    the driveway and the brook is about twice as wide as first built (Eduard)."""
    return 26.0 + 1.3 * math.sin(y * 0.1 + 0.6) + 0.6 * math.sin(y * 0.29 + 2.0)


BROOK_HALF = 1.3  # half the water's width


# ---------------------------------------------------------------- small geometry helpers
def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def smooth_polyline(points, steps=8):
    """Catmull-Rom through the points, for a driveway with soft bends."""
    out = []
    pts = [points[0]] + points + [points[-1]]
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for s in range(steps):
            t = s / steps
            t2, t3 = t * t, t * t * t
            out.append(
                tuple(
                    0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
                    for k in (0, 1)
                )
            )
    out.append(points[-1])
    return out


DRIVE_LINE = smooth_polyline(DRIVEWAY)


def polyline_dist(px, py, line):
    return min(seg_dist(px, py, *line[i], *line[i + 1]) for i in range(len(line) - 1))


def ground_height(x, y):
    """Flat where people walk; the brook cuts a channel along the east edge."""
    d = abs(x - brook_x(y))
    if d < BROOK_HALF + 1.4:
        k = max(0.0, min(1.0, (d - BROOK_HALF) / 1.4))
        return -0.75 * (1 - k * k * (3 - 2 * k))
    return 0.0


# ---------------------------------------------------------------- ground and its paint mask
def ground():
    import bmesh

    x0, y0, size = GROUND
    n = 160
    me = bpy.data.meshes.new("Ground")
    bm = bmesh.new()
    verts = []
    for j in range(n + 1):
        row = []
        for i in range(n + 1):
            x, y = x0 + size * i / n, y0 + size * j / n
            row.append(bm.verts.new((x, y, ground_height(x, y))))
        verts.append(row)
    for j in range(n):
        for i in range(n):
            bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            loop[uv].uv = ((loop.vert.co.x - x0) / size, (loop.vert.co.y - y0) / size)
    bm.to_mesh(me)
    bm.free()
    m = bpy.data.materials.new("GroundPaint")
    me.materials.append(m)
    ob = bpy.data.objects.new("Ground", me)
    bpy.data.collections["Set"].objects.link(ob)
    img = ground_mask()
    # Blender-only preview of the paint (the website colours the ground itself).
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(nd for nd in nt.nodes if nd.type == "BSDF_PRINCIPLED")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Linear"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tex.outputs["Color"], sep.inputs["Color"])

    def mix(a_socket_or_color, b_color, fac_socket):
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        ins = [i for i in mx.inputs if i.type == "RGBA"]
        if isinstance(a_socket_or_color, tuple):
            ins[0].default_value = a_socket_or_color
        else:
            nt.links.new(a_socket_or_color, ins[0])
        ins[1].default_value = b_color
        nt.links.new(fac_socket, mx.inputs[0])
        return next(o for o in mx.outputs if o.type == "RGBA")

    c = mix(lib.hex_to_linear(lib.PALETTE["grass_light"]), lib.hex_to_linear("#8fa84a"), sep.outputs[1])
    c = mix(c, lib.hex_to_linear("#4f6b4a"), sep.outputs[2])
    c = mix(c, lib.hex_to_linear(lib.PALETTE["gravel"]), sep.outputs[0])
    nt.links.new(c, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 1.0


def ground_mask():
    """R = gravel, G = unmown meadow, B = blueberry field. Soft ramps, so the website
    can sample it smoothly and cut crisp, wobbly pixel edges."""
    import numpy as np

    x0, y0, size = GROUND
    res = 1024
    xs = x0 + (np.arange(res) + 0.5) * size / res
    ys = y0 + (np.arange(res) + 0.5) * size / res
    X, Y = np.meshgrid(xs, ys)  # row = y (bottom row first, like Blender's pixels)

    def ramp(signed_dist, soft=0.6):
        return np.clip(0.5 - signed_dist / (2 * soft), 0.0, 1.0)

    def dist_to_line(line):
        d = np.full(X.shape, 1e9)
        for (ax, ay), (bx, by) in zip(line[:-1], line[1:]):
            dx, dy = bx - ax, by - ay
            t = np.clip(((X - ax) * dx + (Y - ay) * dy) / (dx * dx + dy * dy), 0, 1)
            d = np.minimum(d, np.hypot(X - (ax + t * dx), Y - (ay + t * dy)))
        return d

    pad_sd = np.minimum.reduce([(np.hypot((X - cx) / rx, (Y - cy) / ry) - 1.0) * min(rx, ry) for cx, cy, rx, ry in PADS])
    drive_sd = dist_to_line(DRIVE_LINE) - DRIVE_W / 2
    road_sd = np.abs(X - ROAD_X) - ROAD_W / 2
    path_sd = dist_to_line(PATH) - 0.55
    gravel = np.maximum.reduce([ramp(pad_sd), ramp(drive_sd), ramp(road_sd), ramp(path_sd, 0.3)])

    bx0, bx1, by0, by1 = BLUEBERRY
    blue_sd = np.maximum.reduce([bx0 - X, X - bx1, by0 - Y, Y - by1])
    blue = ramp(blue_sd, 0.8)

    # Mown around the cabin, along the driveway and the path; long meadow further out.
    near_cabin = np.hypot((X - 8.0) / 22.0, (Y + 7.0) / 16.0) - 1.0
    near_drive = (dist_to_line(DRIVE_LINE) - 4.0) / 10.0
    near_path = (dist_to_line(PATH) - 2.0) / 10.0
    mown_sd = np.minimum.reduce([near_cabin, near_drive, near_path]) * 10.0
    meadow = 1.0 - ramp(mown_sd, 2.0)
    meadow = np.where(blue > 0.5, 0.0, meadow)

    img = bpy.data.images.new("GroundMask", res, res, alpha=False, is_data=True)
    # (set the colour space before the pixels: changing it afterwards blanks the image)
    px = np.ones((res, res, 4), dtype=np.float32)
    px[..., 0], px[..., 1], px[..., 2] = gravel, meadow, blue
    img.pixels.foreach_set(px.ravel())
    img.update()
    img.filepath_raw = os.path.join(MODEL_DIR, "ground-mask.png")
    img.file_format = "PNG"
    os.makedirs(MODEL_DIR, exist_ok=True)
    img.save()
    return img


def gravel_stones():
    """Loose stones on the yard and driveway, and rocks in the fields."""
    parts = []
    for _ in range(140):
        if rng.random() < 0.45:
            px, py = DRIVE_LINE[rng.randrange(len(DRIVE_LINE))]
            x, y = px + rng.uniform(-1.3, 1.3), py + rng.uniform(-1.3, 1.3)
        else:
            cx, cy, rx, ry = rng.choice(PADS)
            a, r = rng.uniform(0, math.tau), math.sqrt(rng.random()) * 0.9
            x, y = cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r
        s = rng.uniform(0.05, 0.09)
        parts.append(ico(rng.choice(["gravel_dark", "stone"]), s, (x, y, 0.02), scale=(1.2, 1, 0.45), sub=1))
    compound("Gravel", parts)

    rocks = []
    for x, y, s in ((-5.6, -9.0, 0.45), (8.4, -4.0, 0.6), (-6.8, -2.0, 0.55), (7.0, -18.0, 0.4), (-4.6, -20.0, 0.5)):
        rocks.append(ico("stone", s, (x, y, s * 0.2), scale=(1.25, 1, 0.65), rot=deg(0, 0, rng.uniform(0, 90))))
    # blueberry fields are full of rocks
    for _ in range(140):
        x, y = rng.uniform(BLUEBERRY[0] + 1, BLUEBERRY[1] - 1), rng.uniform(BLUEBERRY[2] + 1, BLUEBERRY[3] - 1)
        s = rng.uniform(0.25, 0.6)
        rocks.append(ico("stone", s, (x, y, s * 0.15), scale=(1.3, 1, 0.55), rot=deg(0, 0, rng.uniform(0, 90))))
    compound("Rocks", rocks)


# ---------------------------------------------------------------- cabin and deck
def cabin():
    """The cabin in parts, so the website can cut it away when the guest steps
    inside (roof, ceiling and the south wall fade; the other walls stay).
    Modelled in local coordinates with the front (door + window) facing -Y,
    then turned by CABIN_ROT so the front faces east. Local -X becomes the
    south end (barn doors), +X the north end.
    """
    hw, hd = CABIN_W / 2, CABIN_D / 2
    T = 0.1  # wall thickness
    rot = deg(0, 0, CABIN_ROT)
    dh = 1.72  # door height
    wcx, ww, wz, wh = (WINDOW_X[0] + WINDOW_X[1]) / 2, WINDOW_X[1] - WINDOW_X[0], WALL_BASE + 1.3, 0.72

    def wall_x(p, x0, x1, z0, z1, y_out, inward):
        """A front/back wall piece along X: outer boards and the pine lining inside."""
        cx, w, h = (x0 + x1) / 2, x1 - x0, z1 - z0
        p.append(box("cabin", (w, T - 0.02, h), (cx, y_out + inward * (T - 0.02) / 2, z0 + h / 2)))
        p.append(box("pine", (w, 0.02, h), (cx, y_out + inward * (T - 0.01), z0 + h / 2)))

    def wall_y(p, x_out, inward):
        """An end wall along Y (full width), with its gable triangle."""
        p.append(box("cabin", (T - 0.02, CABIN_D, WALL_H), (x_out + inward * (T - 0.02) / 2, 0, WALL_BASE + WALL_H / 2)))
        p.append(box("pine", (0.02, CABIN_D - 2 * T, WALL_H), (x_out + inward * (T - 0.01), 0, WALL_BASE + WALL_H / 2)))
        p.append(wedge("cabin", CABIN_D, T, RIDGE, (x_out + inward * T / 2, 0, WALL_TOP), deg(0, 0, 90)))

    def battens_y(p, x_face):
        y = -hd + 0.16
        while y < hd - 0.1:
            g = RIDGE * (1 - abs(y) / hd)
            p.append(box("cabin_dark", (0.04, 0.05, WALL_H + g * 0.9), (x_face, y, WALL_BASE + (WALL_H + g * 0.9) / 2)))
            y += 0.32

    # ---- the shell that stays: floor, front (east), back (west) and north walls
    p = [box("stone", (CABIN_W + 0.1, CABIN_D + 0.1, WALL_BASE), (0, 0, WALL_BASE / 2))]
    p.append(box("floor_red", (CABIN_W - 2 * T, CABIN_D - 2 * T, 0.05), (0, 0, WALL_BASE + 0.025)))
    yy = -hd + T + 0.17
    while yy < hd - T:
        p.append(box("floor_dark", (CABIN_W - 2 * T, 0.015, 0.004), (0, yy, WALL_BASE + 0.051)))
        yy += 0.17
    d0, d1 = DOOR_X
    for x0, x1, z0, z1 in (
        (-hw, d0, WALL_BASE, WALL_TOP),
        (d0, d1, WALL_BASE + dh, WALL_TOP),
        (d1, WINDOW_X[0], WALL_BASE, WALL_TOP),
        (WINDOW_X[0], WINDOW_X[1], WALL_BASE, wz - wh / 2),
        (WINDOW_X[0], WINDOW_X[1], wz + wh / 2, WALL_TOP),
        (WINDOW_X[1], hw, WALL_BASE, WALL_TOP),
    ):
        wall_x(p, x0, x1, z0, z1, FRONT_Y, 1)
    wall_x(p, -hw, hw, WALL_BASE, WALL_TOP, hd, -1)
    wall_y(p, hw, -1)
    # board-and-batten outside: front (around the door and window), back and north end
    x = -hw + 0.16
    while x < hw - 0.1:
        for face_y, front in ((FRONT_Y - 0.02, True), (hd + 0.02, False)):
            if front and d0 - 0.06 < x < d1 + 0.06:
                p.append(box("cabin_dark", (0.05, 0.04, WALL_TOP - (WALL_BASE + dh)), (x, face_y, (WALL_TOP + WALL_BASE + dh) / 2)))
            elif front and WINDOW_X[0] - 0.06 < x < WINDOW_X[1] + 0.06:
                p.append(box("cabin_dark", (0.05, 0.04, 0.9), (x, face_y, WALL_BASE + 0.45)))
            else:
                p.append(box("cabin_dark", (0.05, 0.04, WALL_H), (x, face_y, WALL_BASE + WALL_H / 2)))
        x += 0.32
    battens_y(p, hw + 0.02)
    for sy in (-1, 1):
        p.append(box("trim", (0.12, 0.12, WALL_H + 0.02), (hw + 0.01, sy * (hd + 0.01), WALL_BASE + WALL_H / 2)))
    # door frame and window (photos 02 and 05)
    dcx, dw = (d0 + d1) / 2, d1 - d0
    for xx in DOOR_X:
        p.append(box("trim", (0.09, T + 0.06, dh + 0.06), (xx, FRONT_Y + T / 2 - 0.03, WALL_BASE + dh / 2)))
    p.append(box("trim", (dw + 0.18, T + 0.06, 0.1), (dcx, FRONT_Y + T / 2 - 0.03, WALL_BASE + dh + 0.05)))
    p.append(box("glass", (ww, 0.03, wh), (wcx, FRONT_Y + T / 2, wz)))
    for dz in (-wh / 2, wh / 2):
        p.append(box("trim", (ww + 0.14, T + 0.06, 0.09), (wcx, FRONT_Y + T / 2 - 0.03, wz + dz)))
    for dx in (-ww / 2, 0, ww / 2):
        p.append(box("trim", (0.08 if dx else 0.05, T + 0.06, wh), (wcx + dx, FRONT_Y + T / 2 - 0.03, wz)))
    compound("Cabin", p, rot=rot)

    # The parts the website moves or fades go in their own collection and file
    # (cabin-parts.glb), so the optimizer doesn't merge them into the set.
    collection("CabinParts")

    # ---- the south end (barn doors): fades away when the guest is inside
    p = []
    wall_y(p, -hw, 1)
    battens_y(p, -hw - 0.02)
    for sy in (-1, 1):
        p.append(box("trim", (0.12, 0.12, WALL_H + 0.02), (-hw - 0.01, sy * (hd + 0.01), WALL_BASE + WALL_H / 2)))
        p.append(box("cabin_dark", (0.05, 0.85, 1.75), (-hw - 0.04, sy * 0.44, WALL_BASE + 0.9)))
        p.append(box("cabin", (0.06, 0.08, 1.9), (-hw - 0.06, sy * 0.44, WALL_BASE + 0.9), deg(sy * 26, 0, 0)))
    compound("Cabin_SouthWall", p, rot=rot)

    # ---- roof and ceiling: fade away too
    p = []
    run = math.hypot(hd, RIDGE)
    ang = math.atan2(RIDGE, hd)
    length = run + 0.3
    for sy in (-1, 1):
        cy = sy * math.cos(ang) * length / 2
        cz = WALL_TOP + RIDGE - math.sin(ang) * length / 2 + 0.05
        r = (-sy * ang, 0, 0)
        p.append(box("roof", (CABIN_W + 0.5, length, 0.06), (0, cy, cz), r))
        xx = -CABIN_W / 2 - 0.15
        while xx < CABIN_W / 2 + 0.25:
            p.append(box("roof_dark", (0.03, length, 0.03), (xx, cy, cz + 0.04), r))
            xx += 0.4
        p.append(box("trim", (CABIN_W + 0.52, 0.07, 0.12), (0, sy * (hd + 0.3), WALL_TOP)))
        # pine ceiling under each slope
        clen = run - 0.05
        p.append(box("pine", (CABIN_W - 2 * T, clen, 0.03), (0, sy * math.cos(ang) * clen / 2, WALL_TOP + RIDGE - math.sin(ang) * clen / 2 - 0.04), r))
    p.append(box("roof_dark", (CABIN_W + 0.52, 0.2, 0.07), (0, 0, WALL_TOP + RIDGE + 0.09)))
    compound("Cabin_Roof", p, rot=rot)

    # ---- the front door, hinged at its south edge so the website can swing it open
    hinge = (-FRONT_Y, d0)  # local (d0, FRONT_Y) turned to face east
    door = [
        box("door", (dw - 0.04, 0.06, dh - 0.02), (dw / 2, -0.03, WALL_BASE + dh / 2)),
        box("glass", (dw - 0.3, 0.07, 0.75), (dw / 2, -0.035, WALL_BASE + 1.15)),
        box("steel", (0.04, 0.12, 0.1), (dw - 0.14, -0.03, WALL_BASE + 1.0)),
    ]
    compound("Cabin_Door", door, location=(hinge[0], hinge[1], 0.0), rot=rot)

    # string lights along the front eave; they go with the roof when it fades
    lights = [box("wire", (CABIN_W + 0.3, 0.015, 0.015), (0, FRONT_Y - 0.28, WALL_TOP - 0.1))]
    n = 17
    for i in range(n):
        t = i / (n - 1)
        x = -hw - 0.1 + t * (CABIN_W + 0.2)
        sag = 0.07 * math.sin(math.pi * ((t * 4) % 1))
        lights.append(ico("string_light@1.4", 0.05, (x, FRONT_Y - 0.28, WALL_TOP - 0.16 - sag)))
    compound("StringLights", lights, rot=rot)

    collection("Set")
    cabin_interior()


FLOOR_Z = WALL_BASE + 0.05  # top of the cabin floor


def braided_rug(center, rx, ry):
    """An oval braided rug (photo 08): flat rings side by side in one mesh, so
    nothing overlaps or flickers."""
    import bmesh

    bands = [
        ("rug_cream", 0.0, 0.3), ("rug_red", 0.3, 0.34), ("rug_cream", 0.34, 0.48), ("rug_green", 0.48, 0.52),
        ("rug_cream", 0.52, 0.64), ("rug_red", 0.64, 0.68), ("rug_cream", 0.68, 0.79), ("rug_green", 0.79, 0.83),
        ("rug_cream", 0.83, 0.91), ("rug_red", 0.91, 0.95), ("rug_cream", 0.95, 1.0),
    ]
    names = []
    me = bpy.data.meshes.new("Rug")
    bm = bmesh.new()
    seg = 40
    cx, cy, cz = center

    # a very slight dome: a perfectly flat mesh has zero height, which the
    # model compressor can't scale (the rug vanished on the website)
    def ring(t):
        z = cz + 0.004 * (1 - t)
        return [bm.verts.new((cx + math.cos(a) * rx * t, cy + math.sin(a) * ry * t, z)) for a in (i / seg * math.tau for i in range(seg))]

    for tone, t0, t1 in bands:
        if tone not in names:
            names.append(tone)
        mi = names.index(tone)
        outer = ring(t1)
        if t0 == 0:
            mid = bm.verts.new((cx, cy, cz + 0.004))
            faces = [bm.faces.new((mid, outer[i], outer[(i + 1) % seg])) for i in range(seg)]
        else:
            inner = ring(t0)
            faces = [bm.faces.new((inner[i], outer[i], outer[(i + 1) % seg], inner[(i + 1) % seg])) for i in range(seg)]
        for fc in faces:
            fc.material_index = mi
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for fc in bm.faces:
        if fc.normal.z < 0:
            fc.normal_flip()
    bm.to_mesh(me)
    bm.free()
    for n in names:
        me.materials.append(lib.mat(n))
    ob = bpy.data.objects.new("Rug", me)
    bpy.data.collections["Set"].objects.link(ob)


def cabin_interior():
    """Inside, finished (A19), laid out like photo 08: rug in the middle, the red
    bistro table on the north wall, shelves and the folding table on the west
    wall, the counter under the east window. Plus the axe and chainsaw (A50),
    the to-do list on the wall and the résumé on the table (A47, A50)."""
    f = FLOOR_Z
    p = []
    braided_rug((-0.1, 0.0, f + 0.006), 0.62, 1.1)
    # red bistro table and two folding chairs (north wall)
    tx, ty = -0.2, 1.72
    p.append(cyl("bistro_red", 0.34, 0.03, (tx, ty, f + 0.72), seg=16))
    for a in (45, -45):
        p.append(box("bistro_red", (0.03, 0.03, 0.8), (tx, ty, f + 0.36), deg(a * 0.4, 0, a)))
    p.append(box("bistro_red", (0.5, 0.03, 0.03), (tx, ty, f + 0.25)))
    for sx in (-1, 1):
        cx = tx + sx * 0.55
        p.append(box("bistro_red", (0.34, 0.34, 0.03), (cx, ty, f + 0.45)))
        p.append(box("bistro_red", (0.03, 0.34, 0.42), (cx + sx * 0.17, ty, f + 0.66)))
        for lx in (-1, 1):
            for ly in (-1, 1):
                p.append(box("bistro_red", (0.025, 0.025, 0.45), (cx + lx * 0.14, ty + ly * 0.14, f + 0.22)))
    # a small landscape painting above the table
    p.append(box("weathered", (0.52, 0.03, 0.38), (tx, CABIN_W / 2 - 0.13, 1.75)))
    p.append(box("sky", (0.44, 0.035, 0.16), (tx, CABIN_W / 2 - 0.135, 1.81)))
    p.append(box("grass_light", (0.44, 0.035, 0.14), (tx, CABIN_W / 2 - 0.135, 1.66)))
    # west wall: two open shelves with jars and mugs, the folding table, a tote, propane
    wx = -CABIN_D / 2 + 0.1
    for z in (f + 1.0, f + 1.38):
        p.append(box("pine_dark", (0.26, 1.1, 0.03), (wx + 0.13, 0.75, z)))
        for k in range(6):
            tone = ("lupine_pink", "water_jug", "yolk", "trim", "collar", "grass_light")[(k + int(z * 10)) % 6]
            p.append(cyl(tone, 0.04 + 0.01 * (k % 2), 0.1 + 0.03 * (k % 3), (wx + 0.13, 0.3 + k * 0.17, z + 0.07), seg=8))
    p.append(box("door", (0.5, 0.7, 0.03), (wx + 0.3, 1.75, f + 0.7)))
    for lx in (-1, 1):
        for ly in (-1, 1):
            p.append(box("metal_dark", (0.025, 0.025, 0.7), (wx + 0.3 + lx * 0.2, 1.75 + ly * 0.3, f + 0.35)))
    p.append(box("steel", (0.36, 0.42, 0.14), (wx + 0.3, 1.75, f + 0.79)))
    p.append(box("char", (0.42, 0.6, 0.3), (wx + 0.25, -0.3, f + 0.15)))
    p.append(box("yolk", (0.44, 0.62, 0.06), (wx + 0.25, -0.3, f + 0.32)))
    p.append(cyl("white_sink", 0.15, 0.45, (wx + 0.2, -0.85, f + 0.225), seg=10))
    # the chainsaw on the floor, by the west wall
    p.append(box("collar", (0.22, 0.38, 0.22), (wx + 0.3, -1.55, f + 0.11)))
    p.append(box("steel", (0.04, 0.55, 0.08), (wx + 0.3, -1.98, f + 0.08)))
    p.append(box("char", (0.06, 0.1, 0.12), (wx + 0.3, -1.4, f + 0.28)))
    # east wall: the counter under the window, with a kettle and a lantern
    ex = CABIN_D / 2 - 0.1
    p.append(box("pine_dark", (0.48, 1.4, 0.04), (ex - 0.24, 1.05, f + 0.9)))
    for ly in (-1, 1):
        p.append(box("pine_dark", (0.42, 0.04, 0.88), (ex - 0.24, 1.05 + ly * 0.66, f + 0.44)))
    p.append(sphere("kettle", 0.1, (ex - 0.25, 0.7, f + 1.0), scale=(1, 1, 0.9), seg=10, rings=6))
    p.append(box("metal_dark", (0.12, 0.12, 0.2), (ex - 0.22, 1.35, f + 1.02)))
    p.append(box("string_light@1.2", (0.08, 0.08, 0.1), (ex - 0.22, 1.35, f + 1.03)))
    # the axe, leaning by the door
    p.append(box("weathered", (0.04, 0.04, 0.8), (ex - 0.12, -1.8, f + 0.4), deg(12, 0, 0)))
    p.append(box("hammer_head", (0.05, 0.2, 0.1), (ex - 0.12, -1.72, f + 0.78), deg(12, 0, 0)))
    compound("Cabin_Interior", p)
    mushroom_basket((ex - 0.25, 1.03, f + 0.92))
    striper_rod(CABIN_D / 2 - 0.16)

    # the résumé on the bistro table, and the to-do list pinned to the north wall
    compound(
        "Resume",
        [
            box("paper", (0.24, 0.32, 0.01), (0.0, 0.0, 0.0), deg(0, 0, 14)),
            box("paper", (0.24, 0.32, 0.01), (0.03, -0.02, 0.011), deg(0, 0, 4)),
            box("ink", (0.14, 0.02, 0.002), (0.02, 0.09, 0.017), deg(0, 0, 4)),
            box("ink", (0.18, 0.012, 0.002), (0.03, 0.03, 0.017), deg(0, 0, 4)),
            box("ink", (0.18, 0.012, 0.002), (0.03, -0.01, 0.017), deg(0, 0, 4)),
            box("ink", (0.18, 0.012, 0.002), (0.035, -0.05, 0.017), deg(0, 0, 4)),
        ],
        location=(tx + 0.02, ty - 0.04, f + 0.74),
    )
    todo = [box("paper", (0.34, 0.015, 0.46), (0, 0, 0))]
    for k in range(7):
        todo.append(box("ink", (0.2 if k % 3 else 0.25, 0.004, 0.015), (0.02, -0.01, 0.17 - k * 0.055)))
        todo.append(box("ink", (0.03, 0.004, 0.03), (-0.13, -0.01, 0.17 - k * 0.055)))
    todo.append(sphere("collar", 0.02, (0, -0.015, 0.21), seg=6, rings=4))
    compound("TodoList", todo, location=(0.85, CABIN_W / 2 - 0.12, 1.5))


def mushroom_basket(at):
    """A basket of mushrooms on the counter: Eduard forages for them (A70, A71)."""
    x, y, z = at
    p = [
        # the basket, a little wider at the top, with darker woven bands and rim
        cyl("wicker", 0.1, 0.13, (0, 0, 0.065), r2=0.135, seg=14),
        cyl("wicker_dark", 0.112, 0.018, (0, 0, 0.045), r2=0.118, seg=14),
        cyl("wicker_dark", 0.124, 0.018, (0, 0, 0.09), r2=0.13, seg=14),
        cyl("wicker_dark", 0.142, 0.022, (0, 0, 0.132), seg=14),
    ]
    # the handle, an arch over the top along the counter
    for k in range(9):
        a = math.pi * k / 8
        p.append(box("wicker_dark", (0.022, 0.045, 0.022), (0, -0.13 * math.cos(a), 0.135 + 0.15 * math.sin(a)), (-(a - math.pi / 2), 0, 0)))
    # mushrooms heaped in it: Eduard's go-tos, golden chanterelles (funnel caps on
    # short stems) and king boletes (brown domed caps on thick pale stems)
    for k, (mx, my, tilt) in enumerate(((-0.06, 0.06, -20), (0.0, -0.09, 24), (0.08, -0.01, -14), (-0.08, -0.02, 18))):
        tone = "chanterelle_light" if k % 2 else "chanterelle"
        rot = (math.radians(tilt), math.radians(tilt * 0.6), 0)
        h = 0.02 * (k % 2)
        p.append(cyl(tone, 0.014, 0.06, (mx, my, 0.17 + h), rot, r2=0.04, seg=8))
        p.append(sphere(tone, 0.045, (mx, my, 0.205 + h), rot, scale=(1, 1, 0.45), seg=10, rings=4))
    for mx, my, tilt, h in ((0.03, 0.05, 10, 0.03), (-0.02, -0.02, -12, 0.0)):
        rot = (math.radians(tilt), math.radians(-tilt * 0.5), 0)
        p.append(sphere("bolete_stem", 0.034, (mx, my, 0.17 + h), rot, scale=(0.8, 0.8, 1.25), seg=8, rings=5))
        p.append(sphere("bolete_cap", 0.056, (mx, my, 0.22 + h), rot, scale=(1, 1, 0.62), seg=12, rings=6))
    compound("MushroomBasket", p, location=(x, y, z))


def striper_rod(wx):
    """Eduard's surf rod for stripers (A72), on two hooks along the east wall
    above the door (a 9 ft rod doesn't stand up in here), and the tackle box on
    the floor by the door."""
    z = WALL_BASE + 1.9
    along = deg(-90, 0, 0)  # cylinders run along +Y (north)
    p = [
        # the grip, the blank tapering to the tip, and a few guides
        cyl("lumber", 0.022, 0.5, (wx, -1.95, z), along, seg=8),
        cyl("metal_dark", 0.013, 2.2, (wx, -0.6, z), along, r2=0.005, seg=6),
    ]
    for gy in (-1.35, -0.85, -0.35, 0.15):
        p.append(sphere("steel", 0.012, (wx - 0.012, gy, z - 0.016), seg=6, rings=4))
    # a spinning reel hanging under the grip
    p.append(box("metal_dark", (0.016, 0.03, 0.05), (wx, -1.65, z - 0.035)))
    p.append(cyl("steel", 0.045, 0.045, (wx, -1.65, z - 0.08), deg(0, 90, 0), seg=10))
    p.append(cyl("metal_dark", 0.03, 0.05, (wx, -1.65, z - 0.08), deg(0, 90, 0), seg=10))
    # the two hooks it rests on
    for hy in (-1.85, -0.4):
        p.append(box("weathered", (0.09, 0.025, 0.025), (wx + 0.04, hy, z - 0.02)))
        p.append(box("weathered", (0.02, 0.025, 0.05), (wx - 0.005, hy, z + 0.0)))
    compound("StriperRod", p)

    # the tackle box on the floor by the door, north of it
    f = FLOOR_Z
    t = [
        box("tote_green", (0.24, 0.42, 0.16), (0, 0, 0.08)),
        box("pine_dark", (0.25, 0.43, 0.05), (0, 0, 0.18)),
        box("metal_dark", (0.03, 0.16, 0.025), (0, 0, 0.215)),
        box("steel", (0.012, 0.05, 0.04), (-0.125, 0, 0.15)),
    ]
    compound("TackleBox", t, location=(wx - 0.09, -0.12, f), rot=deg(0, 0, 4))


def deck():
    """Half-built deck in front of the door: boards on the west half, open joists east."""
    p = []
    w, d = DECK_X1 - DECK_X0, DECK_Y0 - DECK_Y1
    cx, cy = (DECK_X0 + DECK_X1) / 2, (DECK_Y0 + DECK_Y1) / 2
    p.append(box("deck", (w, 0.07, 0.2), (cx, DECK_Y1 + 0.035, DECK_TOP - 0.14)))
    for x in (DECK_X0 + 0.035, DECK_X1 - 0.035):
        p.append(box("deck", (0.07, d, 0.2), (x, cy, DECK_TOP - 0.14)))
    y = DECK_Y1 + 0.4
    while y < DECK_Y0 - 0.1:
        p.append(box("deck", (w, 0.06, 0.18), (cx, y, DECK_TOP - 0.13)))
        y += 0.4
    for x in (DECK_X0 + 0.12, DECK_X1 - 0.12):
        for yy in (DECK_Y0 - 0.15, DECK_Y1 + 0.15):
            p.append(box("stone", (0.24, 0.24, DECK_TOP - 0.2), (x, yy, (DECK_TOP - 0.2) / 2)))
    # boards run along the wall; the north end is done, the south end is still open
    y = DECK_Y1 + 0.08
    i = 0
    while y < DECK_Y0 - 0.02:
        tone = "lumber" if i % 3 == 0 else "deck"
        p.append(box(tone, (w * 0.6, 0.15, 0.045), (DECK_X1 - w * 0.3, y, DECK_TOP - 0.02)))
        y += 0.17
        i += 1
    # a loose board, ready to go down
    p.append(box("lumber", (1.0, 0.15, 0.045), (DECK_X0 + 0.7, DECK_Y1 + 0.6, DECK_TOP + 0.03), deg(0, 0, 4)))
    p.append(box("deck", (0.9, 0.34, 0.14), (DECK_X1 - 0.9, DECK_Y1 - 0.2, 0.07)))
    compound("Deck", p, rot=deg(0, 0, CABIN_ROT), bevel=0.01)

    pile = []
    for row in range(4):
        for k in range(4 - row // 2):
            pile.append(box("lumber", (2.0, 0.14, 0.045), (0, k * 0.16, 0.08 + row * 0.048), deg(0, 0, rng.uniform(-2, 2))))
    for sx in (-0.7, 0.7):
        pile.append(box("deck", (0.1, 0.7, 0.06), (sx, 0.24, 0.03)))
    compound("LumberPile", pile, location=(4.75, 1.9, 0.0), rot=deg(0, 0, 92), bevel=0.008)

    horse = [box("deck", (1.0, 0.1, 0.1), (0, 0, 0.62))]
    for sx in (-1, 1):
        for sy in (-1, 1):
            horse.append(box("deck", (0.07, 0.07, 0.66), (sx * 0.38, sy * 0.12, 0.3), deg(sy * 12, 0, 0)))
    horse.append(box("lumber", (0.15, 1.3, 0.045), (0.1, 0, 0.69), deg(0, 0, 80)))
    compound("Sawhorse", horse, location=(4.4, 3.5, 0.0), rot=deg(0, 0, 10), bevel=0.008)


def yard():
    # picnic table west of the deck (photo 05)
    p = []
    for i in range(5):
        p.append(box("weathered", (1.8, 0.15, 0.05), (0, -0.32 + i * 0.16, 0.72)))
    for sy in (-1, 1):
        p.append(box("weathered", (1.8, 0.24, 0.05), (0, sy * 0.7, 0.42)))
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.append(box("weathered", (0.08, 0.08, 0.9), (sx * 0.62, sy * 0.36, 0.38), deg(sy * 30, 0, 0)))
        p.append(box("weathered", (0.08, 1.55, 0.08), (sx * 0.62, 0, 0.38)))
    # south of the deck (photo 05)
    compound("PicnicTable", p, location=(3.8, -4.8, 0.0), rot=deg(0, 0, 84), bevel=0.01)

    # white utility sink with a green tote on top, under the window (photo 05)
    s = [
        box("white_sink", (0.62, 0.5, 0.3), (0, 0, 0.78)),
        box("tote_green", (0.6, 0.4, 0.2), (0, 0.02, 1.03)),
        box("water_jug", (0.24, 0.24, 0.3), (0.42, 0.0, 1.0)),
    ]
    for sx in (-1, 1):
        for sy in (-1, 1):
            s.append(box("white_sink", (0.05, 0.05, 0.66), (sx * 0.26, sy * 0.2, 0.33)))
    compound("SinkCart", s, location=(2.25, 1.15, 0.0), rot=deg(0, 0, 90), bevel=0.01)

    # Weber kettle grill beside it
    g = [
        sphere("kettle", 0.3, (0, 0, 0.8), scale=(1, 1, 0.75), seg=12, rings=8),
        cyl("kettle", 0.02, 0.6, (0.15, 0, 0.3), deg(0, 14, 0), seg=4),
        cyl("kettle", 0.02, 0.6, (-0.15, 0.1, 0.3), deg(-10, -14, 0), seg=4),
        cyl("kettle", 0.02, 0.6, (-0.05, -0.15, 0.3), deg(14, 0, 0), seg=4),
        box("steel", (0.12, 0.03, 0.04), (0, 0, 1.03)),
    ]
    compound("Grill", g, location=(2.45, 2.05, 0.0))

    # fire ring where the night scene happens (scene 7)
    f = [cyl("char", 0.55, 0.06, (0, 0, 0.03), seg=12)]
    for i in range(10):
        a = i / 10 * math.tau
        f.append(ico("fire_ring", 0.17, (math.cos(a) * 0.62, math.sin(a) * 0.62, 0.08), scale=(1.2, 1, 0.75), rot=deg(0, 0, a * 57)))
    for i in range(3):
        a = i * 2.1
        f.append(cyl("bark", 0.06, 0.6, (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.12), deg(70, 0, a * 57), seg=6, caps="char"))
    # Eduard's sketch: the fire is south-east of the deck, the seats east of it
    compound("FireRing", f, location=(*FIRE, 0.0))
    for k, (x, y, r) in enumerate(SEATS):
        compound(f"CampChair{k}", camp_chair(), location=(x, y, 0.0), rot=deg(0, 0, r))


def camp_chair():
    p = [box("blue_sink", (0.5, 0.45, 0.05), (0, 0, 0.42)), box("blue_sink", (0.5, 0.05, 0.5), (0, 0.24, 0.68), deg(-12, 0, 0))]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.append(box("metal_dark", (0.035, 0.035, 0.45), (sx * 0.23, sy * 0.2, 0.21)))
        p.append(box("metal_dark", (0.04, 0.42, 0.04), (sx * 0.26, 0, 0.6)))
    return p


# ---------------------------------------------------------------- outbuildings
def outdoor_shower():
    """Tall posts and solid white corrugated walls, open on the south side (photo 05)."""
    p = []
    w, d, h = 1.5, 1.5, 2.15
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.append(box("cabin_dark", (0.12, 0.12, h + 0.3), (sx * w / 2, sy * d / 2, (h + 0.3) / 2)))
    lift = 0.18
    ph = h - lift - 0.05
    p.append(box("panel", (w - 0.08, 0.04, ph), (0, d / 2, lift + ph / 2)))
    for sx in (-1, 1):
        p.append(box("panel", (0.04, d - 0.08, ph), (sx * w / 2, 0, lift + ph / 2)))
    # south side: one panel as the door, half open
    p.append(box("panel", (0.04, w * 0.72, ph), (-w / 2 + 0.36 * w * 0.0 + 0.02, -d / 2 - w * 0.33, lift + ph / 2), deg(0, 0, 60)))
    # corrugation lines, a few per wall so they survive the low resolution
    for k in range(1, 6):
        t = -0.5 + k / 6
        p.append(box("roof", (0.03, 0.05, ph), (t * w, d / 2 + 0.01, lift + ph / 2)))
        for sx in (-1, 1):
            p.append(box("roof", (0.05, 0.03, ph), (sx * (w / 2 + 0.01), t * d, lift + ph / 2)))
    # top rails, the pump line and a shower head
    for sy in (-1, 1):
        p.append(box("cabin_dark", (w + 0.1, 0.1, 0.1), (0, sy * d / 2, h + 0.2)))
    p.append(cyl("steel", 0.025, 0.5, (0.2, d / 2 - 0.2, h + 0.0), deg(90, 0, 0), seg=6))
    p.append(cyl("steel", 0.09, 0.05, (0.2, d / 2 - 0.45, h - 0.04), seg=10))
    p.append(box("weathered", (w + 0.2, d + 0.2, 0.08), (0, 0, 0.04)))
    # opening faces east, away from the cabin
    compound("OutdoorShower", p, location=(*SHOWER, 0.0), rot=deg(0, 0, 90))


def woodshed():
    p = []
    w, d = 2.8, 1.6
    h_front, h_back = 2.1, 1.7
    for sx in (-1, 1):
        p.append(box("cabin_dark", (0.13, 0.13, h_front), (sx * w / 2, -d / 2, h_front / 2)))
        p.append(box("cabin_dark", (0.13, 0.13, h_back), (sx * w / 2, d / 2, h_back / 2)))
    p.append(box("cabin", (w, 0.05, h_back), (0, d / 2, h_back / 2)))
    for sx in (-1, 1):
        p.append(box("cabin", (0.05, d, h_back), (sx * w / 2, 0, h_back / 2)))
    x = -w / 2 + 0.15
    while x < w / 2:
        p.append(box("cabin_dark", (0.04, 0.03, h_back), (x, d / 2 + 0.03, h_back / 2)))
        x += 0.3
    p.append(box("cabin_dark", (w, d, 0.1), (0, 0, 0.12)))
    slope = math.atan2(h_front - h_back, d)
    p.append(box("roof", (w + 0.4, d + 0.5, 0.07), (0, 0, (h_front + h_back) / 2 + 0.06), (slope, 0, 0)))
    x = -w / 2 - 0.1
    while x < w / 2 + 0.2:
        p.append(box("roof_dark", (0.035, d + 0.5, 0.035), (x, 0, (h_front + h_back) / 2 + 0.11), (slope, 0, 0)))
        x += 0.4
    for row in range(6):
        n = 9 if row % 2 == 0 else 8
        for k in range(n):
            xx = -w / 2 + 0.24 + k * 0.29 + (0.145 if row % 2 else 0)
            r = rng.uniform(0.11, 0.14)
            p.append(cyl("bark", r, 1.25, (xx, 0.1, 0.3 + row * 0.24), deg(90, 0, 0), seg=7, caps="endgrain"))
    # open front faces the driveway (west-south-west)
    compound("Woodshed", p, location=(*WOODSHED, 0.0), rot=deg(0, 0, -55), bevel=0.008)

    blk = [cyl("bark", 0.3, 0.46, (0, 0, 0.23), seg=9, caps="endgrain")]
    blk.append(box("weathered", (0.045, 0.05, 0.7), (0.12, 0.0, 0.72), deg(0, 32, 0)))
    blk.append(box("hammer_head", (0.22, 0.05, 0.13), (-0.04, 0, 0.48), deg(0, 32, 0)))
    for i in range(5):
        a = i * 1.3
        blk.append(box("endgrain", (0.1, 0.32, 0.1), (math.cos(a) * 0.6, math.sin(a) * 0.6, 0.05), deg(0, 90 if i % 2 else 0, a * 57)))
    # on the yard side of the woodshed, by the picnic table
    compound("ChoppingBlock", blk, location=(4.6, -6.6, 0.0))


def solar_panels():
    """A small ground-mounted rack in the blueberry field (A45: just there).
    Modelled facing -Y: two panels (Eduard) tilted 35 degrees on two rails, short posts
    in front and tall posts behind."""
    p = []
    tilt = math.radians(35)
    zc, slope = 1.1, 1.65
    xs = [k * 1.05 for k in range(2)]
    for x in xs:
        p.append(box("solar", (1.0, slope, 0.04), (x, 0, zc), (tilt, 0, 0)))
        p.append(box("solar_frame", (1.0, 0.03, 0.05), (x, -math.cos(tilt) * slope / 2, zc - math.sin(tilt) * slope / 2), (tilt, 0, 0)))
    length = xs[-1] - xs[0] + 1.1
    xm = (xs[0] + xs[-1]) / 2
    for u in (-0.5, 0.5):  # rails, just under the panels
        y = math.cos(tilt) * u
        z = zc + math.sin(tilt) * u - 0.06
        p.append(box("solar_frame", (length, 0.06, 0.06), (xm, y, z), (tilt, 0, 0)))
        for x in (xs[0] - 0.3, xs[-1] + 0.3):  # posts down to the ground
            p.append(box("solar_frame", (0.07, 0.07, z), (x, y, z / 2)))
    p.append(box("weathered", (0.15, 0.6, 0.4), (xs[-1] + 0.7, -0.4, 0.2)))  # battery box
    # level with the cabin, across the tree strip (Eduard: "parallel to the
    # cabin"), facing south-west (Eduard)
    compound("SolarPanels", p, location=(-17.9, 0.0, 0.0), rot=deg(0, 0, -45), bevel=0.01)


def brook():
    import bmesh

    me = bpy.data.meshes.new("Brook")
    bm = bmesh.new()
    rows = []
    y = GROUND[1]
    while y <= GROUND[1] + GROUND[2]:
        bx = brook_x(y)
        rows.append((bm.verts.new((bx - BROOK_HALF - 0.25, y, -0.42)), bm.verts.new((bx + BROOK_HALF + 0.25, y, -0.42))))
        y += 1.0
    for a, b in zip(rows[:-1], rows[1:]):
        bm.faces.new((a[0], a[1], b[1], b[0]))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(lib.mat("water"))
    ob = bpy.data.objects.new("Brook", me)
    bpy.data.collections["Set"].objects.link(ob)

    # mossy stones in and along the water, and a few ripples
    stones, ripples = [], []
    for _ in range(140):
        yy = rng.uniform(-75, 70)
        side = rng.choice((-1, 1))
        off = rng.uniform(0.2, BROOK_HALF + 0.9) * side
        s = rng.uniform(0.15, 0.4)
        tone = rng.choice(["stone", "stone", "moss", "bank"])
        x = brook_x(yy) + off
        stones.append(ico(tone, s, (x, yy, ground_height(x, yy) - 0.05 + s * 0.3), scale=(1.3, 1, 0.6), rot=deg(0, 0, rng.uniform(0, 90))))
    for _ in range(70):
        yy = rng.uniform(-75, 70)
        x = brook_x(yy) + rng.uniform(-0.8, 0.8)
        ripples.append(box("water_light", (rng.uniform(0.3, 0.7), 0.06, 0.01), (x, yy, -0.41), deg(0, 0, rng.uniform(-15, 15))))
    compound("BrookStones", stones)
    compound("BrookRipples", ripples)

    # wooden stairs down the bank at the end of the path (A21)
    sx = brook_x(0.2) - BROOK_HALF - 1.45
    st = []
    for k in range(4):
        x = sx + k * 0.38
        z = ground_height(x, 0.2)
        st.append(box("deck", (0.36, 1.1, 0.08), (x, 0.2, z + 0.04)))
        st.append(box("weathered", (0.08, 0.08, 0.5), (x, 0.8, z + 0.1)))
    st.append(box("weathered", (1.6, 0.06, 0.06), (sx + 0.6, 0.8, 0.4), deg(0, 22, 0)))
    compound("BrookStairs", st)


# ---------------------------------------------------------------- trees and plants
def spruce_parts(height, tones=("spruce", "spruce_light"), far=False):
    """far=True: fewer tiers, for woods the camera only sees from a distance."""
    tiers = 3 if far else max(4, int(height / 1.4))
    parts = [cyl("bark", 0.1 * height / 6, height * 0.2, (0, 0, height * 0.1), seg=5)]
    base_r = height * 0.2
    for i in range(tiers):
        t = i / tiers
        r = base_r * (1 - t * 0.82)
        z = height * 0.1 + t * height * 0.8
        parts.append(cyl(tones[i % 2], r, height * (0.34 if far else 0.24), (0, 0, z + height * 0.12), r2=r * 0.12, seg=5 if far else 7, rot=deg(0, 0, i * 23)))
    return parts


def birch_parts(height, far=False):
    parts = [cyl("birch", 0.08, height * 0.7, (0, 0, height * 0.35), seg=5)]
    for k in range(3):
        parts.append(box("hair", (0.1, 0.02, 0.03), (0.02, -0.075, height * (0.2 + k * 0.17))))
    for k in range(2 if far else 4):
        a = k * 1.7
        parts.append(ico("birch_leaf" if k % 2 else "alder", height * 0.17, (math.cos(a) * height * 0.12, math.sin(a) * height * 0.12, height * (0.7 + 0.07 * (k % 2))), scale=(1, 1, 0.8)))
    return parts


def forest():
    """The spruce wall around the clearing, the tree strip, and alder along the brook."""
    placed = []
    trees = {"spruce": [], "birch": []}

    def open_ground(x, y):
        if TREE_STRIP[0] - 0.5 < x < TREE_STRIP[1] + 0.5 and TREE_STRIP[2] < y < TREE_STRIP[3]:
            return False  # the strip is placed separately
        if abs(x - ROAD_X) < ROAD_W / 2 + 1.5:
            return False
        if BLUEBERRY[0] - 1 < x < BLUEBERRY[1] + 1 and BLUEBERRY[2] - 1 < y < BLUEBERRY[3]:
            return False
        if polyline_dist(x, y, DRIVE_LINE) < DRIVE_W / 2 + 2.5:
            return False
        if abs(x - brook_x(y)) < BROOK_HALF + 0.8:
            return False
        # the clearing: cabin, yard, grass field down to the brook, and the meadow inside the U
        if -9.0 < x < brook_x(y) - 1.6 and -44.0 < y < 6.5:
            return False
        if -7.0 < x < 9.0 and y < 10.0 and y > -44.0:
            return False
        return True

    grid = {}

    def place(x, y, h, kind="spruce"):
        r = h * 0.17
        gx, gy = int(x // 4), int(y // 4)
        for i in range(gx - 1, gx + 2):
            for j in range(gy - 1, gy + 2):
                for px, py, pr in grid.get((i, j), ()):
                    if math.hypot(x - px, y - py) < (r + pr) * 0.8:
                        return False
        grid.setdefault((gx, gy), []).append((x, y, r))
        trees[kind].append((x, y, h))
        return True

    # tree strip between the blueberry field and the meadow
    for _ in range(1500):
        x = rng.uniform(TREE_STRIP[0], TREE_STRIP[1])
        y = rng.uniform(TREE_STRIP[2], TREE_STRIP[3])
        place(x, y, rng.uniform(8, 13))
    # the woods: around the clearing and across the brook, west of the road,
    # north of the field, and south of the driveway
    x0, y0, size = GROUND
    regions = [
        (-9.0, x0 + size - 2, -78.0, 118.0, 15000),
        (x0 + 2, ROAD_X - ROAD_W / 2 - 1.5, -78.0, 118.0, 2600),
        (BLUEBERRY[0] - 2, TREE_STRIP[0], BLUEBERRY[3] + 1, 118.0, 900),
        (ROAD_X + ROAD_W / 2 + 1.5, -9.0, -78.0, -47.0, 1500),
    ]
    for rx0, rx1, ry0, ry1, tries in regions:
        for _ in range(tries):
            x, y = rng.uniform(rx0, rx1), rng.uniform(ry0, ry1)
            if not open_ground(x, y):
                continue
            near_brook = abs(x - brook_x(y)) < 5
            kind = "birch" if (near_brook and rng.random() < 0.45) or rng.random() < 0.08 else "spruce"
            h = rng.uniform(9, 15) if kind == "spruce" else rng.uniform(5, 8)
            place(x, y, h, kind)

    # Merge all trees of a kind into one object each (cheap to draw).
    sp = []
    for x, y, h in trees["spruce"]:
        far = math.hypot(x - 2.0, (y + 8.0) * 0.8) > 42
        for prt in spruce_parts(h, far=far):
            prt.center = (prt.center[0] + x, prt.center[1] + y, prt.center[2])
            sp.append(prt)
    compound("Spruces", sp)
    bi = []
    for x, y, h in trees["birch"]:
        far = math.hypot(x - 2.0, (y + 8.0) * 0.8) > 42
        for prt in birch_parts(h, far=far):
            prt.center = (prt.center[0] + x, prt.center[1] + y, prt.center[2] + ground_height(x, y))
            bi.append(prt)
    compound("Birches", bi)

    # the stand between the driveway and the woodshed
    for k, (x, y, h, kind) in enumerate(TREE_STAND):
        parts = spruce_parts(h) if kind == "spruce" else birch_parts(h)
        compound(f"Stand{k}", parts, location=(x, y, 0), rot=(0, 0, k * 0.9))

    # a few young spruce and blue spruce in the grass field, not fully grown
    # (Eduard; photos 01 and 05 show one)
    for k, (x, y, h, kind) in enumerate(SAPLINGS):
        tones = ("blue_spruce", "blue_spruce_light") if kind == "blue" else ("spruce_light", "spruce")
        compound(f"SpruceSapling{k}", spruce_parts(h, tones), location=(x, y, 0), rot=(0, 0, k * 1.3))


def plants():
    tufts = []
    for _ in range(700):
        x, y = rng.uniform(-9, 25), rng.uniform(-44, 8)
        if any(math.hypot((x - cx) / (rx + 0.5), (y - cy) / (ry + 0.5)) < 1 for cx, cy, rx, ry in PADS):
            continue
        if polyline_dist(x, y, DRIVE_LINE) < DRIVE_W / 2 + 0.2 or polyline_dist(x, y, PATH) < 0.8:
            continue
        if -2.2 < x < 4.0 and -2.8 < y < 2.8:
            continue
        if abs(x - brook_x(y)) < BROOK_HALF + 1.0:
            continue
        h = rng.uniform(0.15, 0.32)
        tone = rng.choice(["grass_light", "grass_dark", "grass_light", "moss"])
        tufts.append(cyl(tone, 0.08, h, (x, y, h / 2), r2=0.0, seg=4, rot=deg(0, 0, rng.uniform(0, 90))))
    compound("GrassTufts", tufts)

    # lupines along the driveway edges and the road (photo 06), daisies in the meadow
    flowers = []

    def lupine(x, y):
        h = rng.uniform(0.45, 0.75)
        tone = rng.choice(["lupine", "lupine", "lupine", "lupine_pink", "trim"])
        flowers.append(cyl("grass_dark", 0.02, h * 0.6, (x, y, h * 0.3), seg=4))
        flowers.append(cyl(tone, 0.075, h * 0.5, (x, y, h * 0.62 + h * 0.15), r2=0.02, seg=5))
        flowers.append(cyl("grass_light", 0.15, 0.1, (x, y, 0.07), r2=0.03, seg=5))

    for _ in range(26):
        i = rng.randrange(len(DRIVE_LINE) - 1)
        (ax, ay), (bx, by) = DRIVE_LINE[i], DRIVE_LINE[i + 1]
        t = rng.random()
        px, py = ax + (bx - ax) * t, ay + (by - ay) * t
        nx, ny = -(by - ay), bx - ax
        nl = math.hypot(nx, ny) or 1
        side = rng.choice((-1, 1)) * rng.uniform(DRIVE_W / 2 + 0.5, DRIVE_W / 2 + 1.6)
        cx, cy = px + nx / nl * side, py + ny / nl * side
        if cy > -12:
            continue
        for _ in range(rng.randint(3, 7)):
            lupine(cx + rng.uniform(-0.6, 0.6), cy + rng.uniform(-0.6, 0.6))
    for _ in range(90):
        lupine(ROAD_X + ROAD_W / 2 + rng.uniform(0.4, 1.4), rng.uniform(-75, 105))
    for _ in range(120):
        x, y = rng.uniform(-8.5, 23), rng.uniform(-44, -14)
        if polyline_dist(x, y, DRIVE_LINE) < DRIVE_W / 2 + 0.6:
            continue
        flowers.append(cyl(rng.choice(["daisy", "daisy", "yolk"]), 0.05, 0.05, (x, y, 0.2), seg=5))
        flowers.append(cyl("grass_dark", 0.015, 0.2, (x, y, 0.1), seg=3))
    compound("Flowers", flowers)


def build_set():
    collection("Set")
    ground()
    gravel_stones()
    cabin()
    deck()
    yard()
    outdoor_shower()
    woodshed()
    solar_panels()
    brook()
    forest()
    plants()


# ---------------------------------------------------------------- people
# Chunky little people: big round heads, short bodies. About 1.2 m tall.
HIP, SHOULDER, NECK = 0.4, 0.74, 0.76


def person(name, skin, top, legs, boot, head_extra, arm_extra=None, torso_extra=None):
    collection(name)
    root = empty(name)
    torso = [
        sphere(top, 0.23, (0, 0, 0.17), scale=(0.95, 0.68, 0.95), seg=12, rings=8),
        cyl(top, 0.19, 0.12, (0, 0, 0.05), r2=0.2, seg=12),
    ]
    torso += torso_extra or []
    compound(f"{name}_Torso", torso, location=(0, 0, HIP), parent=root)
    for side, sx in (("L", 1), ("R", -1)):
        thigh = compound(f"{name}_Leg{side}", [cyl(legs, 0.08, 0.22, (0, 0, -0.1), seg=8)], location=(sx * 0.1, 0, HIP), parent=root)
        compound(
            f"{name}_Shin{side}",
            [cyl(legs, 0.075, 0.12, (0, 0, -0.06), seg=8), sphere(boot, 0.085, (0, -0.04, -0.13), scale=(1, 1.35, 0.7), seg=10, rings=6)],
            location=(0, 0, -0.2),
            parent=thigh,
        )
        arm_parts = [
            sphere(top, 0.085, (0, 0, -0.03), seg=10, rings=6),
            cyl(top, 0.075, 0.1, (0, 0, -0.08), seg=8),
            cyl(skin, 0.06, 0.16, (0, 0, -0.2), seg=8),
            sphere(skin, 0.07, (0, 0, -0.3), seg=8, rings=6),
        ]
        arm = compound(f"{name}_Arm{side}", arm_parts, location=(sx * 0.26, 0, SHOULDER), parent=root)
        if arm_extra and side in arm_extra:
            arm_extra[side](arm)
    head = [
        sphere(skin, 0.25, (0, 0, 0.25), scale=(1, 0.94, 0.96), seg=16, rings=10),
        sphere(skin, 0.045, (0, -0.235, 0.21), seg=6, rings=4),  # nose
        sphere(skin, 0.05, (0.245, 0, 0.23), scale=(0.5, 1, 1), seg=6, rings=4),  # ears
        sphere(skin, 0.05, (-0.245, 0, 0.23), scale=(0.5, 1, 1), seg=6, rings=4),
    ] + head_extra
    compound(f"{name}_Head", head, location=(0, 0, NECK), parent=root)
    return root


def eyes(color, z=0.27, spread=0.09):
    return [sphere(color, 0.032, (sx * spread, -0.22, z), scale=(1, 0.5, 1.25), seg=6, rings=4) for sx in (-1, 1)]


def eduard():
    # black hair: a cap over the top and back, with a short fringe
    hair = [
        sphere("hair", 0.26, (0, 0.035, 0.31), scale=(1.0, 0.95, 0.78), seg=16, rings=10),
        sphere("hair", 0.2, (0, -0.1, 0.42), scale=(1.1, 0.7, 0.45), seg=12, rings=6),
        box("hair", (0.09, 0.02, 0.025), (0.09, -0.225, 0.33)),  # eyebrows
        box("hair", (0.09, 0.02, 0.025), (-0.09, -0.225, 0.33)),
    ] + eyes("eye_brown")

    def hammer(arm):
        compound(
            "Eduard_Hammer",
            [box("weathered", (0.04, 0.3, 0.04), (0, -0.14, 0)), box("hammer_head", (0.06, 0.07, 0.16), (0, -0.29, 0.0))],
            location=(0, -0.02, -0.31),
            parent=arm,
            bevel=0.008,
        )

    root = person("Eduard", "skin", "tee_red", "denim", "boot", hair, arm_extra={"R": hammer})
    head = bpy.data.objects["Eduard_Head"]
    # A54: two options for Eduard to pick from. The website shows one at a time.
    compound(
        "Eduard_Beard",
        [
            # short, close beard: only shows along the jaw and chin, below the nose
            sphere("hair", 1.0, (0, -0.035, 0.1), scale=(0.232, 0.18, 0.1), seg=16, rings=10),
            box("hair", (0.15, 0.04, 0.035), (0, -0.232, 0.175)),
            box("hair", (0.035, 0.035, 0.07), (0.07, -0.218, 0.14)),
            box("hair", (0.035, 0.035, 0.07), (-0.07, -0.218, 0.14)),
            box("lip", (0.07, 0.02, 0.02), (0, -0.222, 0.128)),
        ],
        parent=head,
    )
    compound(
        "Eduard_Mustache",
        [
            # chunky on purpose: anything thinner disappears at pixel size
            box("hair", (0.22, 0.05, 0.06), (0, -0.232, 0.168)),
            box("hair", (0.055, 0.05, 0.09), (0.095, -0.218, 0.135)),
            box("hair", (0.055, 0.05, 0.09), (-0.095, -0.218, 0.135)),
            box("lip", (0.07, 0.02, 0.02), (0, -0.212, 0.115)),
        ],
        parent=head,
    )
    bpy.data.objects["Eduard_Mustache"].hide_render = True
    bpy.data.objects["Eduard_Mustache"].hide_viewport = True
    # a deck board he fetches from the lumber pile and carries in his left hand
    # (the website shows it only while he carries it)
    compound(
        "Eduard_Board",
        [box("lumber", (0.11, 1.3, 0.035), (0, 0, 0))],
        location=(0.31, -0.12, SHOULDER - 0.33),
        parent=root,
        bevel=0.006,
    )
    bpy.data.objects["Eduard_Board"].hide_render = True
    bpy.data.objects["Eduard_Board"].hide_viewport = True
    # kneeling on the deck: thighs upright, shins flat on the boards behind him
    for side in ("L", "R"):
        bpy.data.objects[f"Eduard_Shin{side}"].rotation_euler = deg(90, 0, 0)
    bpy.data.objects["Eduard_ArmR"].rotation_euler = deg(-70, 0, 0)
    head.rotation_euler = deg(-15, 0, 0)
    return root


def hiker():
    hat = [
        sphere("beanie", 0.265, (0, 0.01, 0.33), scale=(1.0, 0.98, 0.72), seg=16, rings=10),
        cyl("beanie", 0.262, 0.07, (0, 0.0, 0.32), seg=16),
        sphere("trim", 0.07, (0, 0, 0.53), seg=8, rings=6),
        sphere("hair_brown", 0.25, (0, 0.06, 0.24), scale=(1.01, 0.92, 0.8), seg=14, rings=8),
        sphere("lupine_pink", 0.03, (0.15, -0.215, 0.2), scale=(1, 0.4, 0.7), seg=6, rings=4),
        sphere("lupine_pink", 0.03, (-0.15, -0.215, 0.2), scale=(1, 0.4, 0.7), seg=6, rings=4),
    ] + eyes("hair", z=0.26)
    pack = [
        box("pack", (0.34, 0.2, 0.4), (0, 0.2, 0.2)),
        box("pack", (0.28, 0.07, 0.16), (0, 0.32, 0.12)),
        cyl("cabin", 0.08, 0.4, (0, 0.2, 0.45), deg(0, 90, 0), seg=8),
        box("hair", (0.04, 0.03, 0.34), (0.12, -0.15, 0.2)),
        box("hair", (0.04, 0.03, 0.34), (-0.12, -0.15, 0.2)),
    ]
    root = person("Hiker", "skin_guest", "jacket", "khaki", "boot", hat, torso_extra=pack)
    for ob in ("Hiker_Torso",):
        for mod in bpy.data.objects[ob].modifiers:
            mod.width = 0.03
    return root


# ---------------------------------------------------------------- Rusty and the cow
def rusty():
    collection("Rusty")
    root = empty("Rusty")
    compound(
        "Rusty_Body",
        [
            sphere("rusty", 0.19, (0, 0.02, 0.0), scale=(0.95, 1.75, 0.95), seg=14, rings=8),
            sphere("rusty", 0.19, (0, -0.2, 0.04), scale=(1.0, 1.0, 1.05), seg=12, rings=8),
            sphere("rusty_muzzle", 0.13, (0, -0.3, -0.05), scale=(0.9, 0.6, 1.0), seg=10, rings=6),
            # his paler belly (a yellow lab's), which shows when he rolls over for a rub
            sphere("rusty_muzzle", 0.17, (0, 0.0, -0.06), scale=(1.0, 1.76, 0.76), seg=14, rings=8),
        ],
        location=(0, 0, 0.42),
        parent=root,
    )
    for name, x, y in (("FL", 0.1, -0.24), ("FR", -0.1, -0.24), ("BL", 0.1, 0.24), ("BR", -0.1, 0.24)):
        compound(
            f"Rusty_Leg{name}",
            [cyl("rusty", 0.06, 0.28, (0, 0, -0.13), seg=8), sphere("rusty_muzzle", 0.07, (0, -0.03, -0.27), scale=(1, 1.3, 0.6), seg=8, rings=4)],
            location=(x, y, 0.31),
            parent=root,
        )
    head = compound(
        "Rusty_Head",
        [
            sphere("rusty", 0.165, (0, -0.06, 0.08), scale=(1.0, 1.0, 0.95), seg=14, rings=8),
            sphere("rusty_muzzle", 0.11, (0, -0.21, 0.03), scale=(0.85, 1.05, 0.75), seg=12, rings=6),
            sphere("nose", 0.045, (0, -0.32, 0.07), scale=(1.2, 0.8, 0.8), seg=8, rings=4),
            sphere("nose", 0.025, (0.07, -0.19, 0.15), seg=6, rings=4),
            sphere("nose", 0.025, (-0.07, -0.19, 0.15), seg=6, rings=4),
            sphere("rusty_dark", 0.1, (0.155, -0.02, 0.05), scale=(0.35, 0.75, 1.15), rot=deg(0, -12, 0), seg=8, rings=6),
            sphere("rusty_dark", 0.1, (-0.155, -0.02, 0.05), scale=(0.35, 0.75, 1.15), rot=deg(0, 12, 0), seg=8, rings=6),
            cyl("collar", 0.135, 0.06, (0, 0.06, -0.08), rot=deg(-25, 0, 0), seg=12),
            # his tags (photo 05): the round silver one and a red bone with his name (A68)
            sphere("steel", 0.026, (-0.028, -0.06, -0.15), seg=6, rings=4),
            sphere("tee_red", 0.03, (0.03, -0.075, -0.155), scale=(1.5, 0.45, 0.85), seg=8, rings=4),
        ],
        location=(0, -0.36, 0.58),
        parent=root,
    )
    empty("Rusty_Mouth", location=(0, -0.3, -0.04), parent=head)
    # where his tags hang (the website hangs the name-tag close-up here)
    empty("Rusty_Tag", location=(0.03, -0.08, -0.17), parent=head)
    compound(
        "Rusty_Tail",
        [cyl("rusty", 0.045, 0.3, (0, 0, 0.14), r2=0.025, seg=6)],
        location=(0, 0.33, 0.5),
        parent=root,
        rot=deg(-50, 0, 0),
    )
    return root


def cow():
    """Rusty's plush cow (A41): our own round cow, bigger than life so it reads."""
    collection("Cow")
    root = empty("Cow")
    r = 0.17
    dots = [(-0.05, 0.07), (0.04, 0.12), (0.06, 0.05), (-0.015, 0.15)]
    parts = [
        sphere("cow_white", r, (0, 0, r * 1.05), scale=(1, 0.88, 1.08), seg=14, rings=10),
        sphere("cow_black", r * 0.72, (0.07, 0.04, r * 1.6), scale=(1, 0.85, 0.85), seg=12, rings=8),
        sphere("cow_snout", r * 0.48, (0, -r * 0.78, r * 0.95), scale=(1.3, 0.55, 0.8), seg=12, rings=6),
        sphere("cow_black", 0.022, (0.065, -r * 0.82, r * 1.4), seg=6, rings=4),
        sphere("cow_black", 0.022, (-0.065, -r * 0.82, r * 1.4), seg=6, rings=4),
        cyl("steel", 0.022, 0.06, (0.06, -0.01, r * 2.05), r2=0.005, seg=6),
        cyl("steel", 0.022, 0.06, (-0.06, -0.01, r * 2.05), r2=0.005, seg=6),
        sphere("cow_black", 0.045, (r * 0.95, 0.0, r * 1.75), scale=(1.4, 0.45, 0.7), seg=8, rings=4),
        sphere("cow_snout", 0.045, (-r * 0.95, 0.0, r * 1.75), scale=(1.4, 0.45, 0.7), seg=8, rings=4),
    ]
    parts += [sphere("cow_black", 0.022, (x, -r * 0.86, z), seg=6, rings=4) for x, z in dots]
    compound("Cow_Body", parts, parent=root)
    return root


# ---------------------------------------------------------------- HUGO
def hugo():
    collection("Hugo")
    root = empty("Hugo")
    compound(
        "Hugo_Body",
        [
            cyl("hugo_base", 0.12, 0.03, (0, 0, 0.015), seg=16),
            cyl("hugo_white", 0.115, 0.27, (0, 0, 0.165), r2=0.165, seg=16),
            cyl("metal_dark", 0.148, 0.01, (0, 0, 0.297), seg=16),
        ]
        + [cyl("rod", 0.012, 0.11, (math.cos(a) * 0.06, math.sin(a) * 0.06, 0.34), seg=5) for a in (0.5, 2.6, 4.7)],
        parent=root,
    )
    head = compound(
        "Hugo_Head",
        [box("hugo_white", (0.4, 0.28, 0.28), (0, 0, 0.14))],
        location=(0, 0, 0.39),
        parent=root,
        bevel=0.07,
        bevel_segments=3,
    )
    face = []
    for sx in (-1, 1):
        face += [
            cyl("hugo_eye", 0.078, 0.03, (sx * 0.095, -0.142, 0.135), deg(90, 0, 0), seg=14),
            cyl("hugo_lens", 0.046, 0.012, (sx * 0.095, -0.16, 0.135), deg(90, 0, 0), seg=12),
            box("trim", (0.022, 0.006, 0.022), (sx * 0.095 + 0.02, -0.168, 0.158)),
            cyl("hugo_white", 0.04, 0.04, (sx * 0.205, 0, 0.15), deg(0, 90, 0), seg=10),
        ]
    face.append(box("hugo_eye", (0.05, 0.02, 0.028), (0, -0.145, 0.135)))
    compound("Hugo_Face", face, parent=head)
    for side, sx in (("L", 1), ("R", -1)):
        compound(
            f"Hugo_Antenna{side}",
            [
                cyl("rod", 0.02, 0.05, (0, 0, 0.025), seg=6),
                cyl("metal_dark", 0.014, 0.28, (0, 0, 0.18), seg=5),
                sphere("metal_dark", 0.026, (0, 0, 0.33), seg=6, rings=4),
            ],
            location=(sx * 0.1, 0.0, 0.27),
            parent=head,
            rot=deg(0, sx * 14, 0),
        )
    return root


# ---------------------------------------------------------------- preview rig (not exported)
# Eduard kneels on the finished north half of the deck, facing the open south end.
EDUARD_SPOT = ((3.15, -1.3, DECK_TOP - 0.13), (0, 0, 0))
SPOTS = {
    "Eduard": EDUARD_SPOT,
    "Hiker": ((0.4, -10.0, 0.0), (0, 0, math.pi)),
    "Rusty": ((1.2, -8.4, 0.0), deg(0, 0, 160)),
    "Cow": ((1.6, -9.4, 0.0), (0, 0, 0.4)),
    "Hugo": ((1.3, -9.6, 0.8), (0, 0, math.pi)),
}


def preview_rig():
    collection("Preview")
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 3.4
    sun.color = (1.0, 0.92, 0.78)
    sun.angle = math.radians(2)
    ob = bpy.data.objects.new("Sun", sun)
    bpy.data.collections["Preview"].objects.link(ob)
    ob.rotation_euler = deg(50, 0, -125)
    cam = bpy.data.cameras.new("GameCamera")
    # matches the website's follow camera when the guest stands at SPOTS["Hiker"]
    cam.lens = 35
    camob = bpy.data.objects.new("GameCamera", cam)
    bpy.data.collections["Preview"].objects.link(camob)
    camob.location = (-2.2, -22.5, 8.6)
    camob.rotation_euler = deg(65.4, 0, -8.4)
    bpy.context.scene.camera = camob
    world = bpy.data.worlds.get("Sky") or bpy.data.worlds.new("Sky")
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.5, 0.62, 0.85, 1)
    bg.inputs["Strength"].default_value = 0.8
    bpy.context.scene.world = world


# ---------------------------------------------------------------- export
def export(name, filename):
    lc = bpy.context.view_layer.layer_collection.children[name]
    bpy.context.view_layer.active_layer_collection = lc
    root = bpy.data.objects.get(name)
    saved = None
    if root is not None:
        saved = (tuple(root.location), tuple(root.rotation_euler))
        root.location = (0, 0, 0)
        root.rotation_euler = (0, 0, 0)
    # hidden options (the mustache) still have to be exported
    hidden = [o for o in lc.collection.all_objects if o.hide_viewport or o.hide_get()]
    for o in hidden:
        o.hide_viewport = False
        o.hide_set(False)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(MODEL_DIR, filename),
        export_format="GLB",
        use_active_collection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )
    for o in hidden:
        o.hide_viewport = True
    if saved:
        root.location, root.rotation_euler = saved


def main():
    reset_scene()
    build_set()
    roots = {"Eduard": eduard(), "Hiker": hiker(), "Rusty": rusty(), "Cow": cow(), "Hugo": hugo()}
    for name, root in roots.items():
        loc, rot = SPOTS[name]
        root.location = loc
        root.rotation_euler = rot
    preview_rig()
    os.makedirs(MODEL_DIR, exist_ok=True)
    for name in ("Set", "CabinParts", "Eduard", "Hiker", "Rusty", "Cow", "Hugo"):
        export(name, "cabin-parts.glb" if name == "CabinParts" else f"{name.lower()}.glb")
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print("BUILD_OK", BLEND_PATH)


if __name__ == "__main__":
    main()
