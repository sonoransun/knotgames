// EXKNOTS - Rectangular frame modules for FDM printing
// With optional corner fillets and bridge-aware crossbar junctions.
include <parameters.scad>
use <rod.scad>
use <corners.scad>
use <bridges.scad>

// Rectangular frame with optional crossbar
// Origin at frame center
// fillet_r: radius of internal corner fillets (0 = sphere-only, >0 = add fillets)
module rect_frame(w, h, d=rod_d, crossbar_y=undef, fillet_r=0) {
    hw = w / 2;
    hh = h / 2;

    // Four corners
    corners = [
        [-hw, -hh, 0],
        [hw, -hh, 0],
        [hw, hh, 0],
        [-hw, hh, 0]
    ];

    // Four sides
    for (i = [0:3]) {
        straight_rod(corners[i], corners[(i+1)%4], d);
    }

    // Corner spheres for clean joints
    for (c = corners) {
        translate(c) sphere(d=d, $fn=16);
    }

    // Optional corner fillets (strengthen corners, reduce stress concentration)
    if (fillet_r > 0) {
        // Bottom-left corner
        translate([-hw, -hh, 0]) rotate([0, 0, 0])
            rod_junction_fillet(d, fillet_r);
        // Bottom-right corner
        translate([hw, -hh, 0]) rotate([0, 0, 90])
            rod_junction_fillet(d, fillet_r);
        // Top-right corner
        translate([hw, hh, 0]) rotate([0, 0, 180])
            rod_junction_fillet(d, fillet_r);
        // Top-left corner
        translate([-hw, hh, 0]) rotate([0, 0, 270])
            rod_junction_fillet(d, fillet_r);
    }

    // Optional crossbar
    if (crossbar_y != undef) {
        straight_rod([-hw, crossbar_y, 0], [hw, crossbar_y, 0], d);
        // Junction spheres at T-joints
        translate([-hw, crossbar_y, 0]) sphere(d=d, $fn=16);
        translate([hw, crossbar_y, 0]) sphere(d=d, $fn=16);

        // Bridge check for crossbar span
        bridge_check("frame crossbar", w);

        // Optional fillets at crossbar T-joints
        if (fillet_r > 0) {
            // Left T-joint fillets (up and down)
            translate([-hw, crossbar_y, 0]) {
                rotate([0, 0, 0]) rod_junction_fillet(d, fillet_r);
                rotate([0, 0, 180]) rod_junction_fillet(d, fillet_r);
            }
            // Right T-joint fillets
            translate([hw, crossbar_y, 0]) {
                rotate([0, 0, 0]) rod_junction_fillet(d, fillet_r);
                rotate([0, 0, 180]) rod_junction_fillet(d, fillet_r);
            }
        }
    }
}

// Frame with D-profile bottom for bed adhesion
// (0.5mm flat on bottom face of bottom bar)
module rect_frame_printable(w, h, d=rod_d, crossbar_y=undef, flat=0.5, fillet_r=0) {
    difference() {
        rect_frame(w, h, d, crossbar_y, fillet_r);
        // Trim flat bottom for bed adhesion
        translate([0, -h/2, -d])
            cube([w + d + 2, flat * 2, d * 2], center=true);
    }
}
