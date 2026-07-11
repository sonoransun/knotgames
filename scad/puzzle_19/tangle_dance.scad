// EXKNOTS - Puzzle 19: The Tangle Dance
// FDM 3D Printable Version
//
// Parts: Frame plate (1) + Ball handle (print 4x: 2 blue, 2 red) +
//        two 500mm lengths of 4mm braided nylon cord, one blue and one
//        red (not printed) + setup card (not printed)
//
// A 170mm square plate frame with four corner cup sockets. Each socket is
// a 17mm hemispherical cup for the 16mm ball handle, over a slip-fit bore
// for the handle's 8mm stem, over a conical shoulder and a knot relief
// that houses the cord's stopper knot. The stem tip lands on the shoulder
// exactly when the ball floats concentric in the cup with a uniform 0.5mm
// gap — the stem keeps the ball proud of the cup, so handles lift out
// with two fingers yet re-seat positively. Embossed move glyphs (0.6mm
// relief): the T twist glyph (over/under crossing, "+1") on all four
// edges — it reads upright whenever its edge faces the solver's right,
// which after any R is the twist edge — and the R rotation arrow "-1/x"
// once, on the bottom bar (the plate center is open).
//
// Cord rigging: thread each cord down through its handle's axial bore
// (enter at the flat ball top, exit at the stem tip), tie a stopper knot
// below the stem tip, add a drop of CA. Tension pulls the knot against
// the stem tip; the knot rides in the socket's knot relief when seated.
//
// Print settings:
//   Frame plate: PETG, 0.20mm layers, 25% infill (per construction notes;
//                shell_info's 30% also fine), 3 shells, flat on bed with
//                cups up, no supports (cup recess widens upward; the
//                knot-relief taper is held at <= 45 deg).
//   Handle (x4): PLA (2 blue, 2 red), 0.12mm layers, 100% infill,
//                4 shells, ball flat-face down / stem up, 3mm brim,
//                no supports (ball-to-stem neck is ~30 deg from vertical).
//                NOTE: the 8mm stem around the 6mm cord bore leaves a
//                1.0mm wall (below wall_min) — slice stems at 0.35mm
//                extrusion width (3 thin perimeters) or enable
//                thin-wall/Arachne perimeters.
//
// Print orientation:
//   Frame plate: flat on bed, cup sockets facing up.
//   Handle:      flat ball pole on bed, stem straight up (bore vertical).
//
// Optimizations applied:
//   - Slip-fit stem bore (stem + 2x clearance) — handles cycle in and out
//     constantly; the cup, not the bore, provides the seating feel
//   - Knot relief widens below a <= 45 deg conical shoulder: printable
//     without supports, and the stopper knot never jams the bore
//   - Elephant's-foot chamfers (compensated_hole) on all vertical bores
//   - 3mm ball flat: 12.5mm bed-contact patch leaving a ~1.75mm-wide
//     first-layer ring around the 9mm cord-exit flare, and a comfortable
//     thumb pad where the cord leaves the ball
//   - Cup cut at $fn=120 (fn_detail) — seat feel is the puzzle

include <../common/parameters.scad>
use <../common/ball.scad>
use <../common/holes.scad>
use <../common/text_label.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>

// ---------------------------------------------------------------------------
// Puzzle-specific parameters
// (p19_frame_w/p19_frame_bar/p19_frame_t/p19_handle_d/p19_cup_d/p19_socket_xy
//  mirror FRAME_W/FRAME_BAR/FRAME_T/HANDLE_D/CUP_D/SOCKET_XY in
//  puzzles/puzzle-19.js)
// ---------------------------------------------------------------------------
p19_frame_w = 170;        // frame plate outer width (square)
p19_frame_bar = 18;       // frame bar width
p19_frame_t = 10;         // plate thickness
p19_handle_d = 16;        // ball handle diameter
p19_cup_d = 17;           // hemispherical cup diameter (md: 17.0 for 16mm balls)
p19_socket_xy = 52;       // cup centers at (+/-52, +/-52)

p19_handle_stem_d = 8;    // handle stem diameter
p19_socket_id = p19_handle_stem_d + clearance * 2;  // 8.6mm slip bore (NOT a press fit)

p19_gusset_w = 36;        // corner gusset square, carries cup across the open corner
p19_gusset_xy = 56;       // gusset centers
p19_boss_od = 24;         // raised cup boss diameter
p19_boss_h = 7;           // boss height above the plate face
p19_cup_depth = 6;        // cup recess depth below the boss top

