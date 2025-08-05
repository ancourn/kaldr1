import { EventEmitter } from 'events';
import { NativeCoinUtility } from './native-coin';

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address?: string;
  isNative: boolean;
}

export interface LiquidityPool {
  id: string;
  tokenA: Token;
  tokenB: Token;
  reserveA: bigint;
  reserveB: bigint;
  totalLiquidity: bigint;
  feeRate: number; // 0.003 = 0.3%
  lpToken: Token;
}

export interface SwapQuote {
  inputToken: Token;
  outputToken: Token;
  inputAmount: bigint;
  outputAmount: bigint;
  priceImpact: number;
  fee: bigint;
  route: LiquidityPool[];
  estimatedGas: bigint;
}

export interface LiquidityPosition {
  owner: string;
  poolId: string;
  liquidity: bigint;
  share: number;
  valueA: bigint;
  valueB: bigint;
  rewards: bigint;
}

export interface DEXConfig {
  feeRate: number;
  protocolFee: number;
  maxPriceImpact: number;
  minLiquidity: bigint;
  rewards: {
    enabled: boolean;
    annualRate: number;
    distribution: 'proportional' | 'tiered';
  };
}

export class NativeDEX extends EventEmitter {
  private config: DEXConfig;
  private nativeCoin: NativeCoinUtility;
  private pools: Map<string, LiquidityPool> = new Map();
  private positions: Map<string, LiquidityPosition[]> = new Map();
  private tokens: Map<string, Token> = new Map();
  private isRunning = false;
  private rewardDistributionInterval: number = 86400000; // 24 hours
  private volume24h: bigint = 0n;
  private fees24h: bigint = 0n;
  private lastVolumeReset = Date.now();

  constructor(nativeCoin: NativeCoinUtility, config: DEXConfig) {
    super();
    this.nativeCoin = nativeCoin;
    this.config = config;
    
    this.initializeTokens();
    this.initializePools();
  }

  private initializeTokens(): void {
    // Add native token
    const nativeToken: Token = {
      symbol: 'KALD',
      name: 'KALDRIX',
      decimals: 18,
      isNative: true
    };
    
    this.tokens.set(nativeToken.symbol, nativeToken);

    // Add some common tokens for testing
    const commonTokens: Token[] = [
      { symbol: 'ETH', name: 'Ethereum', decimals: 18, isNative: false },
      { symbol: 'USDC', name: 'USD Coin', decimals: 6, isNative: false },
      { symbol: 'USDT', name: 'Tether', decimals: 6, isNative: false },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, isNative: false },
      { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, isNative: false }
    ];

    commonTokens.forEach(token => {
      this.tokens.set(token.symbol, token);
    });

