export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationMessage {
	type: NotificationType;
	title?: string;
	message: string;
	timestamp: number;
}

export type NotificationListener = (notification: NotificationMessage) => void;

class NotificationCenter {
	private listeners: Set<NotificationListener> = new Set();

	subscribe(listener: NotificationListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	notify(type: NotificationType, message: string, title?: string) {
		const payload: NotificationMessage = {
			type,
			message,
			title,
			timestamp: Date.now(),
		};
		this.listeners.forEach((l) => {
			try {
				l(payload);
			} catch (_) {
				// ignore listener errors
			}
		});
	}
}

export const notificationCenter = new NotificationCenter();
