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

## Demo videos

**Rule: every demo video is recorded frame by frame at 30 fps.** `scripts/record-demo.mjs` runs the
store in a headless Chrome on a virtual clock (timers, `requestAnimationFrame`, `Date`, CSS/WAAPI animations
and smooth scrolls only move when the script advances them) and takes one screenshot per 1/30 s, so every
frame is different whatever the speed of the machine. A live screen recording only reaches 16–22 real fps,
so don't use one.

The video shows one phone on a 1920x1080 frame in the shop's colors: the customer's order (home, menu,
take away, cart, simulated Mercado Pago, confirmation), then a slide to the same order in `/admin`.

```bash
node scripts/select-shop.mjs                    # with SHOP=<slug> in the environment
SHOP=cafe-roma npm run dev -- -p 3100           # keep it running in another terminal
NOTES="Para mamá 💝" npm run record-demo -- demo/cafe-roma-app.mp4
```

It writes `demo/cafe-roma-app.mp4` and `demo/cafe-roma-app-email.mp4` (same frames, smaller), about 3 minutes
of rendering for a 90 s video. `TEST=1` renders only the home and the take-away notice (30 s). `NOTES` is the
order comment: make it match what gets ordered. Needs Chrome (`CHROME=<path>` if it isn't in the default
Windows location). In Git Bash, prefix the command with `MSYS_NO_PATHCONV=1` so `/admin` isn't turned into
a Windows path. Don't change `FPS` unless asked.

### Dental clinic demo (WhatsApp assistant)

A second kind of demo, for clinics: a simulated WhatsApp assistant that books a turno, sends the reminder,
handles an urgency and hands over to reception, then the clinic's agenda. It lives at `/clinica` (chat) and
`/clinica/agenda` (panel) and doesn't depend on `SHOP`; the clinic's name, colors, people and figures are in
`lib/clinica.ts`, the conversation in `components/clinica/chat-script.ts`. Nothing is sent anywhere, so visitors
can also try it by typing or tapping. The bot opens a calendar with only the days and times that are free in the
agenda; what the patient books in the chat shows up in the agenda right away (and leaves the calendar), through
`lib/clinica-store.ts`.

```bash
npm run dev -- -p 3100                                      # in another terminal
MSYS_NO_PATHCONV=1 npm run record-whatsapp-demo -- demo/clinica-whatsapp.mp4
```

Same rules as above (frame by frame, 30 fps, one phone on 1920x1080, `-email.mp4` copy). Every step has a title
beside the phone, the list of steps is on the right, and an intro and a closing card with what's included frame
the video. The titles are the `STEPS` list at the top of `scripts/record-whatsapp-demo.mjs`. `TEST=1` records
only the chat up to the reminder, without titles (about 1 minute). The recorders share the virtual clock in
`scripts/lib/virtual-clock.mjs`, and the two with titles (this one and the one below) the frame pump and the
assembly in `scripts/lib/phone-demo.mjs`.

### Confirmation demo (shops that approve every order)

For shops that want to check an order before agreeing to it, with `orders.payment: "confirmacion"` (see
"Confirmation mode"): the customer sends the order without paying, the shop confirms it in `/admin` (or
proposes another time, or rejects it) and the customer sees the answer. Start the dev server with such a shop
(`SHOP=bonne-francie npm run dev -- -p 3100`), then:

```bash
MSYS_NO_PATHCONV=1 npm run record-approval-demo -- demo/bonne-francie-confirmacion.mp4
```

Same rules (frame by frame, 30 fps, one phone on 1920x1080, `-email.mp4` copy), with a title for every step
(the `STEPS` list at the top of `scripts/record-approval-demo.mjs`), an intro card and a closing card. `NOTES` is the
order comment; `TEST=1` records only the customer's part (about 1 minute).

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

`"confirmacion"` is a third mode: see "Confirmation mode" below.

Other options: leave out `salon` for shops without tables (the Salón page disappears), and set
`orders.leadTimeHours` to `0` for same-day orders (the notice disappears).

Optional links appear only when set; leave them out and nothing shows. `pedidosYa` adds a delivery
button under "Visitanos" and a footer link; `jobsForm` adds "Trabajá con nosotros" to the footer.

## Confirmation mode

Some shops want to check every order before agreeing to it (stock, capacity, the pickup time) instead of
taking payment up front. With `orders.payment: "confirmacion"` in `shop.ts`:

- **Customer:** the cart button says "Enviar pedido" and nothing is charged. The order page says "Pedido
  enviado" and follows the shop's answer: confirmed, rejected (with the reason) or "te proponemos otro
  horario" (with an "Aceptar el nuevo horario" button). Paid at pickup.
- **Shop (`/admin`):** the first tab is "Por confirmar", with a counter. Each order has **Confirmar**,
  **Otro horario** (three next open slots) and **Rechazar** (with a reason). After answering, "Avisar por WhatsApp"
  opens the chat with the message ready (`wa.me`, nothing is sent automatically). Only confirmed and
  delivered orders count as sales.
- **Statuses** (`Order["status"]` in `lib/orders.ts`): `por-confirmar` → `confirmado` | `rechazado` |
  `reprogramado` (waiting for the customer) → `completado`.

This is the demo version: orders live in the browser's localStorage, so the customer's page and `/admin` only
see each other in the same browser (the page updates live between tabs). Shops on `"mercadopago"` or
`"whatsapp"` are unchanged.

### From demo to real (not built yet)

What a shop that really takes orders this way needs; the demo's screens and statuses stay as they are:

1. **A database** (Postgres, e.g. Supabase) for orders instead of localStorage, written by the `startCheckout`
   server action (today it saves nothing: the order page adds it in the browser). Server-side validation of
   every status change.
2. **A login for `/admin`** (staff only), one account per shop.
3. **A status page** `/pedido/<ref>` that reads the order from the database, so the customer sees the answer
   on any device.
4. **Alerts for the kitchen:** a sound and a badge in `/admin` for each new order, and a response deadline (the
   order expires and the customer is told if nobody answers in N minutes).
5. **Automatic WhatsApp messages** with the Cloud API instead of the `wa.me` buttons: a template to the owner
   with Confirmar / Rechazar buttons (so they can answer without opening `/admin`), and templates to the customer
   for confirmed, rejected, new time and ready. Needs Meta business verification, an approved display name and
   template approval (days to weeks), and per-message costs.
6. **Settings the owner edits:** lead time (today `orders.leadTimeHours` in `shop.ts`), pause orders, daily
   capacity.
7. **Optional payment after confirmation:** a Mercado Pago link sent only once the shop confirms.

## Notes

- Orders and the panel live in the browser's localStorage. That's fine for a demo; a real
  deployment needs a database and a login for `/admin`.
- The site is marked `noindex`, so demos don't show up in Google.
