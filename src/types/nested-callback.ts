import type { Builder } from '../builder';

export interface NestedCallback {
  (builder: Builder): void,
}
