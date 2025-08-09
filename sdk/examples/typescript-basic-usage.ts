/**
 * Basic usage example for the TypeScript Dev Assistant Client SDK
 * 
 * This example demonstrates how to use the SDK for:
 * - Contract analysis
 * - Contract optimization
 * - Health checks
 * - Error handling
 * - Retry logic
 */

import { DevAssistantClient, OptimizeRequest, withRetry, DevAssistantError } from '@kaldrix/dev-assistant-client';

async function basicUsageExample() {
    console.log('🚀 KALDRIX Dev Assistant TypeScript SDK - Basic Usage Example');
    console.log('========================================================');

    // Initialize the client
    const client = new DevAssistantClient({
        baseURL: 'https://api.kaldrix.com',
        apiKey: 'your-api-key',
        timeout: 30000,
    });

    try {
        // Example 1: Health Check
        console.log('\n📊 Example 1: Health Check');
        const health = await client.healthCheck();
        console.log('✅ API Status:', health.status);
        console.log('📋 Version:', health.version);
        console.log('🔧 Services:');
        console.log('   - Server:', health.services.server);
        console.log('   - Database:', health.services.database);
        console.log('   - AI Services:', health.services.ai_services);

        // Example 2: Contract Analysis
        console.log('\n🔍 Example 2: Contract Analysis');
        const contractId = '0x1234567890abcdef1234567890abcdef12345678';
        
        const analysis = await client.analyzeContract(contractId);
        console.log('✅ Contract Analysis Results:');
        console.log('   Contract ID:', analysis.contract_id);
        console.log('   Security Score:', analysis.security_score + '/100');
        console.log('   Performance Score:', analysis.performance_score + '/100');
        console.log('   Issues Found:', analysis.issues_found.length);
        console.log('   Total Gas:', analysis.gas_analysis.total_gas);
        console.log('   Optimization Potential:', analysis.gas_analysis.optimization_potential + '%');

        // Display issues
        if (analysis.issues_found.length > 0) {
            console.log('\n🚨 Issues Found:');
            analysis.issues_found.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.severity}] ${issue.type}: ${issue.description}`);
                if (issue.line_number) {
                    console.log(`      Line: ${issue.line_number}`);
                }
                console.log(`      Suggestion: ${issue.suggestion}`);
            });
        }

        // Example 3: Contract Optimization
        console.log('\n⚡ Example 3: Contract Optimization');
        const contractCode = `
// Simple storage contract
contract SimpleStorage {
    uint256 private storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}
`;

        const optimizeRequest: OptimizeRequest = {
            contract_code: contractCode,
            optimization_level: 'basic',
            target_gas_reduction: 20,
        };

        const optimization = await client.optimizeContract(optimizeRequest);
        console.log('✅ Contract Optimization Results:');
        console.log('   Gas Reduction:', optimization.optimization_summary.gas_reduction_percent + '%');
        console.log('   Original Gas:', optimization.optimization_summary.original_gas_estimate);
        console.log('   Optimized Gas:', optimization.optimization_summary.optimized_gas_estimate);
        console.log('   Optimizations Applied:', optimization.optimization_summary.optimizations_applied.length);

        // Display optimizations
        if (optimization.optimization_summary.optimizations_applied.length > 0) {
            console.log('\n🔧 Optimizations Applied:');
            optimization.optimization_summary.optimizations_applied.forEach((opt, index) => {
                console.log(`   ${index + 1}. [${opt.type}] ${opt.description}`);
                console.log(`      Impact: ${opt.impact}`);
            });
        }

        // Display warnings
        if (optimization.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            optimization.warnings.forEach(warning => {
                console.log('   -', warning);
            });
        }

        console.log('\n📝 Optimized Code:');
        console.log('```solidity');
        console.log(optimization.optimized_code);
        console.log('```');

        // Example 4: Error Handling
        console.log('\n🛡️  Example 4: Error Handling');
        
        try {
            // Try to analyze a non-existent contract
            await client.analyzeContract('invalid-contract-id');
            console.log('⚠️  Expected error but got success');
        } catch (error) {
            if (error instanceof DevAssistantError) {
                console.log('✅ Error handled correctly:');
                console.log('   Error:', error.message);
                console.log('   Code:', error.code);
                console.log('   Status:', error.statusCode);
            } else {
                console.log('❌ Unexpected error type:', error);
            }
        }

        // Example 5: Retry Logic
        console.log('\n🔄 Example 5: Retry Logic');
        
        const analysisWithRetry = await withRetry(
            () => client.analyzeContract(contractId),
            3, // max retries
            1000 // base delay in ms
        );
        
        console.log('✅ Analysis completed with retry logic');
        console.log('   Security Score:', analysisWithRetry.security_score + '/100');

        // Example 6: Client Configuration
        console.log('\n⚙️  Example 6: Client Configuration');
        
        // Update configuration
        client.updateBaseURL('https://staging-api.kaldrix.com');
        client.updateApiKey('staging-api-key');
        
        console.log('✅ Client configuration updated:');
        console.log('   Base URL:', client.getConfig().baseURL);
        console.log('   API Key:', client.getConfig().apiKey.substring(0, 10) + '...');
        
        // Create a new client with modified config
        const productionClient = client.withConfig({
            baseURL: 'https://api.kaldrix.com',
            apiKey: 'production-api-key',
            timeout: 60000,
        });
        
        console.log('✅ New client created with modified config');
        console.log('   Timeout:', productionClient.getConfig().timeout + 'ms');

        // Example 7: Advanced Error Handling with Types
        console.log('\n🔧 Example 7: Advanced Error Handling');
        
        try {
            await client.optimizeContract({
                contract_code: '', // Invalid empty contract
            } as OptimizeRequest);
        } catch (error) {
            if (error instanceof DevAssistantError) {
                console.log('✅ DevAssistantError caught:');
                console.log('   Message:', error.message);
                console.log('   Code:', error.code);
                console.log('   Status:', error.statusCode);
                
                // Log error details if available
                if (error.details) {
                    console.log('   Details:', JSON.stringify(error.details, null, 2));
                }
            } else {
                console.log('❌ Unexpected error:', error);
            }
        }

        console.log('\n🎉 All examples completed successfully!');

    } catch (error) {
        console.error('❌ Example failed:', error);
        throw error;
    }
}

