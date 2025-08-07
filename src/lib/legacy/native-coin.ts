// Mock native coin for testing
export class KaldNativeCoin {
  constructor() {}
  
  async getSupplyInfo() {
    return {
      totalSupply: 10000000000000000000000000000n,
      circulatingSupply: 2500000000000000000000000000n,
      stakedSupply: 2500000000000000000000000000n,
      burnedSupply: 0n
    };
  }
}