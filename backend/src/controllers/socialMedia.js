





const axios = require('axios');
const cheerio = require('cheerio');
const { getCachedData, setCachedData } = require('../middleware/cache');
const { fetchSocialMediaData } = require('../services/socialMedia');
const logger = require('../utils/logger');

// Mock social media data for fallback
const mockSocialMediaData = [
  {
    id: '1',
    post: '#floodrelief Need food and water in Lower Manhattan. Families stranded!',
    user: 'citizen_helper1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    verified: false
  },
  {
    id: '2',
    post: 'Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp',
    user: 'brooklyn_resident',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    verified: false
  },
  {
    id: '3',
    post: 'URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp',
    user: 'medical_volunteer',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false
  }
];

const getSocialMediaReports = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { keywords, limit = 20, disaster_type } = req.query;

    const cacheKey = `social_media_${disaster_id}_${keywords || 'all'}_${disaster_type || 'general'}`;
    
    // Check cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Use the new social media service
    const socialMediaData = await fetchSocialMediaData(keywords, disaster_type, parseInt(limit));

    // Cache the results
    await setCachedData(cacheKey, socialMediaData);

    // Emit real-time update
    req.io.emit('social_media_updated', { disaster_id, data: socialMediaData });

    logger.info(`Social media reports fetched for disaster ${disaster_id}: ${socialMediaData.length} posts`);
    res.json({
      disaster_id,
      total_posts: socialMediaData.length,
      keywords_used: keywords,
      disaster_type: disaster_type,
      last_updated: new Date().toISOString(),
      posts: socialMediaData
    });
  } catch (error) {
    logger.error('Error fetching social media reports:', error);
    res.status(500).json({ error: 'Failed to fetch social media reports' });
  }
};

/**
 * New mock endpoint for testing social media functionality
 */
const getMockSocialMedia = async (req, res) => {
  try {
    const { keywords, limit = 20, disaster_type } = req.query;

    // Use the service to get processed mock data
    const mockData = await fetchSocialMediaData(keywords, disaster_type, parseInt(limit));

    logger.info(`Mock social media data requested: ${mockData.length} posts`);
    res.json({
      message: 'Mock social media data',
      total_posts: mockData.length,
      keywords_used: keywords,
      disaster_type: disaster_type,
      timestamp: new Date().toISOString(),
      posts: mockData
    });
  } catch (error) {
    logger.error('Error fetching mock social media data:', error);
    res.status(500).json({ error: 'Failed to fetch mock social media data' });
  }
};

const getOfficialUpdates = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const cacheKey = `official_updates_${disaster_id}`;

    // Check cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Fetch official updates from government/relief websites
    const officialUpdates = await fetchOfficialUpdates();
    
    // Cache the results
    await setCachedData(cacheKey, officialUpdates);

    logger.info(`Official updates fetched for disaster ${disaster_id}`);
    res.json(officialUpdates);
  } catch (error) {
    logger.error('Error fetching official updates:', error);
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
};

// Helper functions
const fetchMockSocialMediaData = async (keywords) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter mock data based on keywords if provided
  if (keywords) {
    const keywordArray = keywords.toLowerCase().split(',');
    return mockSocialMediaData.filter(post => 
      keywordArray.some(keyword => 
        post.post.toLowerCase().includes(keyword.trim())
      )
    );
  }
  
  return mockSocialMediaData;
};

