"""The brook, rebuilt from photo 03 (storyboard scene 6, A21).

Photo 03: a shallow, clear brook, tea-coloured over red-brown stones, dark
rocks capped with bright moss poking out of the riffles, low earth banks with
grass hanging over them, alder brush leaning over the water from both sides,
birch and spruce behind, and a fallen birch angled down into the water.

What's here, all in Blender's coordinates (x east, y north; the website's z is -y):
  - the channel: the ground along the brook is its own finer strip
    (`GroundBrook`, the ground's paint material), so the banks are real banks:
    a little wet shelf at the water's edge, then an earth face up to the field;
  - the water: its own surface (`BrookWater`, the only mesh with the `water`
    material; the website draws it with its own shader);
  - stones on the bed (seen through the water), mossy rocks above it, a riffle
    across upstream with foam, roots and grass along the banks;
  - the brush: alders leaning over the water (the ones near the stairs in the
    `SeeThrough` collection so they fade when they hide the guest), birches,
    a fallen birch and a couple of dead branches;
  - the stairs down the west bank at the end of the path, the landing at the
    foot of them, the fishing hole right by it (A21);
  - the tap where you get water (A21) on a post at the top of the stairs
    (`BrookTap`, in `Props` so it can glow), its pipe down to the brook, and
    the blue water jug under it.

The numbers the website needs are in src/components/features/cabin/brook.ts
(three.js coordinates). Keep the two in step.
"""

import math
import random

import bpy

import lib
from lib import box, collection, compound, cyl, deg, ico, sphere

# ------------------------------------------------------------------ layout (see brook.ts)
WATER_Y = -0.5
# the stairs: three steps from the field (top of the first at x0) down to the landing
STAIR_X0, STAIR_X1, STAIR_Y, STAIR_HALF, STAIR_STEPS, STAIR_RISE = 24.35, 25.1, 0.2, 0.5, 3, 0.09
# the landing at their foot: x0, x1, y0 (south), y1 (north), top
LANDING = (25.1, 26.05, -0.45, 0.75, -0.36)
# the fishing hole right by the stairs (website z = -y)
HOLE = (26.75, -0.65, 0.95)
# the tap: its post, and the spout (pointing west, towards the field)
TAP_POST = (24.12, 1.05)
TAP_SPOUT = (23.94, 1.05, 0.58)
# the fine strip of ground along the brook, and the part of the coarse ground it replaces
STRIP_Y = (-40.0, 30.0)  # on the coarse ground's grid lines (-80 + k * 1.25)
STRIP_HALF = 5.2
STRIP_CUT = 4.0


def brook_x(y):
    """The middle of the brook (the same curve as before, and as brookX in brook.ts)."""
    return 26.0 + 1.3 * math.sin(y * 0.1 + 0.6) + 0.6 * math.sin(y * 0.29 + 2.0)


def _smooth(a, b, x):
    k = min(1.0, max(0.0, (x - a) / (b - a)))
    return k * k * (3 - 2 * k)


def bank(y, side):
    """How far from the middle the bank's top and its foot (the water's edge) are, on one side."""
    top = 2.45 + 0.4 * (0.5 + 0.5 * math.sin(y * 0.37 + side * 1.3))
    toe = 1.55 + 0.12 * math.sin(y * 0.53 + side * 2.1)
    return top, toe


def in_stair_notch(x, y):
    return abs(y - STAIR_Y) < STAIR_HALF + 0.08 and STAIR_X0 - 0.01 < x < STAIR_X1 + 0.02


def in_landing_cut(x, y):
    x0, x1, y0, y1, _ = LANDING
    return x0 - 0.02 < x < x1 + 0.15 and y0 - 0.12 < y < y1 + 0.12


