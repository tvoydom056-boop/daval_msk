import {boot} from '../main.js';
import {mountFamilies} from '../pages/families.js';
await boot(()=>mountFamilies());
