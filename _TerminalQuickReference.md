# Terminal Quick Reference (7/30/2026)

CMD, PowerShell, Bash — plus paths, redirection, and orientation.

---

## 1. The Three Shells, at a Glance

| | CMD (Command Prompt) | PowerShell | Linux / Bash (Git Bash, WSL) |
|---|---|---|---|
| **Age** | Old Windows shell | Newer Windows shell | Unix standard |
| **Flag style** | Forward slashes — `/S /F /A` | Dashes — `-Recurse -Force` | Dashes — `-r -f -a` |
| **Path style** | Backslashes | Accepts **both** `C:\Users` and `C:/Users` | Forward slashes |
| **Typical commands** | `dir`, `cd`, `copy`, `del`, `type`, `tree` | `Get-ChildItem`, `Set-Location`, `Copy-Item`, `Remove-Item` | `ls`, `cd`, `cp`, `rm`, `cat`, `find`, `grep` |

PowerShell carries aliases that mimic both CMD and Linux — `dir`, `ls`, and `cd` all work. It also runs most CMD commands, but **flag handling differs**, which is where things break.

---

## 2. Listing Files and Folders

| Goal | CMD | PowerShell | Linux |
|---|---|---|---|
| Tree, folders only | `tree` | `Get-ChildItem -Recurse -Directory` | — |
| Tree, folders + files | `tree /F /A` | `Get-ChildItem -Recurse` | — |
| Flat recursive listing | `dir /S` | `Get-ChildItem -Recurse \| Select-Object FullName` | `ls -R` or `find .` |
| Just this folder | `dir` | `ls` | `ls` |

Flag meanings: `/F` = show **F**iles · `/A` = **A**SCII characters · `/S` = include **S**ubdirectories

---

## 3. Flag Gotchas

| Command | Valid flags | Trap |
|---|---|---|
| `tree` | `/F` `/A` | Case and order don't matter — `/F /A` == `/a /f` |
| `dir` | `/S` `/A` `/B` `/O` | **No `/F`** — that's a `tree` flag |

**When PowerShell rejects a CMD command** (symptom: *"Too many parameters"* or other weirdness), pick one:

1. Tunnel through CMD — `cmd /c "tree /F /A"`
2. Call the `.com` binary directly — `tree.com /F /A`
3. Use the PowerShell native equivalent — `Get-ChildItem -Recurse`

---

## 4. Redirecting Output to a File

Same syntax in all three shells:

| Operator | Effect |
|---|---|
| `> file.txt` | Overwrite, or create new |
| `>> file.txt` | Append to existing |

```powershell
tree /F /A > structure.txt

dir "C:\Unity Projects\RHWM Emergency Response v0.5" /s > "C:\Unity Projects\RHWM Emergency Response v0.5\structure.txt"
```

---

## 5. Paths & Orientation

### Path conventions

| Shell | Example |
|---|---|
| Windows | `C:\Users\pledger2\Documents` |
| Linux | `/home/pledger2/documents` |
| PowerShell | either — `C:\Users` or `C:/Users` |

**Always quote paths with spaces:**

```powershell
cd "C:\Unity Projects\RHWM Emergency Response v0.5"
```

### "Where am I?"

| Goal | CMD | PowerShell | Linux |
|---|---|---|---|
| Show current folder | `cd` (no arguments) | `pwd` or `Get-Location` | `pwd` |
| Change folder | `cd "path\to\folder"` | same | same |

### Skip the `cd` entirely

In Windows File Explorer: right-click empty space inside the folder --> **Open in Terminal**. PowerShell opens already in that folder. Hold Ctrl and Shift while clicking **Open in Terminal** to open PowerShell in administrator mode.

---

## 6. Things I Learned the Hard Way

- `tree` flag order and case don't matter (`/F /A` == `/a /f`).
- `dir` has no `/F` flag — that belongs to `tree`.
- *"Too many parameters - -f"* usually means mixed-up commands, or being in PowerShell when the syntax was CMD.
- PowerShell opens in `C:\Users\<me>` by default. `cd` to the project folder **before** running Git commands.
- Quote paths with spaces. Always.