def height(x, y):
    """The ground along the brook: flat field, an earth bank, a wet shelf, the bed."""
    c = brook_x(y)
    u = x - c
    side = -1 if u < 0 else 1
    d = abs(u)
    top, toe = bank(y, side)
    if d >= top:
        h = 0.0
    elif d > toe:
        t = (d - toe) / (top - toe)
        h = -0.53 + 0.53 * _smooth(0.3, 1.0, t)
    else:
        bed = -0.7 + 0.035 * math.sin(x * 2.3 + y * 0.7) * math.cos(y * 1.9)
        h = bed + (-0.53 - bed) * _smooth(toe - 0.35, toe, d)
    hx, hy, hr = HOLE
    hd = math.hypot(x - hx, y - hy)
    if hd < hr:
        h = min(h, -0.72 - 0.4 * (1 - (hd / hr) ** 2))
    # the stairs are cut into the bank, and the landing stands clear of it
    if in_stair_notch(x, y):
        k = (x - STAIR_X0) / (STAIR_X1 - STAIR_X0)
        h = min(h, -0.1 - 0.36 * max(0.0, k))
    if in_landing_cut(x, y):
        h = min(h, -0.48)
    return h


def near_brook(x, y, margin=0.0):
    """On the bank or in the water (nothing from the field belongs there)."""
    d = abs(x - brook_x(y))
    top, _ = bank(y, -1 if x < brook_x(y) else 1)
    return d < top + margin


# ------------------------------------------------------------------ the channel and the water
def channel(material):
    """The fine strip of ground along the brook, in the ground's own paint."""
    import bmesh

    y0, y1 = STRIP_Y
    ys = []
    y = y0
    while y < y1 - 1e-6:
        ys.append(y)
        # finer round the stairs and the landing, so the cut into the bank is crisp
        y += 0.1 if -1.8 < y < 2.6 else 0.4
    ys.append(y1)
    fine = [round(-3.4 + 0.15 * k, 4) for k in range(int(6.8 / 0.15) + 1)]
    us = [-STRIP_HALF, -4.3, -3.7] + fine + [3.7, 4.3, STRIP_HALF]
    me = bpy.data.meshes.new("GroundBrook")
    bm = bmesh.new()
    rows = []
    for yy in ys:
        c = brook_x(yy)
        # (3 mm down, so where the coarse ground overlaps the flat edge it wins cleanly)
        rows.append([bm.verts.new((c + u, yy, height(c + u, yy) - 0.003)) for u in us])
    for a, b in zip(rows[:-1], rows[1:]):
        for i in range(len(us) - 1):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    x0, gy0, size = -110.0, -80.0, 200.0
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            loop[uv].uv = ((loop.vert.co.x - x0) / size, (loop.vert.co.y - gy0) / size)
    bm.to_mesh(me)
    bm.free()
    # (smooth, like the coarse ground: shared vertices, and the banks shade softly)
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(material)
    ob = bpy.data.objects.new("GroundBrook", me)
    bpy.data.collections["Set"].objects.link(ob)


def coarse_cut(cx, cy):
    """Whether a face of the coarse ground (centre cx, cy) is replaced by the strip."""
    return STRIP_Y[0] < cy < STRIP_Y[1] and abs(cx - brook_x(cy)) < STRIP_CUT


def water(y_from, y_to):
    """The water's surface: flat, from foot of bank to foot of bank."""
    import bmesh

    me = bpy.data.meshes.new("BrookWater")
    bm = bmesh.new()
    rows = []
    y = y_from
    while y <= y_to:
        c = brook_x(y)
        _, toe_w = bank(y, -1)
        _, toe_e = bank(y, 1)
        across = [-(toe_w + 0.5), -0.6, 0.6, toe_e + 0.5]
        rows.append([bm.verts.new((c + u, y, WATER_Y)) for u in across])
        y += 0.5 if STRIP_Y[0] - 2 < y < STRIP_Y[1] + 2 else 1.0
    for a, b in zip(rows[:-1], rows[1:]):
        for i in range(3):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(lib.mat("water"))
    ob = bpy.data.objects.new("BrookWater", me)
    bpy.data.collections["Set"].objects.link(ob)


# ------------------------------------------------------------------ stones, rocks, banks
def _rock(parts, x, y, r, rng, poke, moss=True):
    """A dark rock sitting in the water, its top `poke` above it and capped with bright moss (photo 03)."""
    z = WATER_Y + poke - 0.85 * r
    turn = deg(0, 0, rng.uniform(0, 180))
    parts.append(ico(rng.choice(["rock_dark", "rock_dark", "stone_brown"]), r, (x, y, z), turn, (1.2, 1.0, 0.85)))
    if moss:
        # (a cap over the top: the dark rock shows round its waterline)
        parts.append(ico("moss_bright", r * 0.9, (x, y, z + r * 0.33), turn, (1.15, 0.97, 0.62), sub=2))


