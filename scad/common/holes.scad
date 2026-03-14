// EXKNOTS - Hole Optimization Module
// Teardrop, compensation, and bridge-optimized holes for FDM printing.
//
// Horizontal holes in FDM have a problem: the top of the hole is an
// unsupported arch that sags. Solutions:
//   1. Teardrop hole: point at top eliminates the overhang entirely
//   2. Bridge-top hole: flat top creates a short bridge (cleaner than sag)
//   3. Oversize compensation: enlarge hole slightly to compensate for
//      material shrink/squeeze on inner surfaces
//
// Vertical holes have a different issue: first few layers may close
// slightly due to elephant's foot. Compensate at the base.
//
// Usage:
//   include <holes.scad>
//   teardrop_hole(d=6, h=20);           // Horizontal hole, point up
//   compensated_hole(d=6, h=20);         // Vertical hole, slightly enlarged
//   bridge_top_hole(d=15, h=30);         // Large horizontal hole, flat top

include <parameters.scad>

// --- Compensation Values ---

// Horizontal holes shrink by ~0.1-0.2mm on inner diameter
hole_h_compensation = 0.15;

// Vertical holes shrink by ~0.05-0.1mm (elephant's foot at base)
hole_v_compensation = 0.1;

// --- Teardrop Hole (Horizontal) ---
// Replaces the top semicircle with a 45-degree point, eliminating
// any overhang > 45 degrees. The point adds ~0.4mm to the height.
// Orientation: hole axis along X (rotate as needed).

module teardrop_hole(d, h, compensation=true) {
    actual_d = compensation ? d + hole_h_compensation * 2 : d;
    r = actual_d / 2;

    rotate([0, 90, 0])
    linear_extrude(height=h, center=true)
    teardrop_2d(r);
}

// 2D teardrop shape: circle with 45-degree point at top
module teardrop_2d(r) {
    union() {
        circle(r=r, $fn=max(24, r*6));
        // 45-degree triangle at top (point up)
        polygon([
            [-r * cos(45), r * sin(45)],
            [0, r * sqrt(2)],
            [r * cos(45), r * sin(45)]
        ]);
    }
}

// --- Bridge-Top Hole (Horizontal) ---
// Flattens the top of a horizontal hole so the slicer creates a
// short bridge instead of a curved overhang. Cleaner than sagging.
// The flat is one layer height below the hole crown.

module bridge_top_hole(d, h, compensation=true) {
    actual_d = compensation ? d + hole_h_compensation * 2 : d;
    r = actual_d / 2;

    rotate([0, 90, 0])
    intersection() {
        cylinder(r=r, h=h, center=true, $fn=max(32, r*6));
        // Cut the top flat: everything below the crown minus one layer
        translate([0, 0, 0])
            cube([actual_d, actual_d * 2, h + 2], center=true);
        translate([0, -r + layer_h/2, 0])
            cube([actual_d, actual_d, h + 2], center=true);
    }
    // Simpler approach: difference off the top sliver
    rotate([0, 90, 0])
    difference() {
        cylinder(r=r, h=h, center=true, $fn=max(32, r*6));
        // Remove the top cap above the flat-bridge line
        translate([0, 0, 0])
        translate([r - layer_h/2, 0, 0])
            cube([layer_h + 0.1, actual_d + 2, h + 2], center=true);
    }
}

// Simplified bridge-top hole (preferred implementation)
module bridge_flat_hole(d, h, compensation=true) {
    actual_d = compensation ? d + hole_h_compensation * 2 : d;
    r = actual_d / 2;

    rotate([0, 90, 0])
    linear_extrude(height=h, center=true)
    intersection() {
        circle(r=r, $fn=max(32, r*6));
        // Clip top to flat bridge
        translate([0, -layer_h/2])
            square([actual_d + 2, actual_d - layer_h], center=true);
    }
}

// --- Compensated Vertical Hole ---
// Enlarges vertical holes slightly to counteract material squeeze.
// Also adds a small chamfer at the base to counter elephant's foot.

module compensated_hole(d, h, compensation=true, base_chamfer=true) {
    actual_d = compensation ? d + hole_v_compensation * 2 : d;

    union() {
        cylinder(d=actual_d, h=h, $fn=max(32, d*4));

        // Base chamfer to counter elephant's foot
        if (base_chamfer) {
            cylinder(d1=actual_d + 0.6, d2=actual_d, h=0.4, $fn=max(32, d*4));
        }
    }
}

// --- Countersunk Hole (Vertical, optimized) ---
// Standard countersink with compensation and optional base chamfer.

module countersunk_hole(d, h, cs_d, cs_depth, compensation=true) {
    actual_d = compensation ? d + hole_v_compensation * 2 : d;
    actual_cs = compensation ? cs_d + hole_v_compensation * 2 : cs_d;

    union() {
        // Main hole
        cylinder(d=actual_d, h=h, $fn=max(32, d*4));
        // Countersink cone at top
        translate([0, 0, h - cs_depth])
            cylinder(d1=actual_d, d2=actual_cs, h=cs_depth, $fn=max(32, d*4));
    }
}

// --- Horizontal Cord Hole (Teardrop, for puzzle rod tips) ---
// Specifically sized for cord channels through rod tips.
// Teardrop point faces up (print orientation: rod horizontal).

module cord_teardrop(length=20) {
    teardrop_hole(cord_hole_d, length);
}

// --- Horizontal Cord Hole with Countersink (Teardrop) ---
module cord_teardrop_attachment(length=20) {
    union() {
        teardrop_hole(cord_hole_d, length);
        // Countersink on one end (conical, using teardrop profile)
        translate([length/2 - cord_countersink_depth, 0, 0])
        scale([1, 1, 1])
            teardrop_hole(cord_countersink_d, cord_countersink_depth + 0.1);
    }
}

// --- Tunnel Hole (Large horizontal, for Puzzle 9) ---
// Large horizontal holes benefit from bridge-flat approach.
module tunnel_hole(d, length) {
    bridge_flat_hole(d, length, compensation=true);
}

// --- Validation ---
module hole_info(name, d, orientation="vertical") {
    comp = orientation == "horizontal" ? hole_h_compensation : hole_v_compensation;
    echo(str("HOLE [", name, "]: d=", d, "mm, orientation=", orientation,
             ", compensation=+", comp*2, "mm → effective d=", d + comp*2, "mm"));
}
