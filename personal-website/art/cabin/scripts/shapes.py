"""Shapes for the characters (A105): smooth, continuous surfaces lofted
through cross-sections, painted by region before smoothing, plus small
parts (ellipsoids, rings, discs) placed on them. Used by rusty_model.py and
eduard_model.py. Units are metres; Blender is Z-up and characters face -Y.
"""

import math

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector
from mathutils.bvhtree import BVHTree  # noqa: F401  (re-exported for the models)

from lib import SMOOTH_ANGLE, _link, mat



def ring(center, tangent, w, h, n, up, keel=0.0, square=2.0, jowl=0.0, bulge=0.0):
    """Points round one cross-section. `w` is the half-width (across), `h` the
    half-height (along `up`); `square` > 2 makes it boxier; `keel` narrows the
    bottom (a dog's chest); `jowl` lets the lower sides hang (the lips);
    `bulge` pushes the upper sides out (cheeks)."""
    t = tangent.normalized()
    side = t.cross(up)
    if side.length < 1e-6:
        side = Vector((1, 0, 0))
    side.normalize()
    upv = side.cross(t).normalized()
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        c, s = math.cos(a), math.sin(a)
        cx = math.copysign(abs(c) ** (2 / square), c)
        sz = math.copysign(abs(s) ** (2 / square), s)
        x = w * cx * (1 - keel * max(0.0, -s)) * (1 + bulge * max(0.0, s) * abs(c))
        z = h * sz - jowl * abs(c) ** 1.5 * max(0.0, -s)
        pts.append(center + side * x + upv * z)
    return pts


def loft(sections, n=16, up=Vector((0, 0, 1))):
    """A closed tube through a list of cross-sections:
    (center, w, h, options) with options passed to `ring`."""
    bm = bmesh.new()
    centers = [Vector(s[0]) for s in sections]
    rings = []
    for i, (c, w, h, opt) in enumerate(sections):
        a = centers[max(0, i - 1)]
        b = centers[min(len(centers) - 1, i + 1)]
        tangent = b - a
        rings.append([bm.verts.new(p) for p in ring(Vector(c), tangent, w, h, n, opt.get("up", up), **{k: v for k, v in opt.items() if k != "up"})])
    for i in range(len(rings) - 1):
        r0, r1 = rings[i], rings[i + 1]
        for k in range(n):
            bm.faces.new((r0[k], r0[(k + 1) % n], r1[(k + 1) % n], r1[k]))
    # round ends: a fan to a point just beyond each end ring
    for r, c, d in ((rings[0], centers[0], centers[0] - centers[1]), (rings[-1], centers[-1], centers[-1] - centers[-2])):
        tip = bm.verts.new(c + d.normalized() * 0.002)
        for k in range(n):
            bm.faces.new((r[k], r[(k + 1) % n], tip))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def painted(bm, colour, levels=2):
    """Paint the coarse shape (so colour edges run along its clean lines,
    not in stair steps), then smooth it. Returns (bmesh, colour names)."""
    bm.normal_update()
    names = []
    for f in bm.faces:
        name = colour(f.calc_center_median(), f.normal)
        if name not in names:
            names.append(name)
        f.material_index = names.index(name)
    return smoothed(bm, levels, len(names)), names


def smoothed(bm, levels=2, slots=0):
    """Catmull-Clark smooth a bmesh (through a throwaway object), as a new bmesh."""
    me = bpy.data.meshes.new("_loft")
    bm.to_mesh(me)
    bm.free()
    for k in range(slots):  # (so the faces keep their colour through the modifier)
        me.materials.append(bpy.data.materials.get("_slot") or bpy.data.materials.new("_slot"))
    ob = bpy.data.objects.new("_loft", me)
    bpy.context.scene.collection.objects.link(ob)
    mod = ob.modifiers.new("smooth", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    dg = bpy.context.evaluated_depsgraph_get()
    out = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(me)
    res = bmesh.new()
    res.from_mesh(out)
    bpy.data.meshes.remove(out)
    bmesh.ops.recalc_face_normals(res, faces=res.faces)
    return res


def ellipsoid(r, center, scale=(1, 1, 1), rot=(0, 0, 0), seg=12, rings=8):
    bm = bmesh.new()
    m = Matrix.Translation(Vector(center)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scale, 1))
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r, matrix=m)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def cube(size, center, rot=(0, 0, 0)):
    bm = bmesh.new()
    m = Matrix.Translation(Vector(center)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*size, 1))
    bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    return bm


