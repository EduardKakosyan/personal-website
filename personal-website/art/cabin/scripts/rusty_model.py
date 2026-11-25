"""Rusty, modelled properly (A105).

Eduard on the old one ("What is this?"): it was balls and tubes glued
together, so the body read as lumps and the face as a box. Here each part
that moves is one continuous, smoothed surface, lofted through
cross-sections shaped after photo 05: a deep chest and a tucked waist, a
thick neck, a broad skull with a clear stop, a boxy muzzle with the lips
hanging at the sides, his mouth open with the tongue out, big soft ears, a
thick otter tail. The colours are painted on by region: the greying face,
the cream chest, belly and toes, the caramel ears, the liver nose.

The pivots, names and empties are the same as before, so every animation on
the website (trot, fetch, sit, lie, roll over, the name tag) carries over:
  Rusty_Body (0, 0, 0.42), Rusty_Leg{FL,FR,BL,BR} (±0.1, ∓0.24, 0.31),
  Rusty_Head (0, -0.36, 0.58) with Rusty_Mouth, Rusty_Tail (0, 0.33, 0.5)
  turned -45° about X, and Rusty_Tag where his tags hang.
He faces -Y (Blender), like every character.
"""

import bmesh
from mathutils import Euler, Matrix, Vector
from mathutils.bvhtree import BVHTree

from lib import deg, empty
from shapes import Joint, cube, disc, ellipsoid, loft, on_surface, opts, painted, torus

BODY = Vector((0, 0, 0.42))
HEAD = Vector((0, -0.36, 0.58))
TAIL = Vector((0, 0.33, 0.5))
LEGS = {"FL": (0.1, -0.24), "FR": (-0.1, -0.24), "BL": (0.1, 0.24), "BR": (-0.1, 0.24)}
LEG_TOP = 0.31
LID_TILT = 0.3  # the eyelids drop a little at the outer corners: soft and kind, like photo 05


# ------------------------------------------------------------------ the body


def body_colour(c, n):
    # the belly and under the chest, the front of the chest and the throat: cream
    if n.z < -0.55:
        return "rusty_light"
    if c.y < -0.25 and n.z < 0.35 and n.y < -0.2:
        return "rusty_light"
    # a slightly deeper gold along the top of his back
    if n.z > 0.85 and -0.2 < c.y < 0.33:
        return "rusty_saddle"
    return "rusty"


def build_body(root):
    S = [
        # (y, z, half-width, half-height, options): from the rump to the neck
        (0.405, 0.03, 0.035, 0.035, opts()),
        (0.385, 0.035, 0.1, 0.11, opts(keel=0.1)),
        (0.335, 0.035, 0.145, 0.155, opts(keel=0.15, square=2.1)),
        (0.255, 0.032, 0.158, 0.168, opts(keel=0.2, square=2.2)),  # rump and hips
        (0.165, 0.037, 0.15, 0.158, opts(keel=0.25, square=2.2)),
        (0.075, 0.047, 0.141, 0.146, opts(keel=0.3, square=2.2)),  # the waist, tucked up
        (-0.025, 0.037, 0.153, 0.174, opts(keel=0.32, square=2.2)),  # ribs
        (-0.115, 0.027, 0.164, 0.197, opts(keel=0.34, square=2.2)),  # the deep chest
        (-0.205, 0.032, 0.16, 0.198, opts(keel=0.3, square=2.2)),
        (-0.275, 0.05, 0.142, 0.18, opts(keel=0.25, square=2.1)),  # the front of the chest
        (-0.325, 0.097, 0.132, 0.156, opts(keel=0.15)),  # a thick neck, rising
        (-0.36, 0.155, 0.124, 0.136, opts(keel=0.05)),
        (-0.383, 0.215, 0.112, 0.118, opts()),
        (-0.396, 0.258, 0.06, 0.06, opts()),  # (inside his head)
    ]
    j = Joint()
    j.add(painted(loft([((0, y, z), w, h, o) for y, z, w, h, o in S], n=18), body_colour))
    # The collar sits on his neck (on the body, so it stays put when he nods):
    # orange webbing, a black clip on his right, a steel D-ring at the throat
    # with the round silver tag and the red bone with his name (photo 05).
    tilt = deg(30, 0, 0)
    centre = Vector((0, -0.345, 0.128))
    j.add(torus(0.13, 0.012, centre, tilt, scale_r=(1.0, 1.08), squash=1.6, seg=28, seg_r=6), "collar")
    j.add(cube((0.05, 0.03, 0.05), (-0.116, -0.392, 0.135), deg(30, 0, -35)), "hair")
    throat = centre + Euler(tilt).to_matrix() @ Vector((0, -0.142, 0))
    j.add(torus(0.016, 0.004, throat + Vector((0, -0.006, -0.018)), deg(0, 90, 0), seg=12, seg_r=4), "steel")
    j.add(disc(0.026, 0.008, throat + Vector((-0.012, -0.012, -0.055)), deg(90, 0, 8)), "steel")
    # the red bone: a bar with two knobs at each end
    bone = throat + Vector((0.026, -0.018, -0.05))
    j.add(cube((0.042, 0.007, 0.018), bone), "tee_red")
    for dx in (-0.021, 0.021):
        for dz in (-0.009, 0.009):
            j.add(ellipsoid(0.011, bone + Vector((dx, 0, dz)), (1, 0.32, 1), seg=8, rings=5), "tee_red")
    ob = j.build("Rusty_Body", BODY, root)
    return ob, bone + BODY


