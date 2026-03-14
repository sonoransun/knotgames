// EXKNOTS - Puzzle 1: The Gatekeeper
// FDM 3D Printable Version
//
// Parts: U-bar (1 piece) + Ring (1 piece) + 400mm paracord
// Print U-bar upright (U-opening up), ring flat on side
//
// Print settings:
//   U-bar: PLA, 0.20mm layers, 100% infill, 5 shells, no supports
//   Ring:  PLA gold, 0.12mm layers, 100% infill, 4 shells, no supports
//
// Optimizations applied:
//   - Teardrop cord holes at tips (horizontal hole optimization)
//   - Layer height: 0.12mm fine zone on ring, 0.20mm for U-bar
//   - Shell profile: "structural" for U-bar, "torus" for ring

include <../common/parameters.scad>
use <../common/rod.scad>
use <../common/ring.scad>
use <../common/cord_channel.scad>
use <../common/holes.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>

// Puzzle-specific parameters
p1_bar_width = 60;
p1_bar_height = 120;
p1_bend_radius = 20;
p1_ring_od = 50;

// Part selector: "assembly" | "u_bar" | "ring"
part = "assembly";

if (part == "u_bar") {
    shell_info("u_bar", "structural");
    layer_opt_info("u_bar", p1_bar_height + p1_bend_radius, "standard");
    p1_u_bar();
} else if (part == "ring") {
    shell_info("ring", "torus");
    layer_opt_info("ring", ring_wire_d, "all_fine");
    torus_ring(p1_ring_od, ring_wire_d);
} else {
    p1_assembly();
}

// U-bar with teardrop cord attachment holes at tips
module p1_u_bar() {
    hw = p1_bar_width / 2;

    difference() {
        // U-bar body
        u_bar_poly(p1_bar_width, p1_bar_height, p1_bend_radius, rod_d);

        // Teardrop cord hole at left tip (horizontal, point up for clean printing)
        translate([-hw, 0, 0])
            cord_attachment_horizontal(cord_hole_d, rod_d + 4);

        // Teardrop cord hole at right tip
        translate([hw, 0, 0])
            cord_attachment_horizontal(cord_hole_d, rod_d + 4);
    }

    // Hole optimization info
    hole_info("left_tip_cord", cord_hole_d, "horizontal");
    hole_info("right_tip_cord", cord_hole_d, "horizontal");
}

// Assembly view (for visualization only - do not print as one piece)
module p1_assembly() {
    hw = p1_bar_width / 2;

    // U-bar
    color("silver") p1_u_bar();

    // Ring (positioned at initial hanging point)
    color("gold")
    translate([0, -p1_bar_height * 0.45, 0])
    rotate([90, 0, 0])
        torus_ring(p1_ring_od, ring_wire_d);

    // Cord path indicator (not a printable part - just shows cord routing)
    color("blue", 0.5)
    translate([0, -p1_bar_height * 0.3, 0])
        cylinder(d=cord_d, h=p1_bar_height * 0.4, $fn=12);
}
