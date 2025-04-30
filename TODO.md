# TODO

## Rules

- Each change should be made atomically.
- We must follow the current code layout with each component having a single responsibility and having tests
- Disused code must be removed immediately
- All of our checks must pass at every step
- Each change should be committed to git with a meaningful, semantic message
- Every user input should be controllable from the keyboard

## To do list

- [ ] Remove the Reset Simulation button
- [ ] Allow the user to control the speed in the simulator (default 60x)
- [ ] Allow the user to control the number of participants to control the number of participants in the simulator (default: 2)
- [ ] Allow the user to control the minimum/maximum pace of participants in the simulator (default: 12:00/km / 2:30/km)
- [ ] Support Google Earth (KML) files for course specification
- [ ] Model course width:
  - The lines from the source file form the left edge.
  - Assume the right edge is 2m away.
  - If the course passes itself multiple times, the left and right edges are the furthest left and right.
- [ ] Model participant width
- [ ] Improve modelling of participant's progress along the course. This is currently a simple function of pace and time but needs to be a series of movements based on clock ticks, currect position, pace, and external factors
- [ ] Model what happens when a participant meets another participant on the course
  - They must not leave the course
  - They can pass if they are faster and there is space to pass on the course
  - They must allow a participant to pass them
  - They are constrained by the pace of the paticipant in front
  - They must stop if they are going to collide with a participant and proceed only when there is room
- [ ] Model participant sentiment
- [ ] Format the elapsed time as HH:MM:SS
  - a 7-segment display theme would be a bonus.
- [ ] Publish artefacts to GitHub Pages
