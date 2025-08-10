export interface ContractTemplate {
  id: string
  name: string
  description: string
  category: 'token' | 'nft' | 'defi' | 'utility' | 'governance'
  code: string
  functions: string[]
  estimatedGas: number
  complexity: 'simple' | 'medium' | 'complex'
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'erc20-token',
    name: 'ERC20 Token',
    description: 'Standard fungible token with transfer and approval functions',
    category: 'token',
    code: `// ERC20 Token Contract
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Balance, Promise, PromiseOrValue};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct ERC20Token {
    owner: AccountId,
    total_supply: Balance,
    balances: std::collections::HashMap<AccountId, Balance>,
    allowances: std::collections::HashMap<AccountId, std::collections::HashMap<AccountId, Balance>>,
}

impl Default for ERC20Token {
    fn default() -> Self {
        Self {
            owner: "owner.near".parse().unwrap(),
            total_supply: 1_000_000 * 10u128.pow(18),
            balances: std::collections::HashMap::new(),
            allowances: std::collections::HashMap::new(),
        }
    }
}

#[near_bindgen]
impl ERC20Token {
    #[init]
    pub fn new(owner_id: AccountId, total_supply: Balance) -> Self {
        let mut this = Self {
            owner: owner_id.clone(),
            total_supply,
            balances: std::collections::HashMap::new(),
            allowances: std::collections::HashMap::new(),
        };
        this.balances.insert(owner_id, total_supply);
        this
    }

    pub fn transfer(&mut self, to: AccountId, amount: Balance) -> bool {
        let from = env::predecessor_account_id();
        let from_balance = self.balances.get(&from).unwrap_or(&0);
        
        if *from_balance < amount {
            return false;
        }
        
        *self.balances.get_mut(&from).unwrap() -= amount;
        *self.balances.entry(to).or_insert(0) += amount;
        true
    }

    pub fn approve(&mut self, spender: AccountId, amount: Balance) -> bool {
        let owner = env::predecessor_account_id();
        let allowance = self.allowances.entry(owner).or_insert_with(std::collections::HashMap::new);
        allowance.insert(spender, amount);
        true
    }

    pub fn transfer_from(&mut self, from: AccountId, to: AccountId, amount: Balance) -> bool {
        let spender = env::predecessor_account_id();
        let allowance = self.allowances.get(&from).and_then(|a| a.get(&spender)).unwrap_or(&0);
        
        if *allowance < amount {
            return false;
        }
        
        let from_balance = self.balances.get(&from).unwrap_or(&0);
        if *from_balance < amount {
            return false;
        }
        
        *self.balances.get_mut(&from).unwrap() -= amount;
        *self.balances.entry(to).or_insert(0) += amount;
        *self.allowances.get_mut(&from).unwrap().get_mut(&spender).unwrap() -= amount;
        true
    }

    pub fn balance_of(&self, account_id: AccountId) -> Balance {
        self.balances.get(&account_id).copied().unwrap_or(0)
    }

    pub fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance {
        self.allowances.get(&owner).and_then(|a| a.get(&spender)).copied().unwrap_or(0)
    }

    pub fn total_supply(&self) -> Balance {
        self.total_supply
    }

    pub fn name(&self) -> String {
        "MyToken".to_string()
    }

    pub fn symbol(&self) -> String {
        "MTK".to_string()
    }

    pub fn decimals(&self) -> u8 {
        18
    }
}`,
    functions: ['transfer', 'approve', 'transfer_from', 'balance_of', 'allowance', 'total_supply', 'name', 'symbol', 'decimals'],
    estimatedGas: 1500000,
    complexity: 'medium'
  },
  {
    id: 'erc721-nft',
    name: 'ERC721 NFT',
    description: 'Non-fungible token with minting and transfer capabilities',
    category: 'nft',
    code: `// ERC721 NFT Contract
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Balance, Promise, PromiseOrValue};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct ERC721NFT {
    owner: AccountId,
    token_counter: u64,
    token_owners: std::collections::HashMap<u64, AccountId>,
    token_approvals: std::collections::HashMap<u64, AccountId>,
    operator_approvals: std::collections::HashMap<AccountId, std::collections::HashMap<AccountId, bool>>,
    token_metadata: std::collections::HashMap<u64, TokenMetadata>,
}

#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct TokenMetadata {
    title: String,
    description: String,
    media: String,
    reference: String,
}

impl Default for ERC721NFT {
    fn default() -> Self {
        Self {
            owner: "owner.near".parse().unwrap(),
            token_counter: 0,
            token_owners: std::collections::HashMap::new(),
            token_approvals: std::collections::HashMap::new(),
            operator_approvals: std::collections::HashMap::new(),
            token_metadata: std::collections::HashMap::new(),
        }
    }
}

#[near_bindgen]
impl ERC721NFT {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner: owner_id,
            token_counter: 0,
            token_owners: std::collections::HashMap::new(),
            token_approvals: std::collections::HashMap::new(),
            operator_approvals: std::collections::HashMap::new(),
            token_metadata: std::collections::HashMap::new(),
        }
    }

    pub fn mint(&mut self, token_id: u64, metadata: TokenMetadata) -> bool {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can mint");
        assert!(!self.token_owners.contains_key(&token_id), "Token already exists");
        
        self.token_owners.insert(token_id, self.owner.clone());
        self.token_metadata.insert(token_id, metadata);
        self.token_counter = std::cmp::max(self.token_counter, token_id + 1);
        true
    }

    pub fn transfer(&mut self, to: AccountId, token_id: u64) -> bool {
        let from = env::predecessor_account_id();
        assert_eq!(self.token_owners.get(&token_id), Some(&from), "Not token owner");
        
        self.token_owners.insert(token_id, to.clone());
        self.token_approvals.remove(&token_id);
        true
    }

    pub fn approve(&mut self, to: AccountId, token_id: u64) -> bool {
        let owner = self.token_owners.get(&token_id).unwrap();
        assert_eq!(env::predecessor_account_id(), *owner, "Not token owner");
        
        self.token_approvals.insert(token_id, to);
        true
    }

    pub fn set_approval_for_all(&mut self, operator: AccountId, approved: bool) -> bool {
        let owner = env::predecessor_account_id();
        let approvals = self.operator_approvals.entry(owner).or_insert_with(std::collections::HashMap::new);
        approvals.insert(operator, approved);
        true
    }

    pub fn owner_of(&self, token_id: u64) -> AccountId {
        self.token_owners.get(&token_id).cloned().unwrap_or_else(|| env::current_account_id())
    }

    pub fn get_approved(&self, token_id: u64) -> AccountId {
        self.token_approvals.get(&token_id).cloned().unwrap_or_else(|| env::current_account_id())
    }

    pub fn is_approved_for_all(&self, owner: AccountId, operator: AccountId) -> bool {
        self.operator_approvals.get(&owner).and_then(|a| a.get(&operator)).copied().unwrap_or(false)
    }

    pub fn token_metadata(&self, token_id: u64) -> TokenMetadata {
        self.token_metadata.get(&token_id).cloned().unwrap_or_else(|| TokenMetadata {
            title: "Untitled".to_string(),
            description: "No description".to_string(),
            media: "".to_string(),
            reference: "".to_string(),
        })
    }

    pub fn total_supply(&self) -> u64 {
        self.token_counter
    }
}`,
    functions: ['mint', 'transfer', 'approve', 'set_approval_for_all', 'owner_of', 'get_approved', 'is_approved_for_all', 'token_metadata', 'total_supply'],
    estimatedGas: 2500000,
    complexity: 'complex'
  },
  {
    id: 'simple-storage',
    name: 'Simple Storage',
    description: 'Basic key-value storage contract',
    category: 'utility',
    code: `// Simple Storage Contract
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct SimpleStorage {
    owner: AccountId,
    data: std::collections::HashMap<String, String>,
}

impl Default for SimpleStorage {
    fn default() -> Self {
        Self {
            owner: "owner.near".parse().unwrap(),
            data: std::collections::HashMap::new(),
        }
    }
}

#[near_bindgen]
impl SimpleStorage {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner: owner_id,
            data: std::collections::HashMap::new(),
        }
    }

    pub fn set(&mut self, key: String, value: String) -> bool {
        let predecessor = env::predecessor_account_id();
        assert_eq!(predecessor, self.owner, "Only owner can set values");
        
        self.data.insert(key, value);
        true
    }

    pub fn get(&self, key: String) -> String {
        self.data.get(&key).cloned().unwrap_or_else(|| "".to_string())
    }

    pub fn remove(&mut self, key: String) -> bool {
        let predecessor = env::predecessor_account_id();
        assert_eq!(predecessor, self.owner, "Only owner can remove values");
        
        self.data.remove(&key).is_some()
    }

    pub fn has_key(&self, key: String) -> bool {
        self.data.contains_key(&key)
    }

    pub fn keys(&self) -> Vec<String> {
        self.data.keys().cloned().collect()
    }

    pub fn size(&self) -> u64 {
        self.data.len() as u64
    }
}`,
    functions: ['set', 'get', 'remove', 'has_key', 'keys', 'size'],
    estimatedGas: 500000,
    complexity: 'simple'
  },
  {
    id: 'voting-contract',
    name: 'Voting Contract',
    description: 'Simple voting system for proposals',
    category: 'governance',
    code: `// Voting Contract
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct VotingContract {
    owner: AccountId,
    proposals: std::collections::HashMap<u64, Proposal>,
    votes: std::collections::HashMap<AccountId, std::collections::HashMap<u64, bool>>,
    proposal_counter: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct Proposal {
    title: String,
    description: String,
    yes_votes: u64,
    no_votes: u64,
    active: bool,
    creator: AccountId,
    created_at: u64,
}

impl Default for VotingContract {
    fn default() -> Self {
        Self {
            owner: "owner.near".parse().unwrap(),
            proposals: std::collections::HashMap::new(),
            votes: std::collections::HashMap::new(),
            proposal_counter: 0,
        }
    }
}

#[near_bindgen]
impl VotingContract {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner: owner_id,
            proposals: std::collections::HashMap::new(),
            votes: std::collections::HashMap::new(),
            proposal_counter: 0,
        }
    }

    pub fn create_proposal(&mut self, title: String, description: String) -> u64 {
        let proposal_id = self.proposal_counter;
        let proposal = Proposal {
            title: title.clone(),
            description,
            yes_votes: 0,
            no_votes: 0,
            active: true,
            creator: env::predecessor_account_id(),
            created_at: env::block_timestamp(),
        };
        
        self.proposals.insert(proposal_id, proposal);
        self.proposal_counter += 1;
        proposal_id
    }

    pub fn vote(&mut self, proposal_id: u64, vote_yes: bool) -> bool {
        let voter = env::predecessor_account_id();
        
        let proposal = self.proposals.get_mut(&proposal_id);
        if proposal.is_none() {
            return false;
        }
        
        let proposal = proposal.unwrap();
        if !proposal.active {
            return false;
        }
        
        let user_votes = self.votes.entry(voter).or_insert_with(std::collections::HashMap::new);
        if user_votes.contains_key(&proposal_id) {
            return false; // Already voted
        }
        
        user_votes.insert(proposal_id, vote_yes);
        
        if vote_yes {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }
        
        true
    }

    pub fn end_proposal(&mut self, proposal_id: u64) -> bool {
        assert_eq!(env::predecessor_account_id(), self.owner, "Only owner can end proposals");
        
        let proposal = self.proposals.get_mut(&proposal_id);
        if proposal.is_none() {
            return false;
        }
        
        proposal.unwrap().active = false;
        true
    }

    pub fn get_proposal(&self, proposal_id: u64) -> Proposal {
        self.proposals.get(&proposal_id).cloned().unwrap_or_else(|| Proposal {
            title: "Not Found".to_string(),
            description: "Proposal does not exist".to_string(),
            yes_votes: 0,
            no_votes: 0,
            active: false,
            creator: env::current_account_id(),
            created_at: 0,
        })
    }

    pub fn get_user_vote(&self, user_id: AccountId, proposal_id: u64) -> Option<bool> {
        self.votes.get(&user_id).and_then(|votes| votes.get(&proposal_id)).copied()
    }

    pub fn list_proposals(&self) -> Vec<(u64, Proposal)> {
        self.proposals.iter().map(|(id, proposal)| (*id, proposal.clone())).collect()
    }

    pub fn active_proposals(&self) -> Vec<(u64, Proposal)> {
        self.proposals.iter()
            .filter(|(_, proposal)| proposal.active)
            .map(|(id, proposal)| (*id, proposal.clone()))
            .collect()
    }
}`,
    functions: ['create_proposal', 'vote', 'end_proposal', 'get_proposal', 'get_user_vote', 'list_proposals', 'active_proposals'],
    estimatedGas: 1200000,
    complexity: 'medium'
  }
]