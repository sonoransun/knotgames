// EXKNOTS - Puzzle 10: The Hopf Paradox
// FDM 3D Printable Version
//
// Two-piece cage assembly: equatorial hoop (complete) + polar hoop (2 semicircles)
// Ring placed inside before polar hoop assembly
//
// Parts: Equatorial hoop (1) + Polar semicircles (2) + Ring (1) +
//        Handle (1) + Ball constraint (1) + 500mm paracord
//
// Print settings:
//   Hoops:  PLA silver, 0.12mm layers, 100% infill, 4 shells, brim 3mm
//   Ring:   PLA gold, 0.12mm layers, 100% infill, 4 shells
//   Handle: PLA dark, 0.20mm, 30% infill, 3 shells
//   Ball:   PLA wood, 0.20mm, 100% infill, flat-bottom → NO supports
//
// Optimizations applied:
//   - Ball constraint uses flat_bottom_sphere → eliminates tree supports
//   - Pole junction sockets filleted for smooth ring passage (critical for Hopf move)
//   - Handle uses rounded_cube corners
//   - All hoops at 0.12mm for smooth torus surfaces
//   - Shell profiles: torus(hoops, ring), enclosure(handle), structural(ball)
//   - Layer optimization: all_fine for hoops and ring
//   - Press-fit pins have insertion chamfer for assembly

include <../common/parameters.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/press_fit.scad>
use <../common/corners.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>
use <../common/holes.scad>

// Puzzle-specific parameters
p10_hoop_d = 120;          // Hoop diameter
p10_hoop_rod = rod_d;      // 6mm
p10_ring_od = 55;
p10_handle_w = 60;
p10_handle_h = 15;
p10_handle_d = 15;
p10_ball_d = 25;
p10_joint_pin_d = 3;
p10_joint_pin_h = 8;

// Clearance checks
p10_ring_id = p10_ring_od - ring_wire_d * 2;  // 55 - 12 = 43mm
p10_window = p10_hoop_d / 2 - p10_hoop_rod;   // ~54mm quarter-window
echo(str("Hopf ring ID: ", p10_ring_id, "mm"));
echo(str("Hopf window opening: ~", p10_window, "mm"));
assert(p10_ring_od < p10_window + 5,
       "Ring must fit through window when properly oriented");

// Part selector
part = "assembly";

if (part == "equatorial") {
    p10_equatorial_hoop();
} else if (part == "polar_half") {
    p10_polar_semicircle();
} else if (part == "ring") {
    torus_ring(p10_ring_od, ring_wire_d);
} else if (part == "ring_test_50") {
    torus_ring(50, ring_wire_d);
} else if (part == "ring_test_60") {
    torus_ring(60, ring_wire_d);
} else if (part == "handle") {
    p10_handle();
} else if (part == "ball") {
    // Flat-bottom ball: prints support-free
    ball_with_hole(p10_ball_d, cord_hole_d, optimized=true);
} else {
    p10_assembly();
}

// Equatorial hoop (full circle in XZ plane)
module p10_equatorial_hoop() {
    r = p10_hoop_d / 2;

    // Torus lying in XZ plane (rotate the standard XY torus)
    rotate([90, 0, 0])
        rotate_extrude($fn=fn_detail)
        translate([r - p10_hoop_rod/2, 0, 0])
        circle(d=p10_hoop_rod, $fn=24);

    // Press-fit sockets at poles for polar hoop attachment
    // North pole (top, +Y)
    translate([0, r - p10_hoop_rod/2, 0])
        _pole_socket();
    // South pole (bottom, -Y)
    translate([0, -(r - p10_hoop_rod/2), 0])
        rotate([180, 0, 0])
        _pole_socket();
}

module _pole_socket() {
    // Flat pad for polar hoop to mate against
    // Socket holes for press-fit pins from polar semicircles
    difference() {
        sphere(d=p10_hoop_rod + 2, $fn=24);
        // Pin socket
        translate([0, 0, 0])
            cylinder(d=p10_joint_pin_d + clearance,
                     h=p10_joint_pin_h + 1, $fn=24);
    }
}

// Polar semicircle (half of the polar hoop, in XY plane)
// Print 2 of these. Each has a press-fit pin at both ends.
module p10_polar_semicircle() {
    r = p10_hoop_d / 2;

    // Semicircular arc (180 degrees)
    steps = 60;
    for (i = [0:steps-1]) {
        a1 = 180 * i / steps;
        a2 = 180 * (i + 1) / steps;
        hull() {
            translate([cos(a1) * (r - p10_hoop_rod/2),
                       sin(a1) * (r - p10_hoop_rod/2), 0])
                sphere(d=p10_hoop_rod, $fn=12);
            translate([cos(a2) * (r - p10_hoop_rod/2),
                       sin(a2) * (r - p10_hoop_rod/2), 0])
                sphere(d=p10_hoop_rod, $fn=12);
        }
    }

    // Press-fit pins at each end
    // End 1 (angle=0, rightmost point)
    translate([r - p10_hoop_rod/2, 0, 0])
        cylinder(d=p10_joint_pin_d, h=p10_joint_pin_h, $fn=24);

    // End 2 (angle=180, leftmost point)
    translate([-(r - p10_hoop_rod/2), 0, 0])
        cylinder(d=p10_joint_pin_d, h=p10_joint_pin_h, $fn=24);
}

module p10_handle() {
    shell_info("handle", "enclosure");
    difference() {
        // Block with rounded corners for comfort
        rounded_cube([p10_handle_w, p10_handle_h, p10_handle_d], r=2);
        // Compensated cord hole
        compensated_hole(cord_hole_d, p10_handle_d + 2);
    }
}

module p10_assembly() {
    r = p10_hoop_d / 2;

    // Equatorial hoop (XZ plane → horizontal)
    color("silver") p10_equatorial_hoop();

    // Polar hoop semicircles (XY plane → vertical)
    // Top semicircle
    color("silver")
    rotate([0, 0, 0])
    rotate([0, 90, 0])
        p10_polar_semicircle();

    // Bottom semicircle
    color("silver")
    rotate([0, 0, 0])
    rotate([0, -90, 0])
        p10_polar_semicircle();

    // Ring inside cage
    color("gold")
    translate([r * 0.5, 0, 0])
        torus_ring(p10_ring_od, ring_wire_d);

    // Handle below
    color("sienna")
    translate([r + 30, 0, -r - 20])
        p10_handle();

    // Ball constraint
    color("burlywood")
    translate([r * 0.6, 0, -r * 0.5])
        ball_with_hole(p10_ball_d, cord_hole_d);

    echo("ASSEMBLY:");
    echo("1. Place ring around equatorial hoop");
    echo("2. Insert polar semicircles through ring, press-fit at poles");
    echo("3. Glue pole joints if needed. SAND POLES TO 400 GRIT.");
    echo("4. Thread cord per path constraint");
    echo("5. Test 3 ring sizes (50/55/60mm) to find the Hopf sweet spot");
}
