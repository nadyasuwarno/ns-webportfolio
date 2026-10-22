# Images

Drop images here, organized by project:

```
assets/images/
├── bibble/
├── mosaic/
└── world-models/
```

**Naming convention:** short, lowercase, hyphenated. e.g. `hero.jpg`, `station-photo.jpg`, `prompt-translator.png`.

**Formats:** JPG for photos, PNG for screenshots with transparency, WebP if you're optimizing.

**Size:** export at ~2x the display size and under 500 KB each when you can.

**How to use them in a page:**

```html
<img src="../assets/images/world-models/hero.jpg" alt="Visitors at the station" />
```

Each project's HTML already has an `<img>` line commented out in the hero block — just uncomment and change the filename.
