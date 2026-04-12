// EXKNOTS - Puzzle 17: Satellite Trap
// FDM 3D Printable Version
//
// Parts: torus_shell_half (2) + ring_inner (1) + ring_outer (1) + ball_stop (2)
// Split torus shell with internal (2,3) torus knot tunnel,
// inner and outer rings, and ball stops.
// Print each shell half flat-side down, rings flat on side, ball stops flat-bottom.
//
// Print settings:
//   Shell halves: PLA, 0.20mm layers, 30% infill, 4 shells, no supports
//   Ring inner:   PLA gold, 0.12mm layers, 100% infill, 4 shells, brim 3mm
//   Ring outer:   PLA silver, 0.12mm layers, 100% infill, 4 shells, brim 3mm
//   Ball stop:    PLA, 0.20mm layers, 100% infill, 5 shells, no supports
//
// Optimizations applied:
//   - Shell splits along XZ plane with alignment pins/sockets
//   - Internal trefoil (2,3) torus knot tunnel for cord routing
//   - Flat-bottom ball stops for support-free printing
//   - Layer height: 0.12mm fine for rings, 0.20mm for shell and ball stops
//   - Shell profile: "enclosure" for torus shell, "torus" for rings, "structural" for ball stops

include <../common/parameters.scad>
use <../common/ring.scad>
use <../common/ball.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>
use <../common/press_fit.scad>

// Puzzle-specific parameters
p17_torus_od = 120;
p17_tube_d = 20;
p17_major_r = (p17_torus_od - p17_tube_d) / 2;  // 50mm
p17_minor_r = p17_tube_d / 2;                     // 10mm
p17_tunnel_d = 6;             // Internal tunnel diameter
p17_knot_p = 2;              // Torus knot p parameter (winds around hole)
p17_knot_q = 3;              // Torus knot q parameter (winds around tube)
p17_ring_inner_od = 22;
p17_ring_outer_od = 30;
p17_ball_d = 10;
p17_align_pin_d = 3;
p17_align_pin_h = 6;
p17_knot_steps = 36;
p17_clip_clearance = 0.2;

// Constraint assertions
assert(p17_tunnel_d < p17_tube_d - wall_min * 2,
       str("Tunnel diameter (", p17_tunnel_d, "mm) must leave sufficient wall (",
           wall_min, "mm min) within tube diameter (", p17_tube_d, "mm)"));
assert(p17_ring_inner_od < p17_ring_outer_od,
       "Inner ring must be smaller than outer ring");
assert(p17_ring_inner_od - ring_wire_d * 2 > p17_tunnel_d,
       str("Inner ring ID (", p17_ring_inner_od - ring_wire_d * 2,
           "mm) must exceed tunnel diameter (", p17_tunnel_d, "mm)"));
assert(p17_ball_d > p17_tunnel_d,
       "Ball stops must be larger than tunnel diameter to act as stops");

// Part selector: "assembly" | "torus_shell_half" | "ring_inner" | "ring_outer" | "ball_stop"
part = "assembly";

if (part == "torus_shell_half") {
    shell_info("torus_shell_half", "enclosure");
    layer_opt_info("torus_shell_half", p17_minor_r, "standard");
    p17_torus_shell_half();
} else if (part == "ring_inner") {
    shell_info("ring_inner", "torus");
    layer_opt_info("ring_inner", ring_wire_d, "all_fine");
    torus_ring(p17_ring_inner_od, ring_wire_d);
} else if (part == "ring_outer") {
    shell_info("ring_outer", "torus");
    layer_opt_info("ring_outer", ring_wire_d, "all_fine");
    torus_ring(p17_ring_outer_od, ring_wire_d);
} else if (part == "ball_stop") {
    shell_info("ball_stop", "structural");
    layer_opt_info("ball_stop", p17_ball_d, "standard");
    p17_ball_stop();
} else {
    p17_assembly();
}

