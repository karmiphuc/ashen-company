import { getContractOffers } from '../../src/engine.js';

export function findOffer(state, type, townId = 'oakwatch') {
  for (let attempt = 0; attempt < 100; attempt++) {
    const offer = getContractOffers(state, townId).find(entry => entry.type === type);
    if (offer) return offer;
    // Select a future fixture board, rather than rerolling with the contract serial.
    // Wagons from the old fixture date must not remain en route past their arrival.
    state.day = (Math.floor((state.day-1)/7)+1)*7+1;
    state.shipments = {};
  }
  throw new Error(`No ${type} offer appeared at ${townId} within 100 weekly boards`);
}
