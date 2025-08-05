import { EventEmitter } from 'events';

export interface NativeCoinConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  initialSupply: bigint;
  stakingRewards: {
    annualRate: number;
    minimumAmount: bigint;
    unbondingPeriod: number; // days
    rewardDistribution: 'continuous' | 'epoch';
  };
  gasMechanics: {
    baseGasPrice: bigint;
    dynamicGasPrice: boolean;
    congestionMultiplier: number;
    freeQuota: {
      enabled: boolean;
      amount: bigint;
      period: number; // days
    };
  };
  governance: {
    votingPower: boolean;
    proposalThreshold: bigint;
    votingPeriod: number; // days
  };
}

export interface Account {
  address: string;
  balance: bigint;
  staked: bigint;
  unbonding: Array<{
    amount: bigint;
    timestamp: number;
    completionTime: number;
  }>;
  nonce: number;
  lastActivity: number;
  freeQuotaUsed: bigint;
  freeQuotaReset: number;
}

export interface StakeInfo {
  delegator: string;
  validator: string;
  amount: bigint;
  rewards: bigint;
  startTime: number;
  status: 'active' | 'unbonding' | 'completed';
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  type: 'parameter_change' | 'spending' | 'upgrade' | 'community';
  amount?: bigint;
  status: 'pending' | 'active' | 'passed' | 'rejected' | 'executed';
  votingStart: number;
  votingEnd: number;
  votes: {
    for: bigint;
    against: bigint;
    abstain: bigint;
  };
  totalVotingPower: bigint;
  executionTime?: number;
}

export interface GasInfo {
  basePrice: bigint;
  currentPrice: bigint;
  congestionLevel: number;
  estimatedBlockTime: number;
  nextPriceAdjustment: number;
}

export class NativeCoinUtility extends EventEmitter {
  private config: NativeCoinConfig;
  private accounts: Map<string, Account> = new Map();
  private stakes: Map<string, StakeInfo[]> = new Map();
  private proposals: Map<string, GovernanceProposal> = new Map();
  private totalStaked: bigint = 0n;
  private circulatingSupply: bigint;
  private gasInfo: GasInfo;
  private isRunning = false;
  private rewardDistributionInterval: number = 86400000; // 24 hours
  private gasPriceAdjustmentInterval: number = 300000; // 5 minutes
  private proposalCounter = 0;

  constructor(config: NativeCoinConfig) {
    super();
    this.config = config;
    this.circulatingSupply = config.initialSupply;
    this.gasInfo = {
      basePrice: config.gasMechanics.baseGasPrice,
      currentPrice: config.gasMechanics.baseGasPrice,
      congestionLevel: 0,
      estimatedBlockTime: 100,
      nextPriceAdjustment: Date.now() + this.gasPriceAdjustmentInterval
    };

    this.initializeSystem();
  }

  private initializeSystem(): void {
    // Create genesis accounts
    this.createGenesisAccounts();
    
    console.log(`🪙 ${this.config.name} (${this.config.symbol}) initialized`);
    console.log(`💰 Total Supply: ${this.formatAmount(this.config.totalSupply)}`);
    console.log(`🔄 Circulating Supply: ${this.formatAmount(this.circulatingSupply)}`);
    console.log(`⚡ Base Gas Price: ${this.formatAmount(this.config.gasMechanics.baseGasPrice)} wei`);
  }

