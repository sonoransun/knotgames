// EXKNOTS - Press-fit and snap-fit joint modules
include <parameters.scad>

// Press-fit pin (for insertion into socket)
module press_pin(d, h=10) {
    cylinder(d=d - press_fit_clearance, h=h, $fn=$fn);
}

// Press-fit socket (hole for pin)
module press_socket(d, depth=10) {
    cylinder(d=d + press_fit_clearance, h=depth + 0.5, $fn=$fn);
}

// Alignment pin (smaller, for mating two halves)
module align_pin(d=3, h=10) {
    cylinder(d=d, h=h, $fn=24);
}

// Alignment socket
module align_socket(d=3, depth=10) {
    cylinder(d=d + clearance, h=depth + 0.5, $fn=24);
}

// Snap-fit pin with barb
module snap_pin(d=3, h=8, barb_h=0.5) {
    union() {
        cylinder(d=d, h=h, $fn=24);
        // Barb at tip
        translate([0, 0, h - barb_h])
            cylinder(d1=d, d2=d + barb_h*2, h=barb_h, $fn=24);
    }
}

// Snap-fit socket
module snap_socket(d=3, depth=8) {
    cylinder(d=d + snap_clearance, h=depth + 1, $fn=24);
}
