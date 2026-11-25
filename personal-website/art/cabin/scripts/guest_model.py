"""The two guest characters, remodelled (A111).

The old guests were the first `person()` build: a ball for a head with dot
eyes, pink blush spots and a bead nose, ball hands, a round lump of a body
and a box for a backpack. Next to the rebuilt Eduard (A107) they looked like
they came from a different game. These are built the same way he is (one
smoothed surface per part, shapes.py), on his head and hands:

  - a face with brown eyes and catchlights, soft brows, a nose, a small
    smile and ears; no blush;
  - a knit beanie with a folded cuff and a pompom; hair under it;
  - a zipped jacket with a high collar, a darker hem and cuffs, over khaki
    trousers with rolled hems and hiking boots;
  - a proper pack (seen from behind most of the time): a rounded body, a lid,
    a front pocket, a rolled bedroll strapped on top, and shoulder straps
    with a chest strap over the jacket;
  - the free (left) hand open, the right a fist (it holds the axe at the
    chopping block).

No gender (A99): the two differ by hair, beanie and jacket colour only.
Character 1 has short brown hair, a blue beanie and the yellow jacket;
Character 2 has longer auburn hair in a ponytail, a lupine beanie and a
rust-orange jacket.

Same names and pivots as before (<Name>_Torso, _Head, _ArmL/R, _LegL/R,
_ShinL/R), so the website animates both the same way. They face -Y.
"""

from mathutils import Vector
from mathutils.bvhtree import BVHTree

from lib import collection, deg, empty
from shapes import Joint, ellipsoid, loft, on_surface, opts, painted, smoothed, torus
from eduard_model import FRONT, fist, front_ness, head_loft, open_hand, shell

HIP, SHOULDER, NECK = 0.4, 0.74, 0.76
SKIN = "skin_guest"

LOOKS = {
    "Hiker": dict(hat="beanie", hair="hair_brown", long_hair=False, jacket="jacket", jacket_dark="jacket_dark"),
    "Hiker2": dict(hat="lupine", hair="hair_auburn", long_hair=True, jacket="jacket_2", jacket_dark="jacket_2_dark"),
}


# ------------------------------------------------------------------ head


def beanie_line(f):
    """Where the beanie's cuff ends: over the brows at the front, just over
    the tops of the ears at the sides, lower at the back."""
    return 0.292 + 0.056 * f


