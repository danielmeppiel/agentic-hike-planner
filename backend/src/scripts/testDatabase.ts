#!/usr/bin/env ts-node

import { DatabaseValidator } from '../services/databaseValidator';

/**
 * CLI script for testing and validating the database implementation
 * 
 * Usage:
 *   npm run test:db                     # Run all tests
 *   npm run test:db -- --schema         # Test schema validation only
 *   npm run test:db -- --operations     # Test database operations only
 */

interface TestOptions {
  schema?: boolean;
  operations?: boolean;
  help?: boolean;
}

function parseArguments(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {};

  for (const arg of args) {
    switch (arg) {
      case '--schema':
        options.schema = true;
        break;
      case '--operations':
        options.operations = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.warn(`Unknown option: ${arg}`);
    }
  }

  // If no specific test is requested, run all tests
  if (!options.schema && !options.operations) {
    options.schema = true;
    options.operations = true;
  }

  return options;
}

function showHelp(): void {
  console.log(`
🧪 Database Testing CLI

Usage: npm run test:db [options]

Options:
  --schema               Test schema validation only
  --operations           Test database operations only
  --help, -h             Show this help message

Examples:
  npm run test:db                        # Run all tests
  npm run test:db -- --schema            # Test schema validation only
  npm run test:db -- --operations        # Test database operations only
`);
}

async function main(): Promise<void> {
  const options = parseArguments();

  // Show help if requested
  if (options.help) {
    showHelp();
    return;
  }

  console.log('🚀 Starting database tests...\n');

  const validator = new DatabaseValidator();
  let allTestsPassed = true;

  try {
    // Run schema validation tests
    if (options.schema) {
      console.log('📋 Running schema validation tests...');
      const schemaTestsPassed = await validator.validateSchemaConstraints();
      allTestsPassed = allTestsPassed && schemaTestsPassed;
      console.log('');
    }

    // Run database operation tests
    if (options.operations) {
      console.log('🗄️  Running database operation tests...');
      const operationTestsPassed = await validator.testDatabaseOperations();
      allTestsPassed = allTestsPassed && operationTestsPassed;
      console.log('');
    }

    // Final results
    if (allTestsPassed) {
      console.log('🎉 All tests passed successfully!');
      console.log('\n✅ Your database implementation is working correctly.');
      console.log('\n💡 Next steps:');
      console.log('   - Seed the database: npm run seed');
      console.log('   - Start the API server: npm run dev');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed!');
      console.log('\n🔧 Please check the error messages above and fix the issues.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }

    console.log('\n🔧 Please check your database configuration and try again.');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { main as testDatabase };