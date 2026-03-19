// src/clients/filesClient.ts
import createClient from "openapi-fetch";
import type { paths } from "@mairie360/files-api-openapi"; 

const filesClient = createClient<paths>({ 
    baseUrl: process.env.FILES_API_URL 
});

export default filesClient;