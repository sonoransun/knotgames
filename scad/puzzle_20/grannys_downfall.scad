// EXKNOTS - Puzzle 20: The Granny's Downfall
// FDM 3D Printable Version
//
// Parts: Mold board (1) + Bridge coupon (1 — PRINT THIS FIRST) +
//        two 750mm loops of 5mm braided nylon cord (not printed, bury-spliced closed)
//
// The mold board is a base plate carved with the flattened symmetric
// square-knot diagram: a closed channel one cord deep, with six integral
// roofed bridges — one per crossing — that force the under-strand through
// a tunnel while the over-strand rides an open groove across the top.
// Exactly one of the two cord loops (the square knot) can lie fully seated.
//
// NOTE: this puzzle uses 5mm cord (p20_cord_d), NOT the series-standard
// 4mm paracord (global cord_d) — thicker cord makes the six crossings
// readable at arm's length and survives repeated seating.
//
// Print settings:
//   Bridge coupon: PETG, 0.20mm layers, 30% infill, 3 shells, flat on bed,
//                  no supports (~30 min). Print FIRST: confirm the 5mm cord
//                  slides freely through the tunnel and that the roof does
//                  not sag before committing to the multi-hour board.
//   Mold board:    PETG, 0.20mm layers, 30% infill, 3 shells, flat on bed,
//                  no supports (~3 h). Bridges print integral with the board;
//                  tunnel roofs are short bridges (see bridge_check below).
//
// Print orientation: both parts flat on the bed, channel openings up.
//
// Optimizations applied:
//   - All tunnel-roof spans kept <= 12mm (well under bridge_max_reliable)
//   - Tunnel headroom recessed into the bridge underside so the bore is a
//     true 7x7mm despite the 6mm channel depth
//   - Over-strand grooves get 45-degree entry/exit ramps (no cord climbing
//     a vertical wall, no support material)
//   - 0.6mm chamfer flare on all channel top edges (solvers seat and unseat
//     cord many times)
//   - Bridge coupon reproduces one full crossing at the true 75.5-degree
//     strand angle for clearance tuning

include <../common/parameters.scad>
use <../common/bridges.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>

// ---------------------------------------------------------------------------
// Puzzle-specific parameters
// (p20_mold_w/d/h mirror MOLD_W/D/H in puzzles/puzzle-20.js)
// ---------------------------------------------------------------------------
p20_mold_w = 200;                 // board width  (x)
p20_mold_d = 120;                 // board depth  (y)
p20_mold_h = 14;                  // board height (z)

p20_cord_d = 5;                   // 5mm braided nylon cord (local override of cord_d=4)

p20_channel_w = p20_cord_d + 2;         // 7mm groove width  — ~2mm seating clearance
p20_channel_depth = p20_cord_d + 1;     // 6mm groove depth  — seated cord sits sub-flush

p20_tunnel_w = 7;                 // bridge tunnel bore width  (md: 7x7 tunnel)
p20_tunnel_h = 7;                 // bridge tunnel bore height
p20_roof_t = wall_min * 2;        // 2.4mm tunnel roof (two structural skins)

// Derived vertical stack (board top = p20_mold_h):
//   channel floor  z =  8   (mold_h - channel_depth)
//   tunnel ceiling z = 15   (floor + tunnel_h; 1mm recessed into the bridge)
//   roof top       z = 17.4 (over-strand groove floor)
//   bridge top     z = 20   (roof + open over-groove)
p20_tunnel_top = p20_mold_h - p20_channel_depth + p20_tunnel_h;
p20_over_groove_depth = 2.6;
p20_bridge_top = p20_tunnel_top + p20_roof_t + p20_over_groove_depth;

p20_bridge_len = 16;              // bridge block length, along the under-strand
p20_bridge_wide = 13;             // bridge block width, across the under-strand

// Both strands cross at 75.52 degrees at every crossing of this diagram
// (computed from the trefoil parametrization shared with puzzles/puzzle-20.js).
p20_cross_angle = 75.52;

// Worst unsupported roof span when printing: the long diagonal of the
// crossing void (two 7mm grooves overlapping at p20_cross_angle) that the
// bridge underside must bridge over = w / sin(angle/2) = 11.43mm.
p20_bridge_span = p20_channel_w / sin(p20_cross_angle / 2);

