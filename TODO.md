# To-Do

[ ] - remove remaining doodle svgs

[ ] - Add 'Liters' to unit types

[ ] - remove the word 'cols' from the grid column buttons label on the grid form.

[ ] - 'Pixel Color' label is to close to color swatches, the selected swatch outline offset is a little too big.

[ ] - make forms max-content height so no scrollbar is needed, scrollbar should only be on main window, not the form.

[ ] - Add Meta tags, images, and links

[ ] - Ability to add a pixel from the sidebar more than once.

[ ] - Description text is a little offset from the description form lines

[ ] - auto save changes on edit grid form close

[ ] - Add a reminder alert feature to a pixel. It can remind you up to 2 days before it's due.

[ ] - Remove form title and input labels, 'Pixel Name' and 'Description', it should just be the editable input or placeholder value.

[ ] - Timer, when paused, ignores seconds remaining and just rounds to nearest minute.

[ ] - Move Pixel Category filter button into Pixel sidebar.

[ ] - Add text copy on homepage about breaking your tasks into tiny pixels to make them more manageable. In the hero text copy.

[ ] - move '+ new' pixel button in sidebar to bottom of sidebar.

[ ] - the timer icon should be shown for a pixel in a gridCell even if a timer is paused.

[ ] - updating a saved pixel's configuration you have to reload the page for a pixel in a grid to change. e.g. change a blue 'read a book' pixel to red, you have to reload the page for grids with 'read a book' pixels to update to red.

[ ] - Create a completed/not-completed visual state for pixels, maybe transparent for not-completed.

[ ] - Cells with pixels need an a slider input to adjust how much progress has been made.

- [ ] - Cell progress can be shown by how saturated/transparent the color of it is.

[ ] - Make this a PWA

[ ] - make timer a sticky widget at the edge of the screen that you can see and control. It can show multiple timers and the pixel title they are associated with.

[🚧] - Save Light/Dark theme preference. where would be the best place to save that, cookie, localDB, sessionstorage?

[✅] - Remove the Delete button from grids and pixels on the dashboard.

[✅] - Change 'End Goal' to 'Goal'

[✅] - Clicking on a grid or pixel component on the dashboard should open it's respective form.

[✅] - Clicking a cell of a grid on the dashboard should open the grid and select that cell.

[✅] - There should be 2 states, an empty cell state, and a filled cell state.

- [✅] - empty cell state should show available pixels and 'new pixel' button

- [✅] - filled cell state should show selected pixel information

[✅] - change Timer from a number input to a checkbox toggle. The timer value will be set by the goal.

- changed - a timer is available to every pixel in a grid. See below
-
- [✅] - A gridCell with a pixel should show a timer component that you can enable/disable, start/stop, and edit the time limit from 1 - 120 minutes.

- [✅] - "Minutes" pixel unit value slider is too sensitive, maybe we need dynamic input maximums based on what unit type it is, 240 for minutes, 74 for hours, and 365 for days. Just to have a better ux for that slider.

[✅] - Create a pixel filter button to show a modal when clicked and place it right next to the search component on the dashboard.

[✅] - Change Row/Column labels to arrows along the top (← and →) and side (↑ and ↓) of the grid.

[✅] - Fix Timer functionality. After starting a timer in a Grid Cell, exit, modify another grid, return to the Grid Cell, and the time is removed and completed is checked. (maybe just had to)

[✅] - change 'End Goal' to a slider.

- need to set max limit much lower than 10000, some of this is already scaffolded, but is not applied yet.

[✅] - Add counter/number pixel Unit type as first option, e.g. Daily Gratitude doesn't work with any other unit.

[✅] - Add pixel creator form in create grid form.

[🚧] - Add Timer to Pixel Creator Form.

[✅] - Add GitHub sign in option to signup form.

[✅] - If user is not logged in, change logout button to login button.

[✅] - In Create Pixel form change the 'boolean' label to something else.

[✅] - Creating a pixel after going through the create grid form did not add a pixel to the Pixels sidebar, why is that?

[✅] - Redirect to signup form on sign up button click

[✅] - When a new user is created redirect them to the dashboard, with a sample pixel grid with pixels.

[✅] - Show error messages in signup form

[✅] - Change 'Pixel Name' default to 'go for a morning run.

[✅] - Change 'Type' and 'Unit' selectors to dropdowns...

[✅] - Fix dropdown menus behind form and behind blur overlay

[✅] - Hide public/private functionality, not important, can delay till later.

[✅] - change 'close journal' button to 'logout'
