# APTNexus

Mobile operations app for site security. Guards clock in, scan checkpoints, register visitors, and talk to the desk. Admins manage sites, team accounts, and duty briefings from the same app. The live data and the admin dashboard live in the sibling project [APTNexus-Admin](https://github.com/M4RCEN/APTNexus-Admin).

This app does not talk to OneAPT, COOZZY, or any other product database. Every clock, scan, chat, and briefing goes to the APTNexus API and the `aptnexus` Mongo database.

App version **1.0.2**. Android package `com.aptnexus.app`.

## Roles

| Role | Home | Tabs |
| --- | --- | --- |
| Security | Clock in and clock out, site, last checkpoint, duty briefings | Home, Patrol, ID, Chat, Gate |
| Admin | Command desk and duty briefings | Home, Team, ID, Chat, Duty |
| Super Admin | Same command desk as Admin, plus team account control | Home, Team, ID, Chat, Duty |

The language setting (English, Bahasa Melayu, 中文) applies across the app.

## What each area does

**Home.** Security picks a site and clocks in or out. GPS trail recording starts while they are clocked in. Admin and Super Admin see the command desk: who is on duty, sites, visitors today, and shortcuts into duty, sites, chat, team, visitors, inbox, and settings. Duty briefings posted by Admin or Super Admin appear on Home for every role, including an optional photo.

**Patrol.** Security scans a printed checkpoint QR. The scan stores the guard, checkpoint, time, and GPS.

**Gate.** Security registers a visitor with identity and vehicle photos.

**ID.** On-duty credential for the signed-in person.

**Chat.** Three channels: Admin desk, Security desk, and the on-duty team group. Direct and group messages are end-to-end encrypted on the device (`tweetnacl`). The Updates tab is where Admin and Super Admin post a duty briefing (title, message, optional photo). Security can read briefings there and on Home.

**Team and Sites.** Admin and Super Admin maintain sites and accounts. Super Admin can create, disable, and remove accounts.

**Duty.** Admin view of clock activity from the phones.

## Requirements

- Node.js 20 or newer
- The [APTNexus-Admin](https://github.com/M4RCEN/APTNexus-Admin) API running and reachable from the phone
- Expo Go, or an EAS development/preview build (`eas.json`)

## Run it locally

1. Start the API in `APTNexus-Admin` first (`npm install`, then `npm run dev` or `npm run server`).
2. In this folder:

```bash
npm install
copy .env.example .env
npx expo start
```

Point the app at the API you are actually using. The public host is the default. On a LAN, use the machine that is running the API, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:5190
EXPO_PUBLIC_APP_URL=http://192.168.1.20:5190
```

Restart Expo after changing `.env`. The phone and that host must be on the same network, and port **5190** must be open. `.env` is gitignored. Commit `.env.example` only.

Sign in with an account created on the admin console (Users), or with a seeded security account from APTNexus-Admin. Change seeded passwords before any shared deployment.

## Configuration

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | APTNexus API origin. Required for every request. |
| `EXPO_PUBLIC_APP_URL` | Public app origin. Falls back with the API URL. |

`app.json` also records the production hosts `https://aptnexus.sbd-one.com` and the EAS project id. iOS and Android permissions cover location (clock-in and on-duty trails), camera (photos and scans), and the photo library.

## How it fits with the admin console

| Surface | Where |
| --- | --- |
| Phones | This repo |
| API, Mongo, and browser dashboard | APTNexus-Admin on port 5190 |
| Public API | `https://aptnexus.sbd-one.com` |
| Public dashboard | `https://aptnexus-admin.sbd-one.com` |

Clock stamps, checkpoint scans, visitors, sites, chat, and briefings are written by this app and read back by both the phones and the dashboard.

## Project map

```
screens/          Role screens (home, patrol, gate, chat, team, sites)
components/       Shared UI
context/          Session, inbox, chat, settings, E2E keys
utils/api.js      HTTP client
utils/i18n.js     English, Bahasa Melayu, Chinese
utils/e2e.js      Message encryption
app.json          Expo config, permissions, production URLs
eas.json          Internal development and preview builds
```

## Builds

Internal distribution is set up in `eas.json` (development client, preview APK, production with auto-incremented version). Building still needs an Expo account that can access project `81e6331b-7fa5-4a89-9130-8e8cc3f30771`.
