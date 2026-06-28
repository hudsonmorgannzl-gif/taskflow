import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://svpfhuwmuzexabxzwpcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2cGZodXdtdXpleGFieHp3cGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjE4NTcsImV4cCI6MjA5ODIzNzg1N30.OdF0NAySwD4Spp41wBo9BIAfhl4_S8Jry1smKiKbOe4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