p19_knot_relief_d = 13;   // stopper-knot cavity below the shoulder
p19_relief_h = 4;         // straight section of the knot relief
p19_cone_h = 2.5;         // relief-to-bore taper height (41 deg from vertical)

p19_ball_flat = 3;        // flat trimmed off the ball's cord-exit pole
p19_flare_d = 9;          // cord-exit flare at the flat pole
p19_glyph_relief = 0.6;   // embossed glyph height (md: 0.6mm relief)
p19_glyph_stroke = 2;     // glyph strand stroke width
p19_glyph_g = 6;          // glyph crossing half-span

// Derived socket stack (frame print orientation, z=0 at plate bottom):
//   knot relief   z 0   .. 4      (d 13)
//   cone shoulder z 4   .. 6.5    (d 13 -> 8.6; stem tip lands here)
//   stem bore     z 6.5 .. 12.5   (d 8.6)
//   cup recess    z 11  .. 17     (sphere d 17 centered at z 19.5)
p19_shoulder_z = p19_relief_h + p19_cone_h;                        // 6.5
p19_boss_top_z = p19_frame_t + p19_boss_h;                         // 17
p19_cup_center_z = p19_boss_top_z - p19_cup_depth + p19_cup_d / 2; // 19.5
p19_bore_h = p19_cup_center_z - p19_cup_d / 2 - p19_shoulder_z + 1.5;  // 6

// Stem length is DERIVED so that when the stem tip rests on the shoulder,
// the ball center coincides with the cup's center of curvature: the ball
// floats concentric with a uniform (cup - ball)/2 = 0.5mm gap.
p19_stem_l = p19_cup_center_z - p19_shoulder_z - p19_handle_d / 2; // 5, below ball bottom
p19_handle_h = p19_handle_d - p19_ball_flat + p19_stem_l;          // 18 print height
p19_seat_z = p19_shoulder_z + p19_handle_h;                        // 24.5, seated flat-pole height

// Cup rim opening (boss top plane cuts the cup sphere 2.5mm below center)
p19_rim_open = 2 * sqrt((p19_cup_d / 2) * (p19_cup_d / 2)
                        - (p19_cup_center_z - p19_boss_top_z)
                          * (p19_cup_center_z - p19_boss_top_z));  // 16.25

p19_bar_mid = (p19_frame_w - p19_frame_bar) / 2;   // bar centerline at +/-76

// ---------------------------------------------------------------------------
// Constraint assertions
// ---------------------------------------------------------------------------
assert(p19_socket_id >= p19_handle_stem_d + clearance * 2,
       str("Socket bore (", p19_socket_id, "mm) must give the ",
           p19_handle_stem_d, "mm stem at least ", clearance * 2,
           "mm of slip clearance — handles lift in and out constantly"));
assert(cord_hole_d > cord_d,
       str("Handle cord bore (", cord_hole_d, "mm) must exceed cord diameter (",
           cord_d, "mm) so the cord threads freely"));
assert(p19_frame_w - 2 * p19_frame_bar >= 120,
       "frame interior must admit hands");
assert(p19_frame_w <= 220,
       str("Frame plate (", p19_frame_w, "mm) must fit a 220mm print bed"));
assert(p19_cup_d > p19_handle_d,
       str("Cup (", p19_cup_d, "mm) must exceed ball (", p19_handle_d,
           "mm) — the md prints cups at 17.0 for 16mm balls; FDM holes shrink"));
assert(p19_rim_open > p19_handle_d,
       str("Cup rim opening (", p19_rim_open, "mm) must admit the ",
           p19_handle_d, "mm ball"));
assert(p19_stem_l >= 4,
       str("Derived stem length (", p19_stem_l,
           "mm) too short to key the socket bore"));
assert((p19_knot_relief_d - p19_socket_id) / 2 <= p19_cone_h,
       str("Knot-relief taper (", (p19_knot_relief_d - p19_socket_id) / 2,
           "mm radial over ", p19_cone_h,
           "mm) must stay at or under 45 deg to print without supports"));
assert(p19_knot_relief_d >= cord_d * 3,
       str("Knot relief (", p19_knot_relief_d,
           "mm) must house a stopper knot in ", cord_d, "mm cord"));
