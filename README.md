# MealWise: Weekly Meal Planning System

Subject: Event-Driven Programming
Stack: TypeScript, React, React Native (Expo Go), REST API (TheMealDB)

## Accounts

The app has two sides. Which one you see depends on the account you sign in with.

| Role | How to get it | What you see |
| --- | --- | --- |
| User | Tap "Create account" on the first screen | Today, Plan, Discover, Groceries, Me |
| Admin | Sign in with the starter admin account below | Overview, Users, Picks |

Starter admin account (created automatically the first time the app opens):

```
Email:    admin@mealwise.app
Password: Admin123!
```

## User features

- **Accounts:** register, sign in, sign out, change password. Each user has separate data.
- **Set up:** eating style (none, vegetarian, vegan, pescatarian), foods to avoid, daily calorie goal.
- **Today:** your meals for today with a "cooked" tick, calorie progress, weekly progress, and the admin's announcement.
- **Plan:** week and day view with Breakfast, Lunch, Dinner, Snack. Fill empty slots with random meals, copy a day, repeat the week into next week, share the week, clear a day, add your own calories to a meal, mark meals as cooked. Meals that clash with your diet or foods to avoid show a warning.
- **Discover:** search as you type, filter by category or cuisine (including Filipino), surprise meal. Saved (hearted meals), Mine (your own recipes: create, edit, delete), Picks (recipes from the admin).
- **Meal details:** ingredients, steps, video link, rating and notes, add to any day and slot.
- **Groceries:** ingredients from the whole week combined into one list, tick items off, add your own items, share the list.
- **Pantry:** add what you already have. Those items leave the grocery list, and "Find meals" shows recipes that use them.
- **Me:** stats, edit preferences, change password, delete your planner data, sign out.

## Admin features

- **Overview:** number of users, meals planned and cooked, user recipes, most planned meals, and an announcement that appears on every user's Today tab.
- **Users:** search, enable or disable an account, make a user an admin or back to user, reset a password (creates a temporary one), delete a user and their data.
- **Picks:** add, edit and delete recipes that appear for all users. A few Filipino recipes are included to start.

## How to run it (VS Code + Expo Go)

1. Install Node.js (LTS) from https://nodejs.org
2. Install **Expo Go** on your phone
3. Unzip, then in VS Code use **File > Open Folder** and choose the `MealWise` folder (the one that has `package.json` directly inside)
4. In the terminal:

```bash
npm install
npx expo install --fix
npx expo start -c
```

5. Scan the QR code with Expo Go.

Tips:
- Phone and laptop must be on the same Wi-Fi. If it does not connect, use `npx expo start --tunnel`.
- If Expo Go says the SDK version is not supported: `npx expo install expo@latest`, then `npx expo install --fix`.
- To start with a clean app (new admin, no users), clear the app's storage in Expo Go or reinstall Expo Go.
- Check types with `npm run typecheck`.

## Important note about the data

There is no server in this project. Accounts and data are saved on the phone (AsyncStorage). That means:
- Users on different phones do not see each other, and the admin only manages accounts on the same device.
- Passwords are stored as salted SHA-256 hashes, which is fine for a school demo. A real system would hash them on a server.

To make it a real multi-user system, the same screens can be connected to a backend API later. The data access is already separated in `src/store`, so only that layer changes.

## Where the events are (for your defense)

Event-driven programming means the program waits for events (taps, typing, data arriving) and runs handlers when they happen, instead of running top to bottom.

| Event | Where | What happens |
| --- | --- | --- |
| `onPress` | tabs, day pills, buttons | change tab, select day, add meal, sign in |
| `onLongPress` | `SlotCard.tsx` | swap a planned meal |
| `onChangeText` + debounce | `DiscoverScreen.tsx` | search runs 400 ms after the user stops typing |
| `onSubmitEditing` | forms, pantry, grocery inputs | submit or close keyboard |
| `onBlur` | `MealDetailModal.tsx` | saves your note when you leave the field |
| `AppState` "change" | `UserShell.tsx` | when the app returns to the foreground on a new day, it jumps to today |
| `onRequestClose` | modals | Android back button closes the sheet |
| Custom events (`bus.emit` / `bus.on`) | `src/events.ts` | the code emits `meal:added`, `meal:removed`, `meal:cooked`, `favorite:toggled`, `auth:signedIn`, `auth:signedOut`. `Toast.tsx` listens and shows messages (with Undo) without the emitters knowing it exists |
| Async API responses | `src/api/mealdb.ts` | responses arrive later; `requestId` in Discover ignores stale ones |
| State changes (`useEffect`) | `PlannerContext.tsx` | every change to the plan is saved automatically |

## Project structure

```
App.tsx                         decides: loading, sign in, admin side, or user side
src/events.ts                   typed event bus
src/store/AuthContext.tsx       accounts, session, admin actions, announcement, featured recipes
src/store/PlannerContext.tsx    one user's plan, favorites, pantry, recipes, notes, profile
src/api/mealdb.ts               REST calls (search, category, cuisine, ingredient, lookup, random)
src/screens/                    Auth, Onboarding, Today, Planner, Discover, Grocery, Profile, MealDetailModal
src/screens/admin/              Overview, Users, Recipes
src/components/                 shared UI (cards, tab bar, toast, forms, editor)
src/utils/diet.ts               diet and food-to-avoid check
src/data/featured.ts            starter Filipino recipes
```
