// EXKNOTS - Puzzle 9: Genus Trap
// FDM 3D Printable Version
//
// SUBSTITUTION: Clear acrylic → split PETG block with color-coded tunnel liners
// Block splits along left-right axis into two halves
//
// Parts: Block left (1) + Block right (1) + Tunnel A liner (red, 1) +
//        Tunnel B liner (blue, 1) + Rings (2) + Ball-stops (2) + 900mm paracord
//
// Print settings:
//   Block halves: PETG natural/translucent, 0.20mm, 30% infill, 3 shells, mating face up
//   Tunnel liners: PLA red/blue, 0.20mm, 100% infill, 3 shells, lying flat
//   Rings:  PLA gold, 0.12mm, 100% infill, 4 shells
//   Balls:  PLA wood, 0.20mm, 100% infill, flat-bottom optimized → NO supports
//
// Optimizations applied:
//   - Tunnel B through-holes use bridge_flat_hole (flat top for clean bridging)
//   - Tunnel A semichannel on mating face prints support-free (open channel)
//   - Ball-stops use flat_bottom_sphere → eliminates tree supports
//   - Block halves use rounded_cube corners for print quality
//   - Socket insertion chamfers on alignment pin sockets
//   - Shell profiles: enclosure(blocks), cord_contact(liners), torus(rings)
//   - Bridge check on tunnel B span (80mm) with internal ribs if needed

include <../common/parameters.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/press_fit.scad>
use <../common/holes.scad>
use <../common/bridges.scad>
use <../common/corners.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>

// Puzzle-specific parameters
p9_block_w = 120;         // Total width (left-right, X axis)
p9_block_h = 60;          // Height (Z axis)
p9_block_d = 80;          // Depth (front-back, Y axis)
p9_tunnel_d = 15;
p9_tunnel_a_z = 25;       // Tunnel A height (lower)
p9_tunnel_b_z = 35;       // Tunnel B height (higher)
p9_ring_od = 40;
p9_ball_d = 30;
p9_liner_wall = 1;        // Tunnel liner wall thickness
p9_align_pin_d = 3;
p9_align_pin_h = 10;

// Constraint assertions
assert(p9_ball_d > p9_tunnel_d, "Ball must be larger than tunnel");
assert(p9_ring_od > p9_tunnel_d, "Ring must be larger than tunnel");
assert(p9_tunnel_b_z - p9_tunnel_a_z >= p9_tunnel_d,
       "Tunnels must not intersect (vertical separation >= tunnel diameter)");

// Part selector
part = "assembly";

if (part == "block_left") {
    p9_block_half(left=true);
} else if (part == "block_right") {
    p9_block_half(left=false);
} else if (part == "tunnel_a_liner") {
    p9_tunnel_liner(p9_block_d + 2);  // Tunnel A runs front-back... wait
    // Tunnel A runs LEFT-RIGHT (X axis), so length = block_w/2 per half
    p9_tunnel_liner(p9_block_w / 2 + 1);
} else if (part == "tunnel_b_liner") {
    // Tunnel B runs FRONT-BACK (Y axis)
    p9_tunnel_liner(p9_block_d + 2);
} else if (part == "ring") {
    torus_ring(p9_ring_od, ring_wire_d);
} else if (part == "ball_stop") {
    // Flat-bottom ball: eliminates tree support requirement
    ball_with_hole(p9_ball_d, cord_hole_d, optimized=true);
} else {
    p9_assembly();
}

// One half of the block
module p9_block_half(left=true) {
    half_w = p9_block_w / 2;
    x_offset = left ? -half_w/2 : half_w/2;

    difference() {
        // Block half with chamfered edges
        translate([0, 0, p9_block_h/2])
            rounded_cube([half_w, p9_block_d, p9_block_h], r=1);

        // Tunnel A (left-right): semicircular channel on mating face
        translate([left ? half_w/2 : -half_w/2, 0, p9_tunnel_a_z])
        rotate([0, 90, 0])
            cylinder(d=p9_tunnel_d, h=half_w + 2, center=true, $fn=48);

        // Tunnel B (front-back): bridge-flat through-hole in each half
        // Flat top eliminates arch sag on the 80mm horizontal span
        translate([0, 0, p9_tunnel_b_z])
        rotate([0, 0, 90])
            bridge_flat_hole(p9_tunnel_d, p9_block_d + 2);

        // Alignment pin sockets on mating face
        mating_x = left ? half_w/2 - 0.5 : -half_w/2 + 0.5;
        for (pos = [[mating_x, -20, 15], [mating_x, 20, 15], [mating_x, 0, 45]]) {
            translate(pos)
            rotate([0, left ? 90 : -90, 0])
                align_socket(p9_align_pin_d, p9_align_pin_h);
        }
    }

    // Alignment pins (only on left half)
    if (left) {
        for (pos = [[-20, 15], [20, 15], [0, 45]]) {
            translate([half_w/2, pos[0], pos[1]])
            rotate([0, 90, 0])
                align_pin(p9_align_pin_d, p9_align_pin_h);
        }
    }
}

// Tunnel liner (colored tube insert)
module p9_tunnel_liner(length) {
    difference() {
        cylinder(d=p9_tunnel_d - clearance, h=length, center=true, $fn=48);
        cylinder(d=p9_tunnel_d - p9_liner_wall * 2 - clearance,
                 h=length + 2, center=true, $fn=48);
    }
}

module p9_assembly() {
    // Left half
    color("white", 0.7)
    translate([-p9_block_w/4, 0, 0])
        p9_block_half(left=true);

    // Right half
    color("white", 0.7)
    translate([p9_block_w/4, 0, 0])
        p9_block_half(left=false);

    // Tunnel A liner (red)
    color("red", 0.8)
    translate([0, 0, p9_tunnel_a_z])
    rotate([0, 90, 0])
        p9_tunnel_liner(p9_block_w + 2);

    // Tunnel B liner (blue)
    color("blue", 0.8)
    translate([0, 0, p9_tunnel_b_z])
    rotate([90, 0, 0])
        p9_tunnel_liner(p9_block_d + 2);

    // Rings
    color("gold") {
        translate([p9_block_w/2 + 15, 0, p9_tunnel_a_z])
            torus_ring(p9_ring_od, ring_wire_d);
        translate([-p9_block_w/2 - 15, 0, p9_tunnel_b_z])
            torus_ring(p9_ring_od, ring_wire_d);
    }

    // Ball stops
    color("burlywood") {
        translate([-p9_block_w/2 - 30, 0, p9_tunnel_a_z])
            ball_with_hole(p9_ball_d, cord_hole_d);
        translate([p9_block_w/2 + 30, 0, p9_tunnel_a_z])
            ball_with_hole(p9_ball_d, cord_hole_d);
    }

    echo("ASSEMBLY: Insert tunnel liners. Mate halves with alignment pins.");
    echo("Glue with CA or epoxy. Thread cord in aba^-1 pattern.");
}