assert(p19_socket_xy - p19_boss_od / 2 >= p19_gusset_xy - p19_gusset_w / 2
       && p19_socket_xy + p19_boss_od / 2 <= p19_gusset_xy + p19_gusset_w / 2,
       "Cup boss must land fully on its corner gusset");
assert(p19_glyph_g + p19_glyph_stroke / 2 <= p19_frame_bar / 2,
       str("Twist glyph (", 2 * p19_glyph_g + p19_glyph_stroke,
           "mm) must fit across the ", p19_frame_bar, "mm bar"));

// Part selector: "assembly" | "frame" | "handle"
part = "assembly";

if (part == "frame") {
    shell_info("frame", "enclosure");
    layer_opt_info("frame", p19_boss_top_z, "standard");
    p19_frame();
} else if (part == "handle") {
    shell_info("handle", "cord_contact");
    layer_opt_info("handle", p19_handle_h, "all_fine");
    p19_handle();
} else {
    p19_assembly();
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

// 2D stroke between two points (hulled circle pair)
module p19_stroke_2d(a, b, w) {
    hull() {
        translate(a) circle(d=w, $fn=24);
        translate(b) circle(d=w, $fn=24);
    }
}

// Twist move glyph, embossed on the plate top face. Drawn for the edge
// facing the solver's RIGHT: the strand from upper-left to lower-right is
// continuous (it passes OVER); the lower-left to upper-right strand breaks
// at the crossing. The over/under sense is load-bearing — mirrored, it
// would teach x - 1 (md: Common Mistake 3 in reverse).
module p19_twist_glyph() {
    g = p19_glyph_g;
    translate([0, 0, p19_frame_t]) {
        linear_extrude(p19_glyph_relief) {
            // over-strand: continuous
            p19_stroke_2d([-g, g], [g, -g], p19_glyph_stroke);
            // under-strand: broken at the crossing
            p19_stroke_2d([-g, -g], [-2.2, -2.2], p19_glyph_stroke);
            p19_stroke_2d([2.2, 2.2], [g, g], p19_glyph_stroke);
        }
        // caption along the bar
        translate([0, 12, 0])
            puzzle_label("T +1", 4.5, p19_glyph_relief);
    }
}

// Rotation move glyph: 3/4 annulus arrow running clockwise (top -> right),
// arrowhead at the 3 o'clock end pointing down, caption "R -1/x".
module p19_rotate_glyph() {
    translate([0, 0, p19_frame_t]) {
        linear_extrude(p19_glyph_relief) {
            difference() {
                circle(r=7, $fn=48);
                circle(r=5, $fn=48);
                polygon([[0, 0], [20, 0], [20, 20], [0, 20]]);  // open the NE quadrant
            }
            polygon([[3.5, 0], [8.5, 0], [6, -4.8]]);  // clockwise arrowhead
        }
        translate([-23, 0, 0])
            puzzle_label("R -1/x", 4.5, p19_glyph_relief);
    }
}

// One corner socket cut, at the corner's local origin (z=0 at plate bottom)
module p19_socket_cut() {
    // stopper-knot relief, elephant's-foot chamfer at the bed face
    translate([0, 0, -0.01])
        compensated_hole(p19_knot_relief_d, p19_relief_h + 0.02);
    // conical shoulder — the stem tip bottoms out on this taper
    translate([0, 0, p19_relief_h])
        cylinder(d1=p19_knot_relief_d, d2=p19_socket_id, h=p19_cone_h, $fn=48);
    // slip-fit stem bore (base chamfer merges into the shoulder)
    translate([0, 0, p19_shoulder_z - 0.01])
        compensated_hole(p19_socket_id, p19_bore_h + 0.02);
    // hemispherical cup — the seat is the feel of the puzzle
    translate([0, 0, p19_cup_center_z])
        sphere(d=p19_cup_d, $fn=fn_detail);
}

// The frame plate: square ring + corner gussets + cup bosses, minus the
// four socket stacks, plus embossed move glyphs.
module p19_frame() {
    difference() {
        union() {
            // plate ring
            linear_extrude(p19_frame_t)
                difference() {
                    square(p19_frame_w, center=true);
                    square(p19_frame_w - 2 * p19_frame_bar, center=true);
                }
            // corner gussets and raised cup bosses
            for (sx = [-1, 1], sy = [-1, 1]) {
                translate([sx * p19_gusset_xy, sy * p19_gusset_xy, p19_frame_t / 2])
                    cube([p19_gusset_w, p19_gusset_w, p19_frame_t], center=true);
                translate([sx * p19_socket_xy, sy * p19_socket_xy, 0])
                    cylinder(d=p19_boss_od, h=p19_boss_top_z);
            }
        }
        // socket stacks
        for (sx = [-1, 1], sy = [-1, 1])
            translate([sx * p19_socket_xy, sy * p19_socket_xy, 0])
                p19_socket_cut();
    }

    // Twist glyph on all four edges: rotated copies, so each reads upright
    // exactly when its edge faces the solver's right — the twist edge.
    for (i = [0 : 3])
        rotate([0, 0, i * 90])
            translate([p19_bar_mid, 20, 0])
                p19_twist_glyph();

    // Rotation arrow once (plate center is open, so it rides the bottom bar)
    translate([0, -p19_bar_mid, 0])
        p19_rotate_glyph();

    hole_info("stem_bore_x4", p19_socket_id, "vertical");
    hole_info("knot_relief_x4", p19_knot_relief_d, "vertical");
}

// Ball handle in PRINT orientation: flat ball pole on the bed, stem up.
// In use it is flipped stem-down: cord enters the flat top through the
// flare, runs down the axial bore, and knots below the stem tip.
module p19_handle() {
    ball_c = p19_handle_d / 2 - p19_ball_flat;   // ball center height
    fillet_d = 11;                               // neck fillet base diameter
    fillet_z = ball_c + sqrt((p19_handle_d / 2) * (p19_handle_d / 2)
                             - (fillet_d / 2) * (fillet_d / 2));

    difference() {
        union() {
            // ball, flat-bottomed for support-free printing
            translate([0, 0, ball_c])
                flat_bottom_sphere(p19_handle_d, p19_ball_flat);
            // stem
            translate([0, 0, ball_c])
                cylinder(d=p19_handle_stem_d, h=p19_handle_h - ball_c);
            // neck fillet where the stem leaves the ball
            translate([0, 0, fillet_z])
                cylinder(d1=fillet_d, d2=p19_handle_stem_d, h=2.5);
        }
        // axial cord bore, through ball and stem
        translate([0, 0, -0.01])
            compensated_hole(cord_hole_d, p19_handle_h + 0.02);
        // cord-exit flare at the flat pole (31 deg from vertical: printable)
        translate([0, 0, -0.01])
            cylinder(d1=p19_flare_d, d2=cord_hole_d, h=2.5, $fn=48);
    }

    hole_info("handle_cord_bore", cord_hole_d, "vertical");
    echo(str("NOTE [handle]: stem wall = ",
             (p19_handle_stem_d - cord_hole_d) / 2,
             "mm — slice at 0.35mm extrusion width (3 thin perimeters)"));
}

// Assembly view (visualization only — do not print as one piece).
// Shows the 0-tangle rest state: blue handles in the top cups, red in the
// bottom, two parallel indicative cords. Apply the card (T,T,R,T,T) to
// preset fraction 3/2.
module p19_assembly() {
    color("burlywood") p19_frame();

    // seated handles: stem tips on the shoulders, balls concentric in cups
    for (sx = [-1, 1], sy = [-1, 1])
        color(sy > 0 ? "royalblue" : "firebrick")
            translate([sx * p19_socket_xy, sy * p19_socket_xy, p19_seat_z])
                rotate([180, 0, 0])
                    p19_handle();

    // indicative cords (not printable parts): the 0 tangle, two parallel
    // horizontal strands between the flat ball tops
    for (sy = [-1, 1])
        color(sy > 0 ? "royalblue" : "firebrick", 0.55)
            translate([0, sy * p19_socket_xy, p19_seat_z + 0.5])
                rotate([0, 90, 0])
                    cylinder(d=cord_d, h=2 * p19_socket_xy, center=true, $fn=24);

    echo(str("SEAT: ball floats concentric in the cup, ",
             (p19_cup_d - p19_handle_d) / 2,
             "mm radial gap; stem tip rests on the socket shoulder at z=",
             p19_shoulder_z));
    echo("ASSEMBLY: 0-tangle shown (blue top, red bottom). Card sequence T,T,R,T,T presets 3/2.");
    echo("RIGGING: thread cord down through each handle bore, knot below the stem tip, drop of CA.");
    echo("CORDS: cut 500mm each — interior diagonal ~175mm, each crossing eats ~35mm of slack.");
}
