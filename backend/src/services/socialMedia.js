const axios = require('axios');
const logger = require('../utils/logger');

// Mock social media data with different disaster types
const mockSocialMediaData = [
  {
    id: '1',
    post: '#floodrelief Need food and water in Lower Manhattan. Families stranded!',
    user: 'citizen_helper1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    verified: false,
    location: 'Lower Manhattan, NYC',
    hashtags: ['#floodrelief', '#emergency']
  },
  {
    id: '2',
    post: 'Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp',
    user: 'brooklyn_resident',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    verified: false,
    location: 'Brooklyn Heights, NYC',
    hashtags: ['#disasterhelp', '#shelter']
  },
  {
    id: '3',
    post: 'URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp',
    user: 'medical_volunteer',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false,
    location: '42nd Street, NYC',
    hashtags: ['#emergencyhelp', '#medical']
  },
  {
    id: '4',
    post: 'Earthquake felt in downtown area. Buildings shaking! #earthquake #help',
    user: 'downtown_witness',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false,
    location: 'Downtown',
    hashtags: ['#earthquake', '#help']
  },
  {
    id: '5',
    post: 'Fire spreading near residential area. Evacuations needed! #fire #evacuate',
    user: 'safety_alert',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false,
    location: 'Residential District',
    hashtags: ['#fire', '#evacuate']
  },
  {
    id: '6',
    post: 'Have extra blankets and warm clothes for disaster victims #donate #help',
    user: 'community_helper',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
    verified: false,
    location: 'Community Center',
    hashtags: ['#donate', '#help']
  }
];

/**
 * Fetch mock social media data with filtering
 */
const fetchMockSocialMediaData = async (keywords, disasterType) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredData = [...mockSocialMediaData];
    
    // Filter by keywords if provided
    if (keywords) {
      const keywordArray = keywords.toLowerCase().split(',').map(k => k.trim());
      filteredData = filteredData.filter(post => 
        keywordArray.some(keyword => 
          post.post.toLowerCase().includes(keyword) ||
          post.hashtags.some(hashtag => hashtag.toLowerCase().includes(keyword))
        )
      );
    }
    
    // Filter by disaster type if provided
    if (disasterType) {
      const type = disasterType.toLowerCase();
      filteredData = filteredData.filter(post => 
        post.post.toLowerCase().includes(type) ||
        post.hashtags.some(hashtag => hashtag.toLowerCase().includes(type))
      );
    }
    
    logger.info(`Mock social media data fetched: ${filteredData.length} posts`);
    return filteredData;
  } catch (error) {
    logger.error('Error fetching mock social media data:', error);
    throw error;
  }
};

/**
 * Process and prioritize social media data
 */
const processSocialMediaData = (data, keywords) => {
  const processed = data.map(post => {
    // Determine priority based on keywords and content
    let priority = 'low';
    const postText = post.post.toLowerCase();
    
    // Urgent keywords
    if (postText.includes('urgent') || postText.includes('sos') || 
        postText.includes('emergency') || postText.includes('evacuate')) {
      priority = 'urgent';
    }
    // High priority keywords  
    else if (postText.includes('need') || postText.includes('help') || 
             postText.includes('stranded') || postText.includes('trapped')) {
      priority = 'high';
    }
    // Medium priority keywords
    else if (postText.includes('offering') || postText.includes('volunteer') || 
             postText.includes('shelter') || postText.includes('donate')) {
      priority = 'medium';
    }

    return {
      ...post,
      priority,
      processed_at: new Date().toISOString(),
      relevance_score: calculateRelevanceScore(post, keywords)
    };
  });

  // Sort by priority and relevance
  return processed.sort((a, b) => {
    const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by relevance score
    return b.relevance_score - a.relevance_score;
  });
};

/**
 * Calculate relevance score based on keywords and content
 */
const calculateRelevanceScore = (post, keywords) => {
  if (!keywords) return 1;
  
  let score = 0;
  const keywordArray = keywords.toLowerCase().split(',').map(k => k.trim());
  const postText = post.post.toLowerCase();
  
  keywordArray.forEach(keyword => {
    // Higher score for exact matches in post content
    if (postText.includes(keyword)) score += 3;
    
    // Medium score for hashtag matches
    if (post.hashtags.some(hashtag => hashtag.toLowerCase().includes(keyword))) {
      score += 2;
    }
    
    // Lower score for location matches
    if (post.location && post.location.toLowerCase().includes(keyword)) {
      score += 1;
    }
  });
  
  return score;
};

/**
 * Simulate Twitter API call (placeholder for real implementation)
 */
