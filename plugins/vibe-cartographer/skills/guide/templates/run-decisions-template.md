<!-- The ledger. Every inference, default, substitution and mid-run class
     upgrade lands here, numbered D1, D2, and so on. Append only. -->

# Decisions: [slug]

## D1
- **Decision:** Treated the gate failure on item 4 as environmental and fell back to `npm test` plus `tsc --noEmit`.
- **Why:** The vibe-test gate exited 2 on win32. Exit 2 is a tool error, not an item failure.
- **Alternative not taken:** Counting it as a failed check, which would have parked the item after two tries.
- **Item:** 4 (add rate-limit config loader)
- **How to reverse:** Re-run the gate on a machine where it runs, then re-open the item if it reports findings.
