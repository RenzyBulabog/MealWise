# MealWise: Weekly Meal Planning System

Subject: Event-Driven Programming
Stack: TypeScript, React, React Native (Expo Go), REST API (TheMealDB)

## What the app does

| Tab | What you can do |
| --- | --- |
| Plan | Pick a week and a day, fill Breakfast / Lunch / Dinner / Snack. Press and hold a meal to swap it. "Fill empty slots" picks random meals from the API. |
| Discover | Search meals as you type, browse by category, or tap the shuffle button for a surprise meal. Open any meal to see ingredients and steps, then add it to a day and slot. |
| Groceries | Ingredients from every planned meal in the week are combined into one list. Tick items off, share the list, untick all. |
| Saved | Meals you hearted, for quick planning later. |

Everything you plan is saved on the phone (AsyncStorage), so it is still there next time you open the app.

## How to run it (VS Code + Expo Go)

1. Install Node.js (LTS) from https://nodejs.org
2. Install **Expo Go** on your phone (Play Store / App Store)
3. Open this folder in VS Code, then open the terminal (Ctrl + `)
4. Run:

```bash
npm install
npx expo install --fix
npx expo start
```

5. Scan the QR code with Expo Go (Android) or the Camera app (iPhone).

Tips:
- Phone and laptop must be on the same Wi-Fi. If the QR code does not connect, run `npx expo start --tunnel`.
- If Expo Go says the project's SDK version is not supported, run `npx expo install expo@latest` then `npx expo install --fix`, and start again.
- Check types anytime with `npm run typecheck`.

## Where the events are (for your defense)

Event-driven programming means the program waits for events (taps, typing, data arriving) and runs handlers when they happen, instead of running top to bottom.

| Event | Where | What happens |
| --- | --- | --- |
| `onPress` | tabs, day pills, buttons | change tab, select day, add meal |
| `onLongPress` | `SlotCard.tsx` | swap a planned meal |
| `onChangeText` + debounce | `DiscoverScreen.tsx` | search runs 400 ms after the user stops typing |
| `onSubmitEditing` | `DiscoverScreen.tsx` | closes the keyboard |
| `AppState` "change" | `App.tsx` | when the app returns to the foreground on a new day, it jumps to today |
| `onRequestClose` | `MealDetailModal.tsx` | Android back button closes the meal sheet |
| Custom events (`bus.emit` / `bus.on`) | `src/events.ts` | the store emits `meal:added`, `meal:removed`, `favorite:toggled`. `Toast.tsx` listens and shows messages (with Undo) without the store knowing it exists |
| Async API responses | `src/api/mealdb.ts` | responses arrive later; `requestId` ignores stale ones |

## Project structure

```
App.tsx                      app shell, tabs, detail sheet
src/events.ts                typed event bus
src/store/PlannerContext.tsx plan, favorites, checked groceries (useReducer + AsyncStorage)
src/api/mealdb.ts            REST calls (search, category, lookup, random)
src/screens/                 Planner, Discover, Grocery, Saved, MealDetailModal
src/components/              WeekStrip, SlotCard, MealCard, TabBar, Toast, ...
src/theme.ts                 colors, type, slot colors
```
