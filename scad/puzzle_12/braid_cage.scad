// EXKNOTS - Puzzle 12: Braid Cage
// FDM 3D Printable Version
//
// Parts: base (1) + post (3) + ring (3)
// Three posts on a base with finial balls; three rings sit on posts.
// Print base flat on bed, posts upright, rings flat on side.
//
// Print settings:
//   Base:  PLA wood-fill, 0.20mm layers, 30% infill, 3 shells, no supports
//   Post:  PLA, 0.20mm layers, 100% infill, 5 shells, no supports
//   Ring:  PLA gold, 0.12mm layers, 100% infill, 4 shells, brim 3mm
//
// Optimizations applied:
//   - Flat base with press-fit sockets for posts
//   - Finial balls with socket-down printing (no supports)
//   - Layer height: 0.12mm fine for rings, 0.20mm for posts and base
//   - Shell profile: "structural" for posts, "torus" for rings, "enclosure" for base

include <../common/parameters.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/base.scad>
use <../common/corners.scad>
use <../common/holes.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>
use <../common/press_fit.scad>

// Puzzle-specific parameters
p12_base_w = 180;
p12_base_d = 60;
p12_base_h = 15;
p12_post_h = 120;
p12_post_d = 8;
p12_finial_d = 14;
p12_ring_od = 35;
p12_post_x_positions = [-50, 0, 50];
p12_socket_depth = 12;

// Constraint assertions
assert(p12_ring_od > p12_post_d + clearance * 2,
       str("Ring ID (", p12_ring_od - ring_wire_d * 2,
           "mm) must be larger than post diameter (", p12_post_d, "mm)"));
assert(p12_post_h > p12_ring_od,
       "Posts must be taller than ring diameter to retain rings");
assert(p12_base_w > abs(p12_post_x_positions[0]) * 2 + p12_post_d,
       "Base must be wide enough for all three posts");

// Part selector: "assembly" | "base" | "post" | "ring"
part = "assembly";

if (part == "base") {
    shell_info("base", "enclosure");
    layer_opt_info("base", p12_base_h, "standard");
    p12_base();
} else if (part == "post") {
    shell_info("post", "structural");
    layer_opt_info("post", p12_post_h + p12_finial_d, "fine_top");
    p12_post();
} else if (part == "ring") {
    shell_info("ring", "torus");
    layer_opt_info("ring", ring_wire_d, "all_fine");
    torus_ring(p12_ring_od, ring_wire_d);
} else {
    p12_assembly();
}

// Base with three post sockets
module p12_base() {
    socket_positions = [
        for (x = p12_post_x_positions) [x, 0]
    ];
    flat_base(p12_base_w, p12_base_d, p12_base_h,
              socket_positions=socket_positions,
              socket_d=p12_post_d,
              socket_depth=p12_socket_depth);
}

// Single post with finial ball on top
module p12_post() {
    // Main post cylinder
    cylinder(d=p12_post_d, h=p12_post_h, $fn=$fn);

    // Finial ball at top
    translate([0, 0, p12_post_h])
        finial_ball(p12_finial_d, p12_post_d);

    // Press-fit pin at bottom for base socket
    translate([0, 0, -p12_socket_depth])
        press_pin(p12_post_d, p12_socket_depth);
}

// Assembly view (for visualization only)
module p12_assembly() {
    // Base
    color("BurlyWood") p12_base();

    // Posts with finials
    for (x = p12_post_x_positions) {
        color("Silver")
        translate([x, 0, p12_base_h / 2])
            p12_post();
    }

    // Rings resting at mid-height on posts
    for (i = [0:2]) {
        color("Gold")
        translate([p12_post_x_positions[i], 0, p12_base_h / 2 + p12_post_h * 0.4 + i * 15])
        rotate([90, 0, 0])
            torus_ring(p12_ring_od, ring_wire_d);
    }
}