def stones_and_rocks(rng):
    bed, rocks, foam, banks = [], [], [], []
    y0, y1 = -34.0, 28.0
    # stones on the bed, under the water: red-brown, brown and tan
    for _ in range(300):
        y = rng.uniform(y0, y1)
        _, toe = bank(y, 1)
        u = rng.uniform(-toe + 0.05, toe - 0.05)
        x = brook_x(y) + u
        s = rng.uniform(0.07, 0.19)
        tone = rng.choice(["stone_red", "stone_red", "stone_brown", "stone_tan"])
        bed.append(ico(tone, s, (x, y, height(x, y) + s * 0.12), deg(0, 0, rng.uniform(0, 180)), (1.35, 1.0, 0.42)))
    # mossy rocks: a shallow riffle just downstream of the landing (in front of
    # the camera, like the photo's foreground), a line across upstream, and
    # some scattered along the way
    def riffle_rock(y, u, r):
        x = brook_x(y) + u
        _rock(rocks, x, y, r, rng, rng.uniform(0.08, 0.17))
        # foam just downstream (south) of it
        for k in range(rng.randint(1, 2)):
            foam.append(box("foam", (rng.uniform(0.12, 0.3), rng.uniform(0.04, 0.07), 0.012), (x + rng.uniform(-0.15, 0.15), y - r * 1.1 - k * 0.12, WATER_Y + 0.004), deg(0, 0, rng.uniform(-20, 20))))

    for _ in range(26):  # the foreground riffle, south of the landing
        y = rng.uniform(-8.5, -2.2)
        riffle_rock(y, rng.uniform(-1.3, 1.4), rng.uniform(0.13, 0.27))
    for k in range(9):  # the line across, upstream (the photo's middle distance)
        y = 7.3 + rng.uniform(-0.35, 0.35)
        riffle_rock(y, -1.4 + k * 0.36 + rng.uniform(-0.08, 0.08), rng.uniform(0.15, 0.26))
    for _ in range(30):
        y = rng.uniform(y0, y1)
        if -2.0 < y < 2.5:
            continue  # (the fishing hole and the landing stay clear)
        riffle_rock(y, rng.uniform(-1.3, 1.3), rng.uniform(0.12, 0.3))
    # the fishing hole: big boulders round its far side, moss on top
    hx, hy, hr = HOLE
    for a, r in ((-0.9, 0.42), (-0.2, 0.5), (0.55, 0.38), (1.35, 0.3)):
        _rock(rocks, hx + math.cos(a) * (hr + 0.2), hy + math.sin(a) * (hr + 0.25), r, rng, rng.uniform(0.24, 0.36))
    # stones along the water's edge, half in
    for _ in range(140):
        y = rng.uniform(y0, y1)
        side = rng.choice((-1, 1))
        _, toe = bank(y, side)
        x = brook_x(y) + side * (toe + rng.uniform(-0.1, 0.25))
        if in_landing_cut(x, y) or in_stair_notch(x, y):
            continue
        s = rng.uniform(0.09, 0.22)
        banks.append(ico(rng.choice(["stone_red", "stone_brown", "rock_dark"]), s, (x, y, height(x, y) + s * 0.25), deg(0, 0, rng.uniform(0, 180)), (1.3, 1.0, 0.6)))
    compound("StreamBed", bed)
    compound("StreamRocks", rocks)
    compound("StreamFoam", foam)
    compound("StreamEdge", banks)


