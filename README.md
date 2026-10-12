# FoodBridge, Module 1: User, Verification and Donation Management

Module 1 of **FoodBridge (খাদ্যসেতু)**, the surplus food redistribution platform for Bangladesh, built with the MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS.

It implements the four features of Module 1 in the project proposal:

| # | Feature | Member | Main files |
|---|---|---|---|
| 1.1 | Multi-Role Registration and Authentication | Member 1 | `server/controllers/auth.controller.js`, `server/services/{otp,token,notify}.service.js`, `server/middleware/auth.js`, `client/src/pages/Auth.jsx`, `client/src/lib/{api.js,auth.jsx,useOtp.js}` |
| 1.2 | Profile and Identity Verification Management | Member 2 | `server/controllers/{profile,admin}.controller.js`, `server/middleware/upload.js`, `server/services/locations.service.js`, `client/src/pages/{Profile,Admin}.jsx`, `client/src/components/AddressFields.jsx` |
| 1.3 | Surplus Food Donation Posting | Member 3 | `server/controllers/donation.controller.js`, `server/services/donation.service.js`, `server/jobs/scheduler.js`, `client/src/pages/{Food,DonationEditor,DonationDetail}.jsx`, `client/src/components/{FoodFields,PhotoPicker}.jsx` |
| 1.4 | Event Pre-Registration | Member 1 | `server/controllers/event.controller.js`, `server/models/Event.js`, `client/src/pages/Events.jsx` |

Every source file starts with a comment naming its feature and member, so each person can find and explain their own code.

---

## What each feature does

**1.1 Registration and authentication**
- Five roles: Donor, Distribution Partner (organization), Volunteer, Hotline Operator and Admin. Donors, partners and volunteers sign up themselves; admins create operator accounts; the first admin is created from the command line.
- Sign-up is confirmed with a 6-digit one-time code (OTP) sent by SMS, or by email as an alternative.
- Sign in with phone or email plus password, or with a one-time code instead of a password.
- Forgot password: reset with a code. Change password from the profile page.
- JWT access tokens (15 minutes, kept only in memory) and refresh tokens (7 days, in an httpOnly cookie, stored hashed, rotated on every use). Re-using an old refresh token signs that session out everywhere.
- Passwords hashed with bcrypt. Five wrong passwords lock the account for 15 minutes. OTPs are stored only as a keyed hash, expire after 5 minutes, allow 5 attempts, and can be resent once a minute (at most 5 an hour). Password reset never reveals whether an account exists.
- Role-based access control on every API route (`requireAuth`, `requireRole`, `requireVerified`) and every page (`Protected`).

**1.2 Profile and identity verification**
- Profile with name, email, organization name and daily capacity (partners), the full Bangladeshi address hierarchy (Division, District, Upazila or Thana, Area, details) and a map pin. All 8 divisions, 64 districts and 497 upazilas, plus the Dhaka and Chattogram city corporations, in English and Bangla. The server checks that the upazila really belongs to the district.
- Volunteers upload an NID, birth certificate, student ID or passport; organizations upload a registration, trade license, NGO certificate or authorization letter (JPG, PNG or PDF, up to 5 MB). The server checks each file's real content, not just its name.
- Documents are private: they are never served as public files, only through an authenticated route to the owner and admins.
- Four-step progress tracker on the profile, then **Submit for verification**.
- Admin verification queue: view documents, approve, or request changes with a reason the user sees. After approval the documents are deleted from disk for privacy (configurable).
- Admins can search accounts, suspend (signs the person out immediately) or restore them, and create hotline operator accounts. The admin page shows live counts.

**1.3 Surplus food posting**
- Post food with a title, type (7 categories with their own colours and icons), servings, vegetarian or not, notes, up to 3 photos, cooking time, pickup address and map pin.
- Safety rules enforced by the server: each category has a maximum safe window (4 hours for cooked rice, curry and biryani; up to 72 hours for packaged food); the cooking time cannot be in the future; at least 15 safe minutes must remain; cooked food needs all three items of the food safety checklist.
- Edit (including adding and removing photos) and cancel with a reason, while the post is still open. Every change is recorded in the post's history.
- A scheduled job (node-cron, every minute) automatically expires posts whose safe window has ended. Reads also expire stale posts, so nothing out of date is ever shown.
- Hotline operators post on behalf of callers, recording the caller's name and number.
- Public list of open food, soonest to expire first, filterable by food type, district and text. People other than the poster see the location rounded to about 1 km and no street details or phone numbers.