// (2,3) torus knot point on the torus surface
// The knot winds p times around the torus hole and q times around the tube
function p17_knot_point(t) =
    let(
        // Position along torus tube center
        phi = p17_knot_p * t,
        // Position around tube cross-section
        theta = p17_knot_q * t,
        // Offset from tube center (tunnel sits inside tube wall)
        tunnel_r = p17_minor_r * 0.6,
        // Point on torus tube center circle
        cx = cos(phi) * p17_major_r,
        cy = sin(phi) * p17_major_r,
        // Direction from center to tube center (radial)
        dx = cos(phi),
        dy = sin(phi),
        // Offset around the tube cross-section
        ox = dx * cos(theta) * tunnel_r,
        oy = dy * cos(theta) * tunnel_r,
        oz = sin(theta) * tunnel_r
    )
    [cx + ox, cy + oy, oz];

// Generate full torus knot tunnel path
function p17_knot_points() = [
    for (i = [0:p17_knot_steps])
        p17_knot_point(360 * i / p17_knot_steps)
];

// Internal tunnel following (2,3) torus knot inside tube wall
module p17_torus_knot_tunnel() {
    points = p17_knot_points();
    for (i = [0:len(points) - 2]) {
        hull() {
            translate(points[i]) sphere(d=p17_tunnel_d, $fn=12);
            translate(points[i + 1]) sphere(d=p17_tunnel_d, $fn=12);
        }
    }
}

// Full torus shell (before splitting)
module p17_torus_shell_full() {
    difference() {
        // Outer torus
        rotate_extrude($fn=fn_detail)
        translate([p17_major_r, 0, 0])
            circle(r=p17_minor_r, $fn=32);

        // Internal torus knot tunnel
        p17_torus_knot_tunnel();
    }
}

// Half of the torus shell (split along XZ plane, Y >= 0)
// Includes alignment pin sockets on the split face
module p17_torus_shell_half() {
    difference() {
        intersection() {
            p17_torus_shell_full();
            // Keep Y >= -clip_clearance (the positive-Y half)
            translate([0, (p17_torus_od + p17_tube_d) / 2, 0])
                cube([p17_torus_od + p17_tube_d + 2,
                      p17_torus_od + p17_tube_d + 2,
                      p17_tube_d + 2], center=true);
        }

        // Alignment pin sockets on split face
        for (x = [-p17_major_r, p17_major_r]) {
            translate([x, 0, 0])
            rotate([-90, 0, 0])
                align_socket(p17_align_pin_d, p17_align_pin_h);
        }
    }

    // Alignment pins (on one half only, protruding from split face)
    for (x = [-p17_major_r, p17_major_r]) {
        translate([x, -p17_align_pin_h, 0])
        rotate([-90, 0, 0])
            align_pin(p17_align_pin_d, p17_align_pin_h);
    }
}

// Ball stop with flat bottom for support-free printing
module p17_ball_stop() {
    flat_bottom_sphere(p17_ball_d);
}

// Assembly view (for visualization only)
module p17_assembly() {
    // Top half of torus shell
    color("SteelBlue", 0.8) p17_torus_shell_half();

    // Bottom half (mirrored)
    color("SteelBlue", 0.8)
    mirror([0, 1, 0])
        p17_torus_shell_half();

    // Inner ring (positioned at torus opening)
    color("Gold")
    translate([p17_major_r + p17_minor_r + 5, 0, 0])
    rotate([0, 90, 0])
        torus_ring(p17_ring_inner_od, ring_wire_d);

    // Outer ring (positioned around the torus)
    color("Silver")
    translate([0, 0, p17_minor_r + ring_wire_d])
        torus_ring(p17_ring_outer_od, ring_wire_d);

    // Ball stops
    color("Crimson")
    translate([p17_major_r + p17_minor_r + p17_ball_d, 0, 0])
        flat_bottom_sphere(p17_ball_d);

    color("Crimson")
    translate([-p17_major_r - p17_minor_r - p17_ball_d, 0, 0])
        flat_bottom_sphere(p17_ball_d);
}
