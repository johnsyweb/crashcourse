# TODO

## Rules

- All of our code must be formatted with prettier before every commit
- All of our code must pass linting before every commit
- All of our code must pass Typescript's type checker before every commit
- All of our tests must pass before every commit
- Disused code must be removed immediately
- Each change must be committed to git with a meaningful, semantic message <https://www.conventionalcommits.org/en/v1.0.0/>
- Each change must be made atomically
- Every single user input must be controllable from the keyboard
- Favour free and open source libraries over implementing logic that I'll have to test and debug
- Functions must have low cyclomatic complexity and high test coverage
- NEVER write code that checks whether we're running in a test environment. The tests MUST test production code.
- Prefer dedicated functions or named variables over explanatory comments
- Tests must not pollute the console
- The README must remain up-to-date at all times
- Use Australian English for text
- We must follow the current code layout with each component having a single responsibility and having tests
- We must have a clean, consistent, accessible and professional user interface

## To do list

- [x] Allow the user to control the number of participants to control the number of participants in the simulator (default: 2)
- [x] Allow the user to control the minimum/maximum pace of participants in the simulator (default: 12:00/km / 2:30/km)
- [x] Optimise the layout of Simulator Controls to remove the scrollbars
- [x] Model course width with the following specifications:
  - The lines from the source file form the left edge.
  - Assume the right edge is 2m away.
  - If the course passes itself multiple times, the left and right edges are the furthest left and right. Up until twice the default width.
  - Let's have some examples.
  - Course: Starts at 0ºN 0ºE. Travels 500m East. Finishes.
    - course.getWidthAt(0) will be the default 2m
    - course.getWidthAt(250) will be the default 2m
    - course.getWidthAt(500) will be the default 2m
    - course.getWidthAt(501) will throw an error as it's out-of bounds
  - Course: Starts at 0ºN 0ºE. Travels 250m East. Travels 1m south. Travels 250m West. Finishes.
    - course.getWidthAt(0) will be 1m (as there's another part of the course, with the opposite bearing, 1m South)
    - course.getWidthAt(125) will be 1m (as there's another part of the course, with the opposite bearing, 1m South)
    - course.getWidthAt(350) will be 1m (as there's another part of the course, with the opposite bearing, 1m South)
  - Course: Starts at 0ºN 0ºE. Travels 100m East. Travels 1m North. Travels 100m East. Travels 1m North. Travels 100m East. Travels 1m North. Travels 100m East. Travels 1m North. Travels 100m East. Travels 1m North. Travels 100m East. Travels 5m South. travels 400m West. Finishes.
    - course.getWidthAt(50) will be 1m (as there's another part of the course, with the opposite bearing, 1m South)
    - course.getWidthAt(150) will be 2m (as there's another part of the course, with the opposite bearing, 2m South)
    - course.getWidthAt(250) will be 3m (as there's another part of the course, with the opposite bearing, 3m South), so we assume the same path
    - course.getWidthAt(350) will be 4m (as there's another part of the course, with the opposite bearing, 4m South), so we assume the same path
    - course.getWidthAt(450) will be 4m (as there's another part of the course, with the opposite bearing, 5m South), so we assume on a different path
- [x] Model participant width
- [x] Improve modelling of participant's progress along the course. This is currently a simple function of pace and time but needs to be a series of movements based on clock ticks, currect position, pace, and duration of clock tick!
- [ ] Model what happens when a participant meets another participant on the course
  - They must not leave the course
  - They can pass if they are faster and there is space to pass on the course
  - They must allow a faster participant to pass them
  - They are constrained by the pace of the participant in front
  - They must stop if they are going to collide with a participant and proceed only when there is room
- [ ] Publish app to GitHub Pages
- [ ] Model participant sentiment
- [ ] Format the elapsed time as HH:MM:SS
  - a 7-segment display theme would be a bonus.
- [ ] Combine Play(P)/Stop(S) controls to a single Play/Pause(P) control
- [ ] Support Google Earth (KML) files for course specification, possibly with a third-party laibrary. Perhaps with drag n' drop
- [ ] Automatically analyse and report on congestion points on the course
- [ ] Automatically analyse and report upon participant sentiment
- [ ] Simulate random members of the public on the course and analyse their sentiment
- [ ] Recommend marshal points on the course to ease congestion and prevent conflict with the public
- [ ] Allow folks to view imperial measurements, if they desire
