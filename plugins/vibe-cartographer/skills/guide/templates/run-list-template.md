<!-- Same per-item field labels as checklist-template.md, so /build can read
     either file. Acceptance holds the item's done-when lines: observable and
     checkable by the item's own local checks. Spec ref points at the source
     (a checklist item, a plan task, an issue #, a dashboard task id, a proposal heading, a finding id, a line in the pasted list).
     Stop class is the only added field. See skills/guide/references/unattended-run.md. -->

# Run List: [slug]

- [ ] **1. [Clear title: what's done when this item is complete]**
  Spec ref: `[source path, issue #, task id, proposal heading or finding id] > [section or line]`
  What to build: Concrete description of the work. Specific enough to execute without guessing.
  Acceptance: Done when [testable criteria]. Checkable with local checks.
  Verify: Specific action, e.g. "Run `[test command]` and confirm [what you should see]."
  Stop class: go

- [ ] **2. [Title]**
  Spec ref: `[...]`
  What to build: [...]
  Acceptance: [...]
  Verify: [...]
  Stop class: hold

- [ ] **3. [Title]**
  Spec ref: `[...]`
  What to build: [...]
  Acceptance: [...]
  Verify: [...]
  Stop class: stop

<!-- Stop class values:
     go    build, check, merge locally (default)
     hold  build and check on its branch, do not merge: money, billing, usage
           limits, auth, access gating, permissions
     stop  do not build, write up what it would take: secrets, credentials,
           key rotation, production data, destructive data ops, deploys,
           force-pushes
     Note dependencies between items. A dependent of a hold item builds on the
     hold branch and is held too. -->

<!-- Optional section. Harvested candidates too big for one run (a new mode, a
     new subsystem) go here instead of in the list above. Omit it when empty.
     They are not built, not counted in the tally, and not in state.json. -->

## Not this run

- [Title] (`[source ref]`): [one line on why it is oversized for one run]