p20_coupon_w = 36;                // bridge coupon plate size (square)

// ---------------------------------------------------------------------------
// Hand-coded 2D polyline of the flattened symmetric square-knot diagram.
// Same geometry as puzzles/puzzle-20.js: two trefoil factors (trefoilLocal:
// x = sin t + 2 sin 2t, y = cos t - 2 cos 2t) with a short arc trimmed at
// one lobe apex (LOBE_GAP = 0.25 rad), mouths facing each other at
// x = +/-3.9 units (LOBE_SPREAD), scaled by FLAT_SCALE = 13. The two open
// mouths are joined by two straight parallel neck strands at y = +/-9.25 —
// the sum sphere's equator. Closing the chain (last -> first point) forms
// the return neck strand, so the polyline is ONE closed loop.
// Handedness lives entirely in the bridges (over/under), not in this plan.
// ---------------------------------------------------------------------------
p20_left_arc = [
    [ -15.29,   9.25], [ -21.07,  13.84], [ -28.97,  16.62], [ -38.25,  17.16],
    [ -48.07,  15.28], [ -57.54,  11.06], [ -65.81,   4.84], [ -72.19,  -2.80],
    [ -76.17, -11.14], [ -77.51, -19.33], [ -76.23, -26.53], [ -72.62, -31.97],
    [ -67.20, -35.04], [ -60.65, -35.34], [ -53.78, -32.74], [ -47.39, -27.38],
    [ -42.22, -19.69], [ -38.86, -10.29], [ -37.70,   0.00], [ -38.86,  10.29],
    [ -42.22,  19.69], [ -47.39,  27.38], [ -53.78,  32.74], [ -60.65,  35.34],
    [ -67.20,  35.04], [ -72.62,  31.97], [ -76.23,  26.53], [ -77.51,  19.33],
    [ -76.17,  11.14], [ -72.19,   2.80], [ -65.81,  -4.84], [ -57.54, -11.06],
    [ -48.07, -15.28], [ -38.25, -17.16], [ -28.97, -16.62], [ -21.07, -13.84],
    [ -15.29,  -9.25]
];

p20_right_arc = [
    [  15.29,  -9.25], [  21.07, -13.84], [  28.97, -16.62], [  38.25, -17.16],
    [  48.07, -15.28], [  57.54, -11.06], [  65.81,  -4.84], [  72.19,   2.80],
    [  76.17,  11.14], [  77.51,  19.33], [  76.23,  26.53], [  72.62,  31.97],
    [  67.20,  35.04], [  60.65,  35.34], [  53.78,  32.74], [  47.39,  27.38],
    [  42.22,  19.69], [  38.86,  10.29], [  37.70,   0.00], [  38.86, -10.29],
    [  42.22, -19.69], [  47.39, -27.38], [  53.78, -32.74], [  60.65, -35.34],
    [  67.20, -35.04], [  72.62, -31.97], [  76.23, -26.53], [  77.51, -19.33],
    [  76.17, -11.14], [  72.19,  -2.80], [  65.81,   4.84], [  57.54,  11.06],
    [  48.07,  15.28], [  38.25,  17.16], [  28.97,  16.62], [  21.07,  13.84],
    [  15.29,   9.25]
];

// Closed loop: left arc, neck strand (left[last] -> right[0]), right arc,
// return neck strand (right[last] -> wrap to left[0]).
p20_channel_path = concat(p20_left_arc, p20_right_arc);

// Six crossings of the SQUARE knot (left factor L-handed, right factor
// R-handed; weave w = hand * -sin 3t picks the under branch).
// Crossings sit at radius 19.5 from each factor center (+/-50.7, 0) —
// identical to bridgeSpecs() in puzzles/puzzle-20.js.
// Columns: [x, y, under-strand tangent (deg), over-groove angle rel. to it]
// The relative angle is 180 - 75.52 on the left (L) factor and 75.52 on the
// right (R) factor — the mirror pair is exactly what makes this the square
// knot's diagram rather than the granny's.
p20_bridges = [
    [ -40.95,  16.89,   7.76, 104.48],   // L factor, upper crossing
    [ -70.20,   0.00, 127.76, 104.48],   // L factor, outer crossing
    [ -40.95, -16.89,  67.76, 104.48],   // L factor, lower crossing
    [  40.95, -16.89, 112.24,  75.52],   // R factor, lower crossing
    [  70.20,   0.00,  52.24,  75.52],   // R factor, outer crossing
    [  40.95,  16.89, 172.24,  75.52]    // R factor, upper crossing
];

