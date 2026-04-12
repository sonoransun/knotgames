// EXKNOTS - Rod modules for FDM printing
include <parameters.scad>

// Straight rod between two points
module straight_rod(from, to, d=rod_d) {
    hull() {
        translate(from) sphere(d=d, $fn=$fn);
        translate(to) sphere(d=d, $fn=$fn);
    }
}

// U-shaped bar: two vertical arms connected by a semicircular bend
// Origin at center of the U opening (top center)
// Deprecated: delegates to u_bar_poly() which uses a correct hull-chain approach
module u_bar(width, height, bend_r, d=rod_d) {
    u_bar_poly(width, height, bend_r, d);
}

// Simplified U-bar using polyline with hull pairs
module u_bar_poly(width, height, bend_r, d=rod_d, bend_steps=16) {
    hw = width / 2;
    arm_h = height - bend_r;

    // Generate all points along the U path
    // Left tip → left bottom → bend → right bottom → right tip
    points = concat(
        // Left arm
        [[-hw, 0, 0], [-hw, -arm_h, 0]],
        // Bend (semicircle from left to right)
        [for (i = [0:bend_steps])
            let(a = 180 + 180 * i / bend_steps)
            [cos(a) * hw, -arm_h - bend_r + sin(a) * bend_r + bend_r, 0]
        ],
        // Right arm
        [[hw, -arm_h, 0], [hw, 0, 0]]
    );

    polyline_rod(points, d);
}

// Rod along a polyline (series of hull pairs)
module polyline_rod(points, d=rod_d) {
    for (i = [0:len(points)-2]) {
        hull() {
            translate(points[i]) sphere(d=d, $fn=16);
            translate(points[i+1]) sphere(d=d, $fn=16);
        }
    }
}

// Curved rod along points (for complex paths)
module curved_rod(points, d=rod_d) {
    polyline_rod(points, d);
}
