import type { Cookie } from "elysia";
import SessionPlugin, { SessionPluginError } from "..";
import { Encryption } from "../Encryption";
import type { BaseStore } from "../Store/base";

/**
 * @description SessionConfig is a type that defines the configuration for a session. You can create your own type to pass in.
 * @template T - The type of the session. For example some interaface like: `interface WeakSession { sessionId: string, user: {name: string}, importantInfo: any }`
 * @template U - The type of the store. For example `RedisStore<WeakSession>`
 */
export interface SessionHandlerConfig<
  T,
  U extends BaseStore<T> = BaseStore<T>
> {
  name?: string;
  store: U;
  encrypt?: (value: string) => Promise<string>;
  decrypt?: (value: string) => Promise<string | null>;
}

export class SessionHandler<T, U extends BaseStore<T>> {
  protected encryptionHandler:
    | Encryption
    | {
        encrypt: (value: string) => Promise<string>;
        decrypt: (value: string) => Promise<string | null>;
      };
  protected sessionStore: U;

  /**
   * Simplified wrapper for sessionStore.create that creates a uuid and encrypts it and returns it
   * @param session - The session object to create. This is passed in to allow for the session to be created with the sessionId already set.
   * @returns {Promise<string>} The sessionId encrypted
   */
  public createSession: ({ session }: { session: T }) => Promise<string>; // returns sessionId

  /**
   * Wrapper for sessionStore.delete that deletes the session and returns a cookie string
   * @param sessionId - The sessionId to delete
   * @returns A cookie string that clears the session with the cookie name
   */
  public deleteSessionAndClearCookie: (sessionId: string) => Promise<string>; // returns cookie string

  // Wrapper for encryptionHandler.decrypt that decrypts the sessionId and returns it
  public getSessionId: (sessionId: string) => Promise<string | null>; // returns sessionId or null

  // from sessionStore
  public getSession: ({
    sessionId,
  }: {
    sessionId: string;
  }) => Promise<T | null>; // returns session or null
  public setSession: ({
    sessionId,
    session,
  }: {
    sessionId: string;
    session: T;
  }) => Promise<void>; // returns void
  public deleteSession: ({
    sessionId,
  }: {
    sessionId: string;
  }) => Promise<boolean>; // returns true if session was deleted, false if not found

  public getCookieName: () => string;

  public sessionFromCookie: (
    cookie?: Record<string, Cookie<string | undefined>>
  ) => Promise<{
    sessionId?: string;
    session?: T;
  }>;

  public encrypt: (input: string) => Promise<string>;
  // public decrypt: (sessionId: string) => Promise<string | null>;

  /**
   * Wrapper for sessionStore.createCookieString that creates a cookie string
   * @param sessionId {string} - The sessionId to create a cookie string for
   * @returns {string} A cookie string that sets the sessionId
   */
  public createCookieString: (sessionId: string) => string;

  constructor(private config: SessionHandlerConfig<T, U>) {
    const { encrypt, decrypt } = config;
    if (encrypt && decrypt) {
      this.encryptionHandler = { encrypt, decrypt };
    } else {
      this.encryptionHandler = new Encryption();
    }
    if (!this.encryptionHandler) {
      throw new SessionPluginError("Encryption is not set");
    }
    this.encrypt = this.encryptionHandler.encrypt.bind(this.encryptionHandler);
    this.sessionStore = config.store;
    this.getCookieName = this.sessionStore.getCookieName.bind(
      this.sessionStore
    );
    this.getSession = this.sessionStore.get.bind(this.sessionStore);
    this.setSession = this.sessionStore.set.bind(this.sessionStore);
    this.deleteSession = this.sessionStore.delete.bind(this.sessionStore);
    this.createSession = async ({ session }: { session: T }) => {
      const sessionId = Bun.randomUUIDv7();
      const encryptedSessionId = await this.encryptionHandler.encrypt(
        sessionId
      );
      await this.sessionStore.set({ sessionId, session });
      return encryptedSessionId;
    };
    this.deleteSessionAndClearCookie = async (sessionId: string) => {
      await this.deleteSession({ sessionId });
      return this.sessionStore.resetCookie();
    };
    this.getSessionId = async (sessionId: string) => {
      return this.encryptionHandler.decrypt(sessionId);
    };
    this.createCookieString = this.sessionStore.createCookieString.bind(
      this.sessionStore
    );
    this.sessionFromCookie = async (
      cookie?: Record<string, Cookie<string | undefined>>
    ): Promise<{
      sessionId?: string;
      session?: T;
    }> => {
      if (!cookie) {
        return {};
      }

      const name = this.getCookieName();

      const sessionCookie = cookie[name]?.value;
      if (!sessionCookie) {
        return {};
      }
      const sessionId = await this.getSessionId(sessionCookie);
      if (!sessionId) {
        return {};
      }
      return {
        sessionId,
        session: (await this.getSession({ sessionId })) ?? undefined,
      };
    };
  }
}
