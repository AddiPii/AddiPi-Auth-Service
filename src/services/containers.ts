import { CONFIG } from "../config/config";
import { cosmosConnect } from "../db/cosmosConnect";
import type { containersType } from "../type";


export const { 
    usersContainer, 
    refreshTokensContainer 
}: containersType = cosmosConnect(CONFIG.COSMOS_ENDPOINT, CONFIG.COSMOS_KEY)
