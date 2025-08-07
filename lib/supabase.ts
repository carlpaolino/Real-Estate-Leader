import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema for Leader platform
export const databaseSchema = {
  users: `
    CREATE TABLE users (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      subscription_status TEXT DEFAULT 'trial',
      subscription_plan TEXT DEFAULT 'basic',
      subscription_end_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  leads: `
    CREATE TABLE leads (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      address TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      foreclosure_type TEXT NOT NULL,
      filing_date DATE NOT NULL,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      notes TEXT,
      street_view_url TEXT,
      county TEXT NOT NULL,
      property_value INTEGER,
      equity_percentage INTEGER,
      signals JSONB DEFAULT '{}',
      delivered BOOLEAN DEFAULT FALSE,
      delivered_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  outreach_logs: `
    CREATE TABLE outreach_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      lead_id UUID REFERENCES leads(id) NOT NULL,
      user_id UUID REFERENCES users(id) NOT NULL,
      method TEXT NOT NULL,
      message_id TEXT,
      content TEXT,
      status TEXT DEFAULT 'sent',
      delivered_at TIMESTAMP WITH TIME ZONE,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  analytics: `
    CREATE TABLE analytics (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  opt_outs: `
    CREATE TABLE opt_outs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      opted_out_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
}

// Row Level Security (RLS) policies
export const rlsPolicies = {
  users: `
    -- Users can only see their own data
    CREATE POLICY "Users can view own data" ON users
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own data" ON users
      FOR UPDATE USING (auth.uid() = id);
  `,
  
  leads: `
    -- Users can only see their own leads
    CREATE POLICY "Users can view own leads" ON leads
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own leads" ON leads
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own leads" ON leads
      FOR UPDATE USING (auth.uid() = user_id);
  `,
  
  outreach_logs: `
    -- Users can only see their own outreach logs
    CREATE POLICY "Users can view own outreach logs" ON outreach_logs
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own outreach logs" ON outreach_logs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  `,
  
  analytics: `
    -- Users can only see their own analytics
    CREATE POLICY "Users can view own analytics" ON analytics
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own analytics" ON analytics
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  `
}

// Functions for data processing
export const databaseFunctions = {
  update_updated_at: `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `,
  
  create_updated_at_triggers: `
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `
}

export async function setupDatabase() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: Object.values(databaseSchema).join('\n')
    })
    
    if (error) throw error
    console.log('Database schema created successfully')
    
    // Enable RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    })
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE leads ENABLE ROW LEVEL SECURITY;'
    })
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;'
    })
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;'
    })
    
    // Create policies
    await supabase.rpc('exec_sql', {
      sql: Object.values(rlsPolicies).join('\n')
    })
    
    // Create functions and triggers
    await supabase.rpc('exec_sql', {
      sql: databaseFunctions.update_updated_at + databaseFunctions.create_updated_at_triggers
    })
    
    console.log('Database setup completed')
  } catch (error) {
    console.error('Database setup failed:', error)
  }
} 