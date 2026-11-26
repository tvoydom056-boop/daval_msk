import {boot} from '../main.js';
import {mountDocuments} from '../pages/documents.js';
await boot(()=>mountDocuments());
