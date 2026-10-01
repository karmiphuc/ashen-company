import { getContractOffers } from '../../src/engine.js';

export function findOffer(state, type, townId = 'oakwatch') {
  for (let attempt = 0; attempt < 100; attempt++) {
    const offer = getContractOffers(state, townId).find(entry => entry.type === type);
    if (offer) return offer;
    state.contractSerial += 1;
  }
  throw new Error(`No ${type} offer appeared at ${townId} within 100 boards`);
}
