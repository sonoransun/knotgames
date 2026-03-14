// EXKNOTS - Shell Optimization Module
// Determines optimal wall/shell count based on part function and stress profile.
//
// FDM shells (perimeters) control wall thickness independently from infill.
// More shells = stronger walls, better surface finish, less infill dependency.
// Fewer shells = faster print, relies more on infill for strength.
//
// Usage:
//   include <shells.scad>
//   walls = shell_walls("structural");  // Returns wall thickness in mm
//   shell_count = shell_count("cord_contact"); // Returns integer perimeter count

include <parameters.scad>

// Shell profiles: maps part function to optimal perimeter count and wall thickness
// Based on 0.4mm nozzle, each perimeter ≈ 0.45mm effective width (with overlap)

perimeter_width = nozzle_d * 1.125;  // Effective extrusion width with overlap

// Shell count by stress profile
function shell_count(profile) =
    profile == "structural"    ? 5 :  // Rods, frames, prongs — max load
    profile == "cord_contact"  ? 4 :  // Surfaces where cord slides — smooth + strong
    profile == "press_fit"     ? 4 :  // Press-fit sockets/pins — hoop stress
    profile == "torus"         ? 4 :  // Rings, ovals — all-wall, no infill at 100%
    profile == "enclosure"     ? 3 :  // Bases, blocks — cosmetic + moderate load
    profile == "cosmetic"      ? 2 :  // Labels, display stands — appearance only
    profile == "flexible"      ? 4 :  // TPU parts — needs wall integrity for flex
    3;  // default

// Wall thickness from shell count
function shell_walls(profile) = shell_count(profile) * perimeter_width;

// Minimum part thickness for a given profile (2x walls for hollow parts)
function min_thickness(profile) = shell_walls(profile) * 2;

// Whether a part should use 100% infill (walls = entire cross-section)
function solid_infill(profile) =
    profile == "structural"   ? true :
    profile == "torus"        ? true :
    profile == "press_fit"    ? true :
    profile == "cord_contact" ? true :
    false;

// Recommended infill percentage when not solid
function recommended_infill(profile) =
    profile == "enclosure" ? 30 :
    profile == "cosmetic"  ? 15 :
    profile == "flexible"  ? 100 :
    20;  // default

// Shell-aware hollow cylinder (for posts, tubes)
// Produces a tube with exactly the right wall thickness for the profile
module shell_tube(od, h, profile="structural") {
    wall = shell_walls(profile);
    id = od - wall * 2;
    if (solid_infill(profile) || id <= 0) {
        cylinder(d=od, h=h, $fn=$fn);
    } else {
        difference() {
            cylinder(d=od, h=h, $fn=$fn);
            translate([0, 0, -0.1])
                cylinder(d=id, h=h + 0.2, $fn=$fn);
        }
    }
}

// Shell-aware box (for bases, blocks)
module shell_box(w, d, h, profile="enclosure") {
    wall = shell_walls(profile);
    if (solid_infill(profile)) {
        cube([w, d, h], center=true);
    } else {
        difference() {
            cube([w, d, h], center=true);
            cube([w - wall*2, d - wall*2, h - wall*2], center=true);
        }
    }
}

// Annotation helper: echo shell recommendation for slicer setup
module shell_info(part_name, profile) {
    echo(str("SHELL INFO [", part_name, "]: ",
             shell_count(profile), " perimeters, ",
             shell_walls(profile), "mm walls, ",
             solid_infill(profile) ? "100% infill" :
                str(recommended_infill(profile), "% infill")));
}
