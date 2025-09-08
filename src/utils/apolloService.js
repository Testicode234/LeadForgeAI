import { supabase } from './supabase';
   import campaignService from './campaignService';

   // 🔐 ENV-SAFE KEYS
   const APOLLO_API_KEY = import.meta.env.VITE_APOLLO_API_KEY;

   // 🔁 Proxy Apollo API via Edge Function
   const callApolloProxy = async (endpoint, method = 'GET', body = null, queryParams = null, oauthToken = null) => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) throw new Error('No active session. Please log in.');

       let url = `/.netlify/functions${endpoint}`;
       if (queryParams) {
         const searchParams = new URLSearchParams(queryParams);
         url += `?${searchParams.toString()}`;
       }

       const headers = {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${session.access_token}`,
       };

       if (oauthToken) {
         headers['Authorization'] = `Bearer ${oauthToken}`;
       } else if (APOLLO_API_KEY) {
         headers['Api-Key'] = APOLLO_API_KEY;
       } else {
         throw new Error('No API key or OAuth token provided');
       }

       const response = await fetch(url, {
         method,
         headers,
         body: body ? JSON.stringify(body) : null,
       });

       const text = await response.text();
       try {
         const data = JSON.parse(text);
         console.log('Apollo API Response:', data);
         if (!data.success) throw new Error(data.error || `HTTP ${data.status}: Request failed`);
         return data.data;
       } catch (jsonError) {
         console.error('JSON Parse Error:', text);
         throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
       }
     } catch (error) {
       console.error('Apollo Service Error:', error);
       throw new Error(
         error.message.includes('fetch') || error.message.includes('NetworkError')
           ? 'Cannot connect to Apollo API. Check your internet connection.'
           : error.message
       );
     }
   };

   const apolloService = {
     // 🔹 Search for leads from Apollo
     searchLeads: async (filters, oauthToken = null) => {
       try {
         const queryParams = {
           q_organization_job_titles: filters.jobTitles?.join(',') || '',
           q_organization_industries: filters.industries?.join(',') || '',
           q_person_locations: filters.locations?.join(',') || '',
           q_organization_sizes: filters.companySizes?.join(',') || '',
           per_page: filters.limit || 5,
         };

         const data = await callApolloProxy('/v1/people/search', 'GET', null, queryParams, oauthToken);
         const leads = data.people?.map((lead, index) => ({
           full_name: lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || `Lead ${index + 1}`,
           first_name: lead.first_name || 'Unknown',
           last_name: lead.last_name || 'Unknown',
           job_title: lead.title || 'Unknown Position',
           company: lead.organization?.name || 'Unknown Company',
           location: lead.city || lead.state || lead.country || 'Unknown Location',
           linkedin_url: lead.linkedin_url || '',
           email: lead.email || null,
           phone: lead.phone || null,
           profile_image_url: lead.photo_url || null,
           apollo_lead_id: lead.id || `temp_${Date.now()}_${index}`,
           lead_data: {
             industry: lead.organization?.industry || null,
             companySize: lead.organization?.estimated_size || null,
             department: lead.department || null,
             seniority: lead.seniority || null,
           },
         })) || [];

         return {
           success: true,
           data: {
             leads,
             total: data.pagination?.total_entries || leads.length,
             hasMore: data.pagination?.next_page || false,
           },
         };
       } catch (error) {
         console.error('Search Leads Error:', error.message);
         return {
           success: false,
           error: error.message || 'Lead search failed',
         };
       }
     },

     // 🔹 Start fetching leads & mark campaign as completed
     startLeadFetching: async (apolloCampaignId, targetingCriteria, campaignId, oauthToken = null) => {
       try {
         const data = await callApolloProxy(`/v1/people/bulk_search/${apolloCampaignId}`, 'POST', {
           q_organization_job_titles: targetingCriteria.jobTitles?.join(',') || '',
           q_organization_industries: targetingCriteria.industries?.join(',') || '',
           q_person_locations: targetingCriteria.locations?.join(',') || '',
           per_page: targetingCriteria.max_leads || 100,
         }, null, oauthToken);

         if (campaignId) {
           await campaignService.updateCampaignStatus(campaignId, 'completed');
         }

         return {
           success: true,
           data: {
             fetchingStarted: true,
             estimatedLeads: data.pagination?.total_entries || 0,
             message: data.message || 'Lead fetching started successfully',
           },
         };
       } catch (error) {
         console.error('Start Lead Fetching Error:', error.message);
         return {
           success: false,
           error: error.message || 'Failed to start lead fetching',
         };
       }
     },

     // 🔹 Validate Apollo API connection
     validateConnection: async (oauthToken = null) => {
       try {
         const data = await callApolloProxy('/v1/auth/validate', 'GET', null, null, oauthToken);
         return {
           success: true,
           data: {
             valid: data.valid,
             account: data.account_info,
           },
         };
       } catch (error) {
         console.error('Validate Connection Error:', error.message);
         return {
           success: false,
           error: error.message || 'Validation failed',
         };
       }
     },
   };

   export default apolloService;