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

**Submitted segment**:
The course path used as the basis for assembly—initially from import, then replaced by the current point sequence whenever the ambassador edits waypoints on the map.
_Avoid_: Partial course, original upload only

**Course assembly**:
Building the full Course from a submitted segment by repeating and/or mirroring that segment; distinct from lap detection on an already-complete path.
_Avoid_: Lap duplication, path extension (informal)

**Repeat count**:
When mirror is off, how many times the submitted segment is chained forward. When mirror is on, use **out-and-back cycle** instead.
_Avoid_: Lap count (when meaning inferred laps)

**Out-and-back cycle**:
One forward pass of the submitted segment plus one mirrored return; used when mirror between repetitions is enabled. Target course length determines how many cycles (including fractional) are assembled.
_Avoid_: Lap, round trip (informal)

**Mirror between repetitions**:
When enabled, each repeat is an out-and-back cycle (forward then reversed). When disabled, each repeat appends the segment in the same direction only.
_Avoid_: Flip, reflect

**Target course length**:
The distance the assembled Course should reach; defaults to 5000 m for parkrun assessment. Assembly computes the repeat multiplier (including fractional values) from the submitted segment and pattern, truncating the final leg along the path to hit the target exactly.
_Avoid_: 5 km (when precision matters), total distance setting

**Full course**:
The Course after assembly—used for simulation and congestion analysis, typically ~5 km for parkrun events.
_Avoid_: Complete route, final path

**Course assembly controls**:
Target course length and mirror on/off; the computed repeat or out-and-back cycle count is read-only feedback. Available after any import and in the simulator; settings persist across the session. Default is target length matching the imported path with mirror off.
_Avoid_: Lap settings, manual lap count

**Assembled course geometry**:
The point sequence produced by course assembly; heuristic lap detection always runs on this geometry, independent of how it was built.
_Avoid_: Expanded path, synthetic track

**Shared course**:
The full course (assembled geometry and settings) encoded for URL sharing and GPX export; not the raw submitted segment alone.
_Avoid_: Import file, original upload
