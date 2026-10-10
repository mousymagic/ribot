/**
 * @file effects.ts
 * @author lauraestupida
 * @license MIT
 * 
 *  Defines a bunch of Effect types that describe a side effect that wants to be
 * performed. These effects can be chained to form some sort of monad.
 */

import type { SocketState } from "./state";

/**
 * Defines a new effect
 */
type Define<Name extends string, Argument, ResponseType = null> =
    { argument: Argument, kind: Name, response: ResponseType }

export type Kind = Definitions['kind']
type Definition<K extends Kind> = Extract<Definitions, { kind: K }>
export type Argument<K extends Kind> = Definition<NoInfer<K>>['argument'];
export type ResponseType<K extends Kind> = Definition<NoInfer<K>>['response'];

/**
 * A specific effect whose Kind can be inferred
 */
export type Effect<K extends Kind = Kind> = readonly [K, Argument<K>]

/**
 * Function that accepts the response of Effect K and returns Effect R
 */
export type Bind<K extends Kind = Exclude<Kind, 'end'>, R extends Kind = Kind> =
    K extends 'end' ? never : (_: ResponseType<K>) => Effect<R | 'end'>

export function bind(u: Effect): Effect<'chain'>;
export function bind<A extends Kind>(u: Effect<A>, a: Bind<A>): Effect<'chain'>;
export function bind<A extends Kind, B extends Kind>
    (u: Effect<A>, a: Bind<A, B>, b: Bind<B>): Effect<'chain'>;
export function bind<A extends Kind, B extends Kind, C extends Kind>
    (u: Effect<A>, a: Bind<A, B>, b: Bind<B, C>, c: Bind<C>): Effect<'chain'>;
export function bind<
    A extends Kind, B extends Kind, C extends Kind, D extends Kind
> (
    u: Effect<A>, a: Bind<A, B>, b: Bind<B, C>, c: Bind<C, D>, d: Bind<D>
): Effect<'chain'>;
export function bind<
    A extends Kind, B extends Kind, C extends Kind, D extends Kind,
    E extends Kind
> (
    u: Effect<A>, a: Bind<A, B>, b: Bind<B, C>, c: Bind<C, D>, d: Bind<D, E>,
    e: Bind<E>
): Effect<'chain'>;
export function bind<
    A extends Kind, B extends Kind, C extends Kind, D extends Kind,
    E extends Kind, F extends Kind
> (
    u: Effect<A>, a: Bind<A, B>, b: Bind<B, C>, c: Bind<C, D>, d: Bind<D, E>,
    e: Bind<E, F>, f: Bind<F>
): Effect<'chain'>;
export function bind<
    A extends Kind, B extends Kind, C extends Kind, D extends Kind,
    E extends Kind, F extends Kind, G extends Kind
> (
    u: Effect<A>, a: Bind<A, B>, b: Bind<B, C>, c: Bind<C, D>, d: Bind<D, E>,
    e: Bind<E, F>, f: Bind<F, G>, g: Bind<G>
): Effect<'chain'>;
export function bind<
    A extends Kind, B extends Kind, C extends Kind, D extends Kind,
    E extends Kind, F extends Kind, G extends Kind, H extends Kind
> (
    u: Effect<A>, a: Bind<A, B>, b: Bind<B, C>, c: Bind<C, D>, d: Bind<D, E>,
    e: Bind<E, F>, f: Bind<F, G>, g: Bind<G, H>, h: Bind<H>
): Effect<'chain'>;

/**
 * Chains multiple effects together
 */
export function bind(u: Effect, ...fns: ReadonlyArray<Bind>): Effect<'chain'> {
    return ['chain', {unit: u, binds: fns}]
}

/**
 * Ends a chain prematurely
 */
export function end(u: Effect | null = null): Effect<'end'> {
    return ['end', {unit: u}]
}

/**
 * ALL YOUR EFFECTS BELONG TO US
 */
type Definitions =
  | Define<'chain', {unit: Effect, binds: ReadonlyArray<Bind>}>
    /**
     * Ends a chain of effects prematurely but first performs effect in unit
     */
  | Define<'end', {unit: Effect | null}>
  | Define<'error', string>
  | Define<'http', Request, Response>
  | Define<'body', Response, string>
  | Define<'log', string>
    /**
     * Channel related stuff
     */
  | Define<'channelevent', { name: string, event: string, data: any }>
  | Define<
      'socketstate', { name: string, next: Partial<SocketState> }, SocketState>
  | Define<'socketemit', { name: string, event: string, message: any }>