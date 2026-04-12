// EXKNOTS - Puzzle 13: Torus Winder
// FDM 3D Printable Version
//
// Parts: torus (1) + ring (1) + ball_stop (2)
// Large torus with a small sliding ring and ball stops.
// Print torus flat on side, ring flat on side, ball stops flat-bottom.
//
// Print settings:
//   Torus:     PLA, 0.20mm layers, 100% infill, 4 shells, brim 5mm
//   Ring:      PLA gold, 0.12mm layers, 100% infill, 4 shells, brim 3mm
//   Ball stop: PLA, 0.20mm layers, 100% infill, 5 shells, no supports
//
// Optimizations applied:
//   - Guide notch markers on torus surface for winding path
//   - Flat-bottom ball stops for support-free printing
//   - Layer height: 0.12mm fine for ring, 0.20mm for torus and ball stops
//   - Shell profile: "torus" for ring and torus, "structural" for ball stops

include <../common/parameters.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>

// Puzzle-specific parameters
p13_torus_od = 120;
p13_major_r = 50;
p13_minor_r = 15;
p13_ring_od = 45;
p13_ball_d = 10;
p13_notch_count = 8;
p13_notch_d = 3;

// Constraint assertions
assert(p13_torus_od > p13_ring_od,
       "Torus must be larger than the sliding ring");
assert(p13_ring_od - ring_wire_d * 2 > p13_minor_r * 2,
       str("Ring ID (", p13_ring_od - ring_wire_d * 2,
           "mm) must fit around torus tube diameter (",
           p13_minor_r * 2, "mm) for ring to slide around tube"));
assert(p13_ball_d > cord_d,
       "Ball stops must be larger than cord diameter");

// Part selector: "assembly" | "torus" | "ring" | "ball_stop"
part = "assembly";

if (part == "torus") {
    shell_info("torus", "torus");
    layer_opt_info("torus", p13_minor_r * 2, "standard");
    p13_torus();
} else if (part == "ring") {
    shell_info("ring", "torus");
    layer_opt_info("ring", ring_wire_d, "all_fine");
    torus_ring(p13_ring_od, ring_wire_d);
} else if (part == "ball_stop") {
    shell_info("ball_stop", "structural");
    layer_opt_info("ball_stop", p13_ball_d, "standard");
    p13_ball_stop();
} else {
    p13_assembly();
}

// Large torus with guide notch markers
module p13_torus() {
    // Main torus body
    rotate_extrude($fn=fn_detail)
    translate([p13_major_r, 0, 0])
        circle(r=p13_minor_r, $fn=32);

    // Guide notch markers (small spheres on torus surface)
    for (i = [0:p13_notch_count - 1]) {
        angle = 360 * i / p13_notch_count;
        translate([
            cos(angle) * p13_major_r,
            sin(angle) * p13_major_r,
            p13_minor_r
        ])
            sphere(d=p13_notch_d, $fn=16);
    }
}

// Ball stop with flat bottom for support-free printing
module p13_ball_stop() {
    flat_bottom_sphere(p13_ball_d);
}

// Assembly view (for visualization only)
module p13_assembly() {
    // Large torus
    color("Silver") p13_torus();

    // Sliding ring (positioned at one side of torus)
    color("Gold")
    translate([p13_major_r, 0, 0])
    rotate([0, 90, 0])
        torus_ring(p13_ring_od, ring_wire_d);

    // Ball stops at top and bottom of torus
    color("Crimson")
    translate([p13_major_r + p13_minor_r + p13_ball_d / 2, 0, 0])
        flat_bottom_sphere(p13_ball_d);

    color("Crimson")
    translate([-p13_major_r - p13_minor_r - p13_ball_d / 2, 0, 0])
        flat_bottom_sphere(p13_ball_d);
}
