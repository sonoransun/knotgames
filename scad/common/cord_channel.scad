// EXKNOTS - Cord channel/hole modules for FDM printing
// Supports optional teardrop optimization for horizontal holes.
include <parameters.scad>
use <holes.scad>

// --- Vertical cord holes (standard, printed upright) ---

// Simple through-hole for cord (vertical)
module cord_hole(d=cord_hole_d, length=20) {
    compensated_hole(d, length);
}

// Cord attachment point: through-hole + countersink for stopper knot (vertical)
module cord_attachment(d=cord_hole_d, length=20,
                       cs_d=cord_countersink_d,
                       cs_depth=cord_countersink_depth) {
    countersunk_hole(d, length, cs_d, cs_depth);
}

// --- Horizontal cord holes (teardrop-optimized) ---

// Horizontal through-hole with teardrop profile (point up)
// Use for holes through rod tips, frame bars, etc.
module cord_hole_horizontal(d=cord_hole_d, length=20) {
    cord_teardrop(length);
}

// Horizontal cord attachment with teardrop + countersink
module cord_attachment_horizontal(d=cord_hole_d, length=20,
                                  cs_d=cord_countersink_d,
                                  cs_depth=cord_countersink_depth) {
    cord_teardrop_attachment(length);
}

// --- Legacy (unoptimized, for backward compatibility) ---

// Simple uncompensated hole (use when exact diameter matters more than print quality)
module cord_hole_exact(d=cord_hole_d, length=20) {
    cylinder(d=d, h=length, center=true, $fn=24);
}

// Cord slot (open on one side, for threading)
module cord_slot(d=cord_slot_d, length=20, depth=10) {
    hull() {
        cylinder(d=d, h=length, center=true, $fn=24);
        translate([depth, 0, 0])
            cylinder(d=d, h=length, center=true, $fn=24);
    }
}
