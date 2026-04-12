// EXKNOTS - Puzzle 15: Seifert Sail
// FDM 3D Printable Version
//
// Parts: trefoil_frame (1) + base (1)
// Trefoil wire frame (~120mm) mounted vertically on a wooden base
// with a vertical mounting post.
// Print trefoil with supports, base flat on bed.
//
// Print settings:
//   Trefoil frame: PLA, 0.20mm layers, 100% infill, 5 shells, supports needed
//   Base:          PLA wood-fill, 0.20mm layers, 30% infill, 3 shells, no supports
//
// Optimizations applied:
//   - Vertical mounting post with press-fit socket
//   - Polyline rod hull-chain for smooth trefoil curves
//   - Layer height: 0.20mm standard for all parts
//   - Shell profile: "structural" for frame and post, "enclosure" for base

include <../common/parameters.scad>
use <../common/rod.scad>
use <../common/base.scad>
use <../common/corners.scad>
use <../common/holes.scad>
use <../common/shells.scad>
use <../common/layer_optimization.scad>
use <../common/press_fit.scad>

// Puzzle-specific parameters
p15_scale = 20;
p15_frame_span = 120;     // Approximate span of trefoil frame
p15_trefoil_steps = 60;
p15_base_w = 100;
p15_base_d = 80;
p15_base_h = 15;
p15_post_d = 10;
p15_post_h = 60;
p15_socket_depth = 12;

// Constraint assertions
assert(p15_frame_span > 0, "Frame span must be positive");
assert(p15_post_h > p15_frame_span * 0.3,
       "Mounting post must be tall enough to support the frame");
assert(p15_base_w > p15_post_d * 2,
       "Base must be wider than the mounting post");

// Part selector: "assembly" | "trefoil_frame" | "base"
part = "assembly";

if (part == "trefoil_frame") {
    shell_info("trefoil_frame", "structural");
    layer_opt_info("trefoil_frame", p15_frame_span, "standard");
    p15_trefoil_frame();
} else if (part == "base") {
    shell_info("base", "enclosure");
    layer_opt_info("base", p15_base_h + p15_post_h, "standard");
    p15_base();
} else {
    p15_assembly();
}

// Generate trefoil knot point at parameter t
function p15_trefoil_point(t) = [
    (sin(t) + 2 * sin(2 * t)) * p15_scale,
    (cos(t) - 2 * cos(2 * t)) * p15_scale,
    -sin(3 * t) * p15_scale * 0.5
];

// Generate full trefoil point array
function p15_trefoil_points() = [
    for (i = [0:p15_trefoil_steps])
        p15_trefoil_point(360 * i / p15_trefoil_steps)
];

// Trefoil wire frame
module p15_trefoil_frame() {
    points = p15_trefoil_points();
    polyline_rod(points, rod_d);
}

// Base with vertical mounting post
module p15_base() {
    // Flat base
    socket_positions = [[0, 0]];
    flat_base(p15_base_w, p15_base_d, p15_base_h,
              socket_positions=socket_positions,
              socket_d=p15_post_d,
              socket_depth=p15_socket_depth);

    // Vertical mounting post
    translate([0, 0, p15_base_h / 2])
        cylinder(d=p15_post_d, h=p15_post_h, $fn=$fn);
}

// Assembly view (for visualization only)
module p15_assembly() {
    // Base with post
    color("BurlyWood") p15_base();

    // Trefoil frame mounted vertically on the post
    color("Silver")
    translate([0, 0, p15_base_h / 2 + p15_post_h])
    rotate([90, 0, 0])
        p15_trefoil_frame();
}
