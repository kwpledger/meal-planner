# Git Quick Reference (7/30/2026)

Ordered by how often it actually gets used: daily workflow first, emergencies last.

---

## 1. Workflow for Committing, Pushing, and Pulling (Not Just Daily -- Every Time)

### At Work When Committing (Using LLNL GitLab)

Note: If you are not on site *and* connected to the wired network, make sure you are on the VPN first!

```powershell
git status                              # See what's changed since last commit
git add .                               # Stage all changes
git commit -m "Message in past tense"   # Save changes to history
git push                                # Send commits to GitLab
git log --oneline [-#]                  # Show commit history, one line each [optional: the last # of commits]
```

### At Home — Start of Session (Using GitHub, Sitting Down at Either PC)

```powershell
git status                              # Confirm you're clean before pulling
git pull --rebase                       # Get whatever the OTHER machine pushed since your last push here (Do this BEFORE you push.)
```

**Notes:**
1. `git pull --rebase` avoids merge commits: it fetches the latest remote changes and replays your unpushed local commits on top. **Never use it on a shared branch** — it rewrites commit hashes and disrupts everyone else's work.
2. Remember the Mnemonic: "Pull when you sit down, push when you get up." The committing-point ritual below covers the "get up" half.

### At Home — When Committing (Using GitHub)

```powershell
git status                              # See what's changed since last commit
git add .                               # Stage all changes
git commit -m "Message in past tense"   # Save changes to history
git pull --rebase                       # Get whatever the OTHER machine pushed since your last push here (Do this BEFORE you push.)
git push                                # Send commits to GitHub
git log --oneline [-#]                  # Show commit history, one line each [optional: the last # of commits]
```

**Notes Again:**
1. `git pull --rebase` avoids merge commits: it fetches the latest remote changes and replays your unpushed local commits on top. **Never use it on a shared branch** — it rewrites commit hashes and disrupts everyone else's work.
2. Remember the Mnemonic: "Pull when you sit down, push when you get up." The committing-point ritual below covers the "get up" half.

### Staging shortcuts

| Command | Does |
|---|---|
| `git add .` | Stage everything — new **and** modified files |
| `git commit -am "msg"` | Stage + commit modified **tracked** files in one step. Does **not** include new untracked files |

---

## 2. Pre-Commit Checklist

- [ ] Saved all scenes in Unity (`Ctrl` + `S`) — and the project itself
- [ ] Ran `git status` to see what's actually changing
- [ ] Commit message describes what was done, in **past tense**
- [ ] Not committing `Library/`, `Temp/`, or other generated cruft

Unity-specific pre-commit settings live in `_UnityQuickReference.md` §8.

---

## 3. Investigating

| Command | Shows |
|---|---|
| `git diff` | Unstaged changes |
| `git diff --staged` | Staged-but-not-committed changes |
| `git log` | Full commit history with details |
| `git log --oneline -20` | Last 20 commits only — far more readable |
| `git show <hash>` | What changed in one specific commit |
| `git log --oneline --graph --all` | Branches and merges visualized in the terminal |
| `git lfs ls-files` | Files tracked by Git LFS |

---

## 4. Branching & Switching

| Command | Does |
|---|---|
| `git branch` | List branches |
| `git branch <name>` | Create a new branch |
| `git switch <name>` | Switch to an existing branch — safer than `checkout` |
| `git switch -c <name>` | Create a new branch and switch to it immediately |
| `git merge <name>` | Merge a branch into the current branch |

---

## 5. Reverting & Restoring

| Command | Does |
|---|---|
| `git restore <file>` | Discard unstaged changes in one file |
| `git restore .` | Discard all unstaged changes in the current directory |
| `git restore --source=<hash> <file>` | Restore one file from a past commit without moving HEAD |
| `git reset --hard <hash>` | ⚠️ Wipe everything and roll the project back to a commit |
| `git reset --hard HEAD` | ⚠️ Wipe everything and roll back to the last commit |

---

## 6. LLNL GitLab Access

Remote: `sd-git.llnl.gov` — **internal only.**

Must be on the lab network (on-site) or connected to VPN (working from home) before:

- `git push`
- `git pull`
- `git fetch`
- `git clone`

Local commits work fine without VPN. Verify the remote with `git remote -v`.

---

## 7. Home Projects Using Two Computers for One Project.

To start a new project (local on desktop) and continue it as local on the laptop:

