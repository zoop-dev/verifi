var CHANGES = [
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
