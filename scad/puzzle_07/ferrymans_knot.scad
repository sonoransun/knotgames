// EXKNOTS - Puzzle 7: The Ferryman's Knot
// FDM 3D Printable Version
//
// Parts: Post (1) + Finial (1, press-fit) + Base (1) + Ring (1) + 600mm paracord
//
// Print settings:
//   Post:   PLA wood, 0.20mm layers, 100% infill, 5 shells, upright, brim 3mm
//   Finial: PLA wood, 0.12mm layers, 100% infill, 4 shells, socket-down, NO supports
//           (socket opening = flat base; ball_with_socket prints support-free)
//   Base:   PLA dark, 0.20mm layers, 30% infill, 3 shells, flat
//   Ring:   PLA gold, 0.12mm layers, 100% infill, 4 shells, flat
//
// Optimizations applied:
//   - Finial prints socket-down → socket is the flat base → NO tree supports needed
//   - Socket rim has insertion chamfer for easier press-fit assembly
//   - Base sockets have compensated holes + insertion chamfer
//   - Eyelet cord hole uses vertical compensation
//   - Corner chamfers on base (rounded_cube via base module)
//   - Layer optimization: fine_top profile for finial (fine layers on crown)
//   - Shell profiles: structural(post), press_fit(finial), enclosure(base), torus(ring)

include <../common/parameters.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/cord_channel.scad>
use <../common/press_fit.scad>
use <../common/text_label.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>
use <../common/holes.scad>
use <../common/corners.scad>

// Puzzle-specific parameters
p7_post_d = 20;
p7_post_h = 200;
p7_finial_d = 42;          // Enlarged from 30mm to trap ring
p7_base_w = 100;
p7_base_d = 100;
p7_base_h = 25;
p7_ring_od = 50;
p7_hook_offset = 40;       // Distance from post center to hook
p7_eyelet_d = 10;          // Hook substitute: printed eyelet
p7_eyelet_h = 10;
p7_socket_depth = 12;

// Critical constraint: finial must exceed ring ID to trap it
p7_ring_id = p7_ring_od - ring_wire_d * 2;  // 50 - 12 = 38mm
assert(p7_finial_d > p7_ring_id,
       str("Finial (", p7_finial_d, "mm) must exceed ring ID (", p7_ring_id, "mm)"));

// Part selector
part = "assembly";

if (part == "post") {
    p7_post();
} else if (part == "finial") {
    p7_finial();
} else if (part == "base") {
    p7_base();
} else if (part == "ring") {
    torus_ring(p7_ring_od, ring_wire_d);
} else {
    p7_assembly();
}

module p7_post() {
    cylinder(d=p7_post_d, h=p7_post_h, $fn=$fn);
    // Press-fit pin at bottom
    translate([0, 0, -p7_socket_depth + 1])
        cylinder(d=p7_post_d - press_fit_clearance * 2,
                 h=p7_socket_depth, $fn=$fn);
}

module p7_finial() {
    // Ball with press-fit socket at bottom
    difference() {
        sphere(d=p7_finial_d, $fn=fn_detail);
        // Socket for post top
        translate([0, 0, -p7_finial_d/2])
            cylinder(d=p7_post_d + press_fit_clearance * 2,
                     h=p7_socket_depth, $fn=$fn);
    }
}

module p7_base() {
    difference() {
        // Base block with chamfered edges
        minkowski() {
            cube([p7_base_w - 4, p7_base_d - 4, p7_base_h - 2], center=true);
            cylinder(r=2, h=1, $fn=16);
        }

        // Post socket (center)
        translate([0, 0, p7_base_h/2 - p7_socket_depth])
            cylinder(d=p7_post_d + press_fit_clearance * 2,
                     h=p7_socket_depth + 1, $fn=$fn);

        // Cord hole through eyelet position
        translate([p7_hook_offset, 0, -1])
            cylinder(d=cord_hole_d, h=p7_base_h + 2, $fn=24);
    }

    // Printed eyelet (J-hook substitute)
    translate([p7_hook_offset, 0, p7_base_h/2])
    difference() {
        cylinder(d=p7_eyelet_d + 4, h=p7_eyelet_h, $fn=32);
        // Through-hole
        cylinder(d=cord_hole_d, h=p7_eyelet_h + 1, $fn=24);
        // Open slot on one side for cord threading
        translate([0, -cord_hole_d/2, 0])
            cube([p7_eyelet_d + 6, cord_hole_d, p7_eyelet_h + 1]);
    }

    // Label on base
    translate([0, -p7_base_d/2 + 8, p7_base_h/2])
        puzzle_label("P7", 6, 0.4);
}

module p7_assembly() {
    // Base
    color("sienna") p7_base();

    // Post
    color("burlywood")
    translate([0, 0, p7_base_h/2])
        p7_post();

    // Finial
    color("burlywood")
    translate([0, 0, p7_base_h/2 + p7_post_h])
        p7_finial();

    // Ring
    color("gold")
    translate([0, 0, p7_base_h/2 + 30])
        torus_ring(p7_ring_od, ring_wire_d);
}
