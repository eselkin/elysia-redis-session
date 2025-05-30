import { Elysia } from "elysia";
import type { BaseStore } from "./Store/base";
import { SessionHandler, type SessionHandlerConfig } from "./SessionHandler";
export { type SessionHandlerConfig } from "./SessionHandler";
export { SessionHandler } from "./SessionHandler";
export { BaseStore, type SessionOptions } from "./Store/base";
export { RedisStore, type RedisStoreOptions } from "./Store/redis";
export { BunRedisStore, type BunRedisStoreOptions } from "./Store/bunredis";
export { SqliteStore, type SqliteStoreOptions } from "./Store/sqlite";
export declare class SessionPluginError extends Error {
    readonly name = "SessionPluginError";
    constructor(message: string, cause?: Error);
}
declare function SessionPlugin<T, U extends BaseStore<T>>(config: SessionHandlerConfig<T, U>): Elysia<"", {
    decorator: {
        sessionHandler: SessionHandler<T, U>;
    };
    store: {};
    derive: {
        sessionId: string | null | undefined;
        session: T | null;
    } | {
        readonly sessionId: string;
        readonly session: NonNullable<T>;
    };
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export default SessionPlugin;
