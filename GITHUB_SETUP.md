# Move bharatdeal to GitHub (and let Claude work there)

This guide gets your project onto GitHub as a **private** repo and connects the
**Claude GitHub App** so Claude can respond to issues and open PRs directly in
the repository.

You'll only run a handful of commands. Total time: ~5 minutes.

---

## Step 1 — Install git + GitHub CLI on your Mac

Open **Terminal** (Cmd+Space, type "Terminal", Enter) and run:

```bash
# Install Homebrew if you don't have it (skip if `brew --version` works)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install git and the GitHub CLI
brew install git gh
```

Verify:

```bash
git --version
gh --version
```

---

## Step 2 — Sign in to GitHub from the terminal

```bash
gh auth login
```

Answer the prompts like this:

1. `What account do you want to log into?` → **GitHub.com**
2. `What is your preferred protocol for Git operations?` → **HTTPS**
3. `Authenticate Git with your GitHub credentials?` → **Y**
4. `How would you like to authenticate?` → **Login with a web browser**

It will print a one-time code, then open your browser. Paste the code, approve,
and you're signed in.

---

## Step 3 — Run the setup script

From Terminal:

```bash
cd ~/Downloads/bharatdeal
bash ./scripts/push-to-github.sh
```

That script will:

- Commit your current uncommitted changes
- Create a **private** repo named `bharatdeal` on your GitHub account
- Push `main` to it
- Print the URL so you can open it in the browser

---

## Step 4 — Install the Claude GitHub App on the repo

1. Go to https://github.com/apps/claude
2. Click **Install** (or **Configure** if already installed)
3. Choose **Only select repositories** → pick `bharatdeal`
4. Click **Install & Authorize**

Once installed, you can:

- Open an issue and write `@claude please add a logout button` — Claude will
  open a PR.
- Comment `@claude` on any PR to get Claude to review or iterate.

> Note: the Claude GitHub App is a separate Anthropic offering with its own
> billing/limits. See https://docs.claude.com for current details.

---

## What about working from another computer?

Anywhere you want to work on this code:

```bash
gh auth login          # one-time per machine
gh repo clone <your-username>/bharatdeal
cd bharatdeal
npm install
```

You're set.

---

## Troubleshooting

**`gh: command not found`** — Homebrew installs to `/opt/homebrew/bin` on Apple
Silicon. Run `eval "$(/opt/homebrew/bin/brew shellenv)"` then retry.

**Push fails with "remote already exists"** — Run `git remote remove origin`
and re-run the script.

**Want to change the repo name** — Edit `REPO_NAME` near the top of
`scripts/push-to-github.sh`.
