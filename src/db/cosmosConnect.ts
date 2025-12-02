import { CosmosClient } from "@azure/cosmos";
import type { Container, Database } from "@azure/cosmos";
import { containersType } from "../type";


export function cosmosConnect(COSMOS_ENDPOINT: string, COSMOS_KEY: string): containersType{
    const missing: string[] = [];
    if (!COSMOS_ENDPOINT) missing.push('COSMOS_ENDPOINT');
    if (!COSMOS_KEY) missing.push('COSMOS_KEY');

    if (missing.length) {
        console.error('Missing required environment variables:', missing.join(', '));
    }

    let usersContainer: Container
    let refreshTokensContainer: Container

    try {
        const comsosClient: CosmosClient = new CosmosClient({ endpoint: COSMOS_ENDPOINT, key: COSMOS_KEY })
        const database: Database = comsosClient.database('addipi')
        usersContainer = database.container('users')
        refreshTokensContainer = database.container('refresh-tokens')
    } catch (err) {
        console.error('Failed to create Cosmos DB client:', err);
        process.exit(1);
    }

    const containers: containersType = {
        usersContainer: usersContainer,
        refreshTokensContainer: refreshTokensContainer
    }

    return containers
}
