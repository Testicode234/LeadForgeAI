import { supabase } from './supabase';
   import apolloService from './apolloService';

   const campaignService = {
     getCampaigns: async (userId) => {
       try {
         const { data, error } = await supabase
           .from('campaigns_new')
           .select('*')
           .eq('user_id', userId)
           .order('created_at', { ascending: false });

         if (error) {
           return { success: false, error: error.message };
         }

         return { success: true, data };
       } catch (error) {
         console.error('Error in getCampaigns:', error);
         return { success: false, error: 'Failed to load campaigns' };
       }
     },

     createCampaign: async (campaignData) => {
       try {
         const { data, error } = await supabase
           .from('campaigns_new')
           .insert({
             ...campaignData,
             campaign_status: 'not_started',
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           })
           .select()
           .single();

         if (error) {
           return { success: false, error: error.message };
         }

         return { success: true, data };
       } catch (error) {
         console.error('Error in createCampaign:', error);
         return { success: false, error: 'Failed to create campaign' };
       }
     },

     updateCampaign: async (campaignId, updates) => {
       try {
         const { data, error } = await supabase
           .from('campaigns_new')
           .update({
             ...updates,
             updated_at: new Date().toISOString(),
           })
           .eq('id', campaignId)
           .select()
           .single();

         if (error) {
           return { success: false, error: error.message };
         }

         return { success: true, data };
       } catch (error) {
         console.error('Error in updateCampaign:', error);
         return { success: false, error: 'Failed to update campaign' };
       }
     },

     updateCampaignStatus: async (campaignId, status) => {
       try {
         const validStatuses = ['not_started', 'processing', 'completed', 'failed'];
         if (!validStatuses.includes(status)) {
           return { success: false, error: `Invalid campaign status: ${status}` };
         }

         const { data, error } = await supabase
           .from('campaigns_new')
           .update({
             campaign_status: status,
             updated_at: new Date().toISOString(),
           })
           .eq('id', campaignId)
           .select()
           .single();

         if (error) {
           return { success: false, error: error.message };
         }

         return { success: true, data };
       } catch (error) {
         console.error('Error in updateCampaignStatus:', error);
         return { success: false, error: 'Failed to update campaign status' };
       }
     },

     deleteCampaign: async (campaignId) => {
       try {
         const { error } = await supabase
           .from('campaigns_new')
           .delete()
           .eq('id', campaignId);

         if (error) {
           return { success: false, error: error.message };
         }

         return { success: true };
       } catch (error) {
         console.error('Error in deleteCampaign:', error);
         return { success: false, error: 'Failed to delete campaign' };
       }
     },

     generateLeadsForCampaign: async (campaignId, filters, oauthToken = null) => {
       try {
         console.log('⏳ Starting enrichment:', { campaignId, filters });
         const { data: campaign, error: campaignError } = await supabase
           .from('campaigns_new')
           .select('id, user_id, target_job_titles, target_industries, target_locations')
           .eq('id', campaignId)
           .single();

         if (campaignError || !campaign) {
           return { success: false, error: 'Campaign not found' };
         }

         await supabase
           .from('campaigns_new')
           .update({
             campaign_status: 'processing',
             updated_at: new Date().toISOString(),
           })
           .eq('id', campaignId);

         const apolloFilters = {
           jobTitles: campaign.target_job_titles || filters.jobTitles || [],
           industries: campaign.target_industries || filters.industries || [],
           locations: campaign.target_locations || filters.locations || [],
           companySizes: filters.companySizes || [],
           limit: filters.limit || 5,
         };

         const apolloResult = await apolloService.searchLeads(apolloFilters, oauthToken);
         console.log('Apollo Result in Campaign:', apolloResult);
         if (!apolloResult.success) {
           await supabase
             .from('campaigns_new')
             .update({
               campaign_status: 'failed',
               updated_at: new Date().toISOString(),
             })
             .eq('id', campaignId);

           return {
             success: false,
             error: `Apollo API Error: ${apolloResult.error}`,
             retryable: true,
           };
         }

         const leads = apolloResult.data.leads || [];
         const leadsToInsert = leads.map((lead) => ({
           ...lead,
           campaign_id: campaign.id,
           user_id: campaign.user_id,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
         }));

         if (leadsToInsert.length > 0) {
           const { error: insertError } = await supabase
             .from('apollo_leads')
             .insert(leadsToInsert);

           if (insertError) {
             await supabase
               .from('campaigns_new')
               .update({
                 campaign_status: 'failed',
                 updated_at: new Date().toISOString(),
               })
               .eq('id', campaignId);

             return { success: false, error: 'Failed to insert leads' };
           }
         }

         await supabase
           .from('campaigns_new')
           .update({
             campaign_status: 'completed',
             leads_generated: leadsToInsert.length,
             updated_at: new Date().toISOString(),
           })
           .eq('id', campaignId);

         return {
           success: true,
           data: {
             leadsGenerated: leadsToInsert.length,
             totalAvailable: apolloResult.data.total || 0,
             hasMore: apolloResult.data.hasMore || false,
             campaignId,
           },
         };
       } catch (error) {
         console.error('Lead generation error:', error.message);
         await supabase
           .from('campaigns_new')
           .update({
             campaign_status: 'failed',
             updated_at: new Date().toISOString(),
           })
           .eq('id', campaignId);

         return {
           success: false,
           error: 'Failed to generate leads: ' + error.message,
           retryable: true,
         };
       }
     },

     sendCampaignMessages: async (campaignId) => {
       try {
         const { data: campaign, error: campaignError } = await supabase
           .from('campaigns_new')
           .select('id, message, user_id')
           .eq('id', campaignId)
           .single();

         if (campaignError || !campaign) {
           return { success: false, error: 'Campaign not found' };
         }

         const { data: leads, error: leadsError } = await supabase
           .from('apollo_leads')
           .select('id, first_name, email')
           .eq('campaign_id', campaignId);

         if (leadsError) {
           return { success: false, error: 'Failed to fetch leads for campaign' };
         }

         const sendPromises = leads.map(async (lead) => {
           let personalizedMessage = campaign.message;
           personalizedMessage = personalizedMessage.replace(/\{\{firstName\}\}/g, lead.first_name || 'Friend');

           const { error } = await supabase
             .from('apollo_leads')
             .update({
               message_sent: true,
               message_sent_at: new Date().toISOString(),
               updated_at: new Date().toISOString(),
             })
             .eq('id', lead.id);

           if (error) {
             console.error(`Failed to update lead ${lead.id}:`, error);
           }

           return { success: !error, leadId: lead.id };
         });

         const results = await Promise.all(sendPromises);
         const successfulSends = results.filter((r) => r.success).length;

         return {
           success: true,
           data: { messagesSent: successfulSends, totalLeads: leads.length },
         };
       } catch (error) {
         console.error('Error in sendCampaignMessages:', error);
         return { success: false, error: 'Failed to send campaign messages' };
       }
     },
   };

   export default campaignService;