// EXKNOTS - Puzzle 6: Devil's Pitchfork
// FDM 3D Printable Version
//
// Parts: Fork assembly (1 piece) + Ring (1 piece) + 300mm paracord loop
// Print fork lying flat (prongs horizontal), ring flat on side
//
// Print settings:
//   Fork: PLA silver, 0.20mm layers, 100% infill, 5 shells, brim 5mm,
//         NO supports (ball-stops print with flat contact when lying flat)
//   Ring: PLA gold, 0.12mm layers, 100% infill, 4 shells
//
// Optimizations applied:
//   - When fork prints lying flat, ball-stops have bed contact → no supports
//   - Stress fillets at prong-base junctions (load-bearing connection points)
//   - Teardrop cord hole at center prong base
//   - Shell profiles: structural(fork), torus(ring)

include <../common/parameters.scad>
use <../common/rod.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/cord_channel.scad>
use <../common/corners.scad>
use <../common/shells.scad>
use <../common/holes.scad>

// Puzzle-specific parameters
p6_prong_spacing = 40;
p6_left_h = 100;
p6_center_h = 80;         // CRITICAL: 20mm shorter
p6_right_h = 100;
p6_base_depth = 15;       // Depth of U-shaped base curve
p6_ring_od = 50;
p6_ball_d = ball_stop_d;  // 12mm

// Critical constraint: height difference is the puzzle's key
assert(p6_left_h - p6_center_h == 20,
       "Center prong must be exactly 20mm shorter");

// Part selector
part = "assembly";

if (part == "fork") {
    p6_fork();
} else if (part == "ring") {
    torus_ring(p6_ring_od, ring_wire_d);
} else {
    p6_assembly();
}

module p6_fork() {
    difference() {
        union() {
            // Base U-curve connecting three prongs
            base_points = [
                [-p6_prong_spacing, 0, 0],
                [-p6_prong_spacing, -p6_base_depth/2, 0],
                [-p6_prong_spacing/2, -p6_base_depth, 0],
                [0, -p6_base_depth, 0],
                [p6_prong_spacing/2, -p6_base_depth, 0],
                [p6_prong_spacing, -p6_base_depth/2, 0],
                [p6_prong_spacing, 0, 0],
            ];
            polyline_rod(base_points, rod_d);

            // Left prong
            straight_rod([-p6_prong_spacing, 0, 0],
                         [-p6_prong_spacing, p6_left_h, 0], rod_d);

            // Center prong (shorter!)
            straight_rod([0, -p6_base_depth, 0],
                         [0, p6_center_h, 0], rod_d);

            // Right prong
            straight_rod([p6_prong_spacing, 0, 0],
                         [p6_prong_spacing, p6_right_h, 0], rod_d);

            // Ball-stops at prong tips
            translate([-p6_prong_spacing, p6_left_h, 0])
                ball_stop(p6_ball_d);
            translate([0, p6_center_h, 0])
                ball_stop(p6_ball_d);
            translate([p6_prong_spacing, p6_right_h, 0])
                ball_stop(p6_ball_d);

            // Stress fillets at prong-base junctions
            // These gussets distribute load where prongs meet the base curve
            translate([-p6_prong_spacing, 0, 0])
                rotate([0, 0, 0]) stress_gusset(rod_d, rod_d);
            translate([p6_prong_spacing, 0, 0])
                rotate([0, 0, 90]) stress_gusset(rod_d, rod_d);
        }

        // Teardrop cord attachment hole at center prong base (horizontal)
        translate([0, -p6_base_depth, 0])
            cord_attachment(cord_hole_d, rod_d + 4);
    }
}

module p6_assembly() {
    color("silver") p6_fork();

    // Ring on left prong
    color("gold")
    translate([-p6_prong_spacing, p6_left_h * 0.6, 0])
    rotate([90, 0, 0])
        torus_ring(p6_ring_od, ring_wire_d);
}
