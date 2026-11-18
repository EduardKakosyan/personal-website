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
    half_log,
    ico,
    reset_scene,
    sphere,
    wedge,
)
import eduard_model  # noqa: E402  (Eduard, A107)
import rusty_model  # noqa: E402  (Rusty, A105)
import guest_model  # noqa: E402  (the guests, A111)

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
WORKBENCH_LOCAL = (-2.5, -0.35)  # in the shed's frame: off its south end, front nearly in line
WOODSHED_ROT = 125  # degrees; the open front (local -Y) faces east-north-east
CHOPPING_BLOCK = (5.62, -5.75, 0.0)
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
# Taken out so the way from the cabin to the woodshed is clear (Eduard, A104).
# They stay in the lists (and are skipped) so nothing else moves or turns.
REMOVED_SAPLINGS = {(7.8, -5.6), (11.0, -4.6)}
REMOVED_ROCKS = {(8.4, -4.0)}
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
        turn = rng.uniform(0, 90)  # (drawn even for a removed rock, so the rest of the scene stays put)
        if (x, y) in REMOVED_ROCKS:
            continue
        rocks.append(ico("stone", s, (x, y, s * 0.2), scale=(1.25, 1, 0.65), rot=deg(0, 0, turn)))
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

    # ---- the front door: the white storm door from photo 02 (a big glass pane
    # over the dark door behind it), hinged at its south edge and opening
    # outward onto the deck, as a storm door does. The website swings it.
    hinge = (-FRONT_Y, d0)  # local (d0, FRONT_Y) turned to face east
    door = [
        box("trim", (dw - 0.04, 0.05, dh - 0.02), (dw / 2, -0.035, WALL_BASE + dh / 2)),
        # the glass pane, with the dark inner door showing through it
        box("glass", (dw - 0.2, 0.06, dh - 0.7), (dw / 2, -0.035, WALL_BASE + dh / 2 + 0.22)),
        box("door", (dw - 0.2, 0.052, dh - 0.7), (dw / 2, -0.02, WALL_BASE + dh / 2 + 0.22)),
        # the dark kick panel at the bottom
        box("door", (dw - 0.2, 0.06, 0.4), (dw / 2, -0.035, WALL_BASE + 0.28)),
        # the handle, on the latch side
        box("steel", (0.03, 0.08, 0.1), (dw - 0.1, -0.075, WALL_BASE + 1.0)),
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

    # Things the guest can use glow on the website, so each is its own object
    # in props.glb (the Props collection isn't merged, see optimize_models.sh).
    collection("Props")
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
    collection("Set")


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
    rows = []
    while y < DECK_Y0 - 0.02:
        tone = "lumber" if i % 3 == 0 else "deck"
        p.append(box(tone, (w * 0.6, 0.15, 0.045), (DECK_X1 - w * 0.3, y, DECK_TOP - 0.02)))
        rows.append(y)
        y += 0.17
        i += 1
    p.append(box("deck", (0.9, 0.34, 0.14), (DECK_X1 - 0.9, DECK_Y1 - 0.2, 0.07)))
    compound("Deck", p, rot=deg(0, 0, CABIN_ROT), bevel=0.01)

    # The boards still to go down, one per row over the open joists, and the
    # loose one lying ready: each its own object in CabinParts, so the website
    # can show them as Eduard lays them (A110; watching him finish the deck).
    # They're hidden here; DECK_BOARDS in world.ts mirrors where they are.
    collection("CabinParts")
    rest = (DECK_X0 + 0.02, DECK_X1 - w * 0.6 - 0.005)  # the open part of each row
    for k, yy in enumerate(rows):
        ob = compound(
            f"DeckBoard_{k}",
            [box("lumber", (rest[1] - rest[0], 0.15, 0.045), ((rest[0] + rest[1]) / 2, yy, DECK_TOP - 0.02), deg(0, 0, 0))],
            rot=deg(0, 0, CABIN_ROT),
            bevel=0.01,
        )
        ob.hide_render = True
    # a loose board, ready to go down (it goes once he's laid the first board)
    compound("DeckLooseBoard", [box("lumber", (1.0, 0.15, 0.045), (DECK_X0 + 0.7, DECK_Y1 + 0.6, DECK_TOP + 0.03), deg(0, 0, 4))], rot=deg(0, 0, CABIN_ROT), bevel=0.01)
    collection("Set")

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
    """The outdoor shower Eduard is finishing, after photo 05: thick posts on
    black metal bases and concrete pads, white corrugated panels raised off the
    ground, darker rails holding them, a pallet floor, the water line looping
    over the top to the shower head, the pump hose, and the stepladder still
    standing beside it. Open on one side, with the door panel half open."""
    p = []
    w, d = 1.5, 1.5
    post_h = 2.5
    lift, top = 0.16, 2.2  # the panels stop short of the ground and the post tops
    ph = top - lift
    # posts on black bases and concrete pads
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * w / 2, sy * d / 2
            p.append(box("stone", (0.3, 0.3, 0.06), (x, y, 0.03)))
            p.append(box("metal_dark", (0.18, 0.18, 0.12), (x, y, 0.12)))
            p.append(box("deck", (0.14, 0.14, post_h - 0.06), (x, y, 0.06 + (post_h - 0.06) / 2)))
            p.append(box("cabin_dark", (0.15, 0.15, 0.02), (x, y, post_h)))

    def panel(cx, cy, length, along_x, out, rot=(0, 0, 0)):
        """A white corrugated sheet: a flat sheet with grey ribs every 12 cm, on both faces."""
        if along_x:
            p.append(box("trim", (length, 0.02, ph), (cx, cy, lift + ph / 2), rot))
            n = int(length / 0.12)
            for k in range(n):
                x = cx - length / 2 + 0.06 + k * 0.12
                p.append(box("panel_rib", (0.035, 0.036, ph), (x, cy, lift + ph / 2), rot))
        else:
            p.append(box("trim", (0.02, length, ph), (cx, cy, lift + ph / 2), rot))
            n = int(length / 0.12)
            for k in range(n):
                y = cy - length / 2 + 0.06 + k * 0.12
                p.append(box("panel_rib", (0.036, 0.035, ph), (cx, y, lift + ph / 2), rot))

    # back wall: sheet on the inside, the rails on the outside (the right-hand wall in the photo)
    panel(0, d / 2 - 0.08, w - 0.14, True, -1)
    for z in (lift + 0.12, lift + ph * 0.52, top - 0.1):
        p.append(box("cabin", (w - 0.14, 0.06, 0.1), (0, d / 2 - 0.02, z)))
    # side walls: sheet on the outside, rails on the inside (the left-hand wall in the photo)
    for sx in (-1, 1):
        panel(sx * (w / 2 + 0.08), 0, d + 0.02, False, sx)
        for z in (lift + 0.12, lift + ph * 0.52, top - 0.1):
            p.append(box("cabin", (0.06, d - 0.14, 0.1), (sx * (w / 2 + 0.01), 0, z)))
    # the open side: a door panel on its own frame, swung half open
    door_w = w - 0.2
    hinge = (-w / 2 + 0.07, -d / 2 - 0.08)
    a = math.radians(-60)
    dc = (hinge[0] + math.cos(a) * door_w / 2, hinge[1] + math.sin(a) * door_w / 2)
    p.append(box("trim", (door_w, 0.02, ph - 0.1), (dc[0], dc[1], lift + 0.05 + (ph - 0.1) / 2), (0, 0, a)))
    for k in range(int(door_w / 0.12)):
        off = -door_w / 2 + 0.06 + k * 0.12
        p.append(box("panel_rib", (0.035, 0.036, ph - 0.1),
                     (dc[0] + math.cos(a) * off, dc[1] + math.sin(a) * off, lift + 0.05 + (ph - 0.1) / 2), (0, 0, a)))
    for z in (lift + 0.2, top - 0.2):
        p.append(box("cabin", (door_w, 0.05, 0.09), (dc[0] - math.sin(a) * 0.04, dc[1] + math.cos(a) * 0.04, z), (0, 0, a)))
    # pallet floor
    for sy in (-0.45, 0, 0.45):
        p.append(box("weathered", (w - 0.2, 0.09, 0.07), (0, sy, 0.035)))
    for k in range(7):
        p.append(box("lumber", (0.11, d - 0.2, 0.025), (-w / 2 + 0.22 + k * 0.175, 0, 0.085)))
    # water: the white line comes up the back corner post, loops over the wall
    # and down to the shower head on an arm; the black pump hose runs down a side post
    bx, by = w / 2 - 0.02, d / 2 + 0.02
    p.append(cyl("trim", 0.016, post_h - 0.2, (bx + 0.09, by, (post_h - 0.2) / 2), seg=6))
    p.append(cyl("trim", 0.016, 0.5, (bx + 0.09, by - 0.25, post_h - 0.12), deg(90, 0, 0), seg=6))
    p.append(cyl("trim", 0.016, 0.62, (bx - 0.22, by - 0.5, post_h - 0.12), deg(0, 90, 0), seg=6))
    p.append(cyl("steel", 0.02, 0.35, (bx - 0.53, by - 0.5, post_h - 0.3), seg=6))
    p.append(cyl("steel", 0.1, 0.05, (bx - 0.53, by - 0.5, post_h - 0.5), seg=10))
    p.append(cyl("wire", 0.02, 1.9, (-w / 2 - 0.1, d / 2 - 0.3, 0.95), seg=6))
    p.append(cyl("wire", 0.02, 0.8, (-w / 2 - 0.1, d / 2 - 0.7, 0.03), deg(90, 0, 0), seg=6))
    # the stepladder left beside it (it's still being finished)
    lx, ly = -w / 2 - 0.55, -0.1
    for sy in (-1, 1):
        for sx in (-1, 1):
            p.append(box("steel", (0.04, 0.025, 1.3), (lx + sx * 0.22, ly + sy * 0.2, 0.62), deg(sy * 9, 0, 0)))
    for k in range(3):
        z = 0.3 + k * 0.32
        p.append(box("trim", (0.46, 0.09, 0.025), (lx, ly - 0.2 + z * 0.16, z)))
    p.append(box("trim", (0.48, 0.2, 0.04), (lx, ly, 1.25)))
    # opening faces east, away from the cabin
    compound("OutdoorShower", p, location=(*SHOWER, 0.0), rot=deg(0, 0, 90))


def woodshed():
    """Eduard's woodshed, after photo 07: fresh pale lumber, horizontal slats
    with gaps on the sides and back, a single-slope roof (high at the open
    front) with a wooden fascia, and split firewood stacked in the front."""
    r = random.Random(55)
    for _ in range(51):  # keep the shared stream where the old woodshed left it
        rng.uniform(0, 1)
    p = []
    w, d = 2.8, 1.6
    base = 0.2  # the floor sits on skids
    h_front, h_back = 2.15, 1.75

    def top(y):  # height of the wall plate at depth y (front is -d/2)
        return h_front + (h_back - h_front) * (y + d / 2) / d

    # skids and floor
    for sx in (-1, 0, 1):
        p.append(box("shed_post", (0.1, d + 0.12, 0.12), (sx * (w / 2 - 0.08), 0, 0.06)))
    p.append(box("shed", (w + 0.06, d + 0.06, 0.06), (0, 0, base - 0.03)))
    # posts: corners and the middle of the front and back, two more along each side
    for x in (-w / 2, 0, w / 2):
        for y in (-d / 2, d / 2):
            h = top(y) - base
            p.append(box("shed_post", (0.1, 0.1, h), (x, y, base + h / 2)))
    for sx in (-1, 1):
        for y in (-d / 6, d / 6):
            h = top(y) - base
            p.append(box("shed_post", (0.08, 0.08, h), (sx * w / 2, y, base + h / 2)))
    # top plates
    p.append(box("shed_post", (w + 0.1, 0.12, 0.16), (0, -d / 2, h_front - 0.02)))
    p.append(box("shed_post", (w + 0.1, 0.1, 0.12), (0, d / 2, h_back - 0.02)))
    # slats with gaps: sides (cut to the slope) and back, set in line with the posts
    # so the posts stand proud of them, as in the photo
    slat, pitch = 0.12, 0.19
    z = base + 0.12
    while z < h_front - 0.2:
        # sides: the slat runs from the front post back to where the slope comes down to it
        y1 = d / 2 if z + slat < h_back - 0.12 else -d / 2 + (h_front - 0.14 - z - slat) / (h_front - h_back) * d
        if y1 > -d / 2 + 0.15:
            ln = y1 + d / 2
            for sx in (-1, 1):
                p.append(box("shed", (0.025, ln, slat), (sx * w / 2, -d / 2 + ln / 2, z + slat / 2)))
        if z + slat < h_back - 0.12:
            p.append(box("shed", (w, 0.025, slat), (0, d / 2, z + slat / 2)))
        z += pitch
    # roof: rafters running front to back, overhanging the front
    slope = math.atan2(h_front - h_back, d)
    over_f, over_b, over_s = 0.45, 0.15, 0.15
    rlen = (d + over_f + over_b) / math.cos(slope)
    yc = (over_b - over_f) / 2
    zc = top(yc) + 0.1
    x = -w / 2
    while x <= w / 2 + 0.01:
        p.append(box("shed_post", (0.05, rlen, 0.12), (x, yc, zc - 0.02), (-slope, 0, 0)))
        x += w / 4
    p.append(box("roof", (w + 2 * over_s, rlen, 0.04), (0, yc, zc + 0.06), (-slope, 0, 0)))
    x = -w / 2 - over_s + 0.12
    while x < w / 2 + over_s:
        p.append(box("roof_dark", (0.03, rlen, 0.03), (x, yc, zc + 0.09), (-slope, 0, 0)))
        x += 0.32
    # fascia: a wide light board across the front and back, sloped boards on the sides
    yf = -d / 2 - over_f
    p.append(box("shed", (w + 2 * over_s + 0.05, 0.04, 0.17), (0, yf, top(yf) + 0.09)))
    yb = d / 2 + over_b
    p.append(box("shed", (w + 2 * over_s + 0.05, 0.04, 0.13), (0, yb, top(yb) + 0.09)))
    for sx in (-1, 1):
        p.append(box("shed", (0.04, rlen, 0.15), (sx * (w / 2 + over_s), yc, zc + 0.03), (-slope, 0, 0)))
    # firewood: the stack behind (only seen through the slats), then split pieces at the front
    stack = h_back - 0.2
    p.append(box("shed_shadow", (w - 0.12, d - 0.5, stack - base), (0, 0.22, (stack + base) / 2)))
    zr = base + 0.075
    row = 0
    while zr < stack:
        x = -w / 2 + 0.13 + (0.07 if row % 2 else 0)
        while x < w / 2 - 0.1:
            if abs(x) > 0.11:  # leave the middle post clear
                rad = r.uniform(0.062, 0.078)
                side = "bark" if r.random() < 0.22 else "split_wood"
                p.append(cyl(side, rad, r.uniform(0.42, 0.5), (x, -d / 2 + 0.3 + r.uniform(-0.03, 0.03), zr),
                             deg(90, r.uniform(0, 360), 0), seg=r.choice((3, 4, 4, 5)), caps="endgrain"))
            x += 0.14
        zr += 0.125
        row += 1
    # the top of the stack: pieces lying front to back
    x = -w / 2 + 0.14
    while x < w / 2 - 0.1:
        if abs(x) > 0.11:
            p.append(cyl("bark" if r.random() < 0.3 else "split_wood", r.uniform(0.06, 0.075), d - 0.55,
                         (x, 0.2, stack + 0.06), deg(90, r.uniform(0, 360), 0), seg=r.choice((4, 5)), caps="endgrain"))
        x += 0.15
    # the open front faces the yard and the grass field (east-north-east), as in photo 07.
    # It fades like the trees when it hides the guest.
    collection("SeeThrough")
    compound("Woodshed", p, location=(*WOODSHED, 0.0), rot=deg(0, 0, WOODSHED_ROT), bevel=0.006)

    # The chopping block, with the axe stuck in it, and the log the guest splits
    # (the splitting game, scene 5). The axe, the log and its halves are their
    # own objects: the website hides the axe while the guest holds it, puts a
    # log on the block, and sends the halves flying.
    collection("Props")
    blk = [cyl("bark", 0.3, 0.46, (0, 0, 0.23), seg=9, caps="endgrain")]
    for i in range(5):
        a = i * 1.3
        blk.append(box("endgrain", (0.1, 0.32, 0.1), (math.cos(a) * 0.6, math.sin(a) * 0.6, 0.05), deg(0, 90 if i % 2 else 0, a * 57)))
    # in the yard off the woodshed's north end, clear of the workbench, with room to swing
    compound("ChoppingBlock", blk, location=CHOPPING_BLOCK, bevel=0.006)
    axe = [
        box("weathered", (0.045, 0.05, 0.7), (0.12, 0.0, 0.72), deg(0, 32, 0)),
        box("hammer_head", (0.22, 0.05, 0.13), (-0.04, 0, 0.48), deg(0, 32, 0)),
        box("steel", (0.05, 0.045, 0.14), (-0.145, 0, 0.42), deg(0, 32, 0)),
    ]
    compound("BlockAxe", axe, location=CHOPPING_BLOCK, bevel=0.006)
    bx, by, bz = CHOPPING_BLOCK
    log_z = bz + 0.46
    compound("Log", [cyl("bark", 0.11, 0.36, (0, 0, 0.18), seg=9, caps="endgrain")], location=(bx, by, log_z))
    for name in ("LogHalfA", "LogHalfB"):
        compound(name, [half_log("bark", 0.11, 0.36, (0, 0, 0.18), seg=6, caps="endgrain", flat="split_wood")], location=(bx, by, log_z))
    for name in ("Log", "LogHalfA", "LogHalfB"):
        bpy.data.objects[name].hide_render = True
        bpy.data.objects[name].hide_viewport = True
    collection("Set")


def shed_point(lx, ly):
    """A point given in the woodshed's own frame (front is -Y, x along the front), in the world."""
    a = math.radians(WOODSHED_ROT)
    return (WOODSHED[0] + lx * math.cos(a) - ly * math.sin(a), WOODSHED[1] + lx * math.sin(a) + ly * math.cos(a))


def workbench():
    """Eduard's workbench, beside the woodshed's south end (on your left as you
    face the firewood, A79), turned the same way as the shed. The top is kept
    clear for the project archive (scene 5)."""
    p = []
    L, D, H = 1.8, 0.7, 0.9
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.append(box("shed_post", (0.09, 0.09, H - 0.06), (sx * (L / 2 - 0.08), sy * (D / 2 - 0.08), (H - 0.06) / 2)))
    # aprons under the top and stretchers holding the lower shelf
    for sy in (-1, 1):
        p.append(box("shed", (L - 0.1, 0.03, 0.12), (0, sy * (D / 2 - 0.05), H - 0.12)))
        p.append(box("shed", (L - 0.1, 0.03, 0.08), (0, sy * (D / 2 - 0.05), 0.2)))
    for sx in (-1, 1):
        p.append(box("shed", (0.03, D - 0.1, 0.12), (sx * (L / 2 - 0.05), 0, H - 0.12)))
    # top: three thick planks, overhanging a little
    for k in range(3):
        p.append(box("lumber", (L, D / 3 - 0.008, 0.05), (0, -D / 3 + k * D / 3, H - 0.025)))
    # lower shelf: three of the project boxes (below) and a toolbox
    p.append(box("shed", (L - 0.14, D - 0.14, 0.03), (0, 0, 0.25)))
    p.append(box("bistro_red", (0.44, 0.22, 0.2), (0.45, 0.02, 0.37)))
    p.append(box("metal_dark", (0.3, 0.03, 0.03), (0.45, 0.02, 0.49)))
    # a vise on the right-hand front corner
    vx, vy = L / 2 - 0.22, -D / 2 - 0.02
    p.append(box("metal_dark", (0.16, 0.12, 0.09), (vx, vy + 0.06, H + 0.045)))
    p.append(box("metal_dark", (0.16, 0.035, 0.11), (vx, vy - 0.03, H + 0.01)))
    p.append(cyl("steel", 0.012, 0.22, (vx, vy - 0.12, H - 0.0), deg(90, 0, 0), seg=6))
    p.append(cyl("steel", 0.01, 0.16, (vx, vy - 0.23, H - 0.0), deg(0, 90, 0), seg=6))
    # back rail with a few hand tools hanging off it
    p.append(box("shed_post", (0.07, 0.07, 0.7), (-L / 2 + 0.08, D / 2 - 0.08, H + 0.35)))
    p.append(box("shed_post", (0.07, 0.07, 0.7), (L / 2 - 0.08, D / 2 - 0.08, H + 0.35)))
    p.append(box("shed", (L, 0.025, 0.14), (0, D / 2 - 0.05, H + 0.62)))
    # handsaw, square, hammer
    p.append(box("steel", (0.42, 0.006, 0.11), (-0.45, D / 2 - 0.075, H + 0.43), deg(0, 8, 0)))
    p.append(box("hammer_head", (0.1, 0.03, 0.08), (-0.69, D / 2 - 0.08, H + 0.5)))
    p.append(box("hammer_head", (0.3, 0.006, 0.03), (0.05, D / 2 - 0.075, H + 0.52)))
    p.append(box("hammer_head", (0.03, 0.006, 0.2), (-0.085, D / 2 - 0.075, H + 0.43)))
    p.append(box("bark", (0.025, 0.025, 0.26), (0.5, D / 2 - 0.08, H + 0.42)))
    p.append(box("hammer_head", (0.11, 0.035, 0.035), (0.5, D / 2 - 0.08, H + 0.55)))
    # a few tools left out on the top (Eduard: "put a few tools on it"), around
    # the project boxes
    t = H  # the top surface
    # cordless drill standing on its battery, back left
    dx, dy = -0.76, 0.15
    p.append(box("metal_dark", (0.11, 0.08, 0.06), (dx, dy, t + 0.03)))
    p.append(box("jacket", (0.045, 0.05, 0.13), (dx + 0.01, dy, t + 0.125)))
    p.append(cyl("jacket", 0.038, 0.17, (dx + 0.045, dy, t + 0.22), deg(0, 90, 0), seg=8))
    p.append(cyl("metal_dark", 0.022, 0.06, (dx + 0.155, dy, t + 0.22), deg(0, 90, 0), seg=8))
    p.append(cyl("steel", 0.006, 0.07, (dx + 0.215, dy, t + 0.22), deg(0, 90, 0), seg=5))
    # tape measure lying flat, with its tab out, front left
    p.append(cyl("jacket", 0.042, 0.04, (-0.62, -0.2, t + 0.02), seg=8))
    p.append(box("metal_dark", (0.03, 0.035, 0.042), (-0.58, -0.2, t + 0.021)))
    p.append(box("moss", (0.07, 0.02, 0.004), (-0.53, -0.2, t + 0.003)))
    # chisel and a carpenter's pencil, front middle
    p.append(cyl("bark", 0.014, 0.1, (-0.16, -0.24, t + 0.014), deg(0, 90, 20), seg=6))
    p.append(box("steel", (0.12, 0.02, 0.006), (-0.05, -0.2, t + 0.006), deg(0, 0, 20)))
    p.append(box("bistro_red", (0.17, 0.014, 0.008), (0.12, -0.3, t + 0.004), deg(0, 0, -12)))
    # wooden mallet, front right
    p.append(box("shed_post", (0.08, 0.15, 0.08), (0.48, -0.2, t + 0.04)))
    p.append(cyl("lumber", 0.014, 0.26, (0.34, -0.2, t + 0.03), deg(0, 90, 0), seg=6))
    # a coffee can of screws, back right
    p.append(cyl("steel", 0.045, 0.1, (0.64, 0.14, t + 0.05), seg=8))
    p.append(cyl("hammer_head", 0.04, 0.005, (0.64, 0.14, t + 0.1), seg=8))

    x, y = shed_point(*WORKBENCH_LOCAL)
    compound("Workbench", p, location=(x, y, 0.0), rot=deg(0, 0, WOODSHED_ROT), bevel=0.006)

    # The project boxes (scene 5, A84): six small slatted crates, one per
    # archive project, each with a paper name label on its front and a lid.
    # Three on the top, three on the shelf. Each is its own object in props.glb
    # (so it can glow), with its lid and the thing inside it as children: the
    # website opens the lid and lifts the thing out when the guest looks in.
    collection("Props")
    crate_at = [(-0.31, 0.07, t), (0.0, 0.07, t), (0.31, 0.07, t), (-0.6, -0.02, 0.265), (-0.3, -0.02, 0.265), (0.0, -0.02, 0.265)]
    crate_turn = (-3, 2, -2, 2, -3, 1)
    crate_tone = ("shed", "lumber", "shed", "lumber", "shed", "lumber")
    a = math.radians(WOODSHED_ROT)
    for i, (cx, cy, z0) in enumerate(crate_at):
        wx = x + cx * math.cos(a) - cy * math.sin(a)
        wy = y + cx * math.sin(a) + cy * math.cos(a)
        crate(i, (wx, wy, z0), WOODSHED_ROT + crate_turn[i], crate_tone[i])
    collection("Set")


CRATE_W, CRATE_D, CRATE_H = 0.26, 0.2, 0.15
# the archive projects in the boxes, in the website's order (src/app/preview/arrival/page.tsx)
CRATE_ITEMS = ("dev-template", "healthbyte", "network-sim", "cargrep", "second-brain", "exosky")


def crate(i, at, yaw, tone):
    """One project box: a slatted crate with its lid hinged along the back edge
    (Crate_i_Lid, pivot on the hinge) and the thing inside (Crate_i_Item)."""
    w, d, h = CRATE_W, CRATE_D, CRATE_H
    p = [box(tone, (w, d, 0.015), (0, 0, 0.0075))]
    p.append(box("shed_shadow", (w - 0.03, d - 0.03, 0.004), (0, 0, 0.017)))
    for zs in (0.05, 0.12):
        for sy in (-1, 1):
            p.append(box(tone, (w, 0.015, 0.055), (0, sy * (d / 2 - 0.0075), zs)))
        for sx in (-1, 1):
            p.append(box(tone, (0.015, d - 0.03, 0.055), (sx * (w / 2 - 0.0075), 0, zs)))
    for sx in (-1, 1):  # corner battens hold the slats
        for sy in (-1, 1):
            p.append(box("shed_post", (0.022, 0.022, h), (sx * (w / 2 - 0.018), sy * (d / 2 - 0.018), h / 2)))
    # the name label on the front, and a line of writing on it
    p.append(box("paper", (0.12, 0.004, 0.045), (0, -d / 2 - 0.002, 0.12)))
    p.append(box("ink", (0.08, 0.003, 0.01), (0, -d / 2 - 0.0045, 0.123)))
    root = compound(f"Crate_{i}", p, location=at, rot=deg(0, 0, yaw), bevel=0.004)
    # the lid: two slats and a batten each end, hinged along the back edge
    lid = [
        box(tone, (w + 0.01, d / 2 - 0.012, 0.014), (0, -d / 4, 0.007)),
        box(tone, (w + 0.01, d / 2 - 0.012, 0.014), (0, -3 * d / 4, 0.007)),
    ]
    for sx in (-1, 1):
        lid.append(box("shed_post", (0.025, d - 0.02, 0.018), (sx * (w / 2 - 0.03), -d / 2, 0.022)))
    compound(f"Crate_{i}_Lid", lid, location=(0, d / 2, h), parent=root, bevel=0.003)
    item = compound(f"Crate_{i}_Item", crate_item(CRATE_ITEMS[i]), location=(0, 0, 0.02), parent=root, bevel=0.003)
    item.hide_render = True
    item.hide_viewport = True


def crate_item(slug):
    """A small thing standing for each archive project, chunky enough to read
    once it's lifted out of the box (about 15 cm across)."""
    if slug == "dev-template":
        # a rubber stamp: you stamp new projects out of the template
        return [
            box("bistro_red", (0.11, 0.07, 0.012), (0, 0, 0.006)),
            box("metal_dark", (0.12, 0.08, 0.022), (0, 0, 0.023)),
            cyl("lumber", 0.018, 0.055, (0, 0, 0.06), seg=8),
            sphere("lumber", 0.03, (0, 0, 0.1), seg=10, rings=6),
        ]
    if slug == "healthbyte":
        # a folded newspaper (health articles) with a red heart on it
        return [
            box("paper", (0.14, 0.1, 0.014), (0, 0, 0.007)),
            box("paper", (0.14, 0.1, 0.014), (0.01, 0.006, 0.021), deg(0, 0, 6)),
            box("ink", (0.08, 0.012, 0.003), (-0.015, 0.03, 0.03), deg(0, 0, 6)),
            box("ink", (0.1, 0.006, 0.003), (-0.005, 0.012, 0.03), deg(0, 0, 6)),
            box("ink", (0.1, 0.006, 0.003), (-0.003, -0.004, 0.03), deg(0, 0, 6)),
            sphere("tee_red", 0.02, (0.04, -0.02, 0.038), seg=8, rings=5),
            sphere("tee_red", 0.02, (0.062, -0.012, 0.038), seg=8, rings=5),
            box("tee_red", (0.045, 0.03, 0.018), (0.051, -0.03, 0.036), deg(0, 0, 45)),
        ]
    if slug == "network-sim":
        # a little network: coloured nodes on a board, joined by rods
        nodes = [(-0.05, -0.03, 0.03, "water_jug"), (0.0, 0.035, 0.05, "yolk"), (0.05, -0.025, 0.035, "lupine_pink"), (0.015, -0.045, 0.07, "grass_light"), (-0.03, 0.04, 0.085, "collar")]
        p = [box("pine_dark", (0.15, 0.12, 0.01), (0, 0, 0.005))]
        for (x, y, z, tone) in nodes:
            p.append(sphere(tone, 0.018, (x, y, z), seg=10, rings=6))
        for a_, b_ in ((0, 1), (1, 2), (0, 3), (3, 2), (1, 4), (4, 0)):
            ax, ay, az, _ = nodes[a_]
            bx, by, bz, _ = nodes[b_]
            dx, dy, dz = bx - ax, by - ay, bz - az
            ln = math.sqrt(dx * dx + dy * dy + dz * dz)
            # a cylinder along Z turned to point from a to b
            tilt = math.acos(dz / ln)
            turn = math.atan2(dy, dx)
            p.append(cyl("steel", 0.004, ln, ((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), (0, tilt, turn), seg=5))
        return p
    if slug == "cargrep":
        # a toy car
        p = [
            box("tee_red", (0.15, 0.08, 0.04), (0, 0, 0.045)),
            box("tee_red", (0.085, 0.07, 0.035), (-0.01, 0, 0.08)),
            # the windows: bands of glass standing a hair proud of the cabin's
            # sides and ends, below the roof. (The glass used to end level with
            # the roof, and the two flickered red and blue: overlapping flat
            # faces, see the README.)
            box("glass", (0.06, 0.073, 0.02), (-0.01, 0, 0.081)),
            box("glass", (0.088, 0.054, 0.017), (-0.01, 0, 0.0815)),
            box("yolk", (0.008, 0.02, 0.012), (0.075, 0.025, 0.05)),
            box("yolk", (0.008, 0.02, 0.012), (0.075, -0.025, 0.05)),
        ]
        for sx in (-1, 1):
            for sy in (-1, 1):
                p.append(cyl("char", 0.02, 0.018, (sx * 0.05, sy * 0.045, 0.02), deg(90, 0, 0), seg=10))
                p.append(cyl("steel", 0.01, 0.02, (sx * 0.05, sy * 0.045, 0.02), deg(90, 0, 0), seg=8))
        return p
    if slug == "second-brain":
        # a brain (pink, two halves, a few folds)
        p = []
        for sx in (-1, 1):
            p.append(sphere("lupine_pink", 0.05, (sx * 0.036, 0, 0.05), scale=(0.75, 1.15, 0.9), seg=12, rings=8))
            for k, (y, z) in enumerate(((0.03, 0.08), (-0.025, 0.085), (0.0, 0.055), (-0.04, 0.045))):
                p.append(sphere("rug_red", 0.016, (sx * (0.045 + 0.01 * (k % 2)), y, z), scale=(1, 1.6, 1), seg=8, rings=5))
        p.append(cyl("lip", 0.012, 0.03, (0, -0.01, 0.012), seg=8))
        return p
    # exosky: a small telescope on a tripod
    p = [cyl("blue_sink", 0.016, 0.14, (0.0, 0.0, 0.09), deg(0, 50, 0), seg=10)]
    p.append(cyl("steel", 0.02, 0.025, (0.052, 0.0, 0.133), deg(0, 50, 0), seg=10))
    p.append(cyl("metal_dark", 0.011, 0.025, (-0.058, 0.0, 0.043), deg(0, 50, 0), seg=8))
    p.append(sphere("metal_dark", 0.016, (0, 0, 0.075), seg=8, rings=5))
    for k in range(3):
        a_ = math.radians(90 + k * 120)
        p.append(cyl("metal_dark", 0.005, 0.1, (math.cos(a_) * 0.03, math.sin(a_) * 0.03, 0.038), (math.radians(-34) * math.sin(a_), math.radians(34) * math.cos(a_), 0), seg=5))
    return p


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

    # The stand and the saplings go in their own collection (exported to
    # see-through.glb, not merged), so the website can fade one that stands
    # between the camera and the guest.
    collection("SeeThrough")
    # the stand between the driveway and the woodshed
    for k, (x, y, h, kind) in enumerate(TREE_STAND):
        parts = spruce_parts(h) if kind == "spruce" else birch_parts(h)
        compound(f"Stand{k}", parts, location=(x, y, 0), rot=(0, 0, k * 0.9))

    # a few young spruce and blue spruce in the grass field, not fully grown
    # (Eduard; photos 01 and 05 show one)
    for k, (x, y, h, kind) in enumerate(SAPLINGS):
        if (x, y) in REMOVED_SAPLINGS:
            continue
        tones = ("blue_spruce", "blue_spruce_light") if kind == "blue" else ("spruce_light", "spruce")
        compound(f"SpruceSapling{k}", spruce_parts(h, tones), location=(x, y, 0), rot=(0, 0, k * 1.3))
    collection("Set")


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
    workbench()
    solar_panels()
    brook()
    forest()
    plants()


# ---------------------------------------------------------------- people
# Chunky little people: big round heads, short bodies. About 1.2 m tall.
HIP, SHOULDER, NECK = 0.4, 0.74, 0.76


def eduard():
    """Eduard, remodelled (A107): see eduard_model.py. The board he carries and
    his kneeling rest pose are set up here as before."""
    root, head = eduard_model.build()
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


def hiker_axe(name):
    """The splitting axe in the guest's right hand (hidden until they pick it
    up at the chopping block). The handle runs forward from the hand; the
    website turns the whole axe as well as the arm during a swing."""

    def axe(arm):
        ob = compound(
            f"{name}_Axe",
            [
                box("weathered", (0.035, 0.62, 0.035), (0, -0.27, 0)),
                box("hammer_head", (0.05, 0.09, 0.15), (0, -0.56, -0.035)),
                box("steel", (0.045, 0.1, 0.03), (0, -0.56, -0.12)),
            ],
            location=(0, -0.02, -0.31),
            parent=arm,
            bevel=0.006,
        )
        ob.hide_render = True
        ob.hide_viewport = True

    return {"R": axe}


def hiker():
    """The guest (A36), Character 1 of the two the guest can pick from (A99),
    remodelled (A111): see guest_model.py."""
    root, arm_r = guest_model.build("Hiker")
    hiker_axe("Hiker")["R"](arm_r)
    return root


def hiker_2():
    """Character 2 (A99), remodelled (A111): see guest_model.py. Same parts and
    names (with the Hiker2 prefix), so the website animates both the same way."""
    root, arm_r = guest_model.build("Hiker2")
    hiker_axe("Hiker2")["R"](arm_r)
    return root


def rusty():
    """Rusty, the yellow Lab, remodelled from photo 05 (A105): see rusty_model.py."""
    collection("Rusty")
    root = empty("Rusty")
    return rusty_model.build(root)


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
    "Hiker2": ((-0.9, -10.6, 0.0), (0, 0, math.pi)),
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
    roots = {"Eduard": eduard(), "Hiker": hiker(), "Hiker2": hiker_2(), "Rusty": rusty(), "Cow": cow(), "Hugo": hugo()}
    for name, root in roots.items():
        loc, rot = SPOTS[name]
        root.location = loc
        root.rotation_euler = rot
    preview_rig()
    os.makedirs(MODEL_DIR, exist_ok=True)
    for name in ("Set", "CabinParts", "SeeThrough", "Props", "Eduard", "Hiker", "Hiker2", "Rusty", "Cow", "Hugo"):
        files = {"CabinParts": "cabin-parts.glb", "SeeThrough": "see-through.glb", "Hiker2": "hiker-2.glb"}
        export(name, files.get(name, f"{name.lower()}.glb"))
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    # where things are, in the website's coordinates (x, -y), for world.ts
    for i in range(6):
        ob = bpy.data.objects[f"Crate_{i}"]
        print("CRATE", i, round(ob.location.x, 3), round(ob.location.z, 3), round(-ob.location.y, 3), "yaw", round(math.degrees(ob.rotation_euler.z), 1))
    print("BUILD_OK", BLEND_PATH)


if __name__ == "__main__":
    main()