1. Per project (one time on `Helios`, in `E:\Claude Code Projects\[Name of Project]\`):

```powershell
git init
git add .
git commit -m "Initial commit"
gh repo create [Name of Project] --private --source=. --push
```

2. On `Hephaestus`, pick any folder and go to it. It does not need to be `E:` or match the path:

```powershell
git clone https://github.com/kwpledger/[Name of Project].git

# Only if the repo has a package.json in its root:
npm install
```

**Note:** `node_modules/` is gitignored on purpose. it's large, machine-specific, and fully derivable. `npm install` reads `package.json` and re-downloads everything locally.

3. Then the daily rhythm is just:

- Before you start working on a machine: `git pull --rebase`
- When you stop: `git add -A`; `git commit -m "..."`; `git push`

### Things I learned from someone else **before** I learned them the hard way

- LFS is per-machine, not per-repo. Run `git lfs install` once on the second machine *before* you clone any projects. If you skip it, your FBX/textures/video come down as tiny text "pointer" files instead of the real assets, and Unity opens to a pile of broken pink/missing references. Your `.gitattributes` travels with the repo, but the LFS *program* has to be present locally on each PC.
- Watch GitHub's LFS quota. This is the one that might actually bite you. GitHub's free tier is 10 GB of LFS storage and 10 GB/month bandwidth. A Unity project with baked lighting, video files, and high-res textures blows past that fast, and every git clone/big pull on the laptop spends bandwidth. If a project is asset-heavy, either add metered billing (not cheap; as of 7/30/26, additional storage is $0.07 per GiB and additional data transfer out is $0.0875 per GiB) or see about keeping that particular project on your LLNL GitLab instead, which has its own limits.
- If the "pull when you sit, push when you stand" discipline slips, Git stops you — rejected `push`, run `pull --rebase`, `push` again. The cost of forgetting is thirty seconds and mild annoyance, not lost work. The only way to convert that into real damage is to reach for `--force` when you see the rejection, and now you know exactly why not to.

---

## 8. Troubleshooting

### "fatal: not a git repository"

1. Look at the PowerShell prompt.
2. If it isn't `PS C:\[Program] Projects\[Name of Project]>`, you're in the wrong folder.
3. Fix: `cd "C:\[Program] Projects\[Name of Project]"`
4. Better: open PowerShell from inside the project folder — right-click --> **Open in Terminal**.

> **The silent version of this bug:** a folder that isn't a repo at all throws the fatal error. Being in the *wrong repo* throws nothing. Run `git remote -v` or `git status` to confirm which project you're looking at.

### Things I learned the hard way

- `.gitignore` and `.gitattributes` must start with a dot, no prefix.
- Adding a file to `.gitignore` does nothing once Git already tracks it. Use `git rm --cached <file>`.
- `Library/` should **never** be tracked — Unity regenerates it.
- If `Temp/` gets tracked, untrack it with `git rm -r --cached Temp/`.
- Commit often, small and focused.
- `warning: LF will be replaced by CRLF` is fine. Ignore it.
- Rebasing rewrites parent commits and changes hashes. Never rebase anything already pushed to a shared public branch. `pull --rebase` reorders your *unpushed* commits, which is always fine. The "never rebase shared history" rule is about *already-pushed* commits, a different thing.
- `git checkout <hash>` with **no filename** detaches HEAD — the whole project jumps to that commit.
  - To revert one file instead: `git restore --source=<hash> <file>`
  - To escape detached HEAD: `git switch master`, then `git restore .`

---

## 9. In Case of Dire Emergency

```powershell
git reset --soft HEAD~1                 # this is the safe version (see note below)
```

Undoes the last commit but **keeps all changes staged** — perfect for when you committed before saving a Unity scene.

**Note:** On a single machine that's just destructive-to-uncommitted-work. On two machines it's sharper: if you ever `reset --hard` (as opposed to `--soft`) to roll back and then `push`, you can clobber commits the other PC made. If you find yourself wanting to undo already-pushed history across machines, that's the moment to stop and check both are in sync first (or reach for `git revert`, which is safe to push). Not a change to make — just a "handle with extra care now that there are two of you."

Beyond that: [dangitgit.com](https://dangitgit.com) — or the saltier [ohshitgit.com](https://ohshitgit.com). Both cover:

- Committed to the wrong branch
- Need to undo a commit that was already pushed
- Accidentally committed sensitive files
- Lost work in a detached HEAD state
- Made a mess and want to nuke everything and start over
