// Parametric dimensions
WALL = 6;
WIDTH = 32;
LENGTH = 32;
HEIGHT = 34;

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
    translate([0, 0, -WALL]) {
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
    offset = (WALL * (1 / 2));
    for (a = [0:3]) {
      rotate([0, 0, 90 * a]) {
        translate([0, LENGTH * 0.5, -offset]) {
          cube([
            WIDTH - (offset * 2),
            offset * 2,
            HEIGHT
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
  difference() {
    // Main body
    Box(WIDTH + (WALL * 2), LENGTH + (WALL * 2), HEIGHT + (WALL * 2));
    // Cut the top out
    translate([0, 0, WALL]) {
      cube([WIDTH * 2, LENGTH * 2, HEIGHT + (WALL * 2)], center = true);
    }
    // Power cord window
    translate([0, 0, HEIGHT * -0.5]) {
      Box(WIDTH * 0.3, WIDTH * 0.15, HEIGHT, 0.6);
    }
  }
  // Pressure fits
  offset = (WALL * (1 / 2));
  for (a = [0:3]) {
    rotate([0, 0, 90 * a]) {
      translate([0, LENGTH * 0.5, HEIGHT * -0.5]) {
        cube([
          WIDTH - (offset * 2),
          offset * 1.5,
          offset * 2
        ], center = true);
      }
    }
  }
}
