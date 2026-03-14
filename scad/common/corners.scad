// EXKNOTS - Corner Optimization Module
// Fillets, chamfers, and corner treatments for FDM printability.
//
// Sharp internal corners concentrate stress and cause print artifacts.
// Sharp external corners can delaminate under force.
// This module provides parametric corner treatments.
//
// Usage:
//   include <corners.scad>
//   fillet_2d(r=2);                    // 2D fillet for extrusion
//   chamfer_edge(length=50, size=1);   // 3D edge chamfer
//   rounded_cube([w,d,h], r=3);        // Box with all edges rounded

include <parameters.scad>

// --- 2D Corner Primitives ---

// 2D fillet: quarter-circle placed at an internal corner
module fillet_2d(r=1) {
    difference() {
        square([r, r]);
        translate([r, r]) circle(r=r, $fn=max(16, r*8));
    }
}

// 2D chamfer: 45-degree cut at a corner
module chamfer_2d(size=1) {
    polygon([[0, 0], [size, 0], [0, size]]);
}

// 2D rounded rectangle
module rounded_rect_2d(w, h, r=1) {
    offset(r=r) offset(r=-r)
        square([w, h], center=true);
}

// --- 3D Corner Treatments ---

// Rounded cube (all edges rounded)
module rounded_cube(dims, r=1) {
    w = dims[0]; d = dims[1]; h = dims[2];
    minkowski() {
        cube([w - r*2, d - r*2, h - r*2], center=true);
        sphere(r=r, $fn=max(16, r*8));
    }
}

// Chamfered cube (all edges chamfered at 45 degrees)
module chamfered_cube(dims, c=1) {
    w = dims[0]; d = dims[1]; h = dims[2];
    minkowski() {
        cube([w - c*2, d - c*2, h - c*2], center=true);
        cylinder(r1=c, r2=0, h=c, $fn=4);  // Octahedron-ish
    }
}

// Rounded cube with different radii for horizontal edges (rxy) and
// vertical edges (rz). Useful when top/bottom need different treatment.
module rounded_cube_hz(dims, rxy=1, rz=1) {
    w = dims[0]; d = dims[1]; h = dims[2];
    minkowski() {
        cube([w - rxy*2, d - rxy*2, h - rz*2], center=true);
        intersection() {
            sphere(r=rxy, $fn=max(16, rxy*8));
            cylinder(r=rxy*2, h=rz*2, center=true, $fn=max(16, rxy*8));
        }
    }
}

// --- Edge Fillet (3D) ---
// A fillet along a straight edge (oriented along Z by default)

module edge_fillet(length, r=1) {
    difference() {
        cube([r + 0.1, r + 0.1, length], center=true);
        translate([r, r, 0])
            cylinder(r=r, h=length + 0.2, center=true, $fn=max(16, r*8));
    }
}

// --- Rod Junction Fillet ---
// Smooth the junction where two rods meet at an angle.
// Currently rods use sphere junctions; this adds a torus fillet
// at the base of a branch rod for extra strength.

module rod_junction_fillet(rod_d, fillet_r=1) {
    rotate_extrude($fn=32)
    translate([rod_d/2, 0, 0])
        fillet_2d(fillet_r);
}

// --- Stress-Relief Corner ---
// For internal corners under load (e.g., prong base on fork),
// adds a triangular gusset/fillet that distributes stress.

module stress_gusset(size, thickness=2) {
    linear_extrude(height=thickness, center=true)
    polygon([[0, 0], [size, 0], [0, size]]);
}

// Circular stress fillet (quarter-torus at internal corner)
module stress_fillet(r, thickness=2) {
    rotate_extrude(angle=90, $fn=32)
    translate([r, 0, 0])
    circle(d=thickness, $fn=16);
}

// --- Print-Optimized Corners ---

// Bottom-edge chamfer: removes the elephant's-foot artifact on
// the first layer by adding a small chamfer at the base of vertical walls.
// Apply as difference() to the bottom edge of any part.
module elephants_foot_chamfer(perimeter_length, chamfer=0.3) {
    // A thin ring/strip at Z=0 that trims the base
    linear_extrude(height=chamfer)
    offset(r=chamfer)
    offset(r=-chamfer * 2)
    offset(r=chamfer)
        children();
}

// Top-surface chamfer for parts that will be handled:
// softens sharp top edges for comfort and reduced delamination risk.
module top_chamfer(w, d, c=0.5) {
    translate([0, 0, -c])
    linear_extrude(height=c, scale=[1 - 2*c/w, 1 - 2*c/d])
        square([w, d], center=true);
}
