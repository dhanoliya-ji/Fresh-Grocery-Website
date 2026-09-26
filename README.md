# Fresh Grocery Website: Freshly Market

**Live site:** https://dhanoliya-ji.github.io/Fresh-Grocery-Website/

A 3D, interactive storefront for **Freshly**, a fictional neighbourhood grocery store. It's a static site built with Vite, Three.js and GSAP. There's no backend: the cart and wishlist live in the browser, and checkout is a demo that takes no payment.

![Freshly Market](public/og.jpg)

## What's inside

- **3D hero**: real produce photos cut out and rendered in WebGL with fake volume lighting, soft contact shadows and mouse parallax. Click a fruit to jump to its aisle.
- **Walk the aisles**: 8 category shelves with 3D tilt and glare, and the product pops out of the card.
- **Fresh deals**: a 3D ring carousel (drag, swipe or arrows) with a live countdown, plus bundle boxes.
- **Shop**: 52 products with category chips, organic/sale toggles, price slider, sorting and live search (press `/`).
- **Product view**: drag-to-rotate photo, nutrition facts, weight options and "pairs well with".
- **Basket drawer**: fly-to-cart animation, 3D basket pile and a free-delivery progress bar.
- **Recipe of the day**: ingredients orbit the plate, and one click adds them all.
- **How it works**: a delivery van that drives as you scroll, and a ZIP-code checker.
- **Demo checkout**: address → delivery window → card preview → order confirmation with confetti.
- Farms parallax section, reviews and newsletter signup (code `FRESH10`).
- Respects `prefers-reduced-motion` and works on phones.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
```

## Editing the store

Everything the shop sells is in [src/data.js](src/data.js):

- `STORE`: name, free-delivery threshold, fees
- `CATEGORIES`: aisles (name, blurb, colour, hero image)
- `PRODUCTS`: `P(id, name, category, price, unit, image, { old, badges, rating, origin, desc, kcal, … })`
- `DEALS`, `BUNDLES`, `RECIPE`, `REVIEWS`

Images live in `public/img/`:

- `p/` holds product photos.
- `c/` holds transparent cut-outs, used when a product has `cut: true`.
- `s/` holds scene photos.

## Deploy to GitHub Pages

The repo includes a workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) that builds and publishes the site on every push to `main`.

1. Create a new repository on GitHub, for example `Fresh-Grocery-Website`.
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Freshly Market"
   git branch -M main
   git remote add origin https://github.com/<your-username>/Fresh-Grocery-Website.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Wait for the "Deploy to GitHub Pages" run under the **Actions** tab to finish (about a minute). The site is then live at
   `https://<your-username>.github.io/Fresh-Grocery-Website/`

Every later `git push` redeploys automatically. Asset paths are relative (`base: './'` in [vite.config.js](vite.config.js)), so the repo can have any name.

## Credits

Photos are CC0 / public domain or Creative Commons licensed, from rawpixel, Wikimedia Commons, Flickr and Openverse. The full per-image list is in [public/img/credits.json](public/img/credits.json) and in the site footer under **Photo credits**.

Freshly is a fictional store made for demonstration. Nothing is for sale.
