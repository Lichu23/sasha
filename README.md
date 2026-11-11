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

### Order demo with titled steps (shops that charge with Mercado Pago)

For shops with `orders.payment: "mercadopago"` and `admin: true`. Same style as the other titled demos (title beside the phone,
list of steps on the right, intro and closing cards): the customer picks products from the take-away menu, completes the order,
pays with the simulated Mercado Pago and sees the confirmation; then the panel shows the order, the shop marks it delivered and
looks at the sales. The steps are the `STEPS` list at the top of `scripts/record-order-demo.mjs`. `NOTES` is the order comment:
make it match what gets ordered. `TEST=1` records only the customer part, without titles.

```bash
SHOP=santa-marta npm run dev -- -p 3100      # in another terminal
NOTES="Las empanadas bien calentitas, gracias 🙏" MSYS_NO_PATHCONV=1 npm run record-order-demo -- demo/santa-marta-pedidos.mp4
```

### WhatsApp consulta demo (shops that agree every order on WhatsApp)

For shops with `orders.payment: "whatsapp"`, `orders.simulatedWhatsapp: true` and `admin: true` (see "WhatsApp
consultas"). The video follows the whole flow on one phone: the customer opens a product in the take-away menu,
adjusts the amount and adds it; opens the cart, completes it and taps "Consultar" (the simulated WhatsApp opens with
the order); the order shows up in the panel; the shop adjusts it with the customer in the chat; modifies the order
and confirms it; taps "Avisar por WhatsApp" (the chat opens with the message for the order's last state) and sends it.
Start the dev server with such a shop (`SHOP=bonne-francie npm run dev -- -p 3100`), then:

```bash
MSYS_NO_PATHCONV=1 npm run record-consulta-demo -- demo/bonne-francie-consulta.mp4
```

Same rules (frame by frame, 30 fps, one phone on 1920x1080, `-email.mp4` copy), with a title for every step
(the `STEPS` list at the top of `scripts/record-consulta-demo.mjs`), an intro card and a closing card. `NOTES` is the
customer's comment; `TEST=1` records only the customer's part (about 1 minute).

### Table reservations demo

For shops with `reservations`, `orders.simulatedWhatsapp: true` and `admin: true` (see "Table reservations"): the
customer picks the day, how many people and a time with room, and taps "Reservar" (the simulated WhatsApp opens with
the request); the reservation shows up in the panel with the seats left that day; the shop adjusts it with the
customer in the chat, modifies and confirms it, taps "Avisar por WhatsApp" and sends the confirmation.

```bash
SHOP=bonne-francie npm run dev -- -p 3100                      # in another terminal
MSYS_NO_PATHCONV=1 npm run record-reservas-demo -- demo/bonne-francie-reservas.mp4
```

Same rules as the others (frame by frame, 30 fps, one phone on 1920x1080, `-email.mp4` copy, a title per step: the
`STEPS` list at the top of `scripts/record-reservas-demo.mjs`). `NOTES` is the customer's comment; `TEST=1` records
only the customer's part (about 40 seconds).

### Management demo (shops in management mode)

For shops with `management` and `admin: true` (see "Management mode"): the staff's Caja (tap what the customer asks for,
the total adds itself, charge), the day's sales with a calendar and the cash closing, and the summary.

```bash
SHOP=magnolia npm run dev -- -p 3100                      # in another terminal
MSYS_NO_PATHCONV=1 npm run record-gestion-demo -- demo/magnolia-gestion.mp4
```

Same rules as the others (frame by frame, 30 fps, one phone on 1920x1080, `-email.mp4` copy, a title per step: the
`STEPS` list at the top of `scripts/record-gestion-demo.mjs`). `TEST=1` records only the Caja (about 35 seconds).

## Send one link

Every shop has a pitch page at `/demo` (e.g. [delfis-pasteleria.vercel.app/demo](https://delfis-pasteleria.vercel.app/demo)):
the YouTube video, a button to the store and a button to the panel, so a message needs one link
instead of three. Add the video in `shop.ts` with `demo: { youtubeId: "095jFol3ey4" }` (the part
after `youtu.be/`). Without it, the page shows only the two buttons. Nothing on the site links to it.

## Plans

Two settings in `shop.ts` decide what the shop gets:

| | Basic | Pro |
|---|---|---|
| `orders.payment` | `"whatsapp"`: "Consultar": the order opens in the shop's WhatsApp, paid on pickup | `"mercadopago"`: paid online before pickup |
| `admin` | `false` | `true`: orders panel and sales dashboard at `/admin` |

With `"mercadopago"`, payments are simulated until `MP_ACCESS_TOKEN` is set (see `.env.example`).

With `"whatsapp"` and `admin: true` the consulta is also saved in `/admin`, where the shop edits and confirms it: see
"WhatsApp consultas" below.

Other options: leave out `salon` for shops without tables (the Salón page disappears), and set
`orders.leadTimeHours` to `0` for same-day orders (the notice disappears).

Optional links appear only when set; leave them out and nothing shows. `pedidosYa` adds a delivery
button under "Visitanos" and a footer link; `jobsForm` adds "Trabajá con nosotros" to the footer.

## WhatsApp consultas

For shops that want to agree every order with the customer on WhatsApp before confirming it (stock, the pickup
time, changes), instead of taking payment up front. It is `orders.payment: "whatsapp"` in `shop.ts`; shops on
`"mercadopago"` are unchanged.

- **Customer:** the cart button says **Consultar** and nothing is charged. The order is saved and WhatsApp opens by
  itself with the message ready (items, total, pickup time, name and order number), a moment after "¡Consulta
  guardada!" (the button is there if it doesn't open). Coming back, the order page follows the shop's answer:
  confirmed (with the changes the shop made) or cancelled. Paid at pickup.
- **Simulated WhatsApp (demo):** with `orders.simulatedWhatsapp: true` the consulta opens an in-site chat at
  `/whatsapp` instead of the real WhatsApp, so a visitor trying the demo sends nothing to the shop's number. The chat
  is kept with the order (`messages`): the customer sees it right after "Consultar", the shop opens it from
  `/admin` ("Abrir chat con…"), and the other side answers by itself so the demo keeps moving. Take the flag out, and
  put the real number in `whatsapp`, when the shop goes live: the consulta then opens `wa.me`.
- **Shop (`/admin`):** the first tab is **Consultas**, with a counter. Each consulta can be **confirmed as it is**,
  **modified** (quantities, where 0 removes a product; the pickup time; a note for the customer; the total
  follows and what the customer asked for is kept) or **cancelled**. "Abrir chat con…" and, after answering,
  "Avisar por WhatsApp" open the chat with the message for that moment written (the confirmation carries the
  order's last state); nothing is sent automatically. Only confirmed and delivered orders count as sales. Each order
  is one card, built for the phone: pickup time and status on top, the name, the products, the total, and full-width
  buttons.
- **Statuses** (`Order["status"]` in `lib/orders.ts`): `consulta` → `confirmado` → `completado`, or `cancelado`.
  `modified`, `requested` and `shopNote` record the edits.

This is the demo version: orders live in the browser's localStorage, so the customer's page and `/admin` only
see each other in the same browser (the page updates live between tabs).

## Management mode

For shops that don't sell online and want the site as their staff's tool: set `management: { paymentMethods: [...] }`
in `shop.ts` (and `admin: true`). The public store disappears (the shop's address, and `/admin`, open the Caja) and
the panel has three tabs:

- **Caja (`/admin/caja`):** the whole menu (both menus, with photos and prices), by category or searched. Each product
  has its amount on it: "Agregar" adds the first one, then − and + set the quantity (the order has the same controls),
  and the bar at the bottom always shows the total. "Ver pedido" opens
  the order: amounts, mostrador / mesa / para llevar, the table or a name, how the customer pays, and **Cobrar**, which
  records the sale (the ticket number counts up).
- **Ventas (`/admin/dia`):** one day (arrows, or the calendar sheet with what was sold each day): the total, the
  tickets, the average, money by payment method, the best sellers and every ticket, each of which can be annulled (and
  restored). The **cash closing** compares the cash that should be in the drawer with what was counted ("sobran" /
  "faltan") and closes the day.
- **Resumen (`/admin/ventas`):** the last 7 or 30 days against the ones before: sales per day, best sellers, how
  they pay and the hours with more sales.

Magnolia uses it (`shops/magnolia/shop.ts`). Demo only: the sales (`lib/sales.ts`) live in the browser's localStorage,
seeded with 60 days of believable sales from the real menu and prices. This tool is the daily record of the money, so a
real version needs more than the storefront demos did: **a database** (so every phone and tablet of the shop sees the
same sales), **a login with roles** (staff load sales, only the owner annuls, closes or sees the summary), an **editor
for products and prices** (today the menu comes from `menu.json`), and, if their Wi-Fi drops, loading sales offline
and syncing later. Possible next steps: open tables (a bill that grows through the meal), stock, expenses, printed
tickets, and several shifts or locations.

## Table reservations

Shops with a `salon` can take table reservations: set `reservations: { seats, maxPartySize }` in `shop.ts` (optional
`stayMinutes`, default 90, and `minNoticeHours`, default 2). A reservation is agreed on WhatsApp, like a consulta.

- **Customer (`/reservas`):** a "Reservas" link in the header and a "Reservar mesa" button on the home page. They pick
  the day in a calendar, how many people and a time; times without room for their party are struck through. Name,
  phone and a comment, then **Reservar**: it is saved and the (simulated) WhatsApp opens with the request ready.
- **Shop (`/admin/reservas`):** a "Reservas" tab: a day bar (arrows, and a calendar that opens over the page with how
  many reservations each day has), the busiest moment of the day against the seats, and one card per reservation. A
  reservation can be **confirmed as it is**, **modified** (the day and time, in the calendar sheet, with the seats
  left at each time; the party size; a note) or **cancelled**; a confirmed one is marked "Llegó" or "No vino".
  "Abrir chat con…" and "Avisar por WhatsApp" work as in the consultas.
- **Capacity:** each reservation holds its seats for `stayMinutes`. A time is offered while the parties that overlap
  it (everyone who starts within a stay of it, a conservative count) leave room for the new one. It is the same idea as
  the clinic demo's calendar: the customer's page and the panel read the same reservations.
- **Statuses** (`Reservation["status"]` in `lib/reservations.ts`): `consulta` → `confirmada` → `asistio` |
  `noshow`, or `cancelada`.

Demo only: reservations live in the browser's localStorage, like the orders. A real shop also needs a database (with
the seat check done on the server, so two customers can't take the last table), the panel's login, a reminder to the
customer the day before to cut no-shows, and the "From demo to real" list below.

### Calendars and the navigation bars

Wherever a date is picked or filtered the template uses one calendar, `components/ui/calendar.tsx` (a month, Monday
first, in Argentina time; the caller decides which days can't be picked and what each day shows). It is drawn inline on
the reservation form and in the cart (the pickup day: only days with a pickup time can be picked, the times are below it),
and in the panel it opens over the page in a bottom sheet (`components/ui/date-sheet.tsx`, built
on the cart's drawer) instead of inside the card being edited: the orders' pickup date filter, the reservations' day
bar, and the day and time of an order or a reservation being modified (a native list wouldn't show up in the videos
either). The navigation bars (`site-header.tsx`, `admin-header.tsx`) have 44 px targets, press feedback, hover only
where there is a mouse, and show the tapped item as current at once (`lib/use-tapped-nav.ts`) instead of when the next
page has loaded. The clinic demo still has its own pickers.

### From demo to real (not built yet)

What a shop that really takes consultas needs; the demo's screens and statuses stay as they are:

1. **A database** (Postgres, e.g. Supabase) for orders instead of localStorage, written by the `startCheckout`
   server action (today it saves nothing: the order page adds it in the browser). Server-side validation of
   every status change.
2. **A login for `/admin`** (staff only), one account per shop.
3. **A status page** `/pedido/<ref>` that reads the order from the database, so the customer sees the answer
   on any device.
4. **Alerts for the kitchen:** a sound and a badge in `/admin` for each new consulta. The consulta is saved before
   WhatsApp opens, so the shop has it even if the customer never presses send: mark those in the list.
5. **Automatic WhatsApp messages** with the Cloud API, only if a client wants them instead of the `wa.me` buttons
   (which cost nothing and need no Meta approval): a template to the owner with Confirmar / Modificar buttons, and
   templates to the customer for confirmed and ready. Needs Meta business verification, an approved display name
   and template approval (days to weeks), and per-message costs.
6. **Settings the owner edits:** lead time (today `orders.leadTimeHours` in `shop.ts`), pause orders, daily
   capacity.
7. **Optional payment after confirmation:** a Mercado Pago link sent only once the shop confirms.

## Notes

- Orders and the panel live in the browser's localStorage. That's fine for a demo; a real
  deployment needs a database and a login for `/admin`.
- The site is marked `noindex`, so demos don't show up in Google.
