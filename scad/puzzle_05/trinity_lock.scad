// EXKNOTS - Puzzle 5: Trinity Lock (Borromean Rings)
// FDM 3D Printable Version
//
// Parts: 3 colored ovals (print separately in red, blue, yellow PLA)
// Print each oval flat on side (torus lying on bed)
//
// Print settings:
//   Each oval: PLA (color), 0.12mm layers, 100% infill, brim 3mm

include <../common/parameters.scad>
use <../common/ring.scad>

// Puzzle-specific parameters
p5_oval_long = 80;       // Major axis
p5_oval_short = 40;      // Minor axis
p5_wire_d = 8;           // Thickened for durability (was 4mm)

// Clearance check: narrow ID must accommodate two crossing rods
p5_narrow_id = p5_oval_short - p5_wire_d * 2;  // 40 - 16 = 24mm
assert(p5_narrow_id > p5_wire_d * 2,
       "Narrow ID must fit two crossing rods");
echo(str("Trinity Lock narrow clearance: ", p5_narrow_id - p5_wire_d, "mm"));

// Part selector
part = "assembly";

if (part == "oval_red") {
    p5_oval();
} else if (part == "oval_blue") {
    p5_oval();
} else if (part == "oval_yellow") {
    p5_oval();
} else if (part == "display_stand") {
    p5_display_stand();
} else {
    p5_assembly();
}

module p5_oval() {
    oval_torus(p5_oval_long, p5_oval_short, p5_wire_d);
}

// Display stand for assembled Borromean configuration
module p5_display_stand() {
    // Flat base
    cylinder(d=100, h=5, $fn=6);  // Hexagonal base

    // Three support pegs
    for (a = [0, 120, 240]) {
        translate([cos(a) * 25, sin(a) * 25, 5])
            cylinder(d=6, h=15, $fn=24);
    }
}

module p5_assembly() {
    // Red oval (XY plane)
    color("red")
        p5_oval();

    // Blue oval (XZ plane, rotated)
    color("blue")
    rotate([90, 0, 90])
        p5_oval();

    // Yellow oval (YZ plane, rotated)
    color("gold")
    rotate([90, 90, 0])
        p5_oval();
}
