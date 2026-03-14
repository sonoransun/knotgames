// EXKNOTS - Bridge Optimization Module
// Geometry aids for horizontal spans (bridges) in FDM printing.
//
// Bridges are horizontal spans between two supports with no material below.
// FDM can bridge ~40-60mm reliably, but quality degrades with distance.
// This module provides:
//   - Bridge-safe geometry (spire supports, sacrificial layers)
//   - Flat-bottom overhangs (convert curved bottoms to flat for bridging)
//   - Bridge length validation
//
// Usage:
//   include <bridges.scad>
//   bridge_flat_bottom(width=40, depth=10, height=5);
//   assert(bridge_ok(span), "Bridge span too long");

include <parameters.scad>

// --- Bridge Limits ---

bridge_max_reliable = 40;   // mm, reliable bridge span (good quality)
bridge_max_possible = 80;   // mm, maximum possible span (poor quality)
bridge_layer_h = 0.2;       // Bridges print best at standard layer height

// Validate bridge span
function bridge_ok(span) = span <= bridge_max_reliable;
function bridge_marginal(span) = span > bridge_max_reliable && span <= bridge_max_possible;

// --- Bridge Geometry Helpers ---

// Flat-bottom bridge: replaces a curved bottom with a flat surface
// for cleaner bridging. Use as a difference() from curved geometry.
// Place at the bottom of any feature that spans unsupported.
module bridge_flat_bottom(width, depth, flat_h=layer_h) {
    translate([0, 0, -flat_h/2])
        cube([width, depth, flat_h], center=true);
}

// Bridge support spire: a thin vertical pillar that supports a bridge
// midpoint, then breaks away cleanly. Use for spans > bridge_max_reliable.
// spire_d should be 1-2 nozzle widths (easy to snap off).
module bridge_spire(h, d=nozzle_d*2) {
    cylinder(d=d, h=h, $fn=8);
}

// Sacrificial bridge layer: a thin horizontal sheet printed below a
// bridge to improve surface quality. Remove after printing.
// Placed gap_h below the bridge surface.
module sacrificial_bridge_layer(width, depth, gap_h=0.3) {
    translate([0, 0, -gap_h])
        cube([width, depth, layer_h], center=true);
}

// --- Bridge-Optimized Hole (horizontal) ---
// A horizontal hole with a flat top to eliminate the unsupported arch.
// The top of the hole is flattened by one layer height, creating a
// short bridge instead of a curved overhang.
// Use for horizontal through-holes where teardrop is not desired.
module bridge_hole(d, length, flat_top=true) {
    if (flat_top) {
        intersection() {
            // Standard cylinder
            rotate([0, 90, 0])
                cylinder(d=d, h=length, center=true, $fn=32);
            // Clip top to flat (one layer below the crown)
            translate([0, 0, -d])
                cube([length + 2, d + 2, d * 2 - layer_h], center=true);
        }
    } else {
        rotate([0, 90, 0])
            cylinder(d=d, h=length, center=true, $fn=32);
    }
}

// --- Internal Bridge Supports ---
// For large hollow sections, add internal bridge ribs that assist
// bridging during print and can optionally be left in place.

// Internal rib (thin wall inside a hollow section)
module bridge_rib(width, height, thickness=nozzle_d*3) {
    cube([thickness, width, height], center=true);
}

// Cross-rib pattern for large flat roofs (e.g., inside base blocks)
module bridge_cross_ribs(w, d, h, spacing=15, thickness=nozzle_d*3) {
    // Ribs along X
    for (y = [-d/2 + spacing : spacing : d/2 - spacing]) {
        translate([0, y, 0])
            cube([w - 4, thickness, h], center=true);
    }
    // Ribs along Y
    for (x = [-w/2 + spacing : spacing : w/2 - spacing]) {
        translate([x, 0, 0])
            cube([thickness, d - 4, h], center=true);
    }
}

// --- Validation ---

module bridge_check(part_name, span) {
    if (bridge_ok(span))
        echo(str("BRIDGE [", part_name, "]: ", span, "mm — OK"));
    else if (bridge_marginal(span))
        echo(str("BRIDGE [", part_name, "]: ", span,
                 "mm — MARGINAL (consider spire supports)"));
    else
        echo(str("BRIDGE [", part_name, "]: ", span,
                 "mm — TOO LONG (add supports or redesign)"));
}
