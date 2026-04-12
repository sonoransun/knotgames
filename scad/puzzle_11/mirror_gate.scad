// EXKNOTS - Puzzle 11: Mirror Gate
// FDM 3D Printable Version
//
// Parts: trefoil_left (1) + trefoil_right (1) + base (1)
// Two mirror-image trefoil knot wire frames mounted on a wooden base.
// Print each trefoil flat (XY plane); base flat on bed.
//
// Print settings:
//   Trefoils: PLA, 0.20mm layers, 100% infill, 5 shells, supports needed
//   Base:     PLA wood-fill, 0.20mm layers, 30% infill, 3 shells, no supports
//
// Optimizations applied:
//   - Polyline rod hull-chain for smooth trefoil curves
//   - Layer height: 0.20mm standard for all parts
//   - Shell profile: "structural" for trefoils, "enclosure" for base

include <../common/parameters.scad>
use <../common/rod.scad>
use <../common/base.scad>
use <../common/corners.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>
use <../common/bridges.scad>

// Puzzle-specific parameters
p11_scale = 35;
p11_trefoil_steps = 18;  // Keep low for CGAL hull-chain performance
p11_base_w = 200;
p11_base_d = 80;
p11_base_h = 20;
p11_recess_depth = 2;
p11_recess_r = 45;
p11_mount_offset_x = 55;  // Distance from center to each trefoil center

// Constraint assertions
assert(p11_scale > 0, "Trefoil scale must be positive");
assert(p11_base_w > p11_mount_offset_x * 2 + p11_scale,
       "Base must be wide enough to hold both trefoils");
assert(rod_d >= 4,
       str("Rod diameter (", rod_d, "mm) must be at least 4mm for structural integrity"));

// Part selector: "assembly" | "trefoil_left" | "trefoil_right" | "base"
part = "assembly";

if (part == "trefoil_left") {
    shell_info("trefoil_left", "structural");
    layer_opt_info("trefoil_left", p11_scale * 0.5, "standard");
    p11_trefoil(handedness=1);
} else if (part == "trefoil_right") {
    shell_info("trefoil_right", "structural");
    layer_opt_info("trefoil_right", p11_scale * 0.5, "standard");
    p11_trefoil(handedness=-1);
} else if (part == "base") {
    shell_info("base", "enclosure");
    layer_opt_info("base", p11_base_h, "standard");
    p11_base();
} else {
    p11_assembly();
}

// Generate trefoil knot point at parameter t with given handedness
function p11_trefoil_point(t, h) = [
    (sin(t) + 2 * sin(2 * t)) * p11_scale,
    (cos(t) - 2 * cos(2 * t)) * p11_scale,
    h * -sin(3 * t) * p11_scale * 0.5
];

// Generate full trefoil point array
function p11_trefoil_points(handedness) = [
    for (i = [0:p11_trefoil_steps])
        p11_trefoil_point(360 * i / p11_trefoil_steps, handedness)
];

// Trefoil knot wire frame
// handedness: 1 = left-handed, -1 = right-handed (mirror)
module p11_trefoil(handedness=1) {
    points = p11_trefoil_points(handedness);
    polyline_rod(points, rod_d);
}

// Wooden base with two colored recess areas
module p11_base() {
    difference() {
        // Main base
        rounded_cube([p11_base_w, p11_base_d, p11_base_h], r=2);

        // Left recess (for left trefoil)
        translate([-p11_mount_offset_x, 0, p11_base_h / 2 - p11_recess_depth + 0.5])
            cylinder(r=p11_recess_r, h=p11_recess_depth + 1, $fn=60);

        // Right recess (for right trefoil)
        translate([p11_mount_offset_x, 0, p11_base_h / 2 - p11_recess_depth + 0.5])
            cylinder(r=p11_recess_r, h=p11_recess_depth + 1, $fn=60);
    }
}

// Assembly view (for visualization only)
module p11_assembly() {
    // Base
    color("BurlyWood") p11_base();

    // Left-handed trefoil (silver)
    color("Silver")
    translate([-p11_mount_offset_x, 0, p11_base_h / 2 + rod_d / 2])
        p11_trefoil(handedness=1);

    // Right-handed trefoil (gold)
    color("Gold")
    translate([p11_mount_offset_x, 0, p11_base_h / 2 + rod_d / 2])
        p11_trefoil(handedness=-1);
}