const processSocialMediaData = (data, keywords) => {
  return data.map(post => {
    // Determine priority based on keywords
    let priority = 'low';
    const postText = post.post.toLowerCase();
    
    if (postText.includes('urgent') || postText.includes('sos') || postText.includes('emergency')) {
      priority = 'urgent';
    } else if (postText.includes('need') || postText.includes('help') || postText.includes('stranded')) {
      priority = 'high';
    } else if (postText.includes('offering') || postText.includes('volunteer')) {
      priority = 'medium';
    }

    return {
      ...post,
      priority,
      processed_at: new Date().toISOString()
    };
  }).sort((a, b) => {
    const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

const fetchOfficialUpdates = async () => {
  try {
    // Mock official updates - in real implementation, this would scrape FEMA, Red Cross, etc.
    const mockOfficialUpdates = [
      {
        id: '1',
        source: 'FEMA',
        title: 'Emergency Shelter Locations Updated',
        content: 'New emergency shelters have been opened in Manhattan and Brooklyn. See locations below.',
        url: 'https://fema.gov/disaster-updates',
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        severity: 'high'
      },
      {
        id: '2',
        source: 'NYC Emergency Management',
        title: 'Water Distribution Points Active',
        content: 'Water distribution is now active at Central Park and Prospect Park locations.',
        url: 'https://nyc.gov/emergency',
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        severity: 'medium'
      },
      {
        id: '3',
        source: 'Red Cross',
        title: 'Volunteer Registration Open',
        content: 'Red Cross is accepting volunteer registrations for disaster relief efforts.',
        url: 'https://redcross.org/volunteer',
        published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        severity: 'low'
      }
    ];

    // In a real implementation, you would scrape actual websites:
    // const response = await axios.get('https://www.fema.gov/disasters');
    // const $ = cheerio.load(response.data);
    // Parse the HTML and extract updates

    return mockOfficialUpdates;
  } catch (error) {
    logger.error('Error fetching official updates:', error);
    throw error;
  }
};

module.exports = {
  getSocialMediaReports,
  getMockSocialMedia,
  getOfficialUpdates
};












// const { getCachedData, setCachedData } = require('../middleware/cache')
// const { fetchSocialMediaData } = require('../services/socialMedia')
// const { fetchOfficialUpdates } = require('../services/browse')
// const logger = require('../utils/logger')

// const getSocialMediaReports = async (req, res) => {
//   try {
//     const { id } = req.params
//     const { keywords, limit = 20, disaster_type } = req.query
//     const cacheKey = `social_media_${id}_${keywords || 'all'}_${disaster_type || 'general'}`
//     const cached = await getCachedData(cacheKey)
//     if (cached) return res.json(cached)
//     const posts = await fetchSocialMediaData(keywords, disaster_type, parseInt(limit))
//     await setCachedData(cacheKey, posts)
//     req.io.emit('social_media_updated', { disaster_id: id, data: posts })
//     res.json({
//       disaster_id: id,
//       total_posts: posts.length,
//       keywords_used: keywords,
//       disaster_type,
//       last_updated: new Date().toISOString(),
//       posts
//     })
//   } catch (e) {
//     logger.error('social media error', e)
//     res.status(500).json({ error: 'Failed to fetch social media reports' })
//   }
// }

// const getMockSocialMedia = async (req, res) => {
//   try {
//     const { keywords, limit = 20, disaster_type } = req.query
//     const posts = await fetchSocialMediaData(keywords, disaster_type, parseInt(limit))
//     res.json({
//       message: 'Mock social media data',
//       total_posts: posts.length,
//       keywords_used: keywords,
//       disaster_type,
//       timestamp: new Date().toISOString(),
//       posts
//     })
//   } catch (e) {
//     logger.error('mock social media error', e)
//     res.status(500).json({ error: 'Failed to fetch mock social media data' })
//   }
// }

// const getOfficialUpdates = async (req, res) => {
//   try {
//     const { id } = req.params
//     const cacheKey = `official_updates_${id}`
//     const cached = await getCachedData(cacheKey)
//     if (cached) return res.json(cached)
//     const updates = await fetchOfficialUpdates()
//     await setCachedData(cacheKey, updates)
//     res.json(updates)
//   } catch (e) {
//     logger.error('official updates error', e)
//     res.status(500).json({ error: 'Failed to fetch official updates' })
//   }
// }

// module.exports = {
//   getSocialMediaReports,
//   getMockSocialMedia,
//   getOfficialUpdates
// }
