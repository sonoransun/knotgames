// EXKNOTS - Puzzle 4: Mobius Snare
// FDM 3D Printable Version
//
// SUBSTITUTION: Chrome-tanned leather → TPU 95A flat strip
// The strip is printed flat, then bent with a 180° half-twist and riveted.
//
// Parts: Flat strip (TPU) + Ring (PLA) + 2 rivet caps (PLA) + 250mm paracord
//
// Print settings:
//   Band:  TPU 95A, 0.20mm layers, 100% infill, 20-30mm/s, no supports
//   Ring:  PLA gold, 0.12mm layers, 100% infill
//   Rivet caps: PLA, 0.12mm layers, 100% infill

include <../common/parameters.scad>
use <../common/ring.scad>

// Puzzle-specific parameters
p4_band_length = 300;
p4_band_width = 25;
p4_band_thickness = 2;
p4_rivet_hole_d = 4;
p4_rivet_spacing = 12;    // Distance between two rivet holes
p4_overlap = 15;           // Overlap for riveting
p4_ring_od = 40;
p4_texture_depth = 0.3;   // Grid texture depth on one face
p4_texture_spacing = 5;   // Grid line spacing

// Part selector
part = "assembly";

if (part == "band") {
    p4_band();
} else if (part == "ring") {
    torus_ring(p4_ring_od, ring_wire_d);
} else if (part == "rivet") {
    p4_rivet_cap();
} else {
    p4_assembly();
}

// Flat TPU strip with rivet holes and one-side texture
module p4_band() {
    difference() {
        union() {
            // Main strip
            cube([p4_band_length, p4_band_width, p4_band_thickness]);

            // Grid texture on top face (distinguishes the two "sides")
            for (x = [0 : p4_texture_spacing : p4_band_length]) {
                translate([x, 0, p4_band_thickness])
                    cube([0.8, p4_band_width, p4_texture_depth]);
            }
            for (y = [0 : p4_texture_spacing : p4_band_width]) {
                translate([0, y, p4_band_thickness])
                    cube([p4_band_length, 0.8, p4_texture_depth]);
            }
        }

        // Rivet holes at left end
        translate([p4_overlap/2 - p4_rivet_spacing/2, p4_band_width/2, -1])
            cylinder(d=p4_rivet_hole_d, h=p4_band_thickness + 4, $fn=24);
        translate([p4_overlap/2 + p4_rivet_spacing/2, p4_band_width/2, -1])
            cylinder(d=p4_rivet_hole_d, h=p4_band_thickness + 4, $fn=24);

        // Matching rivet holes at right end
        translate([p4_band_length - p4_overlap/2 - p4_rivet_spacing/2,
                   p4_band_width/2, -1])
            cylinder(d=p4_rivet_hole_d, h=p4_band_thickness + 4, $fn=24);
        translate([p4_band_length - p4_overlap/2 + p4_rivet_spacing/2,
                   p4_band_width/2, -1])
            cylinder(d=p4_rivet_hole_d, h=p4_band_thickness + 4, $fn=24);
    }
}

// Snap-rivet cap (print 2)
module p4_rivet_cap() {
    // Head
    cylinder(d=8, h=1.5, $fn=24);
    // Shaft (press-fit into rivet hole)
    translate([0, 0, 1.5])
        cylinder(d=p4_rivet_hole_d - 0.2, h=p4_band_thickness * 2 + 0.5, $fn=24);
    // Barb at end
    translate([0, 0, 1.5 + p4_band_thickness * 2])
        cylinder(d1=p4_rivet_hole_d - 0.2, d2=p4_rivet_hole_d + 0.5,
                 h=0.8, $fn=24);
}

module p4_assembly() {
    // Band (flat, before bending)
    color("saddlebrown") p4_band();

    // Ring
    color("gold")
    translate([p4_band_length/2, p4_band_width/2, -30])
        torus_ring(p4_ring_od, ring_wire_d);

    // Assembly note
    echo("ASSEMBLY: Bend strip with 180° half-twist. Overlap ends. Insert rivet caps.");
    echo("The grid-textured side should be continuous after the Mobius twist.");
}
