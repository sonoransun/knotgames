// EXKNOTS - Post/cylinder modules for FDM printing
include <parameters.scad>

// Simple cylindrical post
// Origin at base center
module post(d, h) {
    cylinder(d=d, h=h, $fn=$fn);
}

// Post with press-fit pin at bottom (for inserting into base socket)
module post_with_pin(d, h, pin_d=0, pin_h=10) {
    actual_pin_d = pin_d > 0 ? pin_d : d;
    // Main post
    post(d, h);
    // Press-fit pin below
    translate([0, 0, -pin_h])
        cylinder(d=actual_pin_d - press_fit_clearance,
                 h=pin_h, $fn=$fn);
}

// Socket hole for press-fit post (used in bases)
module post_socket(d, depth=10) {
    cylinder(d=d + press_fit_clearance, h=depth, $fn=$fn);
}