def bank_details(rng):
    """Grass hanging over the bank tops, and roots in the earth faces."""
    tufts, roots = [], []
    for _ in range(420):
        y = rng.uniform(-34, 28)
        side = rng.choice((-1, 1))
        top, toe = bank(y, side)
        c = brook_x(y)
        u = side * (top + rng.uniform(-0.25, 0.15))
        x = c + u
        if in_stair_notch(x, y) or in_landing_cut(x, y) or (abs(y - STAIR_Y) < 1.0 and side < 0):
            continue
        h = rng.uniform(0.22, 0.5)
        lean = rng.uniform(25, 55) * (-side)  # out over the bank, towards the water
        tone = rng.choice(["grass_light", "grass_light", "grass_dark", "alder_light"])
        z = height(x, y)
        tufts.append(cyl(tone, 0.07, h, (x - side * math.sin(math.radians(abs(lean))) * h / 2, y, z + h * 0.4), deg(0, lean, rng.uniform(-25, 25)), r2=0.0, seg=4))
    for _ in range(60):
        y = rng.uniform(-30, 26)
        side = rng.choice((-1, 1))
        top, toe = bank(y, side)
        c = brook_x(y)
        x = c + side * (toe + (top - toe) * rng.uniform(0.45, 0.75))
        if in_stair_notch(x, y) or in_landing_cut(x, y):
            continue
        z = height(x, y)
        towards = (0.0 if side < 0 else math.pi) + rng.uniform(-0.6, 0.6)
        roots.append(cyl("root", 0.018, rng.uniform(0.3, 0.6), (x, y, z), _toward(towards, math.radians(rng.uniform(55, 80))), seg=4))
    compound("BankGrass", tufts)
    compound("BankRoots", roots)


# ------------------------------------------------------------------ brush and trees
def _toward(phi, a):
    """Euler that tilts a +Z cylinder by `a` towards the direction `phi` (in the ground plane)."""
    return (0.0, a, phi)


def alder_parts(h, phi, rng):
    """A clump of alder: a few thin grey stems leaning out over the water, leafy on top."""
    parts = []
    for _ in range(rng.randint(3, 4)):
        a = math.radians(rng.uniform(16, 42))
        p = phi + math.radians(rng.uniform(-35, 35))
        ln = h * rng.uniform(0.7, 1.0)
        dx, dy, dz = math.sin(a) * math.cos(p), math.sin(a) * math.sin(p), math.cos(a)
        parts.append(cyl("alder_bark", 0.035, ln, (dx * ln / 2, dy * ln / 2, dz * ln / 2), _toward(p, a), r2=0.022, seg=5))
        for t in (0.58, 0.82, 1.0):
            r = h * rng.uniform(0.1, 0.15)
            cx, cy, cz = dx * ln * t, dy * ln * t, dz * ln * t
            tone = rng.choice(["alder", "alder_light", "alder_light", "alder_dark"])
            parts.append(ico(tone, r, (cx + rng.uniform(-0.1, 0.1), cy + rng.uniform(-0.1, 0.1), cz), deg(0, 0, rng.uniform(0, 90)), (1.25, 1.1, 0.78)))
    # low, leafy brush round the foot
    for _ in range(2):
        r = h * rng.uniform(0.13, 0.18)
        parts.append(ico(rng.choice(["alder_dark", "alder"]), r, (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), r * 0.7), (0, 0, 0), (1.3, 1.2, 0.8)))
    return parts


def birch_parts(h, rng):
    """A birch: a white, black-marked trunk, a few branches and a light crown."""
    parts = [cyl("birch", 0.11, h * 0.82, (0, 0, h * 0.41), r2=0.06, seg=7)]
    for k in range(int(h * 1.1)):
        z = rng.uniform(0.4, h * 0.75)
        a = rng.uniform(0, math.tau)
        parts.append(box("hair", (0.09, 0.03, 0.035), (math.cos(a) * 0.085, math.sin(a) * 0.085, z), deg(0, 0, math.degrees(a) + 90)))
    for k in range(3):
        a = rng.uniform(0, math.tau)
        z = h * rng.uniform(0.5, 0.72)
        parts.append(cyl("birch", 0.03, h * 0.28, (math.cos(a) * h * 0.1, math.sin(a) * h * 0.1, z + h * 0.08), _toward(a, math.radians(50)), r2=0.015, seg=5))
    for k in range(8):
        a = k * 2.4 + rng.uniform(-0.3, 0.3)
        r = h * rng.uniform(0.1, 0.14)
        rr = h * rng.uniform(0.06, 0.16)
        parts.append(ico(rng.choice(["birch_leaf", "birch_leaf", "alder_light"]), r, (math.cos(a) * rr, math.sin(a) * rr, h * rng.uniform(0.66, 0.95)), deg(0, 0, rng.uniform(0, 90)), (1.2, 1.1, 0.8)))
    return parts


