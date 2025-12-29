const { MongoClient } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Connection URIs
const LOCAL_URI = 'mongodb://localhost:27017';
const LOCAL_DB_NAME = 'skylearn';
const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI) {
    console.error('Please define MONGODB_URI in .env.local');
    process.exit(1);
}

// Collections to migrate
const COLLECTIONS_TO_MIGRATE = [
    'users',
    'courses',
    'orders',
    'progresses',
    'institutions',
    'mcqs',
    'payments'
];

async function migrate() {
    let localClient, atlasClient;

    try {
        console.log('🔄 Starting migration from local MongoDB to Atlas...\n');

        // Connect to local MongoDB
        console.log('📡 Connecting to local MongoDB...');
        localClient = new MongoClient(LOCAL_URI);
        await localClient.connect();
        const localDb = localClient.db(LOCAL_DB_NAME);
        console.log('✅ Connected to local MongoDB\n');

        // Connect to Atlas
        console.log('☁️  Connecting to MongoDB Atlas...');
        atlasClient = new MongoClient(ATLAS_URI);
        await atlasClient.connect();
        const atlasDb = atlasClient.db(); // Uses database from connection string
        console.log('✅ Connected to MongoDB Atlas\n');

        // Get list of collections in local DB
        const localCollections = await localDb.listCollections().toArray();
        const localCollectionNames = localCollections.map(c => c.name);

        console.log('📋 Found collections in local DB:', localCollectionNames.join(', '), '\n');

        let totalMigrated = 0;

        // Migrate each collection
        for (const collectionName of COLLECTIONS_TO_MIGRATE) {
            if (!localCollectionNames.includes(collectionName)) {
                console.log(`⏭️  Skipping '${collectionName}' - not found in local DB`);
                continue;
            }

            const localCollection = localDb.collection(collectionName);
            const atlasCollection = atlasDb.collection(collectionName);

            // Get all documents from local collection
            const documents = await localCollection.find({}).toArray();

            if (documents.length === 0) {
                console.log(`⏭️  Skipping '${collectionName}' - empty collection`);
                continue;
            }

            // Check if collection already has data in Atlas
            const existingCount = await atlasCollection.countDocuments();
            if (existingCount > 0) {
                console.log(`⚠️  '${collectionName}' already has ${existingCount} documents in Atlas.`);
                console.log(`   Clearing existing data and replacing with local data...`);
                await atlasCollection.deleteMany({});
            }

            // Insert documents to Atlas
            const result = await atlasCollection.insertMany(documents);
            console.log(`✅ Migrated '${collectionName}': ${result.insertedCount} documents`);
            totalMigrated += result.insertedCount;
        }

        console.log('\n========================================');
        console.log(`🎉 Migration complete! ${totalMigrated} total documents migrated.`);
        console.log('========================================\n');

        // Show summary of what's now in Atlas
        console.log('📊 Atlas database summary:');
        for (const collectionName of COLLECTIONS_TO_MIGRATE) {
            try {
                const count = await atlasDb.collection(collectionName).countDocuments();
                if (count > 0) {
                    console.log(`   ${collectionName}: ${count} documents`);
                }
            } catch (e) {
                // Collection might not exist
            }
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.error('   Make sure local MongoDB is running (mongod)');
        }
        if (error.message.includes('authentication failed')) {
            console.error('   Check your Atlas credentials in .env.local');
        }
        process.exit(1);
    } finally {
        if (localClient) await localClient.close();
        if (atlasClient) await atlasClient.close();
    }
}

migrate();
