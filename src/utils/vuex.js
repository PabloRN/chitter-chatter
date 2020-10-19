// eslint-disable-next-line no-return-assign
export const set = (property) => (state, payload) => (state[property] = payload);

// eslint-disable-next-line no-return-assign
export const toggle = (property) => (state) => (state[property] = !state[property]);
