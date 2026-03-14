// EXKNOTS - Global FDM Printing Parameters
// All dimensions in mm

// Rod dimensions (thickened from original 4mm steel for FDM)
rod_d = 6;
rod_r = rod_d / 2;

// Cord (real paracord 550 Type III)
cord_d = 4;
cord_hole_d = 6;       // Through-hole for cord (cord_d + 2mm clearance)
cord_slot_d = 7;       // Sliding channel (looser fit)
cord_countersink_d = 8; // Countersink for stopper knots
cord_countersink_depth = 3;

// Ring wire (thickened from original 4mm)
ring_wire_d = 6;

// Ball stops (thickened from original 8mm)
ball_stop_d = 12;

// Printer parameters
nozzle_d = 0.4;
layer_h = 0.2;
layer_h_fine = 0.12;

// Tolerances
clearance = 0.3;               // General moving-part clearance
press_fit_clearance = 0.15;    // Tight press-fit
snap_clearance = 0.4;          // Snap-fit (looser)

// Wall thicknesses
wall_min = 1.2;        // 3 perimeters @ 0.4mm nozzle
wall_structural = 2.0; // 5 perimeters

// Default facet count
$fn = 60;

// Detail facet count (for rings, ovals)
fn_detail = 120;