# ------------------------------------------------------------------ legs


def paw(j, front, inner):
    """The paw: a rounded foot with four toes in front, pale like his toes in
    the photo, dark pads underneath (they show when he rolls over), and on
    the front legs a dewclaw on the inside."""
    y0 = -0.035 if front else -0.012
    j.add(ellipsoid(1.0, (0, y0, -0.286), (0.047, 0.06, 0.027), seg=14, rings=8), "rusty_light")
    for k, x in enumerate((-0.027, -0.009, 0.009, 0.027)):
        dy = 0.008 if k in (0, 3) else 0.0
        j.add(ellipsoid(0.0175, (x, y0 - 0.05 + dy, -0.291), (1, 1.25, 0.8), seg=10, rings=6), "rusty_toes")
        j.add(ellipsoid(0.0075, (x, y0 - 0.052 + dy, -0.309), (1, 1.15, 0.32), seg=8, rings=4), "pad")
    j.add(ellipsoid(0.019, (0, y0 + 0.006, -0.309), (1.2, 0.95, 0.28), seg=10, rings=4), "pad")
    if front:
        j.add(ellipsoid(0.008, (inner * 0.036, 0.004, -0.225), (1, 1, 1.4), seg=8, rings=4), "rusty_light")


def build_leg(root, name):
    x, y = LEGS[name]
    front = name.startswith("F")
    inner = -1 if x > 0 else 1  # towards his middle
    fwd = Vector((0, -1, 0))  # (each cross-section's "height" runs front to back)
    if front:
        S = [
            (0.1, 0.0, 0.03, 0.03),
            (0.07, 0.0, 0.062, 0.076),  # shoulder and upper arm
            (0.0, 0.006, 0.058, 0.07),
            (-0.07, 0.012, 0.05, 0.06),  # the elbow
            (-0.13, 0.002, 0.042, 0.047),  # forearm
            (-0.2, -0.002, 0.038, 0.041),
            (-0.245, -0.006, 0.034, 0.036),  # wrist
            (-0.27, -0.016, 0.036, 0.04),  # pastern, sloping forward
            (-0.284, -0.026, 0.04, 0.045),
        ]
    else:
        S = [
            (0.11, 0.0, 0.03, 0.03),
            (0.08, 0.0, 0.076, 0.106),  # the thigh
            (0.0, -0.01, 0.071, 0.1),
            (-0.07, -0.026, 0.055, 0.075),  # stifle, forward
            (-0.13, 0.002, 0.043, 0.053),
            (-0.19, 0.036, 0.034, 0.04),  # the point of the hock, back
            (-0.215, 0.04, 0.031, 0.034),
            (-0.255, 0.03, 0.03, 0.033),
            (-0.28, 0.012, 0.035, 0.04),
        ]
    j = Joint()
    # his legs are a shade paler than his back, palest at the feet
    colour = lambda c, n: "rusty_light" if c.z < -0.24 else "rusty"
    j.add(painted(loft([((0, yy, z), w, h, opts(up=fwd)) for z, yy, w, h in S], n=14), colour))
    paw(j, front, inner)
    return j.build(f"Rusty_Leg{name}", (x, y, LEG_TOP), root)


# ------------------------------------------------------------------ the head