// ---------------------------------------------------------------------------
// Constraint assertions
// ---------------------------------------------------------------------------
assert(p20_channel_w > p20_cord_d + 1,
       str("Channel width (", p20_channel_w, "mm) must exceed cord + 1mm (",
           p20_cord_d + 1, "mm): the correct loop must seat WITHOUT force"));
assert(p20_tunnel_w >= p20_cord_d + 1,
       str("Tunnel bore width (", p20_tunnel_w, "mm) must be at least cord + 1mm (",
           p20_cord_d + 1, "mm)"));
assert(p20_tunnel_h > p20_cord_d + clearance,
       str("Tunnel bore height (", p20_tunnel_h, "mm) must exceed cord + clearance (",
           p20_cord_d + clearance, "mm)"));
assert(p20_roof_t >= wall_min * 2,
       str("Tunnel roof (", p20_roof_t, "mm) below two structural skins (",
           wall_min * 2, "mm)"));
assert(p20_bridge_span <= 12, "keep bridge roofs printable without supports");
assert(p20_mold_w <= 220 && p20_mold_d <= 220,
       str("Mold board (", p20_mold_w, "x", p20_mold_d,
           "mm) must fit a 220mm print bed"));
// Channel must stay on the plate with a solid margin wall all around
assert(max([for (p = p20_channel_path) abs(p[0])]) + p20_channel_w / 2 + 4
           <= p20_mold_w / 2,
       "Channel polyline overruns the board in x");
assert(max([for (p = p20_channel_path) abs(p[1])]) + p20_channel_w / 2 + 4
           <= p20_mold_d / 2,
       "Channel polyline overruns the board in y");

// Tunnel roofs print as unsupported bridges: check both the straight span
// across the bore and the worst diagonal over the crossing void.
bridge_check("p20_tunnel_roof", p20_tunnel_w);
bridge_check("p20_crossing_void", p20_bridge_span);

// Part selector: "assembly" | "mold" | "bridge_coupon"
part = "assembly";