def torus(R, r, center, rot=(0, 0, 0), scale_r=(1, 1), squash=1.0, seg=24, seg_r=6):
    """A ring: major radius R (scaled per axis by `scale_r`), tube radius r,
    the tube squashed along the ring's axis by `squash` (a flat strap > 1)."""
    bm = bmesh.new()
    m = Matrix.Translation(Vector(center)) @ Euler(rot).to_matrix().to_4x4()
    grid = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(seg_r):
            b = 2 * math.pi * j / seg_r
            rr = R + r * math.cos(b)
            p = Vector((rr * math.cos(a) * scale_r[0], rr * math.sin(a) * scale_r[1], r * squash * math.sin(b)))
            row.append(bm.verts.new(m @ p))
        grid.append(row)
    for i in range(seg):
        for j in range(seg_r):
            a, b = grid[i][j], grid[(i + 1) % seg][j]
            c, d = grid[(i + 1) % seg][(j + 1) % seg_r], grid[i][(j + 1) % seg_r]
            bm.faces.new((a, b, c, d))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def disc(r, thick, center, rot=(0, 0, 0), seg=14):
    bm = bmesh.new()
    m = Matrix.Translation(Vector(center)) @ Euler(rot).to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=thick, matrix=m)
    return bm


class Joint:
    """One moving part: pieces of geometry, each painted by a colour (a
    palette name, or a function of the face's centre and normal), joined
    into one mesh with its pivot at the object's origin."""

    def __init__(self):
        self.bm = bmesh.new()
        self.slots = []

    def slot(self, name):
        if name not in self.slots:
            self.slots.append(name)
        return self.slots.index(name)

    def add(self, src, colour=None, mirror_x=False):
        if isinstance(src, tuple):  # already painted: (bmesh, names)
            src, colour = src
        if mirror_x:
            for v in src.verts:
                v.co.x = -v.co.x
            bmesh.ops.reverse_faces(src, faces=src.faces)
            bmesh.ops.recalc_face_normals(src, faces=src.faces)
        src.normal_update()
        vmap = {v: self.bm.verts.new(v.co) for v in src.verts}
        for f in src.faces:
            if isinstance(colour, list):
                name = colour[f.material_index]
            elif callable(colour):
                name = colour(f.calc_center_median(), f.normal)
            else:
                name = colour
            try:
                nf = self.bm.faces.new([vmap[v] for v in f.verts])
            except ValueError:
                continue
            nf.material_index = self.slot(name)
        src.free()

    def build(self, name, location, parent=None, rot=(0, 0, 0)):
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        for poly in me.polygons:
            poly.use_smooth = True
        me.set_sharp_from_angle(angle=math.radians(SMOOTH_ANGLE))
        for s in self.slots:
            me.materials.append(mat(s))
        ob = bpy.data.objects.new(name, me)
        _link(ob)
        if parent:
            ob.parent = parent
        ob.location = location
        ob.rotation_euler = rot
        return ob


def opts(**kw):
    return kw




def on_surface(tree, origin, direction):
    """Where a ray from inside a shape comes out through its surface."""
    d = Vector(direction).normalized()
    hit, normal, _, _ = tree.ray_cast(Vector(origin), d)
    return (hit if hit is not None else Vector(origin) + d * 0.1), d
