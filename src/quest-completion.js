// Presentation events are transient: loading a save must never replay a reward.
const completed = new WeakMap();
export function recordQuestCompletion(state,id) {
  const pending=completed.get(state)??new Set();pending.add(id);completed.set(state,pending);
}
export function consumeQuestCompletions(state) {
  const pending=[...(completed.get(state)??[])];completed.delete(state);return pending;
}
