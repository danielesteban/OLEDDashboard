// Parametric dimensions
WALL = 6;
WIDTH = 28;
LENGTH = 28;
HEIGHT = 28;

// Lid labels
// $LID_LABEL_TOP = "OLED";
// $LID_LABEL_BOTTOM = "DASHBOARD";
// $LID_LABEL_BOTTOM_SIZE = 4;

// Select what to export
EXPORT_ENCLOSURE = true;
EXPORT_LID = true;

// Rounded box helper
module Box(width, length, height, corner = 0.15) {
  scale([width, length, height]) {
    minkowski() {
      cube([1 - corner, 1 - corner, 1 - corner], center = true);
      sphere($fn=64, d=corner, center = true);
    }
  }
}

// Enclosure
if (EXPORT_ENCLOSURE)
translate([EXPORT_LID ? -WIDTH : 0, 0, 0])
rotate([0, 180, 180])
color("Blue") {
  difference() {
    // Main body
    Box(WIDTH + (WALL * 2), LENGTH + (WALL * 2), HEIGHT + (WALL * 2));
    // Make it hollow
    translate([0, 0, WALL * -0.25]) {
      cube([WIDTH, LENGTH, HEIGHT + WALL * 2], center = true);
    }
    // Cut open the bottom
    translate([0, 0, -(HEIGHT + (WALL * 2)) + WALL]) {
      cube([WIDTH * 2, LENGTH * 2, HEIGHT + (WALL * 2)], center = true);
    }
    // Display window
    translate([0, (LENGTH * 0.25) - (LENGTH * 0.5) / 3, HEIGHT * 0.5]) {
      Box(WIDTH , (LENGTH * 0.5), HEIGHT);
    }
    // Board beds
    offset = WALL * 0.5;
    for (a = [0:3]) {
      rotate([0, 0, 90 * a]) {
        translate([0, LENGTH * 0.5, offset * -0.5]) {
          cube([
            WIDTH - (offset * 2),
            offset * 2,
            HEIGHT + offset
          ], center = true);
        }
      }
    }
    // Buttons windows
    for (a = [1,3]) {
      rotate([0, 0, 90 * a]) {
        translate([0, LENGTH * 0.5, 0]) {
          Box(WIDTH * 0.3, LENGTH, WIDTH * 0.3, 0.6);
        }
      }
    }
  }
}

// Lid
if (EXPORT_LID)
translate([EXPORT_ENCLOSURE ? WIDTH : 0, 0, 0])
color("Blue") {
  union() {
    difference() {
      // Main body
      Box(WIDTH + (WALL * 2), LENGTH + (WALL * 2), HEIGHT + (WALL * 2));
      // Make it hollow
      translate([0, 0, WALL * 0.5]) {
        cube([WIDTH - WALL * 0.9, LENGTH - WALL * 0.8, HEIGHT + WALL * 2], center = true);
      }
      // Cut the top out
      translate([0, 0, WALL]) {
        cube([WIDTH * 2, LENGTH * 2, HEIGHT + (WALL * 2)], center = true);
      }
      // Power cord window
      translate([0, 0, HEIGHT * -0.5]) {
        Box(WIDTH * 0.2, WIDTH * 0.1, HEIGHT, 0.6);
      }
      // Labels
      translate([0, 0, HEIGHT * -0.5 - WALL * 0.75])
      rotate([180, 0, 180]) {
        if ($LID_LABEL_TOP != undef)
        translate([0, LENGTH * (1/3), 0])
        scale([1, 2, 1])
        linear_extrude(height = WALL) {
          size = $LID_LABEL_TOP_SIZE == undef ? 5 : $LID_LABEL_TOP_SIZE;
          text($LID_LABEL_TOP, size = size, font = "monospace", halign = "center", valign = "center", $fn = 16);
        }
        if ($LID_LABEL_BOTTOM != undef)
        translate([0, LENGTH * -(1/3), 0])
        scale([1, 2, 1])
        linear_extrude(height = WALL) {
          size = $LID_LABEL_BOTTOM_SIZE == undef ? 5 : $LID_LABEL_BOTTOM_SIZE;
          text($LID_LABEL_BOTTOM, size = size, font = "monospace", halign = "center", valign = "center", $fn = 16);
        }
      }
    }
    // Pressure fits
    offset = WALL * 0.5;
    for (a = [0:3]) {
      rotate([0, 0, 90 * a]) {
        translate([0, LENGTH * 0.5, HEIGHT * -0.5 + offset * 0.5]) {
          cube([
            WIDTH - (offset * 2.2),
            offset * 1.8,
            offset * 2
          ], center = true);
        }
      }
    }
  }
}