**1.4 Event pre-registration**
- Donors and operators register a wedding, milad or kulkhani, iftar party or corporate event before it ends: venue, address and map pin, start and end time, guests, expected leftover servings, volunteer slots and notes.
- Verified volunteers sign up for a slot (the server makes this atomic, so slots can never be overfilled) or leave. Hosts see the volunteers' names and numbers; others only see counts.
- Once the event starts the host presses **Food is ready**: a food form with the venue already filled in turns the event into a live food post in one step. It can only happen once.
- Hosts can edit or cancel upcoming events. Events that end without posting food close automatically after 12 hours.

The whole interface works in **Bangla and English** (one tap in the header) and on phones.

---

## 1. Run it on your computer

### What you need

1. **Node.js 20.6 or newer** (22 recommended). Check with `node -v`. Download: https://nodejs.org
2. **A MongoDB database**, either of:
   - **MongoDB Atlas** (free, nothing to install): https://www.mongodb.com/cloud/atlas. Create a free M0 cluster, add a database user, allow your IP under Network Access, then copy the connection string from Connect > Drivers and add `/foodbridge` before the `?`, like
     `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/foodbridge?retryWrites=true&w=majority`
   - **MongoDB Community Server** on your machine: https://www.mongodb.com/try/download/community. The connection string is `mongodb://127.0.0.1:27017/foodbridge`.
     If you use Docker instead: `docker run -d -p 27017:27017 --name mongo mongo:7`

### Step 1: install

```bash
cd foodbridge-module1
npm run setup
```

This installs the server packages and the React app's packages.

### Step 2: configure

```bash
cp .env.example .env        # Windows (Command Prompt): copy .env.example .env
```

Open `.env` and set:

- `MONGODB_URI`: your connection string from above.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: two **different** long random strings. Generate each with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

Leave the rest as they are for now. With `SHOW_DEV_OTP=true`, one-time codes are printed in the API terminal **and** shown on screen, so you can sign up without a real SMS service.

### Step 3: add demo data (recommended)

```bash
npm run seed
```

This **erases** FoodBridge data in that database and creates demo accounts, food posts around Dhaka, two events and two accounts waiting for verification. Every demo account's password is **`Password123`**.

| Account | Phone |
|---|---|
| Admin | 01700000000 |
| Hotline operator | 01700000001 |
| Donor: Shapla Community Center | 01711000001 |
| Donor: Kacchi Ghor Restaurant | 01711000002 |
| Organization, verified (Hope Food Bank) | 01811000001 |
| Organization, waiting for review | 01811000003 |
| Volunteer, verified (Tanvir) | 01911000001 |
| Volunteer, waiting for review | 01911000003 |
| Volunteer, no documents yet | 01911000004 |

Not using demo data? Create your own admin instead:

```bash
npm run create-admin -- --phone 01700000000 --password "YourPass123" --name "Your Name"
```

### Step 4: start

```bash
npm run dev
```

- Website: **http://localhost:5173**
- API health check: http://localhost:5000/api/health

The React dev server forwards `/api` and `/media` to Express, so there is nothing else to configure. Keep the terminal visible: one-time codes appear there.

### Step 5: try every feature (about 5 minutes)

