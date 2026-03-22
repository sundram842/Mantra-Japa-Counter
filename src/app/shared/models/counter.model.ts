export interface CounterState {
  count: number;
  target: number;
}

export const DEFAULT_COUNTER_STATE: CounterState = {
  count: 0,
  target: 108,
};
