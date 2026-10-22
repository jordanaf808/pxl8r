export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--journal-ink)'

// The rust token alone is 3.9:1 on cream in the light theme and 3.5:1 in the
// dark one, under the 4.5:1 that text needs. Ink is each theme's strongest
// color against cream, so mixing some in passes in both (5.5:1 and 4.7:1)
export const DANGER_COLOR =
  'color-mix(in srgb, var(--journal-rust) 70%, var(--journal-ink))'

// No height here: two height classes on one button don't override each other,
// because the order of the rules in the built CSS decides, not the class order
const BUTTON = `text-[15px] font-serif border-[1.5px] cursor-pointer disabled:cursor-default disabled:opacity-50 ${FOCUS_RING}`
const PRIMARY = `px-5 font-semibold bg-(--journal-ink) border-(--journal-ink) text-(--journal-paper)`

export const PRIMARY_BUTTON = `${BUTTON} h-10.5 ${PRIMARY}`
// The cell editor's Cancel and Save are as tall as its Complete button
export const EDITOR_SAVE_BUTTON = `${BUTTON} h-12 ${PRIMARY}`
export const OUTLINE_BUTTON = `${BUTTON} h-12 px-4 bg-transparent border-(--journal-ink) text-(--journal-ink)`

export const BUTTON_RADIUS = '3px 8px 5px 10px'
