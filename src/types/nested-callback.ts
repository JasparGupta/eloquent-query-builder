import Builder from '../builder';

export default interface NestedCallback {
  (builder: Builder): void,
}
