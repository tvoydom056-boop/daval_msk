import {boot} from '../main.js';
import {mountHome} from '../pages/home.js';
await boot(()=>mountHome());
