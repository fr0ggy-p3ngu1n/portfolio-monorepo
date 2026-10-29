// Imported first in main.tsx. Zod 4 probes `new Function` when each object
// schema is *defined* (at import time) to decide whether to compile faster
// validators; the CSP blocks eval, so that probe only produced a console
// error. jitless skips it, but only if it's set before any schema module loads.
import { z } from 'zod';

z.config({ jitless: true });
