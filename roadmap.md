# Tasks
- [x] Verify the refresh button stops after a Facebook timeout and remains usable; signed-in initial load and manual refresh both completed, preserving campaign rows.
- [x] Remove incorrect Meta-reported sales from campaigns without attributed webhook sales; both requested campaigns verified with zero sales and revenue (10 tests passed).
- [x] Identify the requesting user's traffic campaign by Meta ID.
- [x] Apply user-scoped fallback attribution to old and future sales without campaign UTMs.
- [x] Verify rules with tests and the signed-in campaign page (7 tests passed; traffic campaign shows 9 sales in the current period).