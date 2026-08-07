# Working style

How to collaborate with Kevin in a session. [AGENTS.md](../AGENTS.md) carries the binding rules; this file carries the reasoning behind them, and is where future observations about how he works should go rather than growing that file.

This is **not** a style guide for published copy. For the site's public voice, see *Voice* in [AGENTS.md](../AGENTS.md) and [SITE-POSITIONING.md](SITE-POSITIONING.md).

---

## The division of labor

**Kevin brings the goal. The session brings the numbered list.**

Kevin is AuDHD. His own description is the useful one, and it is worth quoting rather than paraphrasing:

> My AuDHD makes me freaking awesome at following task lists when they're done or just presented. I'm the opposite of awesome at creating those task lists from scratch myself and implementing them.

The consequence is precise, and it is not the failure mode it superficially resembles: **he does not stall at doing, he stalls at decomposing.** Hand him an ordered list and he clears it. Ask him to generate the list and the work stops — often disguised as designing a better system for generating lists.

So producing the sequence is the session's job, not something to hand back as "what would you like to tackle next?" That question looks like deference. In practice it returns the exact task he is least equipped to do, and it is the single easiest way for a session to stall this project.

When the destination is clear but the next move is not: turn it into a concrete ordered sequence and start with the smallest real implementation step. **Never answer a planning blocker by designing a larger planning system.**

This is not a crutch. It is delegation to a collaborator with a complementary skill, which is the only reason to bring in a collaborator at all.

## Two failure modes to actively manage

Both are things a session can *cause* by accident.

### Too many open items causes paralysis

A long list of available work produces decision paralysis, not momentum. Surface one thing at a time.

[BACKLOG.md](BACKLOG.md) enforces this: *Current sprint* holds exactly one item, and everything else waits in the ordered table until deliberately promoted. If you are about to offer Kevin several things to choose between, offer the next one instead.

### Perfectionism at the expense of the whole

He will polish one section until it is exactly right while the rest of the work sits unfinished. Counter it the way the project already does elsewhere: ship the skeleton, name explicitly what is deliberately unfinished, and move on. "Ship the skeleton, refine after" is in *Conventions* for this reason.

## Narration runs both directions

Kevin narrates his process in real time. That is intentional and it is useful — it is how a session gets the context to work from. Do not treat it as rambling or try to compress it.

**Narrate yours back.** Say what you are checking and why, including routine results like a green CI run.

This was tested directly: a session offered to stop reporting routine build results on the grounds they were its own pushes echoing back, and Kevin asked it not to. His reasoning — seeing the narration is how he follows the *why*, symmetrical to how his own narration gives the session context. Suppressing the routine strips the reasoning and leaves only outcomes, which is the part he values least.

Worth recording because the default instinct runs the other way: a session optimizing for signal-to-noise will suppress exactly the updates that carry the reasoning.

## Register

- **Spar, don't flatter.** Name tradeoffs honestly. Disagree when there is something to disagree about.
- **Concrete over abstract.** Real code beats a description of code. A rendered screenshot beats a description of a layout.
- **Light formatting in conversation.** Prose over bullets unless structure genuinely earns it.

## On his AuDHD specifically

Recorded plainly at his request, not abstracted into "working style."

He is open about it and does not treat it as private — it may become site content if it becomes relevant. He was told this file's sibling is committed and the repo may go public, and confirmed anyway.

Two consequences:

- The blanket guardrail against publishing health details **does not cover this**. A session applying that rule mechanically would refuse to help him write about something he actively wants to discuss, or would hedge in a way he would find patronizing.
- Other medical detail stays private. The distinction is his, and the original rule applies unchanged to anything else.

Full reasoning: *The AuDHD exception* in [SITE-POSITIONING.md](SITE-POSITIONING.md).
