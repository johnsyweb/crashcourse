# Crashcourse

A web tool for parkrun ambassadors to load GPS course data, visualise routes, simulate participation, and analyse congestion.

## Language

**Ambassador**:
A parkrun volunteer who assesses prospective or submitted event courses on behalf of parkrun.
_Avoid_: User, reviewer

**Course**:
The continuous path participants follow, represented as an ordered sequence of geographic points.
_Avoid_: Route (when meaning the same thing), track, path

**Course submission**:
A course definition an ambassador receives from an event team, typically as a GPS or map export file.
_Avoid_: Upload, import (when referring to the business artefact rather than the technical action)

**Assessment**:
Loading a submitted course into Crashcourse, viewing it on the map, running participation simulation, and analysing congestion.
_Avoid_: Review, validation

**KML import**:
Reading a Keyhole Markup Language file so its course geometry becomes the Course in Crashcourse.
_Avoid_: KML upload (when referring to the feature capability)

**Course path**:
The LineString geometry in a submitted KML—the ordered centreline used as the Course.
_Avoid_: Line, route line, track

**Course markers**:
Optional Point placemarks in a submitted KML (e.g. start and finish) that annotate the Course but do not replace the Course path.
_Avoid_: Waypoints (when meaning map pins only), POIs

**Course name (from KML)**:
Taken from the Document-level `<name>` element in a submitted KML.
_Avoid_: Placemark name, layer name

**Course description (from KML)**:
Built from the Document-level `<description>`, optionally appended with plain-text statistics from the Course path placemark.
_Avoid_: HTML block as-is, marker labels

**Submitted KML file**:
A course submission in Keyhole Markup Language format (`.kml` or `.kmz`).
_Avoid_: Google Earth file (too product-specific)

**KMZ**:
A zip archive containing a KML document, treated as equivalent to its embedded KML for import.
_Avoid_: Compressed KML (informal)

**Lap detection configuration**:
Simulator settings that define how Crashcourse detects repeated passes over the start line; not set automatically when importing a submitted KML file.
_Avoid_: Lap count, auto-lap

**Import failure**:
When a submitted KML or KMZ file cannot yield a valid Course path; the ambassador sees an explicit, actionable error message.
_Avoid_: Parse error, invalid file (without explanation)
