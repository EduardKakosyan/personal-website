"""Eduard, remodelled (A107).

Eduard on the old one: "my model looks like a fucking moron, my hand is all
fucked up". It was a ball for a head with box eyebrows, a box moustache over
a red box for a lip (which read as a gaping mouth), and plain balls for
hands. Here every part is one smoothed surface (shapes.py), like Rusty:

  - a head with a jaw and a rounded crown; short black hair with a real
    hairline; the short beard joined to the moustache (A56) as a shell that
    follows his jaw, with his lips left clear; a gentle smile; brown eyes
    with catchlights under soft, arched brows; a proper nose and ears;
  - a red T-shirt with sleeves and a collar over jeans with a belt (A40);
  - hands: the free (left) hand open with a thumb and fingers, turned so
    the palm faces the guest when he waves; the right a fist round the
    hammer's handle;
  - jeans with a hem over work boots with soles.

No photo of Eduard exists in the references (09-eduard.jpg is the cow), so
the face follows the decisions only: black hair, the short beard, brown eyes.

The names and pivots are the same as before (Eduard_Torso, _Head, _ArmL/R,
_LegL/R, _ShinL/R, _Beard, _Mustache, _Hammer, _Board), so the website's
animations carry over. He faces -Y (Blender).
"""

import math

import bmesh
from mathutils import Euler, Matrix, Vector
from mathutils.bvhtree import BVHTree

from lib import collection, compound, box, deg, empty
from shapes import Joint, ellipsoid, loft, on_surface, opts, painted, smoothed, torus

HIP, SHOULDER, NECK = 0.4, 0.74, 0.76
FRONT = Vector((0, -1, 0))


def front_ness(c):
    """1 at the middle of the face, 0 at the sides, -1 at the back of the head."""
    r = math.hypot(c.x, c.y)
    return -c.y / r if r > 1e-6 else 1.0


# ------------------------------------------------------------------ head


HEAD = [
    # (z, half-width, half-depth, y): chin to crown
    (0.035, 0.055, 0.055, -0.02),
    (0.06, 0.15, 0.15, -0.015),  # the jaw
    (0.11, 0.205, 0.2, -0.008),
    (0.17, 0.235, 0.228, -0.003),
    (0.24, 0.25, 0.24, 0.0),
    (0.31, 0.248, 0.24, 0.004),
    (0.38, 0.226, 0.22, 0.01),
    (0.44, 0.182, 0.176, 0.015),
    (0.485, 0.1, 0.1, 0.02),
    (0.5, 0.03, 0.03, 0.02),
]


def fine(rows, step):
    """The head's cross-sections, with more in between (for the shells,
    whose edges need to follow a hairline or a beard line closely)."""
    out = []
    for a, b in zip(rows, rows[1:]):
        k = max(1, round((b[0] - a[0]) / step))
        for i in range(k):
            t = i / k
            out.append(tuple(a[m] + (b[m] - a[m]) * t for m in range(4)))
    out.append(rows[-1])
    return out


def head_loft(grow=0.0, lift=0.0, n=24, step=None):
    """The head's shape, or a shell just outside it (for the hair and beard)."""
    rows = fine(HEAD, step) if step else HEAD
    return loft(
        [((0, y, z + lift * max(0.0, z - 0.25) / 0.25), w + grow, d + grow, opts(up=FRONT)) for z, w, d, y in rows],
        n=n,
        up=FRONT,
    )


