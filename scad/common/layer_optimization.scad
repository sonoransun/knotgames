// EXKNOTS - Layer Height Optimization Module
// Sequential layer height reduction for fine-detail zones.
//
// FDM slicers support variable layer height (PrusaSlicer, Cura).
// This module marks Z-height zones where finer layers improve quality,
// and provides geometry helpers that account for layer quantization.
//
// Usage:
//   include <layer_optimization.scad>
//   h = quantize_z(13.7);                    // → 13.8 (nearest 0.2mm)
//   h = quantize_z_fine(13.7);               // → 13.68 (nearest 0.12mm)
//   layer_zone_marker(z_start, z_end, "fine"); // Visual marker for slicer

include <parameters.scad>

// --- Z-Height Quantization ---
// Snap dimensions to exact layer multiples to avoid partial-layer artifacts

function quantize_z(z, lh=layer_h) =
    ceil(z / lh) * lh;

function quantize_z_fine(z) =
    quantize_z(z, layer_h_fine);

// Round to nearest (not ceil) layer boundary
function round_z(z, lh=layer_h) =
    round(z / lh) * lh;

// Number of layers for a given height
function layer_count(z, lh=layer_h) =
    ceil(z / lh);

// --- Sequential Layer Height Profiles ---
// Returns recommended layer height for a given Z position within a part.
// Used to generate slicer modifier meshes or documentation.

// Standard profile: 0.2mm everywhere
function layer_at_z_standard(z) = layer_h;

// Fine-top profile: standard layers, switching to fine near the top
//   z = current position, total_h = part total height, fine_zone = mm from top
function layer_at_z_fine_top(z, total_h, fine_zone=5) =
    z > (total_h - fine_zone) ? layer_h_fine : layer_h;

// Fine-bottom profile: fine layers at base for bed adhesion detail
function layer_at_z_fine_bottom(z, fine_zone=2) =
    z < fine_zone ? layer_h_fine : layer_h;

// Transition profile: gradual step-down from coarse to fine
//   Returns one of [0.20, 0.16, 0.12] based on zone
function layer_at_z_transition(z, total_h, fine_start_frac=0.7) =
    let(frac = z / total_h)
    frac < fine_start_frac          ? 0.20 :
    frac < fine_start_frac + 0.15   ? 0.16 :
                                      0.12;

// All-fine profile: 0.12mm throughout (for rings, ovals, precision parts)
function layer_at_z_all_fine(z) = layer_h_fine;

// --- Slicer Modifier Mesh Generation ---
// Creates a thin box at specified Z-range that can be exported as a
// modifier mesh in PrusaSlicer to set different layer heights.

// Modifier zone marker (visual + exportable as separate STL)
module layer_zone_modifier(z_start, z_end, xy_size=500) {
    translate([0, 0, z_start])
        cube([xy_size, xy_size, z_end - z_start], center=true);
}

// Visual annotation: colored zone indicator (non-printable, for preview)
module layer_zone_marker(z_start, z_end, zone_type="fine") {
    c = zone_type == "fine"       ? [0, 0.5, 1, 0.15] :
        zone_type == "transition" ? [1, 0.8, 0, 0.15] :
        zone_type == "standard"   ? [0.5, 0.5, 0.5, 0.1] :
                                    [1, 0, 0, 0.2];
    color(c)
    translate([0, 0, (z_start + z_end) / 2])
        cube([200, 200, z_end - z_start], center=true);
}

// --- Part-Specific Layer Optimization Helpers ---

// Torus/ring: the bottom contact and top crown need fine layers
// Returns the Z-ranges that benefit from fine layers
// (relative to torus center at Z=0, printed lying on side)
function torus_fine_zones(od, wire_d) =
    let(r = wire_d / 2)
    [[-r, -r + 1.5], [r - 1.5, r]];  // bottom 1.5mm and top 1.5mm

// Sphere: bottom hemisphere base and top crown
function sphere_fine_zones(d) =
    let(r = d / 2)
    [[-r, -r + 2], [r - 2, r]];  // bottom 2mm and top 2mm

// Post socket: fine layers at socket entrance for press-fit accuracy
function socket_fine_zone(socket_top_z, depth=3) =
    [[socket_top_z - depth, socket_top_z]];

// Echo layer optimization recommendation for a part
module layer_opt_info(part_name, total_h, profile="standard") {
    echo(str("LAYER OPT [", part_name, "]: height=", total_h, "mm, ",
             "layers@0.2=", layer_count(total_h, 0.2), ", ",
             "layers@0.12=", layer_count(total_h, 0.12), ", ",
             "profile=", profile));
    if (profile == "fine_top")
        echo(str("  Fine zone: top 5mm (", layer_count(5, 0.12), " fine layers)"));
    if (profile == "transition")
        echo(str("  Transition: 0.20→0.16→0.12 over top 30%"));
}