def head_colour(c, n):
    # His face is going grey: pale cream over the whole muzzle, a lighter gold
    # round the stop and his eyes, the top and back of his head gold. The
    # edges follow the head's cross-sections, so they run in clean lines.
    if c.y < -0.16:
        return "rusty_face"
    if c.y < -0.095:
        return "rusty_light"
    if n.z < -0.5 and c.y < 0.0:
        return "rusty_light"  # under the chin
    return "rusty"



def build_head(root, body):
    j = Joint()
    S = [
        # (y, z, half-width, half-height, options): the back of the skull to the nose
        (0.122, 0.105, 0.035, 0.035, opts()),
        (0.098, 0.106, 0.092, 0.095, opts()),
        (0.05, 0.11, 0.125, 0.12, opts(keel=0.05, square=2.1)),
        (-0.01, 0.107, 0.138, 0.121, opts(keel=0.1, square=2.2, bulge=0.04)),  # broadest: the cheekbones
        (-0.065, 0.1, 0.132, 0.117, opts(keel=0.15, square=2.2, bulge=0.05)),
        (-0.108, 0.091, 0.118, 0.106, opts(keel=0.15, square=2.3, jowl=0.008)),  # the eyes
        (-0.142, 0.07, 0.103, 0.09, opts(keel=0.1, square=2.6, jowl=0.018)),  # the stop
        (-0.178, 0.054, 0.097, 0.084, opts(keel=0.04, square=3.0, jowl=0.03)),  # a broad, deep, boxy muzzle
        (-0.232, 0.049, 0.094, 0.08, opts(square=3.2, jowl=0.037)),  # the lips hang at the sides
        (-0.276, 0.05, 0.088, 0.075, opts(square=3.2, jowl=0.035)),
        (-0.305, 0.055, 0.074, 0.065, opts(square=3.0, jowl=0.023)),
        (-0.322, 0.06, 0.05, 0.046, opts(square=2.5)),
        (-0.329, 0.062, 0.022, 0.022, opts()),
    ]
    skull = painted(loft([((0, y, z), w, h, o) for y, z, w, h, o in S], n=20), head_colour)
    tree = BVHTree.FromBMesh(skull[0])
    j.add(skull)

    # His mouth is open in a smile: the lower jaw dropped, dark inside, tongue out.
    hinge = Vector((0, -0.07, -0.02))
    open_ = Matrix.Translation(hinge) @ Euler(deg(-13, 0, 0)).to_matrix().to_4x4() @ Matrix.Translation(-hinge)
    jaw, names = painted(
        loft(
            [
                ((0, -0.06, -0.03), 0.05, 0.03, opts()),
                ((0, -0.12, -0.038), 0.07, 0.038, opts(square=2.4)),
                ((0, -0.19, -0.042), 0.07, 0.035, opts(square=2.6)),
                ((0, -0.245, -0.042), 0.06, 0.03, opts(square=2.6)),
                ((0, -0.275, -0.04), 0.044, 0.024, opts()),
                ((0, -0.287, -0.038), 0.02, 0.012, opts()),
            ],
            n=14,
        ),
        lambda c, n: "mouth" if n.z > 0.7 and c.y < -0.09 else "rusty_face",
    )
    bmesh.ops.transform(jaw, matrix=open_, verts=jaw.verts)
    j.add((jaw, names))
    j.add(ellipsoid(1.0, (0, -0.19, -0.03), (0.064, 0.095, 0.026), seg=12, rings=6), "mouth")
    j.add(
        painted(
            loft(
                [
                    ((0, -0.16, -0.038), 0.03, 0.01, opts()),
                    ((0, -0.23, -0.044), 0.037, 0.011, opts()),
                    ((0, -0.285, -0.054), 0.036, 0.01, opts()),
                    ((0, -0.306, -0.07), 0.032, 0.009, opts()),
                    ((0, -0.31, -0.086), 0.024, 0.008, opts()),
                    ((0, -0.308, -0.094), 0.012, 0.005, opts()),
                ],
                n=10,
            ),
            lambda c, n: "tongue",
            1,
        )
    )
    for x in (-0.045, 0.045):  # his bottom canines, just showing
        j.add(ellipsoid(0.0065, (x, -0.255, -0.034), (1, 1, 1.6), seg=6, rings=4), "trim")

    # the nose: broad and liver-brown, the nostrils set into it
    # the nose: broad and liver-brown at the end of the muzzle, nostrils set in
    tip, d = on_surface(tree, (0, -0.25, 0.075), (0, -1, 0.42))
    nose = tip + d * 0.01
    j.add(ellipsoid(1.0, nose, (0.043, 0.029, 0.031), seg=16, rings=8), "rusty_nose")
    for x in (-0.017, 0.017):
        j.add(ellipsoid(0.0085, nose + Vector((x, -0.026, -0.006)), (1.25, 0.35, 0.75), (0, 0, x * 12), seg=8, rings=4), "mouth")
    # whisker spots along the sides of the muzzle
    for side in (-1, 1):
        for yy, zz in ((-0.225, 0.075), (-0.25, 0.072), (-0.237, 0.058), (-0.262, 0.06)):
            p, d = on_surface(tree, (0, yy, zz), (side, -0.15, 0.05))
            j.add(ellipsoid(0.0034, p - d * 0.001, seg=6, rings=4), "rusty_saddle")

    # Eyes: set into the front of his skull either side of the stop, looking
    # forward and a little out; dark brown with a catchlight, under a soft lid.
    for side in (-1, 1):
        p, d = on_surface(tree, (side * 0.035, -0.06, 0.13), (side * 0.45, -1, 0.08))
        eye = p - d * 0.011
        turn = (0, 0, side * -0.55)
        j.add(ellipsoid(0.024, eye, (1, 0.8, 0.92), turn, seg=14, rings=8), "rusty_eye")
        j.add(ellipsoid(0.0068, eye + d * 0.019 + Vector((0, 0, 0.008)) - Vector((side * 0.004, 0, 0)), seg=8, rings=4), "eye_shine")
        # (the lid tilts down at the outer corner: his soft, kind look, not a frown)
        lid_turn = (0, side * LID_TILT, side * -0.55)
        j.add(ellipsoid(0.027, eye + Vector((0, 0.004, 0.025)), (1.08, 0.78, 0.3), lid_turn, seg=14, rings=6), "rusty_light")

    # Big soft ears, set at the sides of his skull behind his eyes, folding
    # over at the top and hanging close down his cheeks.
    for side in (-1, 1):
        sideways = Vector((1, 0, 0))
        ear = painted(
            loft(
                [
                    ((0.098, -0.005, 0.17), 0.03, 0.02, opts(up=sideways)),
                    ((0.13, -0.012, 0.176), 0.062, 0.022, opts(up=sideways)),  # the fold
                    ((0.149, -0.03, 0.135), 0.078, 0.02, opts(up=sideways)),
                    ((0.155, -0.046, 0.07), 0.074, 0.018, opts(up=sideways)),
                    ((0.152, -0.058, 0.01), 0.058, 0.016, opts(up=sideways)),
                    ((0.145, -0.064, -0.028), 0.03, 0.012, opts(up=sideways)),
                    ((0.141, -0.065, -0.04), 0.012, 0.008, opts(up=sideways)),
                ],
                n=12,
            ),
            lambda c, n: "rusty_dark",
        )
        j.add(ear, None, mirror_x=side < 0)

    head = j.build("Rusty_Head", HEAD, root)
    # where the plush cow sits when he carries it: in his open mouth
    empty("Rusty_Mouth", location=(0, -0.31, -0.04), parent=head)
    return head


