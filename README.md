# Friendsgiving food signup

A small Vite + React + TypeScript app on Firebase Hosting and Realtime Database. One page: see dishes by category, add yours, edit, or remove. No guest accounts. Updates arrive live. A save confirmation means Firebase acknowledged the write.

## Local preview

Use Node 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/?demo` for an empty local development menu. It saves only to this browser’s local storage and synchronizes between tabs on the same browser. This development-only mode never writes to Firebase. Clear the `friendsgivingmas:demo:v3` local storage key to reset it. The live menu uses Firebase and requires the full event invitation link.

## Firebase setup

1. Create a Firebase project on the **Spark** plan. Use **Firebase Hosting**, not App Hosting. Enable **Realtime Database** in locked mode and register a Web app. No Authentication, Functions, Analytics, or billing upgrade is required for this implementation.
2. Copy `.env.example` to `.env.local`, and fill its four values from your Firebase Web app configuration. Include the actual Realtime Database URL, including its region when applicable. These web configuration values identify your project; the database rules control access. Never put an event token in a `VITE_` variable.
3. Sign in to the Firebase CLI and select your project:

   ```sh
   npx firebase login
   npx firebase use --add
   ```

4. Build and deploy both Hosting and the database rules:

   ```sh
   REQUIRE_FIREBASE_CONFIG=true npm run build
   npx firebase deploy --only hosting,database
   ```

5. Create a private event link:

   ```sh
   npm run new-event -- https://YOUR_PROJECT_ID.web.app
   ```

   The script prints a private URL, saves it in git-ignored `.private/`, and prints the command to enable that event. In the Realtime Database console, set `/access/TOKEN_FROM_SCRIPT` to the **boolean** `true`, or run the printed CLI command with your project ID. Open the private URL, add your host contributions, and put that entire link in Punchbowl.

Do not import a replacement database root to enable an event: add the one access entry. This preserves older years.

## GitHub

Source repository: https://github.com/CameronBaffuto/Friendsgiving

```sh
git clone https://github.com/CameronBaffuto/Friendsgiving.git
cd Friendsgiving
npm ci
```

CI type-checks and builds the app for pushes and pull requests. Automated test infrastructure is intentionally omitted.

The included **Deploy hosting** workflow is manually triggered from GitHub Actions. Configure repository variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_DATABASE_URL`, and `VITE_FIREBASE_APP_ID`. Add the deployment service-account JSON as the `FIREBASE_SERVICE_ACCOUNT` **secret**, not a variable or committed file. The Firebase CLI's `firebase init hosting:github` can provision the hosting deployment identity and credentials; keep the existing `dist` hosting directory and SPA rewrite. It may create extra workflows, which you can remove if using the supplied manual workflow. If it creates a project-specific secret name, update `deploy.yml` to reference that name.

The workflow deploys **Hosting only**. Deploy rules once before inviting guests, and again whenever `database.rules.json` changes using `npx firebase deploy --only database`. For this annual app, manual deployment is also fine; GitHub can simply keep the source and run CI.

## Access model

- The link has a cryptographically random 192-bit token in its URL fragment (`#event=…`). The fragment isn't sent to Firebase Hosting in the page request. It is used by the client when requesting the corresponding database path.
- Database rules allow reads and individual entry writes only when the exact token has an enabled `/access/TOKEN` entry. Root reads, event enumeration, access-list reads/writes, and other event paths are denied.
- **Anyone who has the link can read and edit any dish in that event**, intentionally matching a shared spreadsheet. Forwarding the link forwards access. No claim of person-specific authentication is made.
- Robots directives discourage indexing; they are not the access control. The random token and database rules are the access boundary. Keep the full link out of public repos, screenshots, and public posts.
- Rules validate required fields, lengths, category, timestamps, and unexpected fields. Text is rendered as text by React.
- Set `/access/TOKEN` to `false` to disable an old or exposed link. To recover from an exposed link, create a fresh event token and copy the desired entries with the Firebase console or an authenticated admin operation.

## Saving and concurrent changes

Entries use independent IDs, so adding two different dishes doesn't overwrite either. The form keeps the same ID while retrying a failed add. Edit and delete use transactions with a revision check, preventing silent overwrites of changes made since the form opened. The UI retains form input on errors, disables repeated submission, and shows success only when the server confirms. If disconnected before saving, the form stays open and asks the guest to reconnect. If disconnected during a write, it stays pending; closing the page before confirmation can lose unsaved changes. A before-unload prompt provides a reminder where supported.

Each event's list is ordered by original creation time within fixed categories. New updates don't reorder existing entries alphabetically. Names are remembered locally for convenience, not identity or authorization.

## Reuse next year

Run `npm run new-event -- https://YOUR_PROJECT_ID.web.app` again and enable its new token. That gives the new year an empty food list and keeps prior events intact. No code changes or new deployment are necessary. Disable last year's link if you no longer want it editable.

## Local checks and manual verification

```sh
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:5173/?demo`. At 375px, 390px, and desktop widths, inspect the hero and all five menu categories. Add a dish with a deliberate category selection, open its details, edit it, and cancel then confirm removal. Check the success sheet, remembered name, and a duplicate-name warning. Reload to check demo persistence and open a second tab to check demo updates and revision conflicts. Use Tab, Shift+Tab, Escape, and the close button in each sheet. Test a short viewport and mobile keyboard with the save action visible.

For live verification, copy `.env.example` to `.env.local` and supply the remaining Firebase web app API key and app ID. The project ID and database URL are prefilled for `friendsgiving-dac7b`. Open an enabled `#event=TOKEN` invitation in two browsers; verify add, edit, delete, reload persistence, concurrent edits, and offline/failed-save input retention. Demo behavior does not verify Firebase connectivity or rules.

To run the UI against a local emulator, use Firebase project `demo-friendsgivingmas`, set `VITE_USE_EMULATORS=true` in `.env.local`, fill the web config using that demo project and a local database URL, and start `npx firebase emulators:start --only database --project demo-friendsgivingmas`. Seed an enabled token through the emulator admin interface. Emulator mode is gated on Vite development mode and cannot activate in a production build.

## Scope

No RSVP, event-detail page, login, guest directory, messaging, analytics, uploads, or event-management dashboard. Only a shared food list.
