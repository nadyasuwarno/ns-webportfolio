# ns-webportfolio

Nadya Suwarno — portfolio site. Static HTML/CSS, zero build.

## File structure

```
ns-webportfolio/
├── index.html              → Home
├── about.html              → About page
├── projects.html           → All projects index
├── projects/               → One file per case study
│   ├── bibble.html
│   ├── world-models.html
│   └── mosaic.html
├── assets/
│   ├── styles.css          → All styling. Colors/fonts live in :root at the top.
│   ├── resume.pdf          → Drop your resume here (filename is used by all Resume links)
│   └── images/
│       ├── bibble/         → Drop Bibble images here
│       ├── world-models/   → Drop World Models images here
│       └── mosaic/         → Drop Mosaic images here
├── README.md
└── .gitignore
```

## Edit a page

Each page is one HTML file. Open it, change the text between the tags, save.

| To edit…           | Open                         |
| ------------------ | ---------------------------- |
| Home page          | `index.html`                 |
| About page         | `about.html`                 |
| Projects index     | `projects.html`              |
| A case study       | `projects/<slug>.html`       |
| Colors or fonts    | `assets/styles.css` (top)    |

**On GitHub:** click any file → pencil icon (top right) → edit in the browser → commit. Site updates in ~1 minute.

## Add a case study image

1. Save your image into the project's folder, e.g. `assets/images/bibble/hero.jpg`.
2. Open `projects/bibble.html`. Find the `<!-- Replace with: ... -->` line in the hero block.
3. Replace the `<span>` placeholder with the uncommented `<img>` line.

## Add a new case study

1. Copy an existing file, e.g. `projects/bibble.html`, to `projects/<new-slug>.html`.
2. Change the title, metadata, and section copy.
3. Create its image folder: `assets/images/<new-slug>/`.
4. Add a card for it in both `index.html` and `projects.html`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy — GitHub Pages (free, forever)

1. Create a new GitHub repo (e.g. `ns-webportfolio` or `nadyasuwarno.github.io`).
2. From this folder:

   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

   Or one-liner with the GitHub CLI:

   ```bash
   gh repo create ns-webportfolio --public --source=. --remote=origin --push
   ```

3. On GitHub → repo → **Settings → Pages** → *Source: Deploy from a branch* → *Branch: main / root*. Save.
4. Live in ~1 min at `https://<you>.github.io/<repo>/`.

### Custom domain (optional)

Add a `CNAME` file at the root with your domain, point your DNS at GitHub Pages.

## Why this setup

- **Free forever** on GitHub Pages. No server, no bill.
- **Sustainable:** plain HTML/CSS. No framework to upgrade, readable in 10 years.
- **Editable:** text is text. No CMS to log into.
- **One file = one page.** Easy to find what to edit.
