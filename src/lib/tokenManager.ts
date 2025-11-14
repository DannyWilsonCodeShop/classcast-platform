type TokenPair = { accessToken: string; refreshToken: string; expiresAt: number };

export interface TokenStorage {
	get(): TokenPair | null;
	set(tokens: TokenPair | null): void;
}

export class MemoryTokenStorage implements TokenStorage {
	private current: TokenPair | null = null;
	get() { return this.current; }
	set(tokens: TokenPair | null) { this.current = tokens; }
}

export interface TokenRefresher {
	refresh(refreshToken: string): Promise<TokenPair>;
}

export class TokenManager {
	private storage: TokenStorage;
	private refresher: TokenRefresher;
	private refreshingPromise: Promise<TokenPair> | null = null;

	constructor(storage: TokenStorage, refresher: TokenRefresher) {
		this.storage = storage;
		this.refresher = refresher;
	}

	getAccessToken(): string | null {
		const tokens = this.storage.get();
		if (!tokens) return null;
		return tokens.accessToken;
	}

	isExpired(safetySkewMs = 5000): boolean {
		const tokens = this.storage.get();
		if (!tokens) return true;
		return Date.now() + safetySkewMs >= tokens.expiresAt;
	}

	async ensureValidToken(): Promise<string | null> {
		const tokens = this.storage.get();
		if (!tokens) return null;
		if (!this.isExpired()) return tokens.accessToken;
		await this.refresh();
		return this.storage.get()?.accessToken ?? null;
	}

	async refresh(): Promise<TokenPair> {
		if (this.refreshingPromise) return this.refreshingPromise;
		const tokens = this.storage.get();
		if (!tokens) throw new Error('No tokens to refresh');
		this.refreshingPromise = this.refresher.refresh(tokens.refreshToken)
			.then((next) => {
				this.storage.set(next);
				return next;
			})
			.finally(() => { this.refreshingPromise = null; });
		return this.refreshingPromise;
	}

	setTokens(tokens: TokenPair | null) {
		this.storage.set(tokens);
	}
}
