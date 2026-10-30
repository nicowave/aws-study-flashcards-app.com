// "Start here": free setup tutorial shared by every course site.
// Terminal basics, a safe AWS account, the AWS command line, Git + GitHub, JSON.

const startHere = {
  slug: 'start-here',
  number: 0,
  title: 'Start here: your toolkit',
  situation: 'Before your first real task, you need the tools every cloud job assumes you have: a terminal, an AWS account that can\'t surprise you with a bill, the AWS command line, and a GitHub portfolio.',
  level: 'Beginner',
  hours: 1.5,
  free: true,
  skills: ['terminal basics', 'Git', 'JSON'],
  aws: ['AWS account', 'budget alerts', 'AWS command line'],
  overview: 'Set up once, use in every course.',
  steps: [
    {
      id: 'how-it-works',
      kind: 'read',
      title: 'How these tutorials work',
      minutes: 4,
      body: `Every tutorial follows the same loop, built around a task someone really gets asked to do at work:

1. **Read**: the situation, and the one idea you need next. Short on purpose.
2. **Try it**: practice in the terminal on the page. It's a pretend Linux server that runs in your browser, so you can't break anything.
3. **Check**: a few quiz questions and flashcards, to make it stick.
4. **Build it**: do it for real on your own computer and AWS account, and push it to GitHub. That's what you show in interviews.

### Two kinds of code boxes

\`\`\`bash
echo "This box says PRACTICE SHELL. Its Run button sends it to the terminal on the page."
\`\`\`

\`\`\`sh
echo "This box says YOUR TERMINAL. Run it on your own computer, in the Build steps."
\`\`\`

Copy and paste is fine, but you'll learn faster if you **type** the commands. Your fingers remember.

> **Your progress saves automatically** in this browser. Sign in (free) to keep it on every device.`,
    },
    {
      id: 'first-commands',
      kind: 'try',
      title: 'Your first commands',
      minutes: 10,
      body: `A terminal is a text conversation with a computer. You type a command, press Enter, and it answers. The text before your cursor is the **prompt**: who you are, which computer, and which folder you're in (\`~\` means your home folder).

| Command | What it does |
|---|---|
| \`pwd\` | **p**rint **w**orking **d**irectory: which folder am I in? |
| \`ls\` | **l**i**s**t what's in this folder |
| \`cd notes\` | **c**hange **d**irectory: go into the \`notes\` folder |
| \`cd ..\` | go up one folder |
| \`cat file.txt\` | print a file's contents |

Try them in order:

\`\`\`bash
pwd
\`\`\`

\`\`\`bash
ls
\`\`\`

\`\`\`bash
cat welcome.txt
\`\`\`

Press the **Up arrow** to bring back earlier commands, and **Tab** to finish file names for you.`,
      task: 'There\'s a folder called `notes` in your home folder. Go into it, find the file inside, and print what it says.',
      hint: 'Use `cd notes`, then `ls` to see the file name, then `cat` with that name. Tab completes names.',
      solution: 'cd notes\nls\ncat first-day.txt',
      scenario: {
        hostname: 'practice',
        files: {
          'welcome.txt': 'Welcome to the practice shell!\nTry: ls, cd notes, cat <file>\n',
          'notes/first-day.txt': 'First day checklist: you found it. The terminal is just folders and files.\n',
        },
      },
      check: ({ result }) => (result.stdout.includes('you found it') ? true : null),
      success: 'That\'s the core of every terminal: move around, look, read. Everything else builds on it.',
    },
    {
      id: 'your-terminal',
      kind: 'build',
      title: 'Open a terminal on your own computer',
      minutes: 10,
      body: `The Build steps run on your computer, so let's find its terminal.

### Mac
Open **Terminal** (press ⌘ + Space, type *Terminal*). Your Mac's shell is **zsh**, a close cousin of Bash. Scripts in this course start with \`#!/bin/bash\`, so they run in real Bash either way.

### Windows
Install the **Windows Subsystem for Linux**, which gives you a real Ubuntu Linux terminal. Open PowerShell as administrator and run:

\`\`\`sh
wsl --install
\`\`\`

Restart, then open **Ubuntu** from the Start menu and pick a username and password.

### Linux
You already have it: open **Terminal**.

Check it works:

\`\`\`sh
echo "Hello from $(whoami) on $(hostname)"
\`\`\``,
      checklist: [
        'I opened a terminal on my computer',
        'I ran `echo "Hello from $(whoami) on $(hostname)"` and saw my user name',
      ],
    },
    {
      id: 'aws-account',
      kind: 'build',
      title: 'Create an AWS account that can\'t surprise you',
      minutes: 20,
      body: `Everything in these courses fits in the AWS Free Tier or costs a few cents. Set up these guard rails **before** you build anything:

1. **Create the account** at [aws.amazon.com](https://aws.amazon.com/). You'll need a card, even for free use.
2. **Protect the root user.** The email you signed up with is the *root user*: it can do anything, including close the account. Turn on **multi-factor authentication (MFA)** for it (top-right menu → *Security credentials*), then stop using it day to day.
3. **Set a budget alert.** Search the console for **Budgets** → *Create budget* → *Use a template* → **Zero spend budget**, with your email. AWS emails you the moment anything costs money.
4. **Make an everyday admin sign-in.** Search for **IAM Identity Center** → *Enable*. Create a user for yourself, then give it the *AdministratorAccess* permission set on your account. You'll get a sign-in link: bookmark it, and use it instead of the root user.

> **Why this matters for jobs:** "Never use the root user" and "least privilege" are questions on every AWS exam and in most cloud interviews. You just did both.`,
      checklist: [
        'My AWS account is created',
        'Multi-factor authentication is on for the root user',
        'A zero-spend budget alert is set to my email',
        'I signed in with my IAM Identity Center user, not the root user',
      ],
    },
    {
      id: 'aws-command-line',
      kind: 'build',
      title: 'Install the AWS command line and sign in',
      minutes: 15,
      body: `The **AWS command line** (the \`aws\` command) lets scripts do anything you'd click in the console.

1. Install version 2 by following AWS's guide for your system: [Installing the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html). Check it:

\`\`\`sh
aws --version
\`\`\`

2. Connect it to your IAM Identity Center user. It asks for the *start URL* from your sign-in link and the region (\`us-east-1\` is fine), then opens your browser to approve:

\`\`\`sh
aws configure sso
\`\`\`

Name the profile \`default\` when asked, so plain \`aws\` commands use it. When the sign-in expires (after a few hours), run \`aws sso login\`.

3. Ask AWS who you are:

\`\`\`sh
aws sts get-caller-identity
\`\`\`

You should see your 12-digit account number. You're in.

> **Never paste access keys into scripts or GitHub.** Short-lived sign-ins like this one are the safe default. Leaked keys are the most common way AWS accounts get hijacked.`,
      checklist: [
        '`aws --version` shows version 2',
        '`aws sts get-caller-identity` shows my account number',
      ],
    },
    {
      id: 'git-github',
      kind: 'build',
      title: 'Git and GitHub: your portfolio',
      minutes: 20,
      body: `**Git** keeps the history of your files. **GitHub** stores it online, where employers can see your work. Each tutorial ends by pushing what you built.

1. Install Git: on Mac run \`git --version\` (it offers to install); on Ubuntu or Windows Subsystem for Linux run \`sudo apt install git\`.
2. Tell Git who you are:

\`\`\`sh
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
\`\`\`

3. Create a free account at [github.com](https://github.com), then a new repository called **aws-study-projects** (tick *Add a README*).
4. Copy it to your computer, add a file, and send it back:

\`\`\`sh
git clone https://github.com/YOUR-NAME/aws-study-projects.git
cd aws-study-projects
echo "# My AWS study projects" > README.md
git add README.md
git commit -m "Start my portfolio"
git push
\`\`\`

GitHub asks you to sign in the first time. The easiest way is the [GitHub command line](https://cli.github.com/): \`gh auth login\`.

> **Keep secrets out of Git.** Anything you commit can be found forever, even after you delete it. Put passwords and keys in a vault, such as AWS Secrets Manager, and list local secret files in \`.gitignore\`.`,
      checklist: [
        'Git is installed and knows my name and email',
        'My aws-study-projects repository is on GitHub',
        'I pushed a commit from my computer',
      ],
    },
    {
      id: 'json',
      kind: 'try',
      title: 'JSON in five minutes',
      minutes: 10,
      body: `AWS answers almost everything in **JSON**: text that holds data as \`"name": value\` pairs inside \`{ }\`, and lists inside \`[ ]\`.

\`\`\`json
{
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/learner",
  "Tags": ["prod", "web"]
}
\`\`\`

You rarely need the whole thing. Two ways to pick one value:

| Way | Example |
|---|---|
| \`--query\` (built into the AWS command line) | \`aws sts get-caller-identity --query Account --output text\` |
| \`jq\` (a JSON tool for any command) | \`aws sts get-caller-identity \\| jq -r .Account\` |

The practice shell has a pretend AWS account. Ask it who you are:

\`\`\`bash
aws sts get-caller-identity
\`\`\``,
      task: 'Print **only** the account number, with no quotes or braces around it.',
      hint: 'Add `--query Account --output text` to the command, or pipe it into `jq -r .Account`.',
      solution: 'aws sts get-caller-identity --query Account --output text',
      scenario: {},
      check: ({ result }) => (result.stdout.trim() === '123456789012' ? true : result.stdout.includes('123456789012') && result.stdout.includes('{') ? 'Close: that\'s the whole JSON. Pick out just the Account value.' : null),
      success: 'You just did what every AWS script does: ask AWS a question, then pull out the one value you need.',
    },
  ],
};

export default startHere;
