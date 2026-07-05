var CHANGES = [
  {
    version: '1.3.2',
    date: '2026-07-05',
    items: [
      { tag: 'new', text: 'admin page lists every site now, click one instead of typing the id' },
      { tag: 'new', text: 'added a total verifications number next to passed/blocked' }
    ]
  },
  {
    version: '1.3.1',
    date: '2026-07-05',
    items: [
      { tag: 'fix', text: 'fixed double counting — failing the quick check then passing the harder one counted as both a pass and a fail. now it only counts as a fail if you actually get blocked' },
      { tag: 'new', text: 'made an actual page for the stats instead of raw json, still just for me though' }
    ]
  },
  {
    version: '1.3.0',
    date: '2026-07-04',
    items: [
      { tag: 'new', text: 'added basic per-site pass/fail counts, admin-only for now' },
      { tag: 'fix', text: 'a db lockdown had quietly broken ip reputation tracking completely, fixed' }
    ]
  },
  {
    version: '1.2.0',
    date: '2026-07-04',
    items: [
      { tag: 'new', text: 'added a keyboard-only fallback ("trouble with mouse or touch?") for the harder challenges — press and hold enter/space instead of dragging or drawing' },
      { tag: 'chg', text: 'the check buttons are real buttons now, so you can tab to them and hit enter instead of needing a mouse click' },
      { tag: 'chg', text: 'screen readers can actually announce whats going on in the verify popups now instead of dead silence' }
    ]
  },
  {
    version: '1.1.1',
    date: '2026-07-04',
    items: [
      { tag: 'fix', text: 'the dots challenge crashed with "missClicks is not defined" on a miss-click after we removed the old targets challenge — leftover dead code, cleaned up' },
      { tag: 'sec', text: 'fixed a minor backend security issue' }
    ]
  },
  {
    version: '1.1.0',
    date: '2026-07-04',
    items: [
      { tag: 'sec', text: 'tokens are locked to whatever domain you registered with now, so nobody can grab your site id and use it on a different site' },
      { tag: 'sec', text: 'added rate limiting so people cant spam the register/token/pow endpoints' },
      { tag: 'new', text: 'new challenge where you drag a dot along a squiggly line — uses the same mouse-tremor tracking we already had' },
      { tag: 'new', text: 'new challenge where you draw a circle or checkmark instead of clicking targets — the click-targets one was too similar to the click-dots-in-order one so it got swapped out' },
      { tag: 'fix', text: 'the word challenge let you guess forever lol, now it blocks you after 3 wrong tries' },
      { tag: 'fix', text: 'the spin-the-dial challenge was straight up broken on mobile — fixed' },
      { tag: 'chg', text: 'killed the press-and-hold challenge and the simon-says one, they were just extra complexity for no reason' },
      { tag: 'chg', text: 'getting blocked actually stops the page from loading now instead of just slapping an overlay on top' },
      { tag: 'chg', text: 'rewrote the client script into separate files and set up a real build (vite + terser) instead of one giant hand-written file' },
      { tag: 'chg', text: 'renamed all the old internal st4ts naming to verifi branding, with a migration so nobody gets logged out' }
    ]
  }
];
