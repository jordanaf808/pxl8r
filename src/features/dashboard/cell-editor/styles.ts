export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--journal-ink)'

// The rust token alone is 3.9:1 on cream in the light theme and 3.5:1 in the
// dark one, under the 4.5:1 that text needs. Ink is each theme's strongest
// color against cream, so mixing some in passes in both (5.5:1 and 4.7:1)
export const DANGER_COLOR =
  'color-mix(in srgb, var(--journal-rust) 70%, var(--journal-ink))'

const BUTTON = `h-10.5 text-[15px] font-serif border-[1.5px] cursor-pointer disabled:cursor-default disabled:opacity-50 ${FOCUS_RING}`

export const PRIMARY_BUTTON = `${BUTTON} px-5 font-semibold bg-(--journal-ink) border-(--journal-ink) text-(--journal-paper)`
export const OUTLINE_BUTTON = `${BUTTON} px-4 bg-transparent border-(--journal-ink) text-(--journal-ink)`

export const BUTTON_RADIUS = '3px 8px 5px 10px'
