# Grey Expectations — Nantucket 2026

Ready-to-publish static voyage website for GitHub Pages. This package contains the latest slideshow arrows and keyboard navigation, Liberty bookends, dated photo galleries, route replay, zoomable telemetry charts, chart-to-map selection, fog annotations, and no-wake / slowdown annotations.

## Publish on GitHub Pages

1. Extract this ZIP. Create a new GitHub repository, for example `grey-expectations-trip`. Use a **new repository** so there is no history containing private original files. A public repository works with GitHub Free.
2. Upload the **contents** of `Grey_Expectations_GitHub_Ready`, preserving the `assets`, `data`, and `vendor` folders. `index.html` must be at the repository root. Do not upload only the ZIP or wrap the website inside another folder. Include `.nojekyll`, `.gitignore`, and `CNAME` when uploading through Git. Never upload the original project_sources folder.
3. In the repository, open **Settings → Pages**. Choose **Deploy from a branch**, branch **main**, folder **/(root)**, then Save. No npm install or build step is needed.
4. Under **Custom domain**, enter `acktrip.bitterradish.com` and save before adding the GoDaddy DNS record. This package already includes a matching `CNAME` file. If you want to use only the default GitHub address initially, remove the `CNAME` file first.
5. In GoDaddy, open **bitterradish.com → DNS → Add New Record**. Add:

| Field | Value |
| --- | --- |
| Type | CNAME |
| Name | acktrip |
| Value | YOUR-GITHUB-USERNAME.github.io |
| TTL | Default |

Replace `YOUR-GITHUB-USERNAME` with your actual GitHub account name. Use only the hostname: no `https://`, no repository name, and no slash. If a conflicting record already exists for `acktrip`, replace that specific record. Keep the records for your main website, email, and astronomical-clock domain unchanged.

6. Return to **Settings → Pages**, wait for the DNS check / HTTPS certificate, and enable **Enforce HTTPS** when available. Verify `https://acktrip.bitterradish.com` in a browser.

GitHub: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
GoDaddy: https://www.godaddy.com/help/add-a-cname-record-19236

## Privacy — read before publishing

**GitHub Pages is a public website.** Its displayed photographs and downloadable voyage data are accessible to visitors. A private repository does not normally make the published Pages website private.

Included:
- 96 displayed archive photographs, thumbnails, curated gallery images and Liberty bookends. Published image files have embedded EXIF, GPS, XMP, IPTC and comment metadata removed.
- Seven voyage days of Garmin-derived coordinates and timestamps, speed, depth and water temperature used for the public map, replay and charts. This includes precise voyage departure and arrival positions, which are not blurred or cropped.
- Eleven trip days of summarized Timeline activity. Only trip dates, timing, broad activity labels, duration / distance / confidence information are included; no original location history or private place coordinates.
- Photo dates and captions and the names / narrative already shown by the website.

Excluded:
- The complete `location-history.json` file and private source uploads.
- Original GPX files, original photo uploads and photos marked skip / do not use.
- Private Timeline place IDs, home / house coordinates from location history, credentials, ChatGPT hosting settings, Git history, build archives and developer tooling.

These exclusions do not hide the places visible in photographs, captions, or the displayed voyage route. `.gitignore` is a convenience, not a security control; never commit private originals, even temporarily. Deleting a file later does not remove it from Git history.

## Local preview

Serve this folder over HTTP (opening index.html directly as a file will block the JSON fetches in many browsers):

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. The site requires internet access for OpenStreetMap tiles; Leaflet and Chart.js are bundled locally.

## Future updates

Replace the website files while retaining the domain configuration. The files in this folder are portable and can also be served by any ordinary static web host. Photo date corrections are in `data/photos.json`; map / chart / replay data are in `data/`.