1. **Register (1.1):** Join > "I can carry food" > fill in the form > Continue. Tap the development code shown on screen, then Verify. You land on your profile.
2. **Profile and documents (1.2):** choose the upazila, type an area, tap the map, Save profile. Upload any JPG, PNG or PDF as your NID, then Submit for verification.
3. **Admin review (1.2):** sign out, sign in as `01700000000`. Admin > Verification queue > open the document > Approve (or Request changes with a reason). Try Accounts and Hotline operators too.
4. **Share food (1.3):** sign in as donor `01711000001` > Share extra food. Pick a type, servings, tick the safety checklist, add a photo, set the pickup point, Post. Then Edit it and Cancel it.
5. **Events (1.4):** as the same donor open Events > My events > "Milad mahfil" (already in progress) > Food is ready > post it. Register a new event too, then sign in as volunteer `01911000001` and press "I will help".
6. **Sign in with a code and reset a password (1.1):** on the sign-in page use the One-time code tab, or "Forgot password?".
7. **Bangla:** press বাংলা in the header.

---

## 2. Tests

```bash
npm test
```

runs the **unit tests** (safe windows, food rules, status changes, OTP hashing, phone and password rules, address hierarchy).

The **end-to-end API tests** (registration, OTP, refresh-token rotation and reuse detection, lockout, password reset, roles, documents, admin review, food posting with photos, privacy, hotline posts, scheduled expiry, events and slots, suspension) need a throwaway database, which they wipe:

```bash
# macOS / Linux
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/foodbridge_test npm test

# Windows PowerShell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/foodbridge_test"; npm test
```

All 17 tests pass (7 unit, 10 API).

---

## 3. Run it as one production server

```bash
npm run build      # builds the React app into client/dist
npm start          # Express serves the API and the built app on http://localhost:5000
```

Before putting it online: set `NODE_ENV=production` and `SHOW_DEV_OTP=false`, use strong secrets, serve over HTTPS (the refresh cookie is then marked Secure), and connect a real SMS gateway in `server/services/notify.service.js` (`sendSms`) or fill in the SMTP settings for email codes.

Uploaded photos and documents are stored in `server/storage/`. Free hosts with temporary disks (Render free tier, Vercel) lose these files on restart, so for a long-lived deployment use a host with a persistent disk or move uploads to a storage service such as Cloudinary or S3.

---

## 4. How it is built

```
Browser (React 18 + Vite + Tailwind CSS v4 + TanStack Query + Leaflet)
   │  /api/...  (access token in memory, refresh token in httpOnly cookie)
   ▼
Express API ── routes ─► controllers ─► services ─► Mongoose models ─► MongoDB
   │              │
   │              └─ middleware: auth (JWT + roles), upload (Multer + file checks), validation (zod), errors
   └─ node-cron job: expires food posts, closes past events
```

**Food post statuses.** Module 1 uses `available`, `cancelled` and `expired`. The model already includes `claimed`, `assigned`, `picked_up` and `delivered`, and the allowed transitions in `donation.service.js`, so Module 2 (claiming and delivery) plugs straight in.

```
available ─► cancelled          (by the donor, with an optional reason)
    └──────► expired            (automatically, when the safe window ends)
    └──────► claimed ─► ...      (Module 2)
```

### Project structure

```
foodbridge-module1/
├── server/
│   ├── index.js                 Starts the API and the scheduler
│   ├── app.js                   Express app: security headers, routes, static files
│   ├── config/                  env.js (settings and limits), db.js (MongoDB)
│   ├── models/                  User, Otp, RefreshToken, Donation, Event
│   ├── controllers/             auth, profile, admin, donation, event
│   ├── routes/                  one file per area, with validation and access rules
│   ├── services/                otp, token, notify, locations, donation rules, http helpers
│   ├── middleware/              auth (RBAC), upload (Multer), error handling
│   ├── validators/schemas.js    zod rules shared by routes
│   ├── jobs/scheduler.js        node-cron background jobs
│   ├── data/bd-locations.json   Divisions, districts, upazilas (EN + BN)
│   ├── scripts/                 seed.js, create-admin.js
│   ├── storage/                 uploaded photos and private documents
│   └── tests/                   unit.test.js, api.test.js
├── client/
│   └── src/
│       ├── main.jsx             Routes
│       ├── index.css            Design tokens (colours, gradients, shadows)
│       ├── lib/                 api client, auth, i18n, constants, hooks
│       ├── components/          Layout, forms, map, OTP input, photo picker, ...
│       └── pages/               Home, Auth, Profile, Admin, Food, DonationEditor,
│                                DonationDetail, Events, Dashboard
├── .env.example
└── package.json
```

