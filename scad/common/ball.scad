// EXKNOTS - Ball/sphere modules for FDM printing
// With optional flat-bottom optimization to reduce/eliminate support needs.
include <parameters.scad>
use <holes.scad>
use <layer_optimization.scad>

// --- Flat-bottom sphere ---
// Trims a flat on the bottom of a sphere so it sits on the print bed
// without needing supports for the first few layers.
// flat_h: height of material removed from bottom (default: 1 layer)
module flat_bottom_sphere(d, flat_h=layer_h) {
    r = d / 2;
    intersection() {
        sphere(d=d, $fn=$fn);
        // Keep everything above Z = -r + flat_h (flattens the bottom)
        translate([0, 0, -r + flat_h])
            cylinder(r=r + 1, h=d, $fn=$fn);
    }
}

// Solid ball-stop (for rod tips)
// optimized=true: flat bottom to reduce support needs
module ball_stop(d=ball_stop_d, optimized=false) {
    if (optimized) {
        flat_bottom_sphere(d);
    } else {
        sphere(d=d, $fn=$fn);
    }
}

// Ball with through-hole for cord
// Uses compensated vertical hole for accurate diameter
// optimized=true: flat bottom for support-free printing
module ball_with_hole(d, hole_d=cord_hole_d, optimized=false) {
    difference() {
        if (optimized) {
            flat_bottom_sphere(d);
        } else {
            sphere(d=d, $fn=$fn);
        }
        // Compensated hole
        compensated_hole(hole_d, d + 2);
    }
}

// Ball with press-fit socket (for mounting on rod tip)
// Print socket-down; socket becomes the flat base = no supports needed
module ball_with_socket(d, socket_d, socket_depth=10) {
    difference() {
        sphere(d=d, $fn=$fn);
        translate([0, 0, -d/2])
            cylinder(d=socket_d + press_fit_clearance,
                     h=socket_depth, $fn=24);
        // The socket opening at the bottom also serves as the flat base
        // for printing socket-down. Add a small chamfer at the socket rim
        // to ease press-fit insertion.
        translate([0, 0, -d/2 + socket_depth - 0.5])
            cylinder(d1=socket_d + press_fit_clearance,
                     d2=socket_d + press_fit_clearance + 1,
                     h=0.5, $fn=24);
    }
}

// Finial ball with press-fit socket for post
// Socket-down printing eliminates support needs entirely.
module finial_ball(d, post_d, socket_depth=10) {
    ball_with_socket(d, post_d, socket_depth);
    // Layer optimization info
    layer_opt_info("finial", d, "fine_top");
}