if (part == "mold") {
    shell_info("mold", "enclosure");
    layer_opt_info("mold", p20_bridge_top, "standard");
    p20_mold();
} else if (part == "bridge_coupon") {
    shell_info("bridge_coupon", "enclosure");
    layer_opt_info("bridge_coupon", p20_bridge_top, "standard");
    p20_bridge_coupon();
} else {
    p20_assembly();
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

// 2D stroke along a polyline: union of hulled circle pairs, one per segment.
// Handles self-crossing paths (a knot diagram!) where polygon offsetting
// cannot. closed=true adds the wrap-around segment.
module p20_path_stroke(pts, w, closed=true) {
    n = len(pts);
    for (i = [0 : (closed ? n - 1 : n - 2)])
        hull() {
            translate(pts[i]) circle(d=w, $fn=24);
            translate(pts[(i + 1) % n]) circle(d=w, $fn=24);
        }
}

// The full channel cut: constant-depth groove following the closed polyline,
// plus a 0.6mm chamfer flare on the top edges (repeated seating/unseating).
module p20_channel_cut() {
    translate([0, 0, p20_mold_h - p20_channel_depth])
        linear_extrude(p20_channel_depth + 1)
            p20_path_stroke(p20_channel_path, p20_channel_w);
    translate([0, 0, p20_mold_h - 0.6])
        linear_extrude(1)
            p20_path_stroke(p20_channel_path, p20_channel_w + 1.2);
}

// Open groove for the over-strand across a bridge top, in the groove's own
// frame (groove axis = local x). Flat floor over the tunnel roof, then a
// ~45-degree ramp down each side so the cord walks up the block instead of
// climbing a vertical wall.
module p20_over_groove() {
    gf = p20_bridge_top - p20_over_groove_depth;   // groove floor (roof top)
    x0 = 5;                                        // flat floor half-length
    x1 = x0 + (gf - p20_mold_h) + 1;               // ramp foot, past the block edge
    // flat slot over the tunnel roof
    translate([-x0, -p20_channel_w / 2, gf])
        cube([2 * x0, p20_channel_w, p20_bridge_top - gf + 2]);
    // descending entry/exit ramps (hull floor slopes gf -> board surface)
    for (s = [1, -1])
        scale([s, 1, 1])
            hull() {
                translate([x0 - 0.2, -p20_channel_w / 2, gf])
                    cube([0.2, p20_channel_w, p20_bridge_top - gf + 2]);
                translate([x1, -p20_channel_w / 2, p20_mold_h])
                    cube([0.2, p20_channel_w, p20_bridge_top - p20_mold_h + 2]);
            }
}

// One bridge block, under-strand axis = local x, sitting on the board top.
// Underside recess raises the bore ceiling to p20_tunnel_top so the tunnel
// is a full p20_tunnel_w x p20_tunnel_h bore above the channel floor.
// over_rel: angle of the over-strand groove relative to the tunnel axis.
module p20_bridge_block(over_rel) {
    difference() {
        translate([0, 0, (p20_mold_h + p20_bridge_top) / 2])
            cube([p20_bridge_len, p20_bridge_wide,
                  p20_bridge_top - p20_mold_h], center=true);
        // tunnel headroom recess along the full block length
        translate([0, 0, p20_mold_h + (p20_tunnel_top - p20_mold_h) / 2 - 0.05])
            cube([p20_bridge_len + 2, p20_tunnel_w,
                  p20_tunnel_top - p20_mold_h + 0.1], center=true);
        // open over-strand groove across the roof
        rotate([0, 0, over_rel])
            p20_over_groove();
    }
}

// The mold board: plate minus the swept channel, plus six roofed bridges.
module p20_mold() {
    difference() {
        translate([0, 0, p20_mold_h / 2])
            cube([p20_mold_w, p20_mold_d, p20_mold_h], center=true);
        p20_channel_cut();
    }
    for (b = p20_bridges)
        translate([b[0], b[1], 0])
            rotate([0, 0, b[2]])
                p20_bridge_block(b[3]);
}

// Test coupon: ONE crossing's bridge on a small plate — two straight grooves
// meeting at the true 75.5-degree crossing angle, one roofed bridge. Print
// and tune clearances here before committing to the multi-hour board.
module p20_bridge_coupon() {
    groove_l = p20_coupon_w + 10;
    difference() {
        translate([0, 0, p20_mold_h / 2])
            cube([p20_coupon_w, p20_coupon_w, p20_mold_h], center=true);
        // under-strand groove along x, over-strand groove at the crossing angle
        translate([0, 0, p20_mold_h - p20_channel_depth])
            linear_extrude(p20_channel_depth + 1) {
                square([groove_l, p20_channel_w], center=true);
                rotate(p20_cross_angle)
                    square([groove_l, p20_channel_w], center=true);
            }
        // matching top-edge chamfer flare
        translate([0, 0, p20_mold_h - 0.6])
            linear_extrude(1) {
                square([groove_l, p20_channel_w + 1.2], center=true);
                rotate(p20_cross_angle)
                    square([groove_l, p20_channel_w + 1.2], center=true);
            }
    }
    p20_bridge_block(p20_cross_angle);
}

// Assembly view (visualization only — do not print as one piece).
// The seated loop is indicative: a cord-width ribbon lying in the channel,
// ignoring the over/under weave (it interpenetrates the bridges).
module p20_assembly() {
    color("burlywood") p20_mold();

    color("royalblue")
        translate([0, 0, p20_mold_h - p20_channel_depth])
            linear_extrude(p20_cord_d)
                p20_path_stroke(p20_channel_path, p20_cord_d);

    echo("ASSEMBLY: square-knot loop shown seated (indicative — weave not modeled).");
    echo("Thread the under-strand through each bridge tunnel; lay the over-strand in the roof groove.");
}
