// EXKNOTS - Puzzle 8: Ouroboros Chain
// FDM 3D Printable Version
//
// Parts: Base (1) + Posts (6) + Shuttle bar (1) + 6x 150mm paracord loops
// Base scaled to 220mm for small-bed printers (parametric)
//
// Print settings:
//   Base:        PLA wood, 0.20mm layers, 30% infill, flat
//   Posts (x6):  PLA dark, 0.20mm layers, 100% infill, upright, brim 3mm
//   Shuttle bar: PETG silver, 0.20mm layers, 100% infill, lying flat, brim 5mm

include <../common/parameters.scad>
use <../common/post.scad>
use <../common/base.scad>
use <../common/text_label.scad>

// Puzzle-specific parameters
p8_num_posts = 6;
p8_post_spacing = 26;     // Reduced from 30mm for 220mm bed (parametric)
p8_post_d = 10;
p8_post_h = 80;
p8_base_w = 220;          // Scaled for Ender 3 bed (set to 250 for larger beds)
p8_base_d = 50;
p8_base_h = 25;
p8_bar_d = 6;             // Thickened from 3mm
p8_bar_length = p8_base_w - 10;
p8_notch_w = p8_bar_d + 1;     // Shuttle bar notch width
p8_notch_depth = 4;
p8_grip_d = 10;            // Grip nubs at bar ends
p8_grip_h = 8;
p8_socket_depth = 12;

// Compute post positions (centered on base)
p8_post_positions = [
    for (i = [0 : p8_num_posts - 1])
        [(i - (p8_num_posts - 1) / 2) * p8_post_spacing, 0]
];

// Constraint assertions
p8_total_span = p8_post_spacing * (p8_num_posts - 1);
assert(p8_total_span < p8_base_w - p8_post_d * 2,
       str("Post span (", p8_total_span, "mm) exceeds base width minus margins"));
assert(p8_bar_length >= p8_total_span,
       "Shuttle bar must span all posts");
assert(p8_base_w <= 250, "Base width exceeds common 250mm print bed");

// Part selector
part = "assembly";

if (part == "base") {
    p8_base();
} else if (part == "post") {
    p8_single_post();
} else if (part == "shuttle_bar") {
    p8_shuttle_bar();
} else {
    p8_assembly();
}

module p8_base() {
    difference() {
        flat_base(p8_base_w, p8_base_d, p8_base_h,
                  p8_post_positions, p8_post_d, p8_socket_depth);

        // Front notch for shuttle bar
        translate([0, -p8_base_d/2 + p8_notch_depth/2 + 2,
                   p8_base_h/2 - p8_notch_w/2 - 2])
            cube([p8_bar_length + 20, p8_notch_depth, p8_notch_w], center=true);
    }

    // Label
    translate([0, p8_base_d/2 - 8, p8_base_h/2])
        puzzle_label("OUROBOROS", 4, 0.4);
}

module p8_single_post() {
    post_with_pin(p8_post_d, p8_post_h, p8_post_d, p8_socket_depth);
}

module p8_shuttle_bar() {
    // Main bar
    cylinder(d=p8_bar_d, h=p8_bar_length, center=true, $fn=24);

    // Grip nubs at each end
    translate([0, 0, p8_bar_length/2])
        cylinder(d=p8_grip_d, h=p8_grip_h, $fn=24);
    translate([0, 0, -p8_bar_length/2 - p8_grip_h])
        cylinder(d=p8_grip_d, h=p8_grip_h, $fn=24);
}

module p8_assembly() {
    // Base
    color("burlywood") p8_base();

    // Posts
    for (pos = p8_post_positions) {
        color("sienna")
        translate([pos[0], pos[1], p8_base_h/2])
            cylinder(d=p8_post_d, h=p8_post_h, $fn=$fn);
    }

    // Shuttle bar (in notch)
    color("silver")
    translate([0, -p8_base_d/2 + p8_notch_depth + 2,
               p8_base_h/2 - p8_notch_w/2])
    rotate([0, 90, 0])
        p8_shuttle_bar();

    echo("ASSEMBLY ORDER: Thread loops right-to-left (6→1).");
    echo("Each loop threads through its left neighbor before mounting.");
    echo("Glue posts into base AFTER all loops are threaded.");
}
