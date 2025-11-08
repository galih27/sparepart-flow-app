// This module provides a simple, centralized event emitter.
// It is used throughout the application to decouple error handling,
// allowing different parts of the app to report errors without needing
// to know how or where those errors will be displayed.

type Listener = (event: any) => void;

class EventEmitter {
  private listeners: { [key: string]: Listener[] } = {};

  // Subscribes a listener function to a specific event.
  on(event: string, listener: Listener): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);

    // Return an unsubscribe function.
    return () => {
      this.off(event, listener);
    };
  }

  // Unsubscribes a listener function from a specific event.
  off(event: string, listener: Listener): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(
      (l) => l !== listener
    );
  }

  // Emits an event, calling all subscribed listeners with the provided data.
  emit(event: string, data: any): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((listener) => listener(data));
  }
}

// Export a singleton instance of the EventEmitter.
export const errorEmitter = new EventEmitter();
