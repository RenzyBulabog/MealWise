import type { Meal, MealPreview, SlotKey } from './types';

/**
 * A tiny typed event bus. The app is event-driven: when something happens
 * (a meal is added, removed, a favorite is toggled) the store EMITS an event,
 * and any interested part of the UI (like the Toast) LISTENS and reacts.
 * The emitter does not know who is listening.
 */
export interface AppEvents {
  'meal:added': { meal: Meal; date: string; slot: SlotKey; replaced: boolean };
  'meal:removed': { meal: Meal; date: string; slot: SlotKey };
  'favorite:toggled': { meal: MealPreview; saved: boolean };
  toast: { message: string; tone?: 'success' | 'info' | 'danger' };
}

type Handler<T> = (payload: T) => void;

class Emitter<E extends object> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  /** Subscribe. Returns an unsubscribe function. */
  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => {
      set?.delete(handler as Handler<never>);
    };
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    this.handlers.get(event)?.forEach((h) => (h as Handler<E[K]>)(payload));
  }
}

export const bus = new Emitter<AppEvents>();
