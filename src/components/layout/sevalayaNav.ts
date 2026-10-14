export interface MenuEntry {
  to: string
  label: string
  tamil: string
  blurb: string
}

/** The two pages under Sevalaya, in the order they are numbered in the menu. */
export const SEVALAYA_ITEMS: MenuEntry[] = [
  {
    to: '/sevalaya/seva',
    label: 'Seva',
    tamil: 'சேவை',
    blurb: 'Annadhanam, education and welfare programmes.',
  },
  {
    to: '/sevalaya/gaushala',
    label: 'Gaushala',
    tamil: 'கோசாலை',
    blurb: 'The cow shelter: fodder, care, rescues and sewas.',
  },
]
