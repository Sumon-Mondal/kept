# Demo video script

Under three minutes. Aim to finish by 2:40. Speak a little slower than feels natural. No music. No other companies' logos or apps on screen. The PayPal button is their checkout SDK, which is the thing this video has to show.

Record the screen and your voice. A small corner of your face is enough if you want it. Film in a quiet room.

Do this once before you hit record:

1. `npm install`, then `npm run dev`, then open http://localhost:3847.
2. In the browser, clear site data for localhost so the till starts at $0.00. Or click **Clear ledger** if you already have rows.
3. Prefer the sandbox path. Put your sandbox client id and secret in `.env.local`, restart the server, and confirm the checkout page shows the gold PayPal button. Have the personal sandbox buyer email and password in a note beside you.
4. If you also have an `AI_API_KEY`, the tape will say **Model clerk** after **Read the note**. That is a nice extra. If you do not, it will say **On-device clerk**. Either is honest. Do not claim a model ran if the badge says on-device.
5. If sandbox login fails on the take, use the fallback line in shot 5. Do not start the video over unless the till itself broke.

The dollars below are what the app computes with fee cover turned on. If you edited the menu, your numbers will differ. Say the numbers on the screen.

## Shot 1 — Home (0:00–0:18)

On screen: the Kept home page. Today's keep is $0.00. The card on the right says a $12 plate keeps $11.09.

Say:

> I'm Sumon Mondal, a CIS student at Livingstone College in Salisbury, North Carolina. On our yard, people sell plates and tees from a text thread. They find out the PayPal fee after the food is gone. Kept tells you what you keep before you hand anything over.

## Shot 2 — The rate (0:18–0:30)

Stay on the card. You can point at "$11.09" with the cursor.

Say:

> PayPal Checkout's published US rate is 3.49 percent plus 49 cents. On a twelve-dollar plate, about 91 cents is the fee. The 49 cents is the part that hurts a small sale.

Click **Ring up a sale**.

## Shot 3 — The water (0:30–0:48)

Click **Just a water**. Wait until the tape shows a buyer price of **$2.06** and **You keep $1.50**. Leave **Cover the fee** selected.

Say:

> A dollar-fifty water. To keep that dollar fifty, the buyer has to pay two oh six. Most of the difference is the fixed 49 cents. If they are already buying a plate, this bottle goes on that same checkout.

## Shot 4 — The step-show table (0:48–1:25)

Click **Step-show table**. Wait for the cart: two jerk plates, extra plantain, bottled water. The tape should show buyer pays **$30.04**, estimated fee **$1.54**, you keep **$28.50**. Scroll if you need to, so "Say this" and the "Ring it as one checkout" note are both visible. The risk badge should say **Look twice**, and the charge button should still be enabled.

Say:

> This is the real sale. I didn't fill out a form. I said two jerk plates, plantain, a water, pickup before the step show, and she asked about another app. Kept priced a fee cover so I still keep twenty-eight fifty, and it told me not to split the water onto a second PayPal checkout. That would charge the 49 cents again. Mentioning another app is a warning. The fee is not a guess from the model. It is the Checkout formula, in code.

Click **Charge $30.04 with PayPal**. On a phone-width window the button says **PayPal**.

## Shot 5 — PayPal (1:25–2:05)

### If sandbox keys are set

On screen: the gold PayPal button, then the sandbox login, then the pay confirmation, then the return to Kept.

Say, while the button is visible, before you click it:

> This is PayPal Checkout in the sandbox. Orders API. Create, then capture. No live money.

Log in as the personal sandbox buyer and approve. If the login is slow, stop talking and let it finish. When the receipt appears, go to shot 6. If you are already past 2:05 when the receipt lands, skip shot 7.

### If you have no keys, or the popup fails

Click **Capture demo payment** (or **Sandbox failing? Capture a demo instead**).

Say:

> Sandbox keys aren't on this machine, so this capture stays in the browser and is marked Demo. The amount and the hold rules are the same ones the Orders API uses. With a sandbox app, this button is the real PayPal button.

## Shot 6 — Receipt (2:05–2:22)

On screen: "You kept $28.50." Read the first line of the paragraph with your eyes, then say:

> The receipt is a paragraph. Buyer paid thirty oh four. Fee estimate one fifty-four. I keep twenty-eight fifty. The capture id is the proof, not a screenshot.

Do not open the refund unless you are ahead of the clock.

## Shot 7 — The hold (2:22–2:42)

Click **Ring up**. Click **Screenshot rush**. Do not check the box yet. Show the disabled charge button and the "Hold the order" badge.

Say:

> This is the note I built Kept to stop. Six tees, tonight, a cousin, a screenshot, another app if that fails. The charge stays off until I confirm I will wait for a PayPal capture.

Check the box so the button enables. Do not pay unless you still have ten seconds and want to show that the hold is a gate, not a lock.

## Shot 8 — Close (2:42–2:55)

If you are over 2:40, say only the last sentence.

Say:

> The clerk can be a model, or the one on the device. Either way it does not get to write the fee. That number is PayPal's published Checkout rate, and the capture is what makes the sale real.

Stop the recording. Upload the unlisted or public YouTube video. Judges are not required to watch past three minutes, so do not put a title card after the three-minute mark that you needed them to see.

## If something breaks

- Tape stuck on the old note: click the preset again.
- PayPal popup blocked: allow popups for localhost, or use the demo capture and say so.
- Wrong dollars: fee cover must be the left-hand choice, the one labeled **Cover the fee**.
- Model badge: only say "the model" if the tape says **Model clerk**.
