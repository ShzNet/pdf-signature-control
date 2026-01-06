export type EventHandler<T = any> = (data: T) => void;

export class EventBus {
    private events: Map<string, EventHandler[]> = new Map();

    on<T = any>(event: string, handler: EventHandler<T>): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)?.push(handler);
    }

    off<T = any>(event: string, handler: EventHandler<T>): void {
        const handlers = this.events.get(event);
        if (handlers) {
            this.events.set(
                event,
                handlers.filter((h) => h !== handler)
            );
        }
    }

    emit<T = any>(event: string, data?: T): void {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in handler for event "${event}":`, error);
                }
            });
        }
    }

    clear(): void {
        this.events.clear();
    }
}
