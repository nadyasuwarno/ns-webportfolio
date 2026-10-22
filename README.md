# ns-webportfolio

Nadya Suwarno — portfolio site. Static HTML/CSS, zero build.

## Edit

All copy lives in `index.html`. Styles in `styles.css`.
Change text, save, commit — that's it. You can edit directly on github.com using the pencil icon on any file.

## Preview locally

Open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy — GitHub Pages (free, forever)

1. Create a new GitHub repo (e.g. `ns-webportfolio` or `nadyasuwarno.github.io`).
2. From this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

3. On GitHub → repo → **Settings → Pages** → *Source: Deploy from a branch* → *Branch: main / root*. Save.
4. Live in ~1 minute at `https://<you>.github.io/<repo>/` (or `https://<you>.github.io/` if the repo is named `<you>.github.io`).

### Custom domain (optional)

Add a `CNAME` file with your domain, then point your DNS at GitHub Pages (`A` records to GitHub's IPs or `CNAME` to `<you>.github.io`).

## Why this setup

- **Free forever** on GitHub Pages; no server, no runtime, no bill.
- **Sustainable:** plain HTML outlives frameworks. Readable in 10 years.
- **Editable:** text is text. No CMS to log into.
- **Fast:** static files from a CDN.
