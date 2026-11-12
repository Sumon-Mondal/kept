# Kept — Devpost submission

Paste the sections below into the Devpost form. The entrant is Sumon Mondal, Computer Information Systems, Livingstone College.

Suggested title: **Kept — the take-home till for campus sellers**

Suggested tagline: **Say the sale. See what you keep after PayPal. Don't hand over a screenshot.**

## Inspiration

I go to Livingstone College in Salisbury, North Carolina. Between classes, people sell plates, org tees, edge control, and an hour of tutoring out of a text thread. The price is whatever they say out loud. PayPal Checkout's published US rate is 3.49% plus a $0.49 fixed fee. On a $12 plate that is about $0.91. On a $1.50 water it is $0.54, more than a third of the bottle. Nobody is doing that math in a parking lot.

The other failure is uglier. Someone says their cousin already paid, then sends a screenshot, or asks to switch to another app because they are late for a step show. The food leaves. The money never does.

I wanted a till that fits that moment: you talk, it prices what you actually keep, it tells you when a second checkout would charge the $0.49 again, and it will not treat a screenshot as a payment. PayPal is the way the money moves. The AI is the clerk that turns the sentence into a cart and a line you can say to the buyer. The fee is not something I ask a model to invent.

## What it does

Kept is a checkout for a one-person stall.

- You type the sale the way you would say it, or you tap the menu. Three sample notes are built in: a step-show table, a single water, and a six-tee rush that arrives as a screenshot.
- The tape shows the menu total, the PayPal Checkout fee estimate (3.49% + $0.49), and what you keep.
- **Cover the fee** raises the charge until your take-home is at least the menu price, and gives you one sentence to say out loud. **Charge the menu price** shows the take-home after the fee comes out of your side.
- Small tickets get a direct warning. A water rung up alone is mostly the fixed fee. If the note says someone might pay separately, Kept shows what a second checkout would cost.
- Risk is a set of rules you can read: screenshot, gift payment, another app, a cousin in the story, a rush, a big count. A screenshot or a friends-and-family ask holds the order until you confirm you will wait for a PayPal capture.
- Checkout is PayPal Orders v2 in the sandbox: create, approve with the PayPal button, capture. The server recomputes the amount from the menu and checks the captured value. Refunds use the Payments v2 refund endpoint.
- The receipt is a short paragraph with the real dollars, plus the order and capture ids.
- The ledger's hero number is what you kept today, not what you sold.
- If sandbox keys or a model key are missing, the same path runs on the device. Demo captures are labeled. The demo does not pretend they hit PayPal.

Amina Blake and Amina's Yard Kitchen are sample data, the kind of stall I see on campus. They are not a real business.

## How we built it

Next.js, TypeScript, Tailwind, and shadcn/ui. The till state lives in the browser. There is no database, because a judging laptop should run this with `npm install` and `npm run dev`.

PayPal integration, sandbox only:

- OAuth client-credentials against `api-m.sandbox.paypal.com`
- Orders v2 create and capture
- The official JavaScript SDK button
- Payments v2 refund of a capture
- The host is hardcoded to sandbox so a live key cannot charge anyone from this project

The purchase unit is built so the line items add up to the charge. When the buyer covers the fee, the difference is its own line, "PayPal fee cover (estimate)," so the PayPal receipt shows it.

AI:

- With `AI_API_KEY`, Kept calls any OpenAI-compatible chat completions endpoint (OpenAI by default, Groq if you point `AI_BASE_URL` there). The model can correct which menu items the note meant and rewrite the spoken line and the receipt.
- It is given the dollar strings only after the code has computed them. If the reply does not contain those exact strings, the template wins.
- Menu prices are locked. A model that returns a jerk plate at $1 is ignored on the price.
- With no key, an on-device parser and the same rules produce the cart, the warning, and the receipt. The tape says which clerk ran.

Money math is integer cents, half-up, covered by Vitest. That includes the sticker search that finds the smallest charge whose take-home clears the menu price, and the check that a PayPal item list sums to the order amount.

## Challenges

The fee is a bad thing to leave to a language model. A confident sentence with a wrong take-home would be worse than no AI. I split the job: code owns every cent, the model owns wording, and wording that disagrees with the cents is dropped. Testing that rejection mattered more to me than making the prose fancy.

PayPal's item breakdown has to equal the amount. Covering the fee means the menu prices no longer add up to the charge. I added an explicit fee-cover line instead of hiding the difference inside a fudge factor.

The $0.49 fixed fee changes the product. A normal cart rounds to two decimals and moves on. On a campus stall the fixed fee is the whole story, especially under about $10, and it is also why two checkouts cost more than one. I had to show that without lecturing.

Sandbox apps and model keys will not be on a judge's machine the first time they clone the repo. Demo mode had to be a complete checkout, not an error page, and it had to be labeled so it never looks like a live PayPal payment.

## Accomplishments that we're proud of

- A working PayPal sandbox checkout (create, capture, refund) and a demo path that exercises the same gate.
- A fee engine pinned to PayPal's published US Checkout rate as of the November 4, 2026 fee page, plus an honest micropayments comparison that does not pretend this button uses that rate.
- A hold for the screenshot pattern I actually worry about, with the charge button disabled until the seller accepts it.
- Tests that fail if the model is allowed to change the dollars.
- A product a person can run with two commands.

## What we learned

Small tickets and fixed fees do not behave like a textbook percentage. I knew 3.49% in the abstract. I did not feel it until a $1.50 water estimated $0.54 and the "keep the menu price" sticker became $2.06. That is the demo, and it is also the lesson.

I also learned to keep the model away from the number that decides whether someone got paid. The interesting AI work was the contract around it: what it is allowed to say, and what the code does when it says something else.

Reading PayPal's fee page carefully changed the design. Checkout, card-present, and micropayments are different products. This app uses Checkout, so it estimates Checkout, and it says so on the tape.

## What's next

- A real account setting for sellers who have been approved for micropayments, so the sticker can use 4.99% + $0.09 when that is actually their rate.
- PayPal webhooks so a capture still lands if the browser closes.
- A shared link the buyer opens on their own phone, instead of one device at the table.
- A week of real stalls at Livingstone, with their menu and their words, before I trust the parser outside the sample notes.

## Built with

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- PayPal Orders API v2 (sandbox)
- PayPal Payments Refunds API (sandbox)
- PayPal JavaScript SDK
- Vitest
- Optional OpenAI-compatible chat completions (default model `gpt-4o-mini`; any compatible host via `AI_BASE_URL`)

PayPal's published US merchant fee schedule (page dated November 4, 2026) is the source for the Checkout and micropayments estimates.

The on-device clerk is the path judges get with no API key. It is a deterministic parser and a set of written rules, not a hosted model. The hosted model is optional and does not replace the rules or the fee.