    console.log(`🪙 Initialized ${this.tokens.size} tokens for DEX`);
  }

  private initializePools(): void {
    // Create initial liquidity pools
    const initialPools = [
      { tokenA: 'KALD', tokenB: 'ETH', reserveA: BigInt(100000) * BigInt(10**18), reserveB: BigInt(50) * BigInt(10**18) },
      { tokenA: 'KALD', tokenB: 'USDC', reserveA: BigInt(200000) * BigInt(10**18), reserveB: BigInt(100000) * BigInt(10**6) },
      { tokenA: 'ETH', tokenB: 'USDC', reserveA: BigInt(10) * BigInt(10**18), reserveB: BigInt(20000) * BigInt(10**6) },
      { tokenA: 'KALD', tokenB: 'DAI', reserveA: BigInt(150000) * BigInt(10**18), reserveB: BigInt(150000) * BigInt(10**18) }
    ];

    initialPools.forEach(pool => {
      this.createPool(pool.tokenA, pool.tokenB, pool.reserveA, pool.reserveB);
    });

    console.log(`🏊 Created ${this.pools.size} initial liquidity pools`);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ DEX is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Native DEX...');

    // Start reward distribution
    if (this.config.rewards.enabled) {
      this.startRewardDistribution();
    }

    // Start volume tracking reset
    this.startVolumeTracking();

    this.emit('started');
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ DEX is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 Stopping Native DEX...');

    this.emit('stopped');
  }

  // Pool Management
  public createPool(tokenASymbol: string, tokenBSymbol: string, reserveA: bigint, reserveB: bigint): string {
    const tokenA = this.tokens.get(tokenASymbol);
    const tokenB = this.tokens.get(tokenBSymbol);

    if (!tokenA || !tokenB) {
      throw new Error('Token not found');
    }

    if (tokenA.symbol === tokenB.symbol) {
      throw new Error('Cannot create pool with same token');
    }

    const poolId = this.generatePoolId(tokenA.symbol, tokenB.symbol);
    
    if (this.pools.has(poolId)) {
      throw new Error('Pool already exists');
    }

    if (reserveA <= 0n || reserveB <= 0n) {
      throw new Error('Reserves must be positive');
    }

    // Create LP token
    const lpToken: Token = {
      symbol: `LP-${tokenA.symbol}-${tokenB.symbol}`,
      name: `${tokenA.name}-${tokenB.name} LP Token`,
      decimals: 18,
      isNative: false
    };

    const pool: LiquidityPool = {
      id: poolId,
      tokenA,
      tokenB,
      reserveA,
      reserveB,
      totalLiquidity: reserveA, // Simplified - in reality would calculate properly
      feeRate: this.config.feeRate,
      lpToken
    };

    this.pools.set(poolId, pool);
    this.tokens.set(lpToken.symbol, lpToken);

    console.log(`🏊 Created pool: ${poolId} with reserves ${this.formatAmount(reserveA, tokenA.decimals)} ${tokenA.symbol} / ${this.formatAmount(reserveB, tokenB.decimals)} ${tokenB.symbol}`);
    
    this.emit('poolCreated', { pool, timestamp: Date.now() });
    
    return poolId;
  }

  // Swap Operations
  public async getQuote(
    inputTokenSymbol: string,
    outputTokenSymbol: string,
    inputAmount: bigint
  ): Promise<SwapQuote> {
    const inputToken = this.tokens.get(inputTokenSymbol);
    const outputToken = this.tokens.get(outputTokenSymbol);

    if (!inputToken || !outputToken) {
      throw new Error('Token not found');
    }

    if (inputAmount <= 0n) {
      throw new Error('Input amount must be positive');
    }

    // Find optimal route (simplified - direct pool only)
    const pool = this.findPool(inputTokenSymbol, outputTokenSymbol);
    if (!pool) {
      throw new Error('No liquidity pool found');
    }

    const isAToB = pool.tokenA.symbol === inputTokenSymbol;
    const reserveIn = isAToB ? pool.reserveA : pool.reserveB;
    const reserveOut = isAToB ? pool.reserveB : pool.reserveA;

    // Calculate output amount using constant product formula
    const feeAmount = (inputAmount * BigInt(Math.floor(pool.feeRate * 10000))) / BigInt(10000);
    const amountInAfterFee = inputAmount - feeAmount;
    
    const outputAmount = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
    
    // Calculate price impact
    const priceImpact = this.calculatePriceImpact(inputAmount, outputAmount, reserveIn, reserveOut);

    if (priceImpact > this.config.maxPriceImpact) {
      throw new Error(`Price impact too high: ${(priceImpact * 100).toFixed(2)}%`);
    }

    const quote: SwapQuote = {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      priceImpact,
      fee: feeAmount,
      route: [pool],
      estimatedGas: BigInt(200000) // Simplified gas estimation
    };

    return quote;
  }

  public async executeSwap(
    user: string,
    inputTokenSymbol: string,
    outputTokenSymbol: string,
    inputAmount: bigint,
    minOutputAmount: bigint
  ): Promise<bigint> {
    if (!this.isRunning) {
      throw new Error('DEX is not running');
    }

    // Get quote
    const quote = await this.getQuote(inputTokenSymbol, outputTokenSymbol, inputAmount);

    if (quote.outputAmount < minOutputAmount) {
      throw new Error('Insufficient output amount');
    }

    // Execute the swap
    const pool = quote.route[0];
    const isAToB = pool.tokenA.symbol === inputTokenSymbol;

    // Update reserves
    if (isAToB) {
      pool.reserveA += quote.inputAmount;
      pool.reserveB -= quote.outputAmount;
    } else {
      pool.reserveB += quote.inputAmount;
      pool.reserveA -= quote.outputAmount;
    }

    // Update volume and fees
    this.volume24h += quote.inputAmount;
    this.fees24h += quote.fee;

    console.log(`🔄 Swap executed: ${user} swapped ${this.formatAmount(quote.inputAmount, quote.inputToken.decimals)} ${quote.inputToken.symbol} for ${this.formatAmount(quote.outputAmount, quote.outputToken.decimals)} ${quote.outputToken.symbol}`);
    
    this.emit('swapExecuted', {
      user,
      inputToken: inputTokenSymbol,
      outputToken: outputTokenSymbol,
      inputAmount: quote.inputAmount,
      outputAmount: quote.outputAmount,
      fee: quote.fee,
      timestamp: Date.now()
    });

    return quote.outputAmount;
  }

  // Liquidity Management
  public async addLiquidity(
    user: string,
    tokenASymbol: string,
    tokenBSymbol: string,
    amountA: bigint,
    amountB: bigint
  ): Promise<bigint> {
    if (!this.isRunning) {
      throw new Error('DEX is not running');
    }

    const poolId = this.generatePoolId(tokenASymbol, tokenBSymbol);
    let pool = this.pools.get(poolId);

    // Create pool if it doesn't exist
    if (!pool) {
      if (amountA < this.config.minLiquidity || amountB < this.config.minLiquidity) {
        throw new Error('Insufficient liquidity for new pool');
      }
      poolId = this.createPool(tokenASymbol, tokenBSymbol, amountA, amountB);
      pool = this.pools.get(poolId)!;
    }

    // Calculate liquidity tokens to mint
    const liquidityTokens = this.calculateLiquidityTokens(pool, amountA, amountB);

    // Update pool reserves
    pool.reserveA += amountA;
    pool.reserveB += amountB;
    pool.totalLiquidity += liquidityTokens;

    // Update or create user position
    if (!this.positions.has(user)) {
      this.positions.set(user, []);
    }

    const positions = this.positions.get(user)!;
    let position = positions.find(p => p.poolId === poolId);

    if (position) {
      position.liquidity += liquidityTokens;
      position.share = Number(position.liquidity) / Number(pool.totalLiquidity);
      position.valueA += amountA;
      position.valueB += amountB;
    } else {
      const newPosition: LiquidityPosition = {
        owner: user,
        poolId,
        liquidity: liquidityTokens,
        share: Number(liquidityTokens) / Number(pool.totalLiquidity),
        valueA: amountA,
        valueB: amountB,
        rewards: 0n
      };
      positions.push(newPosition);
    }

    console.log(`💧 Liquidity added: ${user} added ${this.formatAmount(amountA, pool.tokenA.decimals)} ${pool.tokenA.symbol} and ${this.formatAmount(amountB, pool.tokenB.decimals)} ${pool.tokenB.symbol} to pool ${poolId}`);
    
    this.emit('liquidityAdded', {
      user,
      poolId,
      amountA,
      amountB,
      liquidityTokens,
      timestamp: Date.now()
    });

    return liquidityTokens;
  }

  public async removeLiquidity(
    user: string,
    poolId: string,
    liquidityTokens: bigint
  ): Promise<{ amountA: bigint; amountB: bigint }> {
    if (!this.isRunning) {
      throw new Error('DEX is not running');
    }

    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }

    const positions = this.positions.get(user);
    if (!positions) {
      throw new Error('User has no positions');
    }

    const position = positions.find(p => p.poolId === poolId);
    if (!position || position.liquidity < liquidityTokens) {
      throw new Error('Insufficient liquidity tokens');
    }

    // Calculate amounts to return
    const share = Number(liquidityTokens) / Number(pool.totalLiquidity);
    const amountA = (pool.reserveA * BigInt(Math.floor(share * 1000000))) / BigInt(1000000);
    const amountB = (pool.reserveB * BigInt(Math.floor(share * 1000000))) / BigInt(1000000);

    // Update pool reserves
    pool.reserveA -= amountA;
    pool.reserveB -= amountB;
    pool.totalLiquidity -= liquidityTokens;

    // Update user position
    position.liquidity -= liquidityTokens;
    position.share = Number(position.liquidity) / Number(pool.totalLiquidity);
    position.valueA -= amountA;
    position.valueB -= amountB;

    // Remove position if empty
    if (position.liquidity === 0n) {
      const index = positions.indexOf(position);
      positions.splice(index, 1);
    }

    console.log(`💧 Liquidity removed: ${user} removed ${this.formatAmount(liquidityTokens, 18)} LP tokens from pool ${poolId}, received ${this.formatAmount(amountA, pool.tokenA.decimals)} ${pool.tokenA.symbol} and ${this.formatAmount(amountB, pool.tokenB.decimals)} ${pool.tokenB.symbol}`);
    
    this.emit('liquidityRemoved', {
      user,
      poolId,
      liquidityTokens,
      amountA,
      amountB,
      timestamp: Date.now()
    });

    return { amountA, amountB };
  }

  // Helper Methods
  private findPool(tokenASymbol: string, tokenBSymbol: string): LiquidityPool | undefined {
    const poolId1 = this.generatePoolId(tokenASymbol, tokenBSymbol);
    const poolId2 = this.generatePoolId(tokenBSymbol, tokenASymbol);
    
    return this.pools.get(poolId1) || this.pools.get(poolId2);
  }

  private generatePoolId(tokenASymbol: string, tokenBSymbol: string): string {
    const sorted = [tokenASymbol, tokenBSymbol].sort();
    return `${sorted[0]}-${sorted[1]}`;
  }

  private calculatePriceImpact(
    inputAmount: bigint,
    outputAmount: bigint,
    reserveIn: bigint,
    reserveOut: bigint
  ): number {
    // Calculate spot price
    const spotPrice = Number(reserveOut) / Number(reserveIn);
    
    // Calculate execution price
    const executionPrice = Number(outputAmount) / Number(inputAmount);
    
    // Calculate price impact
    const priceImpact = Math.abs(spotPrice - executionPrice) / spotPrice;
    
    return Math.min(priceImpact, 1.0); // Cap at 100%
  }

  private calculateLiquidityTokens(
    pool: LiquidityPool,
    amountA: bigint,
    amountB: bigint
  ): bigint {
    if (pool.totalLiquidity === 0n) {
      // First liquidity provider
      return amountA; // Simplified
    }

    // Calculate based on current reserves
    const shareA = (amountA * BigInt(1000000)) / pool.reserveA;
    const shareB = (amountB * BigInt(1000000)) / pool.reserveB;
    const minShare = shareA < shareB ? shareA : shareB;
    
    return (pool.totalLiquidity * minShare) / BigInt(1000000);
  }

  private startRewardDistribution(): void {
    if (!this.isRunning) return;

    const distributeRewards = () => {
      if (!this.isRunning) return;

      this.distributeLiquidityRewards();
      
      setTimeout(distributeRewards, this.rewardDistributionInterval);
    };

    distributeRewards();
  }

  private distributeLiquidityRewards(): void {
    if (!this.config.rewards.enabled) return;

    const totalRewards = this.fees24h / BigInt(2); // 50% of fees as rewards
    
    if (totalRewards === 0n) return;

    for (const [user, positions] of this.positions.entries()) {
      let userRewards = 0n;
      
      for (const position of positions) {
        const pool = this.pools.get(position.poolId);
        if (pool) {
          const poolRewards = (totalRewards * position.liquidity) / pool.totalLiquidity;
          userRewards += poolRewards;
          position.rewards += poolRewards;
        }
      }

      if (userRewards > 0n) {
        // Transfer rewards to user (would need to integrate with native coin system)
        console.log(`🎁 DEX rewards distributed: ${this.formatAmount(userRewards, 18)} KALD to ${user}`);
        
        this.emit('rewardsDistributed', { user, amount: userRewards, timestamp: Date.now() });
      }
    }
  }

  private startVolumeTracking(): void {
    setInterval(() => {
      this.volume24h = 0n;
      this.fees24h = 0n;
      this.lastVolumeReset = Date.now();
    }, 86400000); // Reset every 24 hours
  }

  // Query Methods
  public getPool(poolId: string): LiquidityPool | undefined {
    return this.pools.get(poolId);
  }

  public getPools(): LiquidityPool[] {
    return Array.from(this.pools.values());
  }

  public getToken(symbol: string): Token | undefined {
    return this.tokens.get(symbol);
  }

  public getTokens(): Token[] {
    return Array.from(this.tokens.values());
  }

  public getUserPositions(user: string): LiquidityPosition[] {
    return this.positions.get(user) || [];
  }

  public getStats(): {
    totalPools: number;
    totalLiquidity: bigint;
    volume24h: bigint;
    fees24h: bigint;
    totalPositions: number;
    activeUsers: number;
  } {
    let totalLiquidity = 0n;
    let totalPositions = 0;
    const activeUsers = new Set<string>();

    for (const pool of this.pools.values()) {
      totalLiquidity += pool.totalLiquidity;
    }

    for (const [user, positions] of this.positions.entries()) {
      if (positions.length > 0) {
        totalPositions += positions.length;
        activeUsers.add(user);
      }
    }

    return {
      totalPools: this.pools.size,
      totalLiquidity,
      volume24h: this.volume24h,
      fees24h: this.fees24h,
      totalPositions,
      activeUsers: activeUsers.size
    };
  }

  private formatAmount(amount: bigint, decimals: number): string {
    const divisor = BigInt(10**decimals);
    const whole = amount / divisor;
    const fractional = amount % divisor;
    
    return `${whole}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
  }

  public configure(config: Partial<DEXConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ DEX configuration updated');
  }
}