def smooth_step(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def short_hair_keep(c):
    # short: showing under the beanie at the back and over the ears, tucked
    # under it at the front
    f = front_ness(c)
    return c.z > 0.16 + 0.2 * smooth_step(-0.3, 0.55, f)


def long_hair_keep(c):
    # longer: down round the back and sides to the jaw, over the ears,
    # framing the face; a short fringe across the forehead under the beanie
    f = front_ness(c)
    return c.z > 0.085 + 0.24 * smooth_step(0.4, 0.66, f) - 0.008 * (c.x / 0.15) * smooth_step(0.6, 0.8, f)


def build_head(name, look, root):
    j = Joint()
    skull, names = painted(head_loft(), lambda c, n: SKIN)
    tree = BVHTree.FromBMesh(skull)
    j.add((skull, names))
    long_hair = look["long_hair"]
    hair, hat = look["hair"], look["hat"]

    j.add(shell(long_hair_keep if long_hair else short_hair_keep, 0.018, lift=0.03, n=28, step=0.045), hair)
    # the beanie: a knit crown with a little height to it, the folded cuff
    # rolled round the bottom (higher at the front), the pompom sitting on top
    j.add(shell(lambda c: c.z > beanie_line(front_ness(c)) + 0.02, 0.03, lift=0.08, n=28), hat)
    j.add(torus(0.262, 0.021, (0, 0.003, 0.318), rot=deg(-13, 0, 0), scale_r=(1.0, 0.975), squash=1.55, seg=32, seg_r=8), hat)
    j.add(smoothed(ellipsoid(0.062, (0, 0.01, 0.6), (1, 1, 0.9), seg=12, rings=8), 1), "trim")

    if long_hair:
        # the ponytail: tied at the back, hanging down clear of the pack
        tie = Vector((0, 0.258, 0.235))
        j.add(torus(0.032, 0.011, tie, rot=deg(90 - 20, 0, 0), seg=14, seg_r=5), hat)
        tail = loft(
            [
                (tie + Vector((0, 0.004, 0.012)), 0.034, 0.03, opts()),
                (tie + Vector((0, 0.034, -0.02)), 0.046, 0.04, opts()),
                (tie + Vector((0, 0.06, -0.07)), 0.044, 0.038, opts()),
                (tie + Vector((0, 0.07, -0.12)), 0.03, 0.027, opts()),
                (tie + Vector((0, 0.068, -0.15)), 0.01, 0.01, opts()),
            ],
            n=10,
            up=Vector((0, 1, 0)),
        )
        j.add(smoothed(tail, 2), hair)
    else:
        for sx in (-1, 1):
            j.add(ellipsoid(1.0, (sx * 0.246, 0.01, 0.222), (0.03, 0.05, 0.062), seg=12, rings=8), SKIN)
            j.add(ellipsoid(1.0, (sx * 0.262, 0.012, 0.22), (0.012, 0.03, 0.04), seg=10, rings=6), "skin_shade")

    # nose: small and rounded
    p, d = on_surface(tree, (0, -0.1, 0.2), (0, -1, -0.05))
    j.add(ellipsoid(1.0, p + d * 0.005 + Vector((0, 0, 0.002)), (0.026, 0.022, 0.03), deg(-12, 0, 0), seg=14, rings=8), SKIN)
    # eyes: brown, a little tall, with a catchlight
    for sx in (-1, 1):
        p, d = on_surface(tree, (sx * 0.08, -0.1, 0.25), (sx * 0.16, -1, 0.0))
        eye = p - d * 0.012
        j.add(ellipsoid(1.0, eye, (0.028, 0.02, 0.035), seg=14, rings=8), "eye_brown")
        j.add(ellipsoid(0.0085, eye + d * 0.016 + Vector((sx * -0.007, 0, 0.012)), seg=8, rings=4), "eye_shine")
    # brows: soft, in the hair colour, under the beanie's cuff
    for sx in (-1, 1):
        pts = []
        for x, z in ((0.045, 0.298), (0.082, 0.308), (0.118, 0.301)):
            p, d = on_surface(tree, (sx * x, -0.1, z), (sx * x * 1.2, -1, 0.0))
            pts.append(p + d * 0.004)
        brow = loft(
            [
                (pts[0], 0.007, 0.007, opts()),
                (pts[0].lerp(pts[1], 0.5), 0.011, 0.01, opts()),
                (pts[1], 0.012, 0.011, opts()),
                (pts[1].lerp(pts[2], 0.5), 0.01, 0.009, opts()),
                (pts[2], 0.006, 0.006, opts()),
            ],
            n=8,
            up=FRONT,
        )
        j.add(smoothed(brow, 1), hair)
    # a small smile
    arc = []
    for x in (-0.034, -0.017, 0.0, 0.017, 0.034):
        z = 0.11 + 0.011 * (abs(x) / 0.034) ** 2
        p, d = on_surface(tree, (x, -0.1, z), (0, -1, 0.0))
        arc.append(p + d * 0.001)
    widths = (0.003, 0.005, 0.0055, 0.005, 0.003)
    j.add(smoothed(loft([(p, w, w, opts()) for p, w in zip(arc, widths)], n=8, up=FRONT), 1), "mouth")
    return j.build(f"{name}_Head", (0, 0, NECK), root)


# ------------------------------------------------------------------ body

TORSO = [
    # (z, half-width, half-depth): hips to neck, a little fuller than Eduard (a jacket)
    (-0.03, 0.1, 0.08),
    (0.0, 0.168, 0.118),
    (0.04, 0.178, 0.126),
    (0.06, 0.18, 0.128),
    (0.12, 0.188, 0.134),
    (0.2, 0.205, 0.14),
    (0.27, 0.218, 0.14),
    (0.315, 0.21, 0.13),
    (0.345, 0.158, 0.102),
    (0.362, 0.08, 0.074),
    (0.39, 0.066, 0.062),
    (0.415, 0.03, 0.03),
]


def strap(points, w=0.022, t=0.006):
    """A flat strap through (point, normal) pairs, lying on the surface."""
    return smoothed(loft([(p, w, t, opts(up=n)) for p, n in points], n=8), 1)


def build_torso(name, look, root):
    jacket, dark = look["jacket"], look["jacket_dark"]

    def colour(c, n):
        if c.z > 0.375:
            return SKIN
        if c.z < 0.02:
            return "khaki"
        if c.z < 0.058:
            return dark  # the jacket's hem
        return jacket

    j = Joint()
    body, names = painted(loft([((0, 0, z), w, d, opts(up=FRONT)) for z, w, d in TORSO], n=20, up=FRONT), colour)
    tree = BVHTree.FromBMesh(body)
    j.add((body, names))
    # the shoulders: a rounded cap under each sleeve, so the arms stay joined
    # to the jacket however far they swing
    for sx in (-1, 1):
        j.add(smoothed(ellipsoid(1.0, (sx * 0.222, 0, 0.328), (0.08, 0.08, 0.074), seg=12, rings=8), 1), jacket)
    # the high collar, and the zip up the front with its pull
    j.add(torus(0.083, 0.024, (0, 0.004, 0.372), squash=1.5, scale_r=(1.0, 0.93), seg=20, seg_r=8), jacket)
    zip_pts = []
    for z in (0.03, 0.1, 0.18, 0.26, 0.32, 0.36):
        p, d = on_surface(tree, (0, 0, z), (0, -1, 0))
        zip_pts.append((p + d * 0.002, d))
    j.add(strap(zip_pts, w=0.0045, t=0.004), "strap")
    p, d = on_surface(tree, (0, 0, 0.3), (0, -1, 0))
    j.add(ellipsoid(1.0, p + d * 0.01, (0.009, 0.005, 0.017), seg=8, rings=4), "steel")

    # the shoulder straps: from the pack, over the shoulder, down the chest
    for sx in (-1, 1):
        pts = []
        for origin, direction in (
            ((sx * 0.105, 0, 0.26), (0, 1, 0.25)),
            ((sx * 0.105, 0, 0.25), (0, 0.6, 1)),
            ((sx * 0.105, 0, 0.25), (0, -0.25, 1)),
            ((sx * 0.105, 0, 0.3), (0, -1, 0.45)),
            ((sx * 0.1, 0, 0.24), (0, -1, 0.1)),
            ((sx * 0.095, 0, 0.16), (0, -1, 0)),
            ((sx * 0.1, 0, 0.09), (sx * 0.4, -1, 0)),
        ):
            p, d = on_surface(tree, origin, direction)
            pts.append((p + d * 0.013, d))
        j.add(strap(pts, t=0.007), "strap")
    # the chest strap and its buckle
    pts = []
    for x in (-0.1, -0.05, 0.0, 0.05, 0.1):
        p, d = on_surface(tree, (x, 0, 0.235), (x * 2, -1, 0))
        pts.append((p + d * 0.014, d))
    j.add(strap(pts, w=0.009, t=0.005), "strap")
    p, d = on_surface(tree, (0, 0, 0.235), (0, -1, 0))
    j.add(ellipsoid(1.0, p + d * 0.02, (0.02, 0.007, 0.014), seg=8, rings=4), "strap")

    # the pack: a rounded body, a lid, a front pocket, the bedroll on top
    PACK_Y = 0.255
    j.add(
        smoothed(
            loft(
                [
                    ((0, PACK_Y, z), w, d, opts(up=FRONT, square=3.0))
                    for z, w, d in ((0.0, 0.1, 0.05), (0.03, 0.15, 0.09), (0.12, 0.165, 0.1), (0.26, 0.17, 0.1), (0.37, 0.16, 0.094), (0.415, 0.12, 0.075), (0.43, 0.05, 0.03))
                ],
                n=16,
                up=FRONT,
            ),
            2,
        ),
        "pack",
    )
    j.add(smoothed(ellipsoid(1.0, (0, PACK_Y + 0.008, 0.412), (0.168, 0.112, 0.042), seg=14, rings=8), 1), "pack_dark")
    j.add(
        smoothed(
            loft(
                [((0, PACK_Y + 0.098, z), w, d, opts(up=Vector((0, 1, 0)), square=3.0)) for z, w, d in ((0.04, 0.06, 0.012), (0.07, 0.11, 0.03), (0.2, 0.11, 0.03), (0.23, 0.06, 0.012))],
                n=12,
                up=Vector((0, 1, 0)),
            ),
            2,
        ),
        "pack_dark",
    )
    bedroll = loft([((x, PACK_Y, 0.475), r, r, opts(up=Vector((0, 0, 1)))) for x, r in ((-0.2, 0.04), (-0.19, 0.054), (0.19, 0.054), (0.2, 0.04))], n=14)
    j.add(smoothed(bedroll, 1), "bedroll")
    for x in (-0.11, 0.11):
        j.add(torus(0.058, 0.008, (x, PACK_Y, 0.475), rot=deg(0, 90, 0), squash=1.6, seg=16, seg_r=5), "strap")
    return j.build(f"{name}_Torso", (0, 0, HIP), root)


def build_arm(name, look, root, side, sx):
    jacket, dark = look["jacket"], look["jacket_dark"]
    S = [
        (0.045, 0.03),
        (0.02, 0.08),  # the shoulder
        (-0.05, 0.077),
        (-0.12, 0.07),
        (-0.2, 0.064),
        (-0.235, 0.061),
        (-0.245, 0.066),  # the cuff
        (-0.262, 0.062),
        (-0.27, 0.042),
    ]
    j = Joint()
    j.add(painted(loft([((0, 0, z), r, r, opts(up=FRONT)) for z, r in S], n=14, up=FRONT), lambda c, n: dark if c.z < -0.238 else jacket))
    if side == "L":
        open_hand(j, sx, SKIN)
        return j.build(f"{name}_Arm{side}", (sx * 0.26, 0, SHOULDER), root)
    # The right hand comes twice, as its own objects: open (petting Rusty,
    # carrying a box), and a fist round the axe's handle. The website shows
    # the fist only while the axe is held.
    arm = j.build(f"{name}_Arm{side}", (sx * 0.26, 0, SHOULDER), root)
    hand = Joint()
    open_hand(hand, sx, SKIN)
    hand.build(f"{name}_HandR", (0, 0, 0), arm)
    grip = Joint()
    fist(grip, sx, SKIN)
    ob = grip.build(f"{name}_FistR", (0, 0, 0), arm)
    ob.hide_render = True
    ob.hide_viewport = True
    return arm


def build_leg(name, root, side, sx):
    thigh = Joint()
    thigh.add(
        smoothed(
            loft(
                [((0, 0, z), r, r * 1.03, opts(up=FRONT)) for z, r in ((0.05, 0.04), (0.025, 0.09), (-0.08, 0.087), (-0.17, 0.08), (-0.215, 0.077))],
                n=14,
                up=FRONT,
            ),
            2,
        ),
        "khaki",
    )
    leg = thigh.build(f"{name}_Leg{side}", (sx * 0.1, 0, HIP), root)
    shin = Joint()
    shin.add(
        smoothed(loft([((0, 0, z), r, r * 1.03, opts(up=FRONT)) for z, r in ((0.03, 0.075), (-0.05, 0.074), (-0.085, 0.075))], n=14, up=FRONT), 2),
        "khaki",
    )
    shin.add(torus(0.074, 0.012, (0, 0, -0.08), squash=1.2, seg=18, seg_r=6), "khaki")  # rolled hems
    # hiking boots: a padded collar, the laced front, a rounded toe, a thick sole
    shin.add(torus(0.064, 0.012, (0, 0.0, -0.096), seg=16, seg_r=5), "boot")
    shin.add(smoothed(ellipsoid(1.0, (0, -0.005, -0.116), (0.07, 0.075, 0.042), seg=12, rings=8), 1), "boot")
    shin.add(smoothed(ellipsoid(1.0, (0, -0.062, -0.144), (0.068, 0.097, 0.034), seg=14, rings=8), 1), "boot")
    shin.add(ellipsoid(1.0, (0, -0.04, -0.118), (0.022, 0.05, 0.022), deg(-30, 0, 0), seg=8, rings=5), "trim")  # the laces
    shin.add(ellipsoid(1.0, (0, -0.052, -0.176), (0.074, 0.122, 0.015), seg=14, rings=6), "sole")
    shin.build(f"{name}_Shin{side}", (0, 0, -0.2), leg)


def build(name):
    """Build one guest ("Hiker" or "Hiker2"). Returns (root, right arm)."""
    look = LOOKS[name]
    collection(name)
    root = empty(name)
    build_torso(name, look, root)
    arms = {}
    for side, sx in (("L", 1), ("R", -1)):
        build_leg(name, root, side, sx)
        arms[side] = build_arm(name, look, root, side, sx)
    build_head(name, look, root)
    return root, arms["R"]

