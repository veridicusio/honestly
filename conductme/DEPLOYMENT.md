# 🚀 Complete Step-by-Step Guide: Deploy VERIDICUS to Cloudflare Pages

**This guide is written for absolute beginners. Every single click is explained!**

---

## 📋 What You Need Before Starting

1. ✅ Your code pushed to GitHub (or GitLab/Bitbucket)
2. ✅ A Cloudflare account (free account works perfectly!)
3. ✅ The domain `veridicus.io` (you said you already have this)

**That's it!** You don't need to know coding, servers, or anything complicated.

---

## PART 1: Add Your Domain to Cloudflare (Domain Onboarding)

**If you already added veridicus.io to Cloudflare, skip to Part 2!**

### Step 1.1: Log Into Cloudflare

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: **https://dash.cloudflare.com**
3. Enter your email and password
4. Click the blue **"Log in"** button

**What you'll see:** Your Cloudflare dashboard with a list of websites (or it might be empty if this is your first time)

---

### Step 1.2: Add Your Domain

1. Look at the top right of the page
2. You'll see a big button that says **"Add a site"** or **"Add site"** - click it!
3. A box will appear asking for your domain
4. Type exactly: **`veridicus.io`** (no www, no https://, just the domain)
5. Click the blue **"Add site"** button below the box

**What happens next:** Cloudflare will scan your domain to see what DNS records exist

---

### Step 1.3: Choose a Plan

1. You'll see a page asking you to choose a plan
2. **Scroll down** and look for the **"Free"** plan
3. Click the gray **"Continue with Free"** button (it's on the right side)
4. **Don't worry** - the free plan is perfect for this!

**Why free works:** Cloudflare Pages is free, and the free plan includes everything you need!

---

### Step 1.4: Get Your Nameservers

1. After choosing the plan, Cloudflare will show you **2 nameservers**
2. They'll look something like:
   - `alice.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`
3. **IMPORTANT:** Write these down or copy them! You'll need them in the next step
4. You'll see a big blue button that says **"Continue"** - click it

**What are nameservers?** Think of them like the address book for your domain. Cloudflare needs to be in charge of your domain's address book.

---

### Step 1.5: Update Nameservers at Your Domain Registrar

**Where did you buy veridicus.io?** (GoDaddy, Namecheap, Google Domains, etc.)

1. **Log into** the website where you bought the domain (where you registered veridicus.io)
2. **Find** the "DNS Settings" or "Nameservers" section
   - It might be under "Domain Settings" or "Advanced Settings"
   - Look for words like "Nameservers", "DNS", or "Domain Name Servers"
3. **Change** the nameservers to the ones Cloudflare gave you:
   - Replace the old nameservers with the 2 Cloudflare nameservers
   - Delete the old ones and add the new Cloudflare ones
4. **Save** the changes

**Example of what you're changing:**
- **OLD:** `ns1.godaddy.com` and `ns2.godaddy.com`
- **NEW:** `alice.ns.cloudflare.com` and `bob.ns.cloudflare.com` (your actual Cloudflare nameservers)

**How long does this take?** Usually 5 minutes to 24 hours. Cloudflare will email you when it's done!

---

### Step 1.6: Wait for Cloudflare to Verify

1. Go back to your Cloudflare dashboard
2. You'll see your domain `veridicus.io` with a status
3. It might say **"Pending"** or **"Active"**
4. **Wait** until it says **"Active"** (this means Cloudflare is now managing your domain!)

**How to check:** Refresh the page every few minutes. When the status changes to "Active", you're ready!

**✅ Domain onboarding complete!** Now move to Part 2!

---

## PART 2: Deploy Your Website to Cloudflare Pages

### Step 2.1: Go to Cloudflare Pages

1. In your Cloudflare dashboard, look at the **left sidebar** (menu on the left)
2. Find and click **"Workers & Pages"**
3. You'll see a new page with options
4. Click the big blue button that says **"Create application"**
5. A menu will pop up - **IMPORTANT:** Click **"Pages"** (NOT "Workers"!)
6. Then click **"Connect to Git"**

**⚠️ CRITICAL:** Make sure you click **"Pages"** not **"Workers"**! 
- **Pages** = Website hosting (what you want)
- **Workers** = Serverless functions (NOT what you want for this)

**How to tell the difference:**
- If you see "Deploy command: npx wrangler deploy" → You're in **Workers** (WRONG!)
- If you see "Build output directory" field → You're in **Pages** (CORRECT!)

**What you're doing:** Telling Cloudflare to grab your code from GitHub and host it as a website

---

### Step 2.2: Connect Your GitHub Account

1. You'll see a page asking you to connect a Git provider
2. Click the **"GitHub"** button (it has a GitHub logo)
3. A popup window will appear asking you to authorize Cloudflare
4. Click **"Authorize Cloudflare"** or **"Install"**
5. You might need to enter your GitHub password
6. Click **"Authorize"** on the GitHub page

**What this does:** Gives Cloudflare permission to see your code repositories (don't worry, it's safe!)

---

### Step 2.3: Select Your Repository

1. After authorizing, you'll see a list of your GitHub repositories
2. **Find** the repository that contains your `conductme` folder
3. **Click** on the repository name to select it
4. Click the blue **"Begin setup"** button at the bottom

**Can't find your repo?** Make sure you pushed your code to GitHub first! If you haven't, go to GitHub.com, create a repository, and push your code there.

---

### Step 2.4: Configure Build Settings

**This is the most important step!** Fill in these boxes exactly:

#### Project Name
- **Box label:** "Project name"
- **Type:** `veridicus` (or whatever you want to call it)
- This is just a name for your project in Cloudflare

#### Production Branch
- **Box label:** "Production branch"
- **Type:** `main` (or `master` if your default branch is called master)
- **How to check:** Go to your GitHub repo and look at the branch dropdown - use whatever your main branch is called

#### Framework Preset ⚠️ IMPORTANT!
- **Box label:** "Framework preset"
- **If you see "Next.js" in the dropdown:** Select it!
- **If you DON'T see "Next.js"** (you see "http", "node", "node_modules", etc.):
  - **Select "None"** or leave it blank
  - **Don't worry!** We'll configure everything manually
  - This is totally fine and will work perfectly!

**⚠️ WAIT!** If you DON'T see a "Build output directory" field at all, you're in the **WRONG PLACE**!
- You're probably in **Workers** instead of **Pages**
- Go back and make sure you clicked **"Pages"** not **"Workers"**
- Workers don't have a "Build output directory" field - only Pages does!

#### Build Command
- **Box label:** "Build command"
- **Type exactly:** `cd conductme && npm install && npm run build`
- **What this does:** Goes into your conductme folder, installs packages, then builds your website
- **⚠️ IMPORTANT:** Use `npm install` (NOT `npm ci`) because `npm ci` requires package.json and package-lock.json to be perfectly in sync, which often causes build failures

#### Build Output Directory ⚠️ THIS IS THE ANSWER!
- **Box label:** "Build output directory"
- **Type exactly:** `.next`
- **NOT** `conductme/.next` - just `.next` (because we're already in the conductme folder from the build command)
- **What this does:** Tells Cloudflare where to find the built website files after the build completes

**Wait, why `.next` and not `conductme/.next`?**
- The build command starts with `cd conductme`, which means we're already inside the conductme folder when the build runs
- So the output directory is relative to the conductme folder, not the root
- That's why it's just `.next`, not `conductme/.next`

#### Root Directory
- **Box label:** "Root directory"
- **Type exactly:** `conductme`
- **What this does:** Tells Cloudflare your code is in a subfolder, not at the root

**⚠️ SPECIAL CASE:** If your GitHub repository IS the conductme folder (not a parent folder), then:
- **Build command:** `npm install && npm run build` (no `cd conductme`)
- **Build output directory:** `.next`
- **Root directory:** Leave this **EMPTY** or put `/`

---

### Step 2.5: Set Environment Variables

**Before clicking "Save and Deploy", let's add environment variables!**

1. **Scroll down** on the same page
2. Look for a section called **"Environment variables"** or **"Variables"**
3. Click **"Add variable"** or the **"+"** button
4. You'll add these **3 variables** one by one:

#### Variable 1: API URL
- **Variable name:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://api.veridicus.io` (or your actual API URL if you have one)
- **Environment:** Make sure **"Production"** is checked
- Click **"Add"** or **"Save"**

#### Variable 2: WebSocket URL
- Click **"Add variable"** again
    - **Variable name:** `NEXT_PUBLIC_WS_URL`
    - **Value:** `wss://ws.veridicus.io/ws/veridicus` (or your actual WebSocket URL)
- **Environment:** Make sure **"Production"** is checked
- Click **"Add"** or **"Save"**

#### Variable 3: Site URL
- Click **"Add variable"** again
- **Variable name:** `NEXT_PUBLIC_SITE_URL`
- **Value:** `https://veridicus.io`
- **Environment:** Make sure **"Production"** is checked
- Click **"Add"** or **"Save"**

**Don't have an API yet?** That's okay! The app will work with mock data. You can update these later.

---

### Step 2.6: Deploy!

1. **Scroll to the bottom** of the page
2. Look for a big blue button that says **"Save and Deploy"**
3. **Click it!**

**What happens next:**
- Cloudflare will start building your website
- You'll see a progress screen with logs
- This takes 2-5 minutes
- **Don't close the page!** Watch it build (it's fun to see!)

---

### Step 2.7: Wait for Build to Complete

1. You'll see a page with build logs scrolling
2. Look for messages like:
   - ✅ "Installing dependencies..."
   - ✅ "Running build command..."
   - ✅ "Deploying..."
3. When you see **"Success"** or **"Deployed"**, you're done!
4. You'll get a URL like: `https://veridicus-abc123.pages.dev`

**If it fails at "Dependencies" or "Installing dependencies":**

1. **Click on the failed build** to see the full error logs
2. **Scroll up** to see what went wrong
3. Common dependency errors and fixes:
   - **"npm ERR! Missing: [package] from lock file"** or **"package.json and package-lock.json are out of sync"** → cd conductme && npm install && npm run build
     - **SOLUTION:** Change build command to: ``
     - `npm install` will update the lock file automatically, `npm ci` requires them to be perfectly in sync
   - **"npm ERR! code ENOENT"** → Missing `package.json` or wrong root directory
   - **"npm ERR! Cannot find module"** → Dependencies not in `package.json`, or need to run `npm install` locally first
   - **"npm ERR! peer dep missing"** → Try build command: `cd conductme && npm install --legacy-peer-deps && npm run build`
   - **"Command failed"** → Check that `package.json` has a `build` script
   - **"EACCES permission denied"** → Rare, but try: `cd conductme && npm install && npm run build`

**Most common fix:**
- If you see "Missing from lock file" errors, change build command to: `cd conductme && npm install && npm run build`
- `npm install` will fix the lock file automatically
- `npm ci` is stricter and fails if lock file is out of sync

**If it still fails:** Scroll up in the logs and look for the red error message - that will tell you exactly what's wrong!

---

## PART 3: Connect Your Custom Domain (veridicus.io)

### Step 3.1: Go to Custom Domains

1. After your site is deployed, you'll see your project page
2. Look at the **top menu** - you'll see tabs like "Deployments", "Functions", "Settings"
3. Click the **"Custom domains"** tab (or look in Settings for "Custom domains")

---

### Step 3.2: Add Your Domain

1. You'll see a button that says **"Set up a custom domain"** or **"Add custom domain"**
2. **Click it!**
3. A box will appear asking for your domain
4. Type: **`veridicus.io`** (no www, no https://)
5. Click **"Continue"** or **"Add domain"**

---

### Step 3.3: Cloudflare Does the Magic

**Cloudflare will automatically:**
1. ✅ Create the DNS record (CNAME) for you
2. ✅ Set up SSL certificate (the padlock for HTTPS)
3. ✅ Configure everything

**You'll see:**
- A status that says "Active" or "Pending"
- If it says "Pending", wait 1-5 minutes for the SSL certificate

---

### Step 3.4: Verify It Works!

1. Open a **new browser tab**
2. Type in the address bar: **`https://veridicus.io`**
3. Press Enter
4. **Your website should load!** 🎉

**What to check:**
- ✅ The page loads (doesn't show an error)
- ✅ There's a **padlock icon** 🔒 in the address bar (means HTTPS is working)
- ✅ You can navigate to `/veridicus` and see the dashboard

**If it doesn't work:**
- Wait 5-10 minutes (DNS can take time)
- Make sure your domain is "Active" in Cloudflare
- Check that the SSL certificate status is "Active"

---

## PART 4: Optional - Make veridicus.io Go Directly to Dashboard

**Right now, `veridicus.io` shows the homepage. Want it to go straight to `/veridicus`?**

### Option A: Using Cloudflare (Easiest!)

1. In Cloudflare dashboard, go to your domain (not Pages, the main domain)
2. Click **"Rules"** in the left sidebar
3. Click **"Page Rules"** or **"Redirect Rules"**
4. Click **"Create rule"**
5. Fill in:
   - **URL pattern:** `veridicus.io/`
   - **Setting:** "Forwarding URL" or "Redirect"
   - **Status code:** 301 (Permanent Redirect)
   - **Destination:** `https://veridicus.io/veridicus`
6. Click **"Save"**

**Now when someone visits veridicus.io, they'll automatically go to /veridicus!**

---

## 🎉 You're Done!

**Congratulations!** Your VERIDICUS dashboard is now live at **https://veridicus.io**!

---

## 🆘 Troubleshooting (When Things Go Wrong)

### Problem: "Build failed" or "Failing at Dependencies"

**First, check WHERE you are:**
- If you see **"Deploy command"** field → You're in **Workers** (WRONG for Next.js!)
- If you see **"Build output directory"** field → You're in **Pages** (CORRECT!)

**If you're in Workers (wrong place):**
1. **STOP!** You need to be in Pages, not Workers
2. Go back to "Workers & Pages" → "Create application" → **"Pages"** (not Workers!)
3. Create a NEW Pages project and connect your Git repo
4. Workers don't work for Next.js websites - you MUST use Pages!

**If you're in Pages and build fails at dependencies:**

1. Click on the failed deployment to see the error logs
2. Scroll up in the logs to see the exact error
3. Common fixes:
   - **"Cannot find module"** or **"npm ERR!"** → 
     - Make sure `package.json` is in the `conductme` folder
     - Make sure all dependencies are listed in `package.json`
     - Try changing build command to: `cd conductme && npm ci && npm run build` (uses `npm ci` for cleaner installs)
   - **"Command failed"** → Check your build command for typos
   - **"Directory not found"** → Check your root directory setting (should be `conductme`)
   - **"Output directory not found"** → Make sure output directory is `.next` (not `conductme/.next`)
   - **"EACCES" or permission errors** → This is rare, but try: `cd conductme && npm install --legacy-peer-deps && npm run build`

**Most common issue:** You're in Workers instead of Pages! Workers can't build Next.js apps properly.

### Problem: "Domain not working"

**What to do:**
1. Go to Cloudflare dashboard → Your domain → DNS
2. Look for a CNAME record pointing to your Pages site
3. If it's missing, Cloudflare should have created it automatically
4. If it's there but not working, wait 10-15 minutes (DNS propagation)

### Problem: "SSL certificate pending"

**What to do:**
1. Wait 5-10 minutes (certificates take time to issue)
2. Make sure your domain is "Active" in Cloudflare
3. Check that nameservers are correctly set at your registrar
4. If it's still pending after 30 minutes, contact Cloudflare support

### Problem: "Website shows blank page"

**What to do:**
1. Open browser developer tools (F12)
2. Look at the Console tab for errors
3. Check that environment variables are set correctly
4. Verify the build completed successfully

### Problem: "Can't find my repository"

**What to do:**
1. Make sure you authorized Cloudflare to access GitHub
2. Check that your code is actually on GitHub
3. Try disconnecting and reconnecting GitHub in Cloudflare settings

### Problem: "Framework preset doesn't have Next.js"

**What to do:**
1. **Don't panic!** This is totally fine
2. Select **"None"** or leave it blank
3. Make sure your build command and output directory are set correctly
4. The build will work fine without selecting a framework preset

---

## 📞 Need More Help?

- **Cloudflare Support:** https://support.cloudflare.com
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Check build logs:** Always check the deployment logs first - they tell you exactly what went wrong!

---

## ✅ Checklist: Did You Do Everything?

- [ ] Added veridicus.io domain to Cloudflare
- [ ] Updated nameservers at your registrar
- [ ] Domain shows "Active" in Cloudflare
- [ ] Connected GitHub to Cloudflare Pages
- [ ] Selected your repository
- [ ] Set framework preset to "None" (if Next.js not available)
- [ ] Set build command: `cd conductme && npm install && npm run build`
- [ ] Set build output: `.next` (NOT `conductme/.next`)
- [ ] Set root directory: `conductme`
- [ ] Added environment variables (all 3)
- [ ] Build completed successfully
- [ ] Added custom domain veridicus.io
- [ ] SSL certificate is Active
- [ ] Website loads at https://veridicus.io
- [ ] Dashboard works at https://veridicus.io/veridicus

**If you checked all boxes, you're golden! 🎉**

---

## 🔍 Quick Reference: Build Settings Summary

**For a repository where conductme is a subfolder:**
- **Framework preset:** None (or Next.js if available)
- **Build command:** `cd conductme && npm install && npm run build` (use `npm install`, NOT `npm ci`)
- **Build output directory:** `.next`
- **Root directory:** `conductme`

**Why `npm install` instead of `npm ci`?**
- `npm ci` requires `package.json` and `package-lock.json` to be perfectly in sync
- If you've added dependencies without updating the lock file, `npm ci` will fail
- `npm install` will automatically update the lock file and is more forgiving

**For a repository that IS the conductme folder:**
- **Framework preset:** None (or Next.js if available)
- **Build command:** `npm install && npm run build`
- **Build output directory:** `.next`
- **Root directory:** (leave empty)

