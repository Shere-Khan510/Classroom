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

Need help setting up SSH keys or encountering issues? Visit: https://docs.github.com/en/authentication