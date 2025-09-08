import { supabase } from './supabase';

const contactService = {
  // Get all leads for the current user via campaigns_new
  getContacts: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('campaigns_new')
        .select(`
          id,
          name,
          apollo_leads!fk_campaign(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false, referencedTable: 'apollo_leads' });

      if (error) {
        return { success: false, error: error.message };
      }

      // Flatten the leads from all campaigns
      const leads = data.flatMap(campaign => 
        (campaign.apollo_leads || []).map(lead => ({
          ...lead,
          campaign_id: campaign.id,
          campaign_name: campaign.name
        }))
      );

      return { success: true, data: leads };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to load leads' };
    }
  },

  // Create a new lead
  createContact: async (contactData) => {
    try {
      const { data, error } = await supabase
        .from('apollo_leads')
        .insert([contactData])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to create lead' };
    }
  },

  // Update a lead
  updateContact: async (contactId, updates) => {
    try {
      const { data, error } = await supabase
        .from('apollo_leads')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to update lead' };
    }
  },

  // Delete a lead
  deleteContact: async (contactId) => {
    try {
      const { error } = await supabase
        .from('apollo_leads')
        .delete()
        .eq('id', contactId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to delete lead' };
    }
  },

  // Search leads via campaigns_new
  searchContacts: async (query, userId) => {
    try {
      const { data, error } = await supabase
        .from('campaigns_new')
        .select(`
          id,
          name,
          apollo_leads!fk_campaign(*)
        `)
        .eq('user_id', userId)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`, { referencedTable: 'apollo_leads' })
        .order('created_at', { ascending: false, referencedTable: 'apollo_leads' });

      if (error) {
        return { success: false, error: error.message };
      }

      // Flatten the leads from all campaigns
      const leads = data.flatMap(campaign => 
        (campaign.apollo_leads || []).map(lead => ({
          ...lead,
          campaign_id: campaign.id,
          campaign_name: campaign.name
        }))
      );

      return { success: true, data: leads };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to search leads' };
    }
  },

  // Import leads from CSV
  importContacts: async (contactsArray) => {
    try {
      const { data, error } = await supabase
        .from('apollo_leads')
        .insert(contactsArray)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to import leads' };
    }
  }
};

export default contactService;