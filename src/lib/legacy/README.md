# Legacy Code Library

This directory contains clean, useful legacy code from the `kaldr1/` directory that has been migrated for potential reuse or reference.

## Migrated Files

### Core Services
- **`socket.ts`** - WebSocket/Socket.IO setup and event handling
- **`blockchain-service.ts`** - Core blockchain service with status, metrics, and network information
- **`db.ts`** - Prisma database client configuration (identical to main src/lib/db.ts)

### Business Logic
- **`testnet-incentive-system.ts`** - Comprehensive testnet incentive program management including:
  - Participant registration and tracking
  - Transaction, referral, uptime, and staking rewards
  - Leaderboard and statistics
  - Reward processing and distribution

- **`success-metrics-tracker.ts`** - Success metrics tracking and goal management including:
  - Network, performance, economic, community, and incentive metrics
  - Goal progress tracking
  - Performance reporting and recommendations
  - Automated metrics collection

### Specialized Services
- **`parallel-processing-service.ts`** - Parallel transaction processing service
- **`performance-monitoring-service.ts`** - Performance monitoring and metrics collection
- **`tokenomics.ts`** - Economic and tokenomics management

## Usage

These files are provided for reference and potential integration into the main codebase. Before using any of these files:

1. **Review Dependencies**: Check if the file has any dependencies on other legacy code
2. **Update Imports**: Update any import paths to use the current project structure
3. **Test Integration**: Thoroughly test before integrating into production code
4. **Refactor as Needed**: Some files may need refactoring to match current coding standards

## Integration Guidelines

1. **Start Small**: Begin with simple utilities like `socket.ts`
2. **Gradual Migration**: Migrate business logic one piece at a time
3. **Maintain Compatibility**: Ensure migrated code works with existing systems
4. **Update Documentation**: Document any changes or adaptations made

## Notes

- All files have been copied from the `kaldr1/src/lib/` directory
- Files are provided "as-is" and may require adaptation
- Some files may have dependencies on other legacy code not migrated
- Always test thoroughly before using in production