# Connecting to GitHub

1. First, ensure you have Git installed on your computer:
   - Download Git from https://git-scm.com/downloads
   - Follow the installation instructions for your operating system

2. Configure Git with your GitHub credentials:
   ```bash
   git init
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. Create a new repository on GitHub:
   - Go to https://github.com
   - Click the "+" icon in the top right corner
   - Select "New repository"
   - Fill in the repository name and other details
   - Click "Create repository"

4. Connect your local project to GitHub:
   ```bash
   git remote add origin https://github.com/username/repository-name.git
   git branch -M main
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

5. Authentication:
   - You'll be prompted to authenticate with GitHub
   - For better security, it's recommended to use SSH keys or GitHub CLI
   - Alternatively, you can use GitHub Desktop for a graphical interface

## Troubleshooting Permission Errors

If you see a "Permission denied" or "403" error when pushing:

1. Verify you're using the correct GitHub account:
   ```bash
   git config --global user.name
   git config --global user.email
   ```

2. Re-authenticate with GitHub:
   - Go to GitHub's website and sign in
   - Generate a Personal Access Token:
     1. Click your profile picture → Settings
     2. Scroll to Developer Settings → Personal Access Tokens → Tokens (classic)
     3. Generate new token
     4. Select repo and workflow permissions
     5. Copy the generated token

3. When pushing, use the token as your password:
   ```bash
   git remote set-url origin https://YOUR-USERNAME@github.com/Shere-Khan510/Classroom.git
   ```
   When prompted for password, use your Personal Access Token.

Need more help? Visit: https://docs.github.com/en/authentication