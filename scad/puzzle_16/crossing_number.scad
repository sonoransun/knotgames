// EXKNOTS - Puzzle 16: Crossing Number
// FDM 3D Printable Version
//
// Parts: fig8_frame (1) + pin (4) + ring (1) + base (1)
// Figure-eight knot wire frame with 4 removable/flippable crossing pins,
// a ring, and a flat base.
// Print frame with supports, pins upright, ring flat on side, base flat.
//
// Print settings:
//   Fig-8 frame: PLA, 0.20mm layers, 100% infill, 5 shells, supports needed
//   Pin:         PLA, 0.20mm layers, 100% infill, 5 shells, no supports
//   Ring:        PLA gold, 0.12mm layers, 100% infill, 4 shells, brim 3mm
//   Base:        PLA wood-fill, 0.20mm layers, 30% infill, 3 shells, no supports
//
// Optimizations applied:
//   - Pin sockets on frame for removable crossing markers
//   - Flat-bottom ball caps on pins for support-free printing
//   - Polyline rod hull-chain for smooth figure-eight curves
//   - Layer height: 0.12mm fine for ring, 0.20mm for frame/pins/base
//   - Shell profile: "structural" for frame and pins, "torus" for ring, "enclosure" for base

include <../common/parameters.scad>
use <../common/rod.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/corners.scad>
use <../common/holes.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>
use <../common/press_fit.scad>

// Puzzle-specific parameters
p16_scale = 18;
p16_frame_span = 150;     // Approximate span of figure-eight frame
p16_fig8_steps = 60;
p16_ring_od = 25;
p16_pin_d = 5;
p16_pin_h = 20;
p16_pin_ball_d = 10;
p16_pin_socket_depth = 8;
p16_base_w = 150;
p16_base_d = 150;
p16_base_h = 8;
p16_num_crossings = 4;

// Constraint assertions
assert(p16_ring_od - ring_wire_d * 2 > rod_d + clearance * 2,
       str("Ring ID (", p16_ring_od - ring_wire_d * 2,
           "mm) must be larger than frame rod diameter (",
           rod_d, "mm) for ring to slide"));
assert(p16_pin_d < p16_pin_ball_d,
       "Pin ball cap must be larger than pin shaft");
assert(p16_base_w >= p16_frame_span * 0.9,
       "Base should be at least as wide as the frame span");

// Part selector: "assembly" | "fig8_frame" | "pin" | "ring" | "base"
part = "assembly";

if (part == "fig8_frame") {
    shell_info("fig8_frame", "structural");
    layer_opt_info("fig8_frame", p16_scale * 2, "standard");
    p16_fig8_frame();
} else if (part == "pin") {
    shell_info("pin", "structural");
    layer_opt_info("pin", p16_pin_h + p16_pin_ball_d, "fine_top");
    p16_pin();
} else if (part == "ring") {
    shell_info("ring", "torus");
    layer_opt_info("ring", ring_wire_d, "all_fine");
    torus_ring(p16_ring_od, ring_wire_d);
} else if (part == "base") {
    shell_info("base", "enclosure");
    layer_opt_info("base", p16_base_h, "standard");
    p16_base();
} else {
    p16_assembly();
}

// Generate figure-eight knot point at parameter t
// Parametric: x = (2+cos(2t))*cos(3t)*scale, y = (2+cos(2t))*sin(3t)*scale, z = sin(4t)*scale
function p16_fig8_point(t) = [
    (2 + cos(2 * t)) * cos(3 * t) * p16_scale,
    (2 + cos(2 * t)) * sin(3 * t) * p16_scale,
    sin(4 * t) * p16_scale
];

// Generate full figure-eight point array
function p16_fig8_points() = [
    for (i = [0:p16_fig8_steps])
        p16_fig8_point(360 * i / p16_fig8_steps)
];

// Approximate crossing positions on the figure-eight knot
// These are parameter values where crossings occur
p16_crossing_t_values = [45, 135, 225, 315];

// Figure-eight knot wire frame with pin sockets at crossings
module p16_fig8_frame() {
    points = p16_fig8_points();

    difference() {
        // Main frame
        polyline_rod(points, rod_d);

        // Pin sockets at crossing positions
        for (i = [0:p16_num_crossings - 1]) {
            t = p16_crossing_t_values[i];
            pos = p16_fig8_point(t);
            translate(pos)
                cylinder(d=p16_pin_d + press_fit_clearance * 2,
                         h=p16_pin_socket_depth + 0.5, $fn=24);
        }
    }

    // Socket hole info
    for (i = [0:p16_num_crossings - 1]) {
        hole_info(str("crossing_", i), p16_pin_d, "vertical");
    }
}

// Removable/flippable crossing pin with ball cap
module p16_pin() {
    // Pin shaft
    cylinder(d=p16_pin_d, h=p16_pin_h, $fn=$fn);

    // Ball cap at top
    translate([0, 0, p16_pin_h])
        flat_bottom_sphere(p16_pin_ball_d);
}

// Flat base
module p16_base() {
    rounded_cube([p16_base_w, p16_base_d, p16_base_h], r=2);
}

// Assembly view (for visualization only)
module p16_assembly() {
    // Base
    color("BurlyWood") p16_base();

    // Figure-eight frame (raised above base)
    color("Silver")
    translate([0, 0, p16_base_h / 2 + p16_scale + rod_d])
        p16_fig8_frame();

    // Crossing pins
    for (i = [0:p16_num_crossings - 1]) {
        t = p16_crossing_t_values[i];
        pos = p16_fig8_point(t);
        color("Crimson")
        translate([pos[0], pos[1], pos[2] + p16_base_h / 2 + p16_scale + rod_d])
            p16_pin();
    }

    // Ring (positioned on the frame)
    color("Gold")
    translate([p16_scale * 2.5, 0, p16_base_h / 2 + p16_scale + rod_d])
    rotate([90, 0, 0])
        torus_ring(p16_ring_od, ring_wire_d);
}
