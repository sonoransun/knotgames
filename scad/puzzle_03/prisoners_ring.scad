// EXKNOTS - Puzzle 3: The Prisoner's Ring
// FDM 3D Printable Version
//
// Parts: Frame with crossbar (1 piece) + Ring (1 piece) + 400mm paracord loop
// Print frame flat (rods on bed, brim 5mm), ring flat on side
//
// Print settings:
//   Frame: PLA silver, 0.20mm layers, 100% infill, brim 5mm
//   Ring:  PLA gold, 0.12mm layers, 100% infill

include <../common/parameters.scad>
use <../common/rod.scad>
use <../common/ring.scad>
use <../common/frame.scad>

// Puzzle-specific parameters
p3_frame_w = 100;
p3_frame_h = 150;
p3_ring_od = 50;
p3_crossbar_y = 0;  // At midpoint (center of frame)

// Part selector
part = "assembly";

if (part == "frame") {
    p3_frame();
} else if (part == "ring") {
    torus_ring(p3_ring_od, ring_wire_d);
} else {
    p3_assembly();
}

module p3_frame() {
    rect_frame_printable(p3_frame_w, p3_frame_h, rod_d, p3_crossbar_y);
}

module p3_assembly() {
    // Frame
    color("silver") p3_frame();

    // Ring hanging below frame
    color("gold")
    translate([0, -p3_frame_h/2 - 30, 0])
    rotate([90, 0, 0])
        torus_ring(p3_ring_od, ring_wire_d);
}
