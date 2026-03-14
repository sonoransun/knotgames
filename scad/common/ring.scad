// EXKNOTS - Ring/Torus modules for FDM printing
include <parameters.scad>

// Standard torus ring
// od = outer diameter, wire_d = cross-section diameter
module torus_ring(od, wire_d=ring_wire_d) {
    center_r = (od - wire_d) / 2;
    rotate_extrude($fn=fn_detail)
    translate([center_r, 0, 0])
    circle(d=wire_d, $fn=32);
}

// Elliptical oval torus (for Puzzle 5 Trinity Lock)
// long_d = major axis diameter, short_d = minor axis diameter
module oval_torus(long_d, short_d, wire_d=ring_wire_d, steps=120) {
    long_r = (long_d - wire_d) / 2;
    short_r = (short_d - wire_d) / 2;

    for (i = [0:steps-1]) {
        a1 = 360 * i / steps;
        a2 = 360 * (i + 1) / steps;
        hull() {
            translate([cos(a1) * long_r, sin(a1) * short_r, 0])
                sphere(d=wire_d, $fn=16);
            translate([cos(a2) * long_r, sin(a2) * short_r, 0])
                sphere(d=wire_d, $fn=16);
        }
    }
}

// Ring inner diameter helper
function ring_id(od, wire_d=ring_wire_d) = od - wire_d * 2;

// Torus for print-in-place (with split gap)
module torus_ring_split(od, wire_d=ring_wire_d, gap=0.3) {
    center_r = (od - wire_d) / 2;
    difference() {
        torus_ring(od, wire_d);
        // Cut a gap
        translate([center_r, -wire_d, -wire_d/2 - 1])
            cube([wire_d + 2, wire_d * 2, wire_d + 2]);
    }
}
