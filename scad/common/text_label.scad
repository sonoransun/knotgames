// EXKNOTS - Text label module for embossing puzzle info
include <parameters.scad>

// Embossed text label (for printing on base surfaces)
module puzzle_label(txt, size=5, depth=0.6) {
    linear_extrude(height=depth)
        text(txt, size=size, halign="center", valign="center",
             font="Liberation Sans:style=Bold");
}

// Debossed text label (recessed into surface)
module puzzle_label_debossed(txt, size=5, depth=0.6) {
    linear_extrude(height=depth + 1)
        text(txt, size=size, halign="center", valign="center",
             font="Liberation Sans:style=Bold");
}
