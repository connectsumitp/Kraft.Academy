# Razorpay Checkout (Apps Script backend)

## 1) Apps Script setup
1. Create a new Apps Script project.
2. Paste the contents of `razorpay.gs` into the script editor.
3. Deploy as Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the Web App URL.

## 2) Script Properties
Add these in **Project Settings ? Script properties**:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## 3) Frontend env
Create `.env` (or update) in the project root:

```
VITE_RAZORPAY_ORDER_SCRIPT_URL=YOUR_APPS_SCRIPT_WEBAPP_URL
```

Restart dev server after updating env:
```
npm run dev
```

## 4) How it works
- The frontend calls the Apps Script URL with amount/currency to create a Razorpay order.
- The script returns `{ key, order_id, amount, currency }`.
- The frontend opens Razorpay Checkout with prefilled name/email/phone.