const fetchTwitterData = async (query, count = 20) => {
  try {
    // This would be replaced with actual Twitter API call
    // const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
    //   headers: { 'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
    //   params: { query, max_results: count }
    // });
    
    logger.warn('Twitter API not implemented, using mock data');
    return await fetchMockSocialMediaData(query);
  } catch (error) {
    logger.error('Twitter API error:', error);
    throw error;
  }
};

/**
 * Simulate Bluesky API call (placeholder for real implementation)
 */
const fetchBlueskyData = async (query, count = 20) => {
  try {
    // This would be replaced with actual Bluesky API call
    // const response = await axios.get('https://bsky.social/xrpc/app.bsky.feed.searchPosts', {
    //   headers: { 'Authorization': `Bearer ${process.env.BLUESKY_ACCESS_TOKEN}` },
    //   params: { q: query, limit: count }
    // });
    
    logger.warn('Bluesky API not implemented, using mock data');
    return await fetchMockSocialMediaData(query);
  } catch (error) {
    logger.error('Bluesky API error:', error);
    throw error;
  }
};

/**
 * Main function to fetch social media data from available sources
 */
const fetchSocialMediaData = async (keywords, disasterType, limit = 20) => {
  try {
    let data = [];
    
    // Try Twitter API first
    if (process.env.TWITTER_BEARER_TOKEN) {
      try {
        data = await fetchTwitterData(keywords, limit);
      } catch (error) {
        logger.warn('Twitter API failed, trying alternatives');
      }
    }
    
    // Try Bluesky API if Twitter failed
    if (data.length === 0 && process.env.BLUESKY_ACCESS_TOKEN) {
      try {
        data = await fetchBlueskyData(keywords, limit);
      } catch (error) {
        logger.warn('Bluesky API failed, using mock data');
      }
    }
    
    // Fallback to mock data
    if (data.length === 0) {
      data = await fetchMockSocialMediaData(keywords, disasterType);
    }
    
    // Process and return the data
    return processSocialMediaData(data, keywords);
  } catch (error) {
    logger.error('Error fetching social media data:', error);
    // Return mock data as final fallback
    return processSocialMediaData(mockSocialMediaData, keywords);
  }
};

module.exports = {
  fetchSocialMediaData,
  fetchMockSocialMediaData,
  processSocialMediaData,
  calculateRelevanceScore
};













// const posts = [
//   {
//     id: '1',
//     post: '#floodrelief Need food and water in Lower Manhattan. Families stranded!',
//     user: 'citizen_helper1',
//     timestamp: new Date(Date.now() - 7200000).toISOString(),
//     priority: 'high',
//     verified: false
//   },
//   {
//     id: '2',
//     post: 'Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp',
//     user: 'brooklyn_resident',
//     timestamp: new Date(Date.now() - 3600000).toISOString(),
//     priority: 'medium',
//     verified: false
//   },
//   {
//     id: '3',
//     post: 'URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp',
//     user: 'medical_volunteer',
//     timestamp: new Date(Date.now() - 1800000).toISOString(),
//     priority: 'urgent',
//     verified: false
//   },
//   {
//     id: '4',
//     post: 'Earthquake felt in downtown area. Buildings shaking! #earthquake #help',
//     user: 'downtown_witness',
//     timestamp: new Date(Date.now() - 900000).toISOString(),
//     priority: 'urgent',
//     verified: false
//   },
//   {
//     id: '5',
//     post: 'Fire spreading near residential area. Evacuations needed! #fire #evacuate',
//     user: 'safety_alert',
//     timestamp: new Date(Date.now() - 2700000).toISOString(),
//     priority: 'urgent',
//     verified: false
//   },
//   {
//     id: '6',
//     post: 'Have extra blankets and warm clothes for disaster victims #donate #help',
//     user: 'community_helper',
//     timestamp: new Date(Date.now() - 10800000).toISOString(),
//     priority: 'low',
//     verified: false
//   }
// ]

// function score(p) {
//   const order = { urgent: 3, high: 2, medium: 1, low: 0 }
//   return order[p.priority] * -1
// }

// async function fetchSocialMediaData(keywords, disasterType, limit) {
//   let data = posts.slice()
//   if (keywords) {
//     const terms = keywords.toLowerCase().split(',').map(t => t.trim()).filter(Boolean)
//     data = data.filter(p =>
//       terms.some(t => p.post.toLowerCase().includes(t))
//     )
//   }
//   data.sort((a, b) => score(a) - score(b))
//   return data.slice(0, limit)
// }

// module.exports = { fetchSocialMediaData }
