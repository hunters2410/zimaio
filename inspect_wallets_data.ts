
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    let log = "";
    const addLog = (msg: string) => {
        console.log(msg);
        log += msg + "\n";
    };

    addLog("--- DATA INSPECTION START ---");

    // 1. Check Profiles
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name');

    if (pError) addLog('Profiles Error: ' + JSON.stringify(pError));
    else addLog(`Found ${profiles?.length} profiles.`);

    // 2. Check Wallets Table Content
    const { data: wallets, error: wError } = await supabase
        .from('wallets')
        .select('*');

    if (wError) addLog('Wallets Error: ' + JSON.stringify(wError));
    else {
        addLog(`Found ${wallets?.length} wallets.`);
        wallets?.forEach(w => {
            const owner = profiles?.find(p => p.id === w.user_id);
            addLog(`Wallet for ${owner?.email || w.user_id} (${owner?.role}): Balance=${w.balance}, BalanceUSD=${w.balance_usd}, BalanceZIG=${w.balance_zig}`);
        });
    }

    // 3. check joining logic
    const { data: joined, error: jError } = await supabase
        .from('profiles')
        .select('email, id, wallets(*)');

    if (jError) addLog('Join Error: ' + JSON.stringify(jError));
    else {
        addLog("Join test:");
        joined?.forEach(p => {
            addLog(`User: ${p.email}, Wallets Count: ${p.wallets?.length}`);
        });
    }

    fs.writeFileSync('inspection_results.txt', log);
}

inspectData();