// Advanced usage example with async/await patterns
async function advancedUsageExample() {
    console.log('\n🚀 Advanced Usage Example');
    console.log('========================');

    const client = new DevAssistantClient({
        baseURL: 'https://api.kaldrix.com',
        apiKey: 'your-api-key',
    });

    try {
        // Batch processing example
        console.log('\n📦 Batch Processing Example');
        const contractIds = [
            '0x1111111111111111111111111111111111111111',
            '0x2222222222222222222222222222222222222222',
            '0x3333333333333333333333333333333333333333',
        ];

        const analysisPromises = contractIds.map(id => 
            client.analyzeContract(id).catch(error => ({ id, error }))
        );

        const results = await Promise.all(analysisPromises);
        
        console.log('✅ Batch analysis completed:');
        results.forEach((result, index) => {
            if ('error' in result) {
                console.log(`   Contract ${index + 1}: ❌ ${result.error.message}`);
            } else {
                console.log(`   Contract ${index + 1}: ✅ Score ${result.security_score}/100`);
            }
        });

        // Concurrent operations example
        console.log('\n⚡ Concurrent Operations Example');
        
        const [health, analysis] = await Promise.all([
            client.healthCheck(),
            client.analyzeContract(contractIds[0]),
        ]);

        console.log('✅ Concurrent operations completed:');
        console.log('   Health Status:', health.status);
        console.log('   Analysis Score:', analysis.security_score + '/100');

        // Rate limiting simulation
        console.log('\n⏱️  Rate Limiting Example');
        
        const delays = [0, 1000, 2000]; // Simulate rate limiting delays
        
        for (let i = 0; i < contractIds.length; i++) {
            console.log(`Processing contract ${i + 1}...`);
            
            if (i > 0) {
                console.log(`Waiting ${delays[i]}ms...`);
                await new Promise(resolve => setTimeout(resolve, delays[i]));
            }
            
            try {
                const result = await client.analyzeContract(contractIds[i]);
                console.log(`✅ Contract ${i + 1}: ${result.security_score}/100`);
            } catch (error) {
                console.log(`❌ Contract ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        console.log('\n🎉 Advanced examples completed successfully!');

    } catch (error) {
        console.error('❌ Advanced example failed:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        await basicUsageExample();
        await advancedUsageExample();
    } catch (error) {
        console.error('❌ Examples failed:', error);
        process.exit(1);
    }
}

// Run examples
if (require.main === module) {
    main();
}

export { basicUsageExample, advancedUsageExample };