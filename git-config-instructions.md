# Git Configuration Instructions

To change your git committer name to "MrBranchManager", follow these steps:

## 1. Change Git User Name Locally (for this repository only)

Open a terminal and run:
```bash
git config user.name "MrBranchManager"
```

## 2. Verify the Change

Check that the name was updated:
```bash
git config user.name
```

This should output: `MrBranchManager`

## 3. Optional: Keep the Same Email

Your current email is set to: `39727967-thomasbroon@users.noreply.replit.com`

If you want to change the email as well:
```bash
git config user.email "your.new.email@example.com"
```

## 4. Optional: Set Globally (for all repositories)

If you want this name to apply to ALL git repositories on this system:
```bash
git config --global user.name "MrBranchManager"
```

## Notes

- These changes will apply to all future commits in this repository
- Past commits will still show the old committer name
- If you need to change the author of past commits, that requires rewriting git history (not recommended unless necessary)

## Current Configuration

Your current git configuration is:
- Name: Tom Brown
- Email: 39727967-thomasbroon@users.noreply.replit.com

After making the change, new commits will show:
- Name: MrBranchManager
- Email: 39727967-thomasbroon@users.noreply.replit.com (unless you change it)