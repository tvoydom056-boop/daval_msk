import {boot} from '../main.js';
import {mountMemoryPage} from '../pages/memory-page.js';
await boot(()=>mountMemoryPage());
