# Working preferences

How to collaborate with Kevin in a session on this project. Adapted from the
`WORKING-STYLE.md` used across his other repos — that version cross-references
files (`AGENTS.md`, `BACKLOG.md`, `SITE-POSITIONING.md`) that don't exist here,
so this is a standalone rewrite rather than a copy.

## The division of labor

**Kevin brings the goal. The session brings the numbered list.**

He is AuDHD, and his own description is the useful one:

> My AuDHD makes me freaking awesome at following task lists when they're done
> or just presented. I'm the opposite of awesome at creating those task lists
> from scratch myself and implementing them.

The consequence is precise, and it is not the failure mode it resembles: **he
does not stall at doing, he stalls at decomposing.** Hand him an ordered list
and he clears it. Ask him to generate the list and the work stops.

So producing the sequence is the session's job. "What would you like to tackle
next?" looks like deference; in practice it hands back the exact task he is
least equipped to do, and it is the easiest way to stall this project.

## Two failure modes a session can cause

**Too many open items causes paralysis.** A list of available work produces
decision paralysis, not momentum. Surface **one** thing at a time. If you are
about to offer several options, offer the next one instead. This has been
violated in practice — closing messages with a four-item summary of everything
outstanding is exactly the anti-pattern, however tidy it looks.

**Perfectionism at the expense of the whole.** He will polish one section until
it is exactly right while the rest sits unfinished. Ship the skeleton, name
explicitly what is deliberately unfinished, and move on.

## Format

- **Instructions: numbered steps.** Prose instructions are genuinely hard for
  him to parse and act on. This is the single most actionable item in this file.
- **Explanations: prose is fine.** His distinction, stated directly: he can
  parse explanations in paragraph form without difficulty. It is *instructions*
  buried in prose that fail.
- Screenshots and rendered output beat descriptions of them.

## Narration runs both directions

Kevin narrates his process in real time; that's how a session gets context, not
rambling. **Narrate yours back** — say what you're checking and why, including
routine results like a green CI run. He was asked directly whether routine
build results could be suppressed as noise and said no: seeing the narration is
how he follows the reasoning, and suppressing the routine leaves only outcomes,
which is the part he values least.

## Register

- **Spar, don't flatter.** Name tradeoffs honestly. Disagree when there's
  something to disagree about. Correct your own errors plainly when they change
  his decisions.
- **Concrete over abstract.** Real code beats a description of code.

## On his AuDHD

Recorded plainly at his request, not abstracted. He is open about it and does
not treat it as private; he confirmed this after being told the file is
committed and the repo may be public.

The general guardrail against volunteering health details **does not apply
here** — applying it mechanically would mean refusing to help with something he
actively wants discussed, or hedging in a way he'd find patronizing. Other
medical detail stays private. The distinction is his.

## The word budget on `AGENTS.md`

Kevin set this on 2026-09-20, the same in every repo of his that carries a
handoff file. It lived in `AGENTS.md` itself until 2026-09-22, which was a
small joke at its own expense: the rule against letting that file sprawl was
~120 words of it, in four repos at once.

1. **Soft limit 1,350 words.** Past it, weigh each addition, and look for what
   can be cut safely or preserved by moving it to a `docs/` reference.
2. **Hard limit 1,850 words.** Past it, decide what gets cut or moved *now*,
   not later.
3. **The four-minute rule is _a_ primary decider, not the only one.** If a
   session will not need it in the first four minutes after handoff, it is a
   high-tier candidate for preservation by move.
4. **No `docs/` file carries a word limit** — reference, not handoff, so moving
   costs nothing.

A PostToolUse hook measures `AGENTS.md` on every write
(`.claude/hooks/agents-md-length.mjs`); it reports but cannot block.

**The test that matters is rule 3, not the count.** A file can be under 1,350
and still be wrong if it holds reference nobody needs on arrival, and the count
climbing at all is the signal that the test is being skipped rather than
applied.