# ------------------------------------------------------------------ the tail


def build_tail(root):
    # The tail's pivot is turned -45° about X (the website wags it about its
    # own up axis), so this shape leans back to carry it about level, the way
    # a Lab does, with the tip lifting a little.
    back = Vector((0, -1, 0))
    S = [
        (-0.03, -0.014, 0.03),
        (0.0, 0.0, 0.058),
        (0.07, 0.033, 0.054),  # thick at the root: an otter tail
        (0.15, 0.069, 0.046),
        (0.23, 0.1, 0.036),
        (0.3, 0.124, 0.026),
        (0.352, 0.136, 0.016),
        (0.368, 0.139, 0.006),
    ]
    j = Joint()
    j.add(painted(loft([((0, y, z), r, r, opts(up=back)) for z, y, r in S], n=12), lambda c, n: "rusty"))
    return j.build("Rusty_Tail", TAIL, root, rot=deg(-45, 0, 0))


def build(root):
    """Rusty's parts under `root` (an empty at his feet)."""
    body, tag_at = build_body(root)
    for name in LEGS:
        build_leg(root, name)
    build_head(root, body)
    build_tail(root)
    # where his tags hang (the website hangs the name-tag close-up here)
    empty("Rusty_Tag", location=tuple(tag_at - BODY), parent=body)
    return root