def brush(rng):
    """Alders along both banks leaning over the water, birches, and what's fallen."""
    merged = []

    def place_alder(x, y, h, phi, name=None):
        parts = alder_parts(h, phi, rng)
        z = height(x, y)
        if name:
            collection("SeeThrough")
            compound(name, parts, location=(x, y, z))
            collection("Set")
            return
        for p in parts:
            p.center = (p.center[0] + x, p.center[1] + y, p.center[2] + z)
            merged.append(p)

    # the far (east) bank: thick, from one end to the other, with a second row behind
    y = -34.0
    while y < 30.0:
        top, _ = bank(y, 1)
        place_alder(brook_x(y) + top + rng.uniform(-0.25, 0.4), y, rng.uniform(2.3, 3.6), math.pi + rng.uniform(-0.3, 0.3))
        if rng.random() < 0.45:
            yb = y + rng.uniform(-0.6, 0.6)
            place_alder(brook_x(yb) + top + rng.uniform(1.3, 2.4), yb, rng.uniform(3.0, 4.4), math.pi + rng.uniform(-0.4, 0.4))
        y += rng.uniform(1.1, 1.7)
    # the near (west) bank, on the field's side: in clumps with gaps (photo 07
    # shows the field running down to the water), none by the stairs and the tap
    near = 0
    y = -32.0
    while y < 30.0:
        if not (-4.0 < y < 4.2) and rng.random() < 0.7:
            top, _ = bank(y, -1)
            x = brook_x(y) - top - rng.uniform(-0.2, 0.3)
            # the ones near the stairs can hide the guest: each fades on its own
            name = None
            if abs(y - STAIR_Y) < 13:
                name = f"BankAlder{near}"
                near += 1
            place_alder(x, y, rng.uniform(2.0, 3.3), rng.uniform(-0.35, 0.35), name)
        y += rng.uniform(1.6, 2.8)
    compound("BankBrush", merged)

    # birches along the banks, some leaning out over the water (x, y, height, lean degrees, towards)
    birches = [
        (1, -9.0, 8.0, 14, math.pi),
        (1, 5.5, 9.0, 9, math.pi + 0.3),
        (1, 14.0, 8.5, 6, math.pi),
        (1, -18.0, 7.5, 10, math.pi - 0.3),
        (-1, -12.5, 7.0, 13, 0.2),
        (-1, 9.5, 7.6, 20, -0.15),  # the big one leaning over from the field's side (photo 07)
    ]
    for k, (side, by, h, lean, phi) in enumerate(birches):
        top, _ = bank(by, side)
        bx = brook_x(by) + side * (top + 0.3)
        parts = birch_parts(h, rng)
        target = "SeeThrough" if side < 0 and abs(by - STAIR_Y) < 13 else None
        if target:
            collection(target)
        compound(f"BankBirch{k}", parts, location=(bx, by, height(bx, by)), rot=_toward(phi, math.radians(lean)))
        if target:
            collection("Set")

    fallen = []
    # a fallen birch from the far bank down into the water, branches and all (photo 03)
    fy = -3.4
    x0, z0 = brook_x(fy) + 2.7, 0.08
    x1, z1 = brook_x(fy) + 0.4, WATER_Y - 0.06
    ln = math.hypot(x1 - x0, z1 - z0)
    a = math.atan2(z0 - z1, x0 - x1)
    fallen.append(cyl("birch", 0.1, ln + 0.4, ((x0 + x1) / 2, fy - 0.35, (z0 + z1) / 2), (0.0, math.pi / 2 - a, 0.0), r2=0.08, seg=7))
    for k in range(5):
        t = 0.2 + 0.15 * k
        px, pz = x0 + (x1 - x0) * t, z0 + (z1 - z0) * t
        fallen.append(box("hair", (0.1, 0.03, 0.03), (px, fy - 0.35 + 0.02, pz + 0.095)))
        fallen.append(cyl("birch", 0.025, 0.7, (px, fy - 0.35 + (0.3 if k % 2 else -0.3), pz + 0.12), deg(70 if k % 2 else -70, 0, 15), r2=0.012, seg=4))
    # a dead branch along the near bank, upstream of the stairs
    for k in range(3):
        y = 5.6 + k * 0.25
        top, _ = bank(y, -1)
        x = brook_x(y) - top + 0.35
        fallen.append(cyl("bark", 0.05 - k * 0.012, 2.2 - k * 0.5, (x, y, height(x, y) + 0.1), deg(0, 82, 70 + k * 25), r2=0.02, seg=5))
    # an old mossy trunk down from the far bank, its end in the water, further up
    ly = 11.0
    c = brook_x(ly)
    a = math.radians(35)  # (turned downstream, its top end lower, in the water)
    ln = 3.4
    mx, my = c + 1.15, ly - 0.35
    fallen.append(cyl("bark", 0.16, ln, (mx, my, -0.3), (0, math.radians(84), -a), r2=0.12, seg=8))
    for k in range(3):
        t = (k - 1) * 0.32 * ln
        fallen.append(ico("moss_bright", 0.16, (mx + math.cos(a) * t, my - math.sin(a) * t, -0.3 + 0.13 + t * 0.1), deg(0, 0, k * 40 - 35), (1.6, 1.0, 0.45)))
    compound("FallenWood", fallen)


