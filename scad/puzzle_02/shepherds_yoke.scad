// EXKNOTS - Puzzle 2: Shepherd's Yoke
// FDM 3D Printable Version
//
// Parts: Paddle (1 piece) + 200mm paracord loop
// Print paddle flat on bed
//
// Print settings:
//   Paddle: PLA wood-tone, 0.20mm layers, 40% infill, no supports
//           Enable ironing on top surface for smooth cord sliding

include <../common/parameters.scad>

// Puzzle-specific parameters
p2_paddle_w = 150;
p2_paddle_h = 80;
p2_paddle_d = 10;
p2_hole_d = 20;
p2_chamfer = 1;          // Edge chamfer for smooth cord sliding
p2_corner_r = 5;         // Corner radius

// Cord loop check: paddle short edge must fit through loop
p2_loop_circ = 200;      // Paracord loop circumference
assert(p2_paddle_h < p2_loop_circ / 2,
       "Paddle short edge must be less than half loop circumference");

// Part selector
part = "assembly";

if (part == "paddle") {
    p2_paddle();
} else {
    p2_assembly();
}

module p2_paddle() {
    difference() {
        // Paddle body with rounded corners
        minkowski() {
            cube([p2_paddle_w - p2_corner_r*2,
                  p2_paddle_h - p2_corner_r*2,
                  p2_paddle_d - p2_chamfer*2], center=true);
            // Rounded edges (chamfer + corner radius combined)
            cylinder(r=p2_corner_r, h=p2_chamfer, $fn=32);
        }

        // Center hole with chamfered edges
        cylinder(d=p2_hole_d, h=p2_paddle_d + 2, center=true, $fn=48);

        // Chamfer on hole top edge
        translate([0, 0, p2_paddle_d/2 - p2_chamfer])
            cylinder(d1=p2_hole_d, d2=p2_hole_d + p2_chamfer*2,
                     h=p2_chamfer + 0.1, $fn=48);

        // Chamfer on hole bottom edge
        translate([0, 0, -p2_paddle_d/2 - 0.1])
            cylinder(d1=p2_hole_d + p2_chamfer*2, d2=p2_hole_d,
                     h=p2_chamfer + 0.1, $fn=48);
    }
}

module p2_assembly() {
    color("burlywood") p2_paddle();

    // Cord loop indicator (not printable)
    color("blue", 0.4)
    translate([0, 0, p2_paddle_d/2 + 3])
        torus_indicator(p2_loop_circ / 3.14159 / 2, 2);
}

module torus_indicator(r, tube_r) {
    rotate_extrude($fn=48)
    translate([r, 0, 0])
    circle(r=tube_r, $fn=12);
}