  private createGenesisAccounts(): void {
    // Create some initial accounts for testing
    const genesisAccounts = [
      { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12345', balance: BigInt(1000000) * BigInt(10**18) },
      { address: '0x1234567890123456789012345678901234567890', balance: BigInt(500000) * BigInt(10**18) },
      { address: '0x0987654321098765432109876543210987654321', balance: BigInt(250000) * BigInt(10**18) }
    ];

    genesisAccounts.forEach(account => {
      this.accounts.set(account.address, {
        address: account.address,
        balance: account.balance,
        staked: 0n,
        unbonding: [],
        nonce: 0,
        lastActivity: Date.now(),
        freeQuotaUsed: 0n,
        freeQuotaReset: Date.now()
      });
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Native coin utility is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Native Coin Utility System...');

    // Start reward distribution
    this.startRewardDistribution();
    
    // Start gas price adjustment
    this.startGasPriceAdjustment();
    
    // Start governance processing
    this.startGovernanceProcessing();

    this.emit('started');
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Native coin utility is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 Stopping Native Coin Utility System...');

    this.emit('stopped');
  }

  // Balance Management
  public getBalance(address: string): bigint {
    const account = this.accounts.get(address);
    return account ? account.balance : 0n;
  }

  public async transfer(from: string, to: string, amount: bigint): Promise<boolean> {
    if (!this.isRunning) {
      throw new Error('System is not running');
    }

    if (amount <= 0n) {
      throw new Error('Amount must be positive');
    }

    const fromAccount = this.accounts.get(from);
    const toAccount = this.accounts.get(to);

    if (!fromAccount) {
      throw new Error('Sender account not found');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create recipient account if it doesn't exist
    if (!toAccount) {
      this.accounts.set(to, {
        address: to,
        balance: 0n,
        staked: 0n,
        unbonding: [],
        nonce: 0,
        lastActivity: Date.now(),
        freeQuotaUsed: 0n,
        freeQuotaReset: Date.now()
      });
    }

    // Perform transfer
    fromAccount.balance -= amount;
    fromAccount.nonce++;
    fromAccount.lastActivity = Date.now();

    const recipientAccount = this.accounts.get(to)!;
    recipientAccount.balance += amount;
    recipientAccount.lastActivity = Date.now();

    console.log(`💸 Transfer: ${this.formatAmount(amount)} ${this.config.symbol} from ${from} to ${to}`);
    
    this.emit('transfer', { from, to, amount, timestamp: Date.now() });
    
    return true;
  }

  // Staking System
  public async stake(delegator: string, validator: string, amount: bigint): Promise<boolean> {
    if (!this.isRunning) {
      throw new Error('System is not running');
    }

    if (amount < this.config.stakingRewards.minimumAmount) {
      throw new Error(`Minimum stake amount is ${this.formatAmount(this.config.stakingRewards.minimumAmount)}`);
    }

    const account = this.accounts.get(delegator);
    if (!account || account.balance < amount) {
      throw new Error('Insufficient balance for staking');
    }

    // Deduct from balance
    account.balance -= amount;
    account.staked += amount;
    account.lastActivity = Date.now();

    // Create stake record
    const stake: StakeInfo = {
      delegator,
      validator,
      amount,
      rewards: 0n,
      startTime: Date.now(),
      status: 'active'
    };

    // Add to stakes
    if (!this.stakes.has(delegator)) {
      this.stakes.set(delegator, []);
    }
    this.stakes.get(delegator)!.push(stake);

    // Update total staked
    this.totalStaked += amount;

    console.log(`🔒 Staked: ${this.formatAmount(amount)} ${this.config.symbol} from ${delegator} to ${validator}`);
    
    this.emit('staked', { delegator, validator, amount, timestamp: Date.now() });
    
    return true;
  }

  public async unstake(delegator: string, validator: string, amount: bigint): Promise<boolean> {
    if (!this.isRunning) {
      throw new Error('System is not running');
    }

    const account = this.accounts.get(delegator);
    if (!account) {
      throw new Error('Account not found');
    }

    const stakes = this.stakes.get(delegator);
    if (!stakes || stakes.length === 0) {
      throw new Error('No stakes found');
    }

    // Find stakes for this validator
    const validatorStakes = stakes.filter(s => s.validator === validator && s.status === 'active');
    const totalStaked = validatorStakes.reduce((sum, s) => sum + s.amount, 0n);

    if (totalStaked < amount) {
      throw new Error('Insufficient staked amount');
    }

    // Process unstaking
    let remainingAmount = amount;
    for (const stake of validatorStakes) {
      if (remainingAmount <= 0n) break;

      const unstakeAmount = stake.amount > remainingAmount ? remainingAmount : stake.amount;
      
      // Move to unbonding
      const unbondingCompletion = Date.now() + (this.config.stakingRewards.unbondingPeriod * 86400000);
      
      account.unbonding.push({
        amount: unstakeAmount,
        timestamp: Date.now(),
        completionTime: unbondingCompletion
      });

      // Update stake
      stake.amount -= unstakeAmount;
      if (stake.amount === 0n) {
        stake.status = 'completed';
      }

      account.staked -= unstakeAmount;
      this.totalStaked -= unstakeAmount;
      remainingAmount -= unstakeAmount;
    }

    console.log(`🔓 Unstaked: ${this.formatAmount(amount)} ${this.config.symbol} from ${delegator}`);
    
    this.emit('unstaked', { delegator, validator, amount, timestamp: Date.now() });
    
    return true;
  }

  public async claimRewards(delegator: string): Promise<bigint> {
    if (!this.isRunning) {
      throw new Error('System is not running');
    }

    const account = this.accounts.get(delegator);
    if (!account) {
      throw new Error('Account not found');
    }

    const stakes = this.stakes.get(delegator);
    if (!stakes || stakes.length === 0) {
      return 0n;
    }

    let totalRewards = 0n;
    const now = Date.now();

    for (const stake of stakes) {
      if (stake.status === 'active') {
        const stakingDuration = (now - stake.startTime) / 1000; // seconds
        const rewards = this.calculateRewards(stake.amount, stakingDuration);
        
        stake.rewards += rewards;
        totalRewards += rewards;
        stake.startTime = now; // Reset start time
      }
    }

    if (totalRewards > 0n) {
      account.balance += totalRewards;
      account.lastActivity = Date.now();

      console.log(`🎁 Rewards claimed: ${this.formatAmount(totalRewards)} ${this.config.symbol} by ${delegator}`);
      
      this.emit('rewardsClaimed', { delegator, amount: totalRewards, timestamp: Date.now() });
    }

    return totalRewards;
  }

  private calculateRewards(amount: bigint, duration: number): bigint {
    const annualRate = this.config.stakingRewards.annualRate;
    const secondsInYear = 31536000;
    const rewards = (amount * BigInt(Math.floor(annualRate * 10000)) * BigInt(duration)) / (BigInt(10000) * BigInt(secondsInYear));
    return rewards;
  }

  // Gas Mechanics
  public getGasInfo(): GasInfo {
    return { ...this.gasInfo };
  }

  public async calculateGasCost(gasLimit: bigint, address?: string): Promise<bigint> {
    let gasPrice = this.gasInfo.currentPrice;

    // Check for free quota
    if (address && this.config.gasMechanics.freeQuota.enabled) {
      const account = this.accounts.get(address);
      if (account && this.canUseFreeQuota(account, gasLimit)) {
        return 0n;
      }
    }

    return gasPrice * gasLimit;
  }

  private canUseFreeQuota(account: Account, gasLimit: bigint): boolean {
    const now = Date.now();
    const quotaPeriod = this.config.gasMechanics.freeQuota.period * 86400000;

    // Reset quota if period has passed
    if (now - account.freeQuotaReset > quotaPeriod) {
      account.freeQuotaUsed = 0n;
      account.freeQuotaReset = now;
    }

    const remainingQuota = this.config.gasMechanics.freeQuota.amount - account.freeQuotaUsed;
    return remainingQuota >= gasLimit;
  }

  public async useGas(address: string, gasLimit: bigint): Promise<bigint> {
    const account = this.accounts.get(address);
    if (!account) {
      throw new Error('Account not found');
    }

    const gasCost = await this.calculateGasCost(gasLimit, address);

    if (gasCost > 0n) {
      if (account.balance < gasCost) {
        throw new Error('Insufficient balance for gas');
      }

      account.balance -= gasCost;
      account.lastActivity = Date.now();
    } else if (this.config.gasMechanics.freeQuota.enabled) {
      // Use free quota
      account.freeQuotaUsed += gasLimit;
      account.lastActivity = Date.now();
    }

    return gasCost;
  }

  // Governance System
  public async createProposal(
    proposer: string,
    title: string,
    description: string,
    type: GovernanceProposal['type'],
    amount?: bigint
  ): Promise<string> {
    if (!this.isRunning) {
      throw new Error('System is not running');
    }

    const account = this.accounts.get(proposer);
    if (!account) {
      throw new Error('Proposer account not found');
    }

    const votingPower = this.getVotingPower(proposer);
    if (votingPower < this.config.governance.proposalThreshold) {
      throw new Error('Insufficient voting power to create proposal');
    }

    const proposalId = `proposal_${++this.proposalCounter}`;
    const now = Date.now();
    const votingPeriod = this.config.governance.votingPeriod * 86400000;

    const proposal: GovernanceProposal = {
      id: proposalId,
      title,
      description,
      proposer,
      type,
      amount,
      status: 'pending',
      votingStart: now,
      votingEnd: now + votingPeriod,
      votes: {
        for: 0n,
        against: 0n,
        abstain: 0n
      },
      totalVotingPower: this.getTotalVotingPower()
    };

    this.proposals.set(proposalId, proposal);

    console.log(`📋 Proposal created: ${proposalId} by ${proposer}`);
    
    this.emit('proposalCreated', { proposal, timestamp: Date.now() });
    
    return proposalId;
  }

  public async vote(proposalId: string, voter: string, vote: 'for' | 'against' | 'abstain'): Promise<boolean> {
    if (!this.isRunning) {
      throw new Error('System is not running');
    }

    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'active') {
      throw new Error('Proposal is not active for voting');
    }

    const now = Date.now();
    if (now < proposal.votingStart || now > proposal.votingEnd) {
      throw new Error('Voting period is not active');
    }

    const votingPower = this.getVotingPower(voter);
    if (votingPower === 0n) {
      throw new Error('No voting power');
    }

    // Record vote (simplified - in reality would track individual votes)
    proposal.votes[vote] += votingPower;

    console.log(`🗳️ Vote cast: ${voter} voted ${vote} on ${proposalId} with ${this.formatAmount(votingPower)} power`);
    
    this.emit('voteCast', { proposalId, voter, vote, votingPower, timestamp: Date.now() });
    
    return true;
  }

  private getVotingPower(address: string): bigint {
    const account = this.accounts.get(address);
    if (!account) return 0n;

    // Voting power = balance + staked amount
    return account.balance + account.staked;
  }

  private getTotalVotingPower(): bigint {
    let total = 0n;
    for (const account of this.accounts.values()) {
      total += account.balance + account.staked;
    }
    return total;
  }

  // System Operations
  private startRewardDistribution(): void {
    if (!this.isRunning) return;

    const distributeRewards = () => {
      if (!this.isRunning) return;

      this.distributeStakingRewards();
      
      setTimeout(distributeRewards, this.rewardDistributionInterval);
    };

    distributeRewards();
  }

  private distributeStakingRewards(): void {
    if (this.totalStaked === 0n) return;

    const annualRewards = (this.config.totalSupply * BigInt(Math.floor(this.config.stakingRewards.annualRate * 10000))) / BigInt(10000);
    const dailyRewards = annualRewards / BigInt(365);

    // Distribute rewards proportionally
    for (const [delegator, stakes] of this.stakes.entries()) {
      const account = this.accounts.get(delegator);
      if (!account) continue;

      let delegatorStaked = 0n;
      for (const stake of stakes) {
        if (stake.status === 'active') {
          delegatorStaked += stake.amount;
        }
      }

      if (delegatorStaked > 0n) {
        const rewards = (dailyRewards * delegatorStaked) / this.totalStaked;
        account.balance += rewards;
        
        this.emit('rewardsDistributed', { delegator, amount: rewards, timestamp: Date.now() });
      }
    }

    console.log(`💰 Distributed ${this.formatAmount(dailyRewards)} staking rewards`);
  }

  private startGasPriceAdjustment(): void {
    if (!this.isRunning) return;

    const adjustGasPrice = () => {
      if (!this.isRunning) return;

      this.adjustGasPriceBasedOnCongestion();
      
      setTimeout(adjustGasPrice, this.gasPriceAdjustmentInterval);
    };

    adjustGasPrice();
  }

  private adjustGasPriceBasedOnCongestion(): void {
    // Simulate congestion based on recent activity
    const recentActivity = this.getRecentActivity();
    const congestionLevel = Math.min(1.0, recentActivity / 1000); // Normalize to 0-1

    this.gasInfo.congestionLevel = congestionLevel;

    if (this.config.gasMechanics.dynamicGasPrice) {
      const multiplier = 1 + (congestionLevel * this.config.gasMechanics.congestionMultiplier);
      this.gasInfo.currentPrice = this.gasInfo.basePrice * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
    }

    this.gasInfo.nextPriceAdjustment = Date.now() + this.gasPriceAdjustmentInterval;
  }

  private getRecentActivity(): number {
    let activity = 0;
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    for (const account of this.accounts.values()) {
      if (account.lastActivity > oneHourAgo) {
        activity++;
      }
    }

    return activity;
  }

  private startGovernanceProcessing(): void {
    if (!this.isRunning) return;

    const processGovernance = () => {
      if (!this.isRunning) return;

      this.processProposals();
      
      setTimeout(processGovernance, 60000); // Check every minute
    };

    processGovernance();
  }

  private processProposals(): void {
    const now = Date.now();

    for (const [proposalId, proposal] of this.proposals.entries()) {
      if (proposal.status === 'pending' && now >= proposal.votingStart) {
        proposal.status = 'active';
        this.emit('proposalActivated', { proposal, timestamp: Date.now() });
      }

      if (proposal.status === 'active' && now >= proposal.votingEnd) {
        this.finalizeProposal(proposal);
      }
    }
  }

  private finalizeProposal(proposal: GovernanceProposal): void {
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
    const quorum = proposal.totalVotingPower / BigInt(4); // 25% quorum

    if (totalVotes < quorum) {
      proposal.status = 'rejected';
      console.log(`❌ Proposal ${proposal.id} rejected - quorum not met`);
    } else if (proposal.votes.for > proposal.votes.against) {
      proposal.status = 'passed';
      proposal.executionTime = Date.now() + 86400000; // Execute in 24 hours
      console.log(`✅ Proposal ${proposal.id} passed`);
    } else {
      proposal.status = 'rejected';
      console.log(`❌ Proposal ${proposal.id} rejected`);
    }

    this.emit('proposalFinalized', { proposal, timestamp: Date.now() });
  }

  // Utility Methods
  public getAccount(address: string): Account | undefined {
    return this.accounts.get(address);
  }

  public getStakes(delegator?: string): StakeInfo[] {
    if (delegator) {
      return this.stakes.get(delegator) || [];
    }

    const allStakes: StakeInfo[] = [];
    for (const stakes of this.stakes.values()) {
      allStakes.push(...stakes);
    }
    return allStakes;
  }

  public getProposals(filter?: { status?: GovernanceProposal['status'] }): GovernanceProposal[] {
    let proposals = Array.from(this.proposals.values());
    
    if (filter?.status) {
      proposals = proposals.filter(p => p.status === filter.status);
    }
    
    return proposals.sort((a, b) => b.votingStart - a.votingStart);
  }

  public getStats(): {
    totalSupply: bigint;
    circulatingSupply: bigint;
    totalStaked: bigint;
    stakingRate: number;
    totalAccounts: number;
    activeProposals: number;
    currentGasPrice: bigint;
    congestionLevel: number;
  } {
    const totalAccounts = this.accounts.size;
    const activeProposals = Array.from(this.proposals.values()).filter(p => p.status === 'active').length;
    const stakingRate = this.config.totalSupply > 0 ? Number(this.totalStaked) / Number(this.config.totalSupply) : 0;

    return {
      totalSupply: this.config.totalSupply,
      circulatingSupply: this.circulatingSupply,
      totalStaked: this.totalStaked,
      stakingRate,
      totalAccounts,
      activeProposals,
      currentGasPrice: this.gasInfo.currentPrice,
      congestionLevel: this.gasInfo.congestionLevel
    };
  }

  private formatAmount(amount: bigint): string {
    const decimals = this.config.decimals;
    const divisor = BigInt(10**decimals);
    const whole = amount / divisor;
    const fractional = amount % divisor;
    
    return `${whole}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
  }

  public configure(config: Partial<NativeCoinConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Native coin configuration updated');
  }
}