# ------------------------------------------------------------------ the stairs, landing and tap
def stairs_and_landing():
    st = []
    tread = (STAIR_X1 - STAIR_X0) / STAIR_STEPS
    for k in range(STAIR_STEPS):
        top = -STAIR_RISE * (k + 1)
        x = STAIR_X0 + tread * (k + 0.5)
        # solid timber steps, set into the bank
        st.append(box("deck", (tread + 0.01, STAIR_HALF * 2, 0.32), (x, STAIR_Y, top - 0.16)))
        st.append(box("weathered", (0.05, STAIR_HALF * 2 + 0.02, 0.06), (x - tread / 2 + 0.025, STAIR_Y, top - 0.02)))
    # the side boards (stringers), sloping down the cut
    run = STAIR_X1 + 0.08 - (STAIR_X0 - 0.08)
    drop = 0.36
    a = math.atan2(drop, run)
    for s in (-1, 1):
        st.append(box("weathered", (math.hypot(run, drop), 0.05, 0.24), ((STAIR_X0 + STAIR_X1) / 2, STAIR_Y + s * (STAIR_HALF + 0.03), -0.2), (0, a, 0)))
    # a handrail down the south side
    ry = STAIR_Y - STAIR_HALF - 0.06
    for x, z in ((STAIR_X0 - 0.05, 0.0), (STAIR_X1 + 0.05, LANDING[4])):
        st.append(box("weathered", (0.07, 0.07, 0.95), (x, ry, z + 0.45)))
    st.append(box("weathered", (math.hypot(STAIR_X1 - STAIR_X0 + 0.1, 0.36) + 0.12, 0.06, 0.05), ((STAIR_X0 + STAIR_X1) / 2, ry, 0.88 - 0.18), (0, a, 0)))
    # the landing: boards on two joists and four posts down into the bank and the bed
    x0, x1, y0, y1, top = LANDING
    n = 6
    w = (x1 - x0) / n
    for k in range(n):
        st.append(box("deck", (w - 0.015, y1 - y0, 0.05), (x0 + w * (k + 0.5), (y0 + y1) / 2, top - 0.025)))
    for y in (y0 + 0.08, y1 - 0.08):
        st.append(box("weathered", (x1 - x0, 0.08, 0.1), ((x0 + x1) / 2, y, top - 0.1)))
    for x in (x0 + 0.06, x1 - 0.06):
        for y in (y0 + 0.08, y1 - 0.08):
            st.append(box("weathered", (0.09, 0.09, 0.6), (x, y, top - 0.35)))
    # a low edge board along the water side
    st.append(box("weathered", (0.06, y1 - y0, 0.08), (x1 - 0.03, (y0 + y1) / 2, top + 0.03)))
    compound("Stairs", st)