def shell(keep, grow, lift=0.0, n=24, step=None):
    """A shell over part of the head: the faces of a slightly bigger head
    where `keep(centre)` holds, smoothed. (A coarse shell gives a clean,
    rounded edge; a finer one follows a shaped line but its edge gets ragged.)"""
    bm = head_loft(grow, lift, n=n, step=step)
    bm.normal_update()
    gone = [f for f in bm.faces if not keep(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    return smoothed(bm, 2)


def hairline(f):
    """How high the hair starts, by how far round to the front."""
    return 0.28 + 0.09 * f + 0.026 * math.exp(-(((f - 0.72) / 0.12) ** 2))


def hair_keep(c):
    # The hairline: low at the nape, above the ears at the sides, a touch
    # higher at the temples, and a short fringe swept to one side with a few
    # points over his forehead (a straight edge across read as a cap).
    f = front_ness(c)
    line = hairline(f)
    if f > 0.55:
        front = min(1.0, (f - 0.55) / 0.3)
        around = math.atan2(c.x, -c.y)
        sweep = 0.022 * (c.x / 0.22)  # lower on his right, higher on his left
        points = 0.02 * max(0.0, math.cos(around * 7 + 0.6)) ** 2
        line -= front * (0.012 + sweep + points)
    return c.z > line


def beard_keep(c):
    # A56: a short beard along his jaw and chin, joined to the moustache, up
    # the sides to his sideburns; his lips stay clear
    f = front_ness(c)
    if f < -0.15:
        return False
    if f > 0.86 and abs(c.x) < 0.07 and 0.088 < c.z < 0.128:
        return False  # his mouth
    top = 0.172 + 0.135 * (1 - max(0.0, f)) ** 1.5
    if f < 0.42:
        # sideburns: up in front of his ears to meet his hair (bare skin there
        # turned to a grey smudge in the shade)
        top = max(top, hairline(f) + 0.012)
    return c.z < top


def mustache_keep(c):
    f = front_ness(c)
    return f > 0.72 and abs(c.x) < 0.1 and 0.124 < c.z < 0.176


def build_head(root):
    j = Joint()
    skull, names = painted(head_loft(), lambda c, n: "skin")
    tree = BVHTree.FromBMesh(skull)
    j.add((skull, names))
    j.add(shell(hair_keep, 0.016, lift=0.06, n=36, step=0.028), "hair")

    # nose: rounded, a little upturned
    p, d = on_surface(tree, (0, -0.1, 0.2), (0, -1, -0.05))
    j.add(ellipsoid(1.0, p + d * 0.006 + Vector((0, 0, 0.002)), (0.034, 0.03, 0.038), (deg(-12, 0, 0)), seg=14, rings=8), "skin")
    # ears
    for sx in (-1, 1):
        j.add(ellipsoid(1.0, (sx * 0.246, 0.01, 0.228), (0.03, 0.05, 0.066), seg=12, rings=8), "skin")
        j.add(ellipsoid(1.0, (sx * 0.262, 0.012, 0.226), (0.012, 0.03, 0.044), seg=10, rings=6), "skin_shade")
    # eyes: brown, a little tall, with a catchlight
    for sx in (-1, 1):
        p, d = on_surface(tree, (sx * 0.08, -0.1, 0.25), (sx * 0.16, -1, 0.0))
        eye = p - d * 0.012
        j.add(ellipsoid(1.0, eye, (0.029, 0.02, 0.036), seg=14, rings=8), "eye_brown")
        j.add(ellipsoid(0.0085, eye + d * 0.016 + Vector((sx * -0.007, 0, 0.012)), seg=8, rings=4), "eye_shine")
    # brows: thick and black (he has black hair), softly arched, a little raised
    for sx in (-1, 1):
        pts = []
        for x, z in ((0.042, 0.312), (0.082, 0.326), (0.122, 0.318)):
            p, d = on_surface(tree, (sx * x, -0.1, z), (sx * x * 1.2, -1, 0.0))
            pts.append(p + d * 0.004)
        brow = loft([(pts[0], 0.009, 0.009, opts()), (pts[0].lerp(pts[1], 0.5), 0.015, 0.014, opts()), (pts[1], 0.016, 0.015, opts()), (pts[1].lerp(pts[2], 0.5), 0.014, 0.013, opts()), (pts[2], 0.008, 0.008, opts())], n=8, up=FRONT)
        j.add(smoothed(brow, 1), "hair")
    # a gentle smile: one curved line, the corners lifting
    arc = []
    for x in (-0.04, -0.02, 0.0, 0.02, 0.04):
        z = 0.108 + 0.013 * (abs(x) / 0.04) ** 2
        p, d = on_surface(tree, (x, -0.1, z), (0, -1, 0.0))
        arc.append(p + d * 0.001)
    widths = (0.003, 0.0055, 0.006, 0.0055, 0.003)
    j.add(smoothed(loft([(p, w, w, opts()) for p, w in zip(arc, widths)], n=8, up=FRONT), 1), "mouth")

    head = j.build("Eduard_Head", (0, 0, NECK), root)

    beard = Joint()
    beard.add(shell(beard_keep, 0.014), "hair")
    beard.build("Eduard_Beard", (0, 0, 0), head)
    must = Joint()
    must.add(shell(mustache_keep, 0.016), "hair")
    ob = must.build("Eduard_Mustache", (0, 0, 0), head)
    ob.hide_render = True
    ob.hide_viewport = True
    return head


# ------------------------------------------------------------------ body


def torso_colour(c, n):
    if c.z > 0.352:
        return "skin"  # his neck
    if c.z < 0.034:
        return "denim"
    if c.z < 0.058:
        return "belt"
    return "tee_red"


def build_torso(root):
    S = [
        # (z, half-width, half-depth): hips to neck
        (-0.03, 0.1, 0.08),
        (0.0, 0.165, 0.115),
        (0.046, 0.17, 0.118),
        (0.12, 0.18, 0.125),
        (0.2, 0.198, 0.13),
        (0.27, 0.212, 0.13),
        (0.315, 0.203, 0.12),  # the slope of his shoulders
        (0.345, 0.15, 0.095),
        (0.362, 0.078, 0.072),
        (0.39, 0.066, 0.062),
        (0.415, 0.03, 0.03),
    ]
    j = Joint()
    j.add(painted(loft([((0, 0, z), w, d, opts(up=FRONT)) for z, w, d in S], n=20, up=FRONT), torso_colour))
    # the T-shirt's collar, and the belt buckle
    j.add(torus(0.074, 0.009, (0, 0, 0.356), squash=0.8, scale_r=(1.0, 0.92), seg=20), "tee_red")
    j.add(ellipsoid(1.0, (0, -0.121, 0.046), (0.028, 0.008, 0.017), seg=8, rings=4), "steel")
    return j.build("Eduard_Torso", (0, 0, HIP), root)


def open_hand(j, sx):
    """The free hand, open: palm, four fingers and a thumb. It's turned so
    the palm faces back at rest; raised to wave, it faces the guest."""
    turn = Matrix.Rotation(sx * math.radians(-40), 4, "Z")

    def put(bm):
        bmesh.ops.transform(bm, matrix=turn, verts=bm.verts)
        return bm

    palm = loft(
        [
            ((0, 0, -0.262), 0.028, 0.038, opts(up=FRONT)),
            ((0, 0, -0.285), 0.03, 0.048, opts(up=FRONT)),
            ((0, 0, -0.315), 0.028, 0.052, opts(up=FRONT)),
            ((0, 0, -0.338), 0.022, 0.05, opts(up=FRONT)),
            ((0, 0, -0.344), 0.012, 0.03, opts(up=FRONT)),
        ],
        n=12,
        up=FRONT,
    )
    j.add(put(smoothed(palm, 2)), "skin")
    for k, (y, ln) in enumerate(((-0.033, 0.036), (-0.012, 0.044), (0.01, 0.042), (0.031, 0.034))):
        j.add(put(ellipsoid(1.0, (0, y, -0.338 - ln / 2), (0.0125, 0.0115, ln / 2 + 0.006), seg=8, rings=6)), "skin")
    j.add(put(ellipsoid(1.0, (sx * -0.022, -0.04, -0.298), (0.013, 0.014, 0.032), deg(30, sx * 20, 0), seg=8, rings=6)), "skin")


def fist(j, sx):
    """The hammer hand: a fist round the handle (which runs forward)."""
    j.add(smoothed(ellipsoid(1.0, (0, 0.0, -0.31), (0.044, 0.05, 0.05), seg=12, rings=8), 1), "skin")
    # the fingers curled round the handle: knuckles in a row down the outside
    for y in (-0.027, -0.009, 0.009, 0.027):
        j.add(ellipsoid(0.0135, (sx * 0.036, y, -0.334), seg=8, rings=5), "skin")
    # the thumb over the top of the handle
    j.add(ellipsoid(1.0, (sx * -0.028, -0.036, -0.29), (0.013, 0.021, 0.012), seg=8, rings=5), "skin")


def build_arm(root, side, sx):
    S = [
        (0.045, 0.03),
        (0.02, 0.074),  # the shoulder, in the T-shirt
        (-0.05, 0.072),
        (-0.108, 0.07),
        (-0.122, 0.073),  # the sleeve's hem
        (-0.13, 0.061),  # bare arm
        (-0.2, 0.057),
        (-0.248, 0.049),
        (-0.268, 0.045),
    ]
    j = Joint()
    j.add(
        painted(
            loft([((0, 0, z), r, r, opts(up=FRONT)) for z, r in S], n=14, up=FRONT),
            lambda c, n: "tee_red" if c.z > -0.126 else "skin",
        )
    )
    if side == "L":
        open_hand(j, sx)
    else:
        fist(j, sx)
    return j.build(f"Eduard_Arm{side}", (sx * 0.26, 0, SHOULDER), root)


def build_leg(root, side, sx):
    thigh = Joint()
    thigh.add(
        smoothed(
            loft(
                [((0, 0, z), r, r * 1.03, opts(up=FRONT)) for z, r in ((0.05, 0.04), (0.025, 0.088), (-0.08, 0.085), (-0.17, 0.079), (-0.215, 0.076))],
                n=14,
                up=FRONT,
            ),
            2,
        ),
        "denim",
    )
    leg = thigh.build(f"Eduard_Leg{side}", (sx * 0.1, 0, HIP), root)
    shin = Joint()
    shin.add(
        smoothed(
            loft([((0, 0, z), r, r * 1.03, opts(up=FRONT)) for z, r in ((0.03, 0.074), (-0.05, 0.073), (-0.098, 0.074))], n=14, up=FRONT),
            2,
        ),
        "denim",
    )
    shin.add(torus(0.074, 0.008, (0, 0, -0.096), seg=18, seg_r=5), "denim")  # the jeans' hem
    # work boots: an ankle, a rounded toe, a dark sole
    shin.add(smoothed(ellipsoid(1.0, (0, -0.005, -0.112), (0.07, 0.075, 0.04), seg=12, rings=8), 1), "boot")
    shin.add(smoothed(ellipsoid(1.0, (0, -0.06, -0.142), (0.068, 0.095, 0.034), seg=14, rings=8), 1), "boot")
    shin.add(ellipsoid(1.0, (0, -0.05, -0.172), (0.072, 0.118, 0.012), seg=14, rings=6), "sole")
    shin.build(f"Eduard_Shin{side}", (0, 0, -0.2), leg)


def build():
    collection("Eduard")
    root = empty("Eduard")
    build_torso(root)
    for side, sx in (("L", 1), ("R", -1)):
        build_leg(root, side, sx)
        build_arm(root, side, sx)
    head = build_head(root)
    arm_r = __import__("bpy").data.objects["Eduard_ArmR"]
    compound(
        "Eduard_Hammer",
        [box("weathered", (0.034, 0.3, 0.034), (0, -0.14, 0)), box("hammer_head", (0.055, 0.065, 0.15), (0, -0.29, 0.0))],
        location=(0, -0.02, -0.31),
        parent=arm_r,
        bevel=0.008,
    )
    return root, head
