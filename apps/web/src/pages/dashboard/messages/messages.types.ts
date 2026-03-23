import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@fitnassist/api/src/routers';

type RouterOutput = inferRouterOutputs<AppRouter>;

// Infer types from tRPC router outputs
export type Connection = RouterOutput['message']['getConnections'][number];
export type SingleConnection = RouterOutput['message']['getConnection'];

export type Message = RouterOutput['message']['getThread'][number];

export interface OtherPerson {
  name: string;
  image: string | null | undefined;
  isTrainer: boolean;
  trainerHandle?: string;
  userId?: string;
}

// Use inferred type from tRPC for getOtherPerson utility
// SingleConnection is the return type from message.getConnection which includes trainer.handle
export type ConnectionBase = NonNullable<SingleConnection>;