def tap():
    """The tap where you get water (A21): a post with the pipe up it, a brass
    valve with a red wheel, the spout over the blue water jug. Its pipe runs
    down the bank into the brook, upstream."""
    px, py = TAP_POST
    sx, sy, sz = TAP_SPOUT
    t = [
        box("weathered", (0.09, 0.09, 0.85), (px, py, 0.425)),
        cyl("pipe", 0.022, sz + 0.02, (px - 0.07, py, (sz + 0.02) / 2), seg=6),
        cyl("pipe", 0.02, px - 0.07 - sx + 0.03, ((px - 0.07 + sx) / 2, py, sz), deg(0, 90, 0), seg=6),
        box("brass", (0.07, 0.06, 0.06), (sx + 0.06, py, sz)),
        cyl("brass", 0.018, 0.07, (sx, py, sz - 0.03), seg=6),
        cyl("bistro_red", 0.045, 0.02, (sx + 0.06, py, sz + 0.06), seg=10),
        cyl("pipe", 0.008, 0.05, (sx + 0.06, py, sz + 0.035), seg=4),
        # the jug on a flat stone under the spout
        ico("stone", 0.17, (sx, sy, 0.0), scale=(1.3, 1.1, 0.25)),
        box("water_jug", (0.2, 0.15, 0.27), (sx, sy, 0.17)),
        cyl("trim", 0.035, 0.04, (sx + 0.04, sy, 0.32), seg=8),
        box("water_jug", (0.03, 0.12, 0.03), (sx - 0.06, sy, 0.31)),
    ]
    collection("Props")
    compound("BrookTap", t)
    collection("Set")
    # the pipe down the bank and into the water, upstream
    pts = []
    for k in range(9):
        f = k / 8
        x = px + (brook_x(py + 1.2) - 0.6 - px) * f
        y = py + 1.2 * f
        pts.append((x, y, max(height(x, y), WATER_Y - 0.12) + 0.03))
    pipe = []
    for (ax, ay, az), (bx, by, bz) in zip(pts[:-1], pts[1:]):
        ln = math.dist((ax, ay, az), (bx, by, bz))
        yaw = math.atan2(by - ay, bx - ax)
        pitch = math.atan2(bz - az, math.hypot(bx - ax, by - ay))
        pipe.append(cyl("pipe", 0.02, ln + 0.02, ((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), (0, math.pi / 2 - pitch, yaw), seg=5))
    compound("TapPipe", pipe)


def rod_prop():
    """A rod leaning on the handrail at the foot of the stairs, for casting at
    the hole (`BrookRod`, in Props so it glows; the website hides it while the
    guest has it, like the axe in the chopping block)."""
    base = (25.42, -0.3, LANDING[4])
    lean_to = (25.16, -0.37, 0.56)
    dx, dy, dz = (lean_to[i] - base[i] for i in range(3))
    ln = math.sqrt(dx * dx + dy * dy + dz * dz)
    ux, uy, uz = dx / ln, dy / ln, dz / ln
    length = 1.35
    pitch = math.acos(uz)
    yaw = math.atan2(uy, ux)
    rot = (0.0, pitch, yaw)

    def at(t):
        return (base[0] + ux * t, base[1] + uy * t, base[2] + uz * t)

    parts = [
        cyl("pipe", 0.013, length - 0.25, at(0.25 + (length - 0.25) / 2), rot, r2=0.007, seg=6),
        cyl("wicker", 0.024, 0.26, at(0.13), rot, seg=7),
        cyl("steel", 0.04, 0.03, at(0.3), (math.pi / 2, 0, yaw), seg=10),
    ]
    collection("Props")
    compound("BrookRod", parts)
    collection("Set")


def build(ground_material, y_from, y_to):
    rng = random.Random(61)  # (its own, so the rest of the scene stays where it was)
    channel(ground_material)
    water(y_from, y_to)
    stones_and_rocks(rng)
    bank_details(rng)
    brush(rng)
    stairs_and_landing()
    rod_prop()
    tap()
