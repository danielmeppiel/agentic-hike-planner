#!/usr/bin/env ts-node

import { DataSeeder } from '../services/dataSeeder';

/**
 * CLI script for seeding the database with mock data
 * 
 * Usage:
 *   npm run seed                           # Seed with default values
 *   npm run seed -- --users 20            # Seed with 20 users
 *   npm run seed -- --clear               # Clear existing data first
 *   npm run seed -- --users 10 --trails 30 --trips 15 --recommendations 25
 */

interface CLIOptions {
  users?: number;
  trails?: number;
  trips?: number;
  recommendations?: number;
  clear?: boolean;
  validate?: boolean;
  stats?: boolean;
  help?: boolean;
}

function parseArguments(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--users':
        const usersArg = args[++i];
        if (usersArg !== undefined) {
          options.users = parseInt(usersArg, 10);
        }
        break;
      case '--trails':
        const trailsArg = args[++i];
        if (trailsArg !== undefined) {
          options.trails = parseInt(trailsArg, 10);
        }
        break;
      case '--trips':
        const tripsArg = args[++i];
        if (tripsArg !== undefined) {
          options.trips = parseInt(tripsArg, 10);
        }
        break;
      case '--recommendations':
        const recsArg = args[++i];
        if (recsArg !== undefined) {
          options.recommendations = parseInt(recsArg, 10);
        }
        break;
      case '--clear':
        options.clear = true;
        break;
      case '--validate':
        options.validate = true;
        break;
      case '--stats':
        options.stats = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.warn(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
🌱 Database Seeding CLI

Usage: npm run seed [options]

Options:
  --users <number>           Number of users to create (default: 10)
  --trails <number>          Number of trails to create (default: 50)
  --trips <number>           Number of trips to create (default: 20)
  --recommendations <number> Number of recommendations to create (default: 30)
  --clear                    Clear existing data before seeding
  --validate                 Only validate existing data (no seeding)
  --stats                    Only show statistics (no seeding)
  --help, -h                 Show this help message

Examples:
  npm run seed                                    # Use default values
  npm run seed -- --users 20 --trails 100       # Custom counts
  npm run seed -- --clear --users 5              # Clear first, then seed
  npm run seed -- --validate                     # Only validate data
  npm run seed -- --stats                        # Only show statistics
`);
}

async function main(): Promise<void> {
  const options = parseArguments();

  // Show help if requested
  if (options.help) {
    showHelp();
    return;
  }

  const seeder = new DataSeeder();

  try {
    // Handle stats-only request
    if (options.stats) {
      console.log('📊 Getting database statistics...');
      const stats = await seeder.getSeedingStatistics();
      console.log('\n📈 Current Database Statistics:');
      console.log(`   Users: ${stats.users}`);
      console.log(`   Trails: ${stats.trails}`);
      console.log(`   Trips: ${stats.trips}`);
      console.log(`   Recommendations: ${stats.recommendations} (${stats.activeRecommendations} active)`);
      return;
    }

    // Handle validation-only request
    if (options.validate) {
      console.log('🔍 Validating existing data...');
      const validation = await seeder.validateSeedData();
      
      console.log('\n✅ Validation Results:');
      console.log(`   Status: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (validation.issues.length > 0) {
        console.log('   Issues found:');
        validation.issues.forEach(issue => console.log(`     - ${issue}`));
      } else {
        console.log('   No issues found');
      }

      if (validation.statistics) {
        console.log('\n📈 Statistics:');
        console.log(`   Users: ${validation.statistics.users}`);
        console.log(`   Trails: ${validation.statistics.trails}`);
        console.log(`   Trips: ${validation.statistics.trips}`);
        console.log(`   Recommendations: ${validation.statistics.recommendations} (${validation.statistics.activeRecommendations} active)`);
      }
      return;
    }

    // Seed the database
    console.log('🚀 Starting database seeding process...');
    
    const seedingOptions = {
      users: options.users || 10,
      trails: options.trails || 50,
      trips: options.trips || 20,
      recommendations: options.recommendations || 30,
      clearExisting: options.clear || false
    };

    const result = await seeder.seedDatabase(seedingOptions);

    // Show final results
    console.log('\n🎯 Seeding Results:');
    console.log(`   ✅ Users created: ${result.summary.usersCreated}`);
    console.log(`   ✅ Trails created: ${result.summary.trailsCreated}`);
    console.log(`   ✅ Trips created: ${result.summary.tripsCreated}`);
    console.log(`   ✅ Recommendations created: ${result.summary.recommendationsCreated}`);
    console.log(`   ⏱️  Total time: ${result.summary.totalTime}ms`);

    // Validate the seeded data
    console.log('\n🔍 Validating seeded data...');
    const validation = await seeder.validateSeedData();
    
    if (validation.isValid) {
      console.log('✅ All seeded data is valid!');
    } else {
      console.log('⚠️  Some issues found with seeded data:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n💡 You can now:');
    console.log('   - Start the API server: npm run dev');
    console.log('   - Check statistics: npm run seed -- --stats');
    console.log('   - Validate data: npm run seed -- --validate');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }

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

export { main as seedData };