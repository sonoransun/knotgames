// EXKNOTS - Base/platform modules for FDM printing
// With corner chamfers, socket chamfers, and optional internal bridge ribs.
include <parameters.scad>
use <post.scad>
use <corners.scad>
use <holes.scad>
use <bridges.scad>
use <shells.scad>

// Flat rectangular base with optional post sockets
// chamfer_r: edge chamfer radius (default 1mm)
// socket_chamfer: add press-fit insertion chamfer to socket rims
module flat_base(w, d, h, socket_positions=[], socket_d=10, socket_depth=10,
                 chamfer_r=1, socket_chamfer=true) {
    shell_info("base", "enclosure");

    difference() {
        // Base block with chamfered edges
        rounded_cube([w, d, h], r=chamfer_r);

        // Post sockets with optional insertion chamfer
        for (pos = socket_positions) {
            translate([pos[0], pos[1], h/2 - socket_depth]) {
                // Main socket (compensated)
                compensated_hole(socket_d + press_fit_clearance * 2,
                                 socket_depth + 1, compensation=false);
                // Insertion chamfer at rim (eases press-fit assembly)
                if (socket_chamfer) {
                    translate([0, 0, socket_depth - 0.5])
                        cylinder(d1=socket_d + press_fit_clearance * 2,
                                 d2=socket_d + press_fit_clearance * 2 + 1.5,
                                 h=0.8, $fn=32);
                }
            }
        }
    }
}

// Base with notches for shuttle bar (Puzzle 8)
// notch_chamfer: add chamfer at notch edges for clean bar insertion
module base_with_notches(w, d, h, notch_w=7, notch_depth=4,
                         notch_y_offset=0,
                         socket_positions=[], socket_d=10, socket_depth=10,
                         notch_chamfer=0.5) {
    difference() {
        flat_base(w, d, h, socket_positions, socket_d, socket_depth);

        // Front notch (shuttle bar slot) with chamfered entry
        translate([0, -d/2 + notch_depth/2 + notch_y_offset, h/2 - notch_w/2]) {
            cube([w + 2, notch_depth, notch_w], center=true);
            // Entry chamfer (widen the notch at the surface by 0.5mm)
            if (notch_chamfer > 0) {
                translate([0, -notch_depth/2, 0])
                    cube([w + 2, notch_chamfer * 2, notch_w + notch_chamfer * 2],
                         center=true);
            }
        }
    }
}
