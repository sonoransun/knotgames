// EXKNOTS - Puzzle 14: Tricolor Lock
// FDM 3D Printable Version
//
// Parts: trefoil_frame (1) + ring (1) + base (1)
// Trefoil wire frame with physically separated crossings, a trapped ring,
// and a flat base.
// Print trefoil with supports, ring flat on side, base flat on bed.
//
// Print settings:
//   Trefoil frame: PLA, 0.20mm layers, 100% infill, 5 shells, supports needed
//   Ring:          PLA gold, 0.12mm layers, 100% infill, 4 shells, brim 3mm
//   Base:          PLA wood-fill, 0.20mm layers, 30% infill, 3 shells, no supports
//
// Optimizations applied:
//   - Crossing over-strands raised 10mm for physical separation
//   - Polyline rod hull-chain for smooth trefoil curves
//   - Layer height: 0.12mm fine for ring, 0.20mm for frame and base
//   - Shell profile: "structural" for frame, "torus" for ring, "enclosure" for base

include <../common/parameters.scad>
use <../common/rod.scad>
use <../common/ring.scad>
use <../common/corners.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>

// Puzzle-specific parameters
p14_scale = 25;
p14_frame_span = 150;     // Approximate span of trefoil frame
p14_crossing_raise = 10;  // Over-strand raised height at crossings
p14_trefoil_steps = 60;
p14_ring_od = 30;
p14_base_w = 140;
p14_base_d = 140;
p14_base_h = 8;

// Constraint assertions
assert(p14_ring_od - ring_wire_d * 2 > rod_d + clearance * 2,
       str("Ring ID (", p14_ring_od - ring_wire_d * 2,
           "mm) must be larger than frame rod diameter (",
           rod_d, "mm) for ring to slide"));
assert(p14_crossing_raise > rod_d,
       "Crossing raise must exceed rod diameter for physical clearance");
assert(p14_base_w >= p14_frame_span * 0.9,
       "Base should be at least as wide as the frame span");

// Part selector: "assembly" | "trefoil_frame" | "ring" | "base"
part = "assembly";

if (part == "trefoil_frame") {
    shell_info("trefoil_frame", "structural");
    layer_opt_info("trefoil_frame", p14_crossing_raise * 2, "standard");
    p14_trefoil_frame();
} else if (part == "ring") {
    shell_info("ring", "torus");
    layer_opt_info("ring", ring_wire_d, "all_fine");
    torus_ring(p14_ring_od, ring_wire_d);
} else if (part == "base") {
    shell_info("base", "enclosure");
    layer_opt_info("base", p14_base_h, "standard");
    p14_base();
} else {
    p14_assembly();
}

// Generate trefoil point with raised crossings
// Over-strand sections are raised by p14_crossing_raise at crossing zones
function p14_trefoil_point(t) =
    let(
        x = (sin(t) + 2 * sin(2 * t)) * p14_scale,
        y = (cos(t) - 2 * cos(2 * t)) * p14_scale,
        // Base z follows trefoil z-profile; crossings get extra raise
        z_base = -sin(3 * t) * p14_scale * 0.5,
        // Amplify the over-strand portions (where z_base > 0)
        z = z_base > 0 ? z_base + p14_crossing_raise : z_base
    )
    [x, y, z];

// Generate full trefoil point array
function p14_trefoil_points() = [
    for (i = [0:p14_trefoil_steps])
        p14_trefoil_point(360 * i / p14_trefoil_steps)
];

// Trefoil wire frame with raised crossings
module p14_trefoil_frame() {
    points = p14_trefoil_points();
    polyline_rod(points, rod_d);
}

// Flat base
module p14_base() {
    rounded_cube([p14_base_w, p14_base_d, p14_base_h], r=2);
}

// Assembly view (for visualization only)
module p14_assembly() {
    // Base
    color("BurlyWood") p14_base();

    // Trefoil frame (raised above base)
    color("Silver")
    translate([0, 0, p14_base_h / 2 + p14_crossing_raise + rod_d])
        p14_trefoil_frame();

    // Trapped ring (positioned at one lobe of the trefoil)
    color("Gold")
    translate([p14_scale * 1.5, 0, p14_base_h / 2 + p14_crossing_raise + rod_d])
    rotate([90, 0, 0])
        torus_ring(p14_ring_od, ring_wire_d);
}
