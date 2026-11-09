# Shop template

An ordering site for cafés and bakeries: home page, dine-in menu, made-to-order products with
pickup times, and an orders and sales panel. One codebase serves every shop; each shop is just
configuration in `shops/<slug>/`.

## See it live

**Demo: [delfis-pasteleria.vercel.app](https://delfis-pasteleria.vercel.app)** (orders panel at
[/admin](https://delfis-pasteleria.vercel.app/admin))

To see the whole flow, place an order in the demo, then open `/admin` in the same browser.
Payment is simulated, so nothing is charged.

**What customers get**

- A home page with hours, address, WhatsApp and the shop's favorite products
- The dine-in menu, by category
- A take-away catalog: they add cakes to the cart, choose the branch, the pickup day and time,
  and pay online with Mercado Pago
- A confirmation page with the order summary

**What the shop gets** (`/admin`)

- Incoming orders, grouped by pickup day and branch, which they mark as delivered
- A sales dashboard: revenue per day, best-selling products and the busiest weekdays

**Built with** Next.js 16, React 19, Tailwind CSS 4 and Base UI, deployed on Vercel.

```
shops/
  types.ts            what a shop can configure (every field is documented)
  _template/          copied by `npm run new-shop`
  sasha/
    shop.ts           name, contact, hours, colors, texts, features
    menu.json         categories and products (generated, don't edit by hand)
    stock-photos.json openly licensed photos for products without one (credited at /creditos)
    fonts.ts          optional: the shop's own display and body fonts (default: shops/fonts.ts)
public/shops/<slug>/  that shop's logo, cover and photos
```

The `SHOP` environment variable picks the shop (default: `sasha`). `npm run dev` and
`npm run build` write `shops/current.ts` (and `shops/current-fonts.ts`) from it, and the app imports the shop from there.

## Add a shop

```bash
npm run new-shop -- cafe-roma "Café Roma"
```

1. Fill in `shops/cafe-roma/shop.ts`: address, WhatsApp, hours, colors and texts.
2. Put the logo and cover in `public/shops/cafe-roma/` and point to them in `shop.ts`.
3. Load the menu from a spreadsheet. Import `shops/_template/menu-ejemplo.csv` into Google Sheets,
   fill it in, share it as "anyone with the link", then:
   ```bash
   npm run menu-from-csv -- cafe-roma "https://docs.google.com/spreadsheets/d/<id>/edit"
   ```
   For a shop on Parra Marketplace: `npm run import-parra -- <parra-slug> cafe-roma`.
   For a shop on Núcleo Check (`prod.nucleocheck.com/menu/<id>/1`): `npm run import-nucleocheck -- <id> cafe-roma`.
4. Try it locally:
   ```bash
   SHOP=cafe-roma npm run dev               # bash
   $env:SHOP="cafe-roma"; npm run dev       # PowerShell
   ```
5. Deploy: in Vercel, create a new project from this same repo and set the environment
   variable `SHOP=cafe-roma`. Each shop is its own project, so it gets its own domain.

## Send one link

Every shop has a pitch page at `/demo` (e.g. [delfis-pasteleria.vercel.app/demo](https://delfis-pasteleria.vercel.app/demo)):
the YouTube video, a button to the store and a button to the panel, so a message needs one link
instead of three. Add the video in `shop.ts` with `demo: { youtubeId: "095jFol3ey4" }` (the part
after `youtu.be/`). Without it, the page shows only the two buttons. Nothing on the site links to it.

## Plans

Two settings in `shop.ts` decide what the shop gets:

| | Basic | Pro |
|---|---|---|
| `orders.payment` | `"whatsapp"`: the order arrives in the shop's WhatsApp, paid on pickup | `"mercadopago"`: paid online before pickup |
| `admin` | `false` | `true`: orders panel and sales dashboard at `/admin` |

With `"mercadopago"`, payments are simulated until `MP_ACCESS_TOKEN` is set (see `.env.example`).

Other options: leave out `salon` for shops without tables (the Salón page disappears), and set
`orders.leadTimeHours` to `0` for same-day orders (the notice disappears).

Optional links appear only when set; leave them out and nothing shows. `pedidosYa` adds a delivery
button under "Visitanos" and a footer link; `jobsForm` adds "Trabajá con nosotros" to the footer.

## Notes

- Orders and the panel live in the browser's localStorage. That's fine for a demo; a real
  deployment needs a database and a login for `/admin`.
- The site is marked `noindex`, so demos don't show up in Google.