---

## 5. API reference

All routes start with `/api`. "Signed in" means the header `Authorization: Bearer <access token>`.

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | /auth/otp | anyone | Send a code `{ purpose: register, login or reset, channel: sms or email, phone or email }` |
| POST | /auth/register | anyone | Create a donor, partner or volunteer account with the code |
| POST | /auth/login | anyone | Sign in `{ identifier (phone or email), password }` |
| POST | /auth/login/otp | anyone | Sign in with a code |
| POST | /auth/password/reset | anyone | New password with a code |
| PATCH | /auth/password | signed in | Change password |
| POST | /auth/refresh | cookie | New access token (rotates the refresh token) |
| POST | /auth/logout | cookie | End the session |
| GET | /auth/me | signed in | Current user |
| GET | /locations | anyone | Division > District > Upazila data |
| GET, PATCH | /profile | signed in | Read or update profile, address, location |
| POST | /profile/documents | partner, volunteer | Upload documents (multipart: `type`, `documents`) |
| DELETE | /profile/documents/:docId | owner | Remove a document before review |
| POST | /profile/verification/submit | partner, volunteer | Send for admin review |
| GET | /documents/:userId/:docId | owner or admin | View a private document |
| GET | /admin/stats | admin | Counts for the admin page |
| GET | /admin/verifications | admin | Accounts by verification status |
| POST | /admin/verifications/:id/approve | admin | Approve |
| POST | /admin/verifications/:id/reject | admin | Request changes `{ reason }` |
| GET | /admin/users | admin | Search accounts |
| PATCH | /admin/users/:id/status | admin | Suspend or restore |
| POST | /admin/operators | admin | Create a hotline operator |
| GET | /donations | anyone | Open food (`category`, `district`, `q`, `page`) |
| GET | /donations/mine | signed in | Your posts |
| GET | /donations/:id | anyone | One post (privacy filtered) |
| POST | /donations | verified donor, operator, admin | Create (multipart: `payload` JSON + `photos`) |
| PATCH | /donations/:id | poster | Edit (multipart, `keepPhotos` lists photos to keep) |
| POST | /donations/:id/cancel | poster | Cancel `{ reason? }` |
| GET | /events | signed in | `scope=upcoming`, `mine` or `joined` |
| GET | /events/:id | signed in | One event |
| POST, PUT | /events, /events/:id | donor, operator, admin | Register or edit |
| POST, DELETE | /events/:id/volunteers | verified volunteer | Join or leave |
| POST | /events/:id/convert | host | Post the event's food (multipart) |
| POST | /events/:id/cancel | host or admin | Cancel |

Errors always look like `{ "error": "Readable message", "details": { "field": ["problem"] } }`.

---

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| `MONGODB_URI is not set` or `JWT_ACCESS_SECRET is not set` | Create `.env` in the project root (not in `client/`) from `.env.example`. |
| `MongoServerSelectionError` | Is MongoDB running? For Atlas, allow your IP under Network Access and check the password in the URI. |
| "Cannot reach the server" in the browser | Start everything with `npm run dev` (both the API and the website), not only the client. |
| I never receive the code | In development codes are printed in the API terminal and shown on screen. Real SMS needs a gateway in `notify.service.js`; email needs the SMTP settings. |
| "Please wait 60 seconds..." | Codes can be resent once a minute and 5 times an hour. |
| Account locked after wrong passwords | Wait 15 minutes, or sign in with a one-time code. |
| Port 5000 is busy (common on macOS) | Set `PORT=5001` in `.env` and change both proxy targets in `client/vite.config.js`. |
| The map is grey | The map tiles come from OpenStreetMap; check your internet connection. |
| I want English as the default language | In `client/src/lib/i18n.jsx` change `?? 'bn'` to `?? 'en'`. |

---

## Credits

Bangladesh location data: [nuhil/bangladesh-geocode](https://github.com/nuhil/bangladesh-geocode) (MIT), with official spellings and city corporations added. Map data © OpenStreetMap contributors.
