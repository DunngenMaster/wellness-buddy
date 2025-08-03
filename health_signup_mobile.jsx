import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';

// Dummy Fitbit data - simulating real API response
const dummyFitbitData = {
  "user": {
    "name": "John Doe",
    "age": 32,
    "gender": "male",
    "weight": 75.5,
    "height": 175,
    "bmi": 24.7
  },
  "activity": {
    "steps": 8500,
    "calories": 2100,
    "activeMinutes": 45,
    "sleepHours": 7.2,
    "heartRate": {
      "resting": 62,
      "average": 72
    }
  },
  "goals": ["Improve Sleep", "Boost Energy"],
  "connectedApps": {
    "Fitbit": true,
    "Oura": false,
    "Apple Health": false
  }
};

export default function SignupScreen() {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [currentCardContext, setCurrentCardContext] = useState(null);
  const [activeChatCard, setActiveChatCard] = useState(null);
  const [showProductRecommendations, setShowProductRecommendations] = useState(false);
  const [productRecommendations, setProductRecommendations] = useState(null);
  const [timeLapseData, setTimeLapseData] = useState(null);

  // Load existing profile on app start
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // In a real app, this would read from local storage
      // For demo, we'll simulate checking if profile exists
      const existingProfile = localStorage.getItem('userProfile');
      if (existingProfile) {
        setUserProfile(JSON.parse(existingProfile));
        setShowProfile(true);
      }
    } catch (error) {
      console.log('No existing profile found');
    }
  };

  const saveUserProfile = async (profile) => {
    try {
      // Save to local storage (simulating local JSON file)
      localStorage.setItem('userProfile', JSON.stringify(profile));
      console.log('Profile saved successfully:', profile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const importFitbitData = async () => {
    setLoading(true);
    
    try {
      // Call our local Flask proxy server
      const response = await fetch('http://localhost:5001/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const apiData = await response.json();
      console.log('✅ Fitbit API Response:', apiData);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', response.headers);
      
      // Parse the API response and create user profile
      const userData = parseFitbitData(apiData);
      
      // Create complete user profile from real Fitbit data
      const completeProfile = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...userData,
        preferences: {
          notifications: true,
          weeklyReports: true,
          goalReminders: true
        },
        lastSync: new Date().toISOString()
      };

      // Save profile locally
      await saveUserProfile(completeProfile);
      
      // Save profile to server for demo persistence
      try {
        const serverResponse = await fetch('http://localhost:5001/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: completeProfile.id,
            profile: completeProfile
          })
        });
        
        if (serverResponse.ok) {
          const result = await serverResponse.json();
          console.log('✅ Profile saved to server:', result);
        } else {
          console.log('⚠️ Failed to save to server, but local storage works');
        }
      } catch (error) {
        console.log('⚠️ Server save failed, but local storage works:', error);
      }
      
      // Update state
      setUserProfile(completeProfile);
      setShowProfile(true);
      
      Alert.alert('Success', 'Profile created from real Fitbit data!');
      
    } catch (error) {
      console.error('❌ Error importing Fitbit data:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', 'Failed to import Fitbit data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse Fitbit data from API response
  const parseFitbitData = (apiData) => {
    try {
      console.log('Parsing Fitbit data:', apiData);
      
      // If API returns structured data, use it directly
      if (apiData.user && apiData.activity) {
        return apiData;
      }
      
      // Handle real Fitbit API response structure
      if (apiData.fullName || apiData.displayName || apiData.firstName) {
        console.log('Detected real Fitbit API response');
        
        // Calculate BMI from weight and height
        const weight = apiData.weight || 70;
        const height = (apiData.height || 170) / 100; // Convert cm to meters
        const bmi = height > 0 ? (weight / (height * height)).toFixed(1) : 24.2;
        
        // Get name from various possible fields
        const name = apiData.fullName || apiData.displayName || 
                    `${apiData.firstName || ''} ${apiData.lastName || ''}`.trim() || "User";
        
        // Get steps from various possible fields
        const steps = apiData.averageDailySteps || apiData.steps || apiData.dailySteps || 8000;
        
        // Estimate sleep hours (Fitbit API might not provide this directly)
        const sleepHours = apiData.sleepHours || apiData.sleep || 7.5;
        
        // Estimate heart rate (Fitbit API might not provide this directly)
        const restingHeartRate = apiData.restingHeartRate || 65;
        const averageHeartRate = apiData.averageHeartRate || 75;
        
        return {
          user: {
            name: name,
            age: apiData.age || 30,
            gender: apiData.gender || "unknown",
            weight: weight,
            height: apiData.height || 170,
            bmi: parseFloat(bmi)
          },
          activity: {
            steps: steps,
            calories: apiData.calories || 2000,
            activeMinutes: apiData.activeMinutes || 30,
            sleepHours: sleepHours,
            heartRate: {
              resting: restingHeartRate,
              average: averageHeartRate
            }
          },
          goals: apiData.goals || ["Improve Health", "Stay Active"],
          connectedApps: {
            Fitbit: true,
            Oura: false,
            "Apple Health": false
          }
        };
      }
      
      // If API returns different structure, try to map it
      if (apiData.profile || apiData.data) {
        const data = apiData.profile || apiData.data;
        return {
          user: {
            name: data.name || data.userName || "User",
            age: data.age || 30,
            gender: data.gender || "unknown",
            weight: data.weight || 70,
            height: data.height || 170,
            bmi: data.bmi || 24.2
          },
          activity: {
            steps: data.steps || data.dailySteps || 8000,
            calories: data.calories || data.dailyCalories || 2000,
            activeMinutes: data.activeMinutes || 30,
            sleepHours: data.sleepHours || data.sleep || 7.5,
            heartRate: {
              resting: data.restingHeartRate || 65,
              average: data.averageHeartRate || 75
            }
          },
          goals: data.goals || ["Improve Health", "Stay Active"],
          connectedApps: {
            Fitbit: true,
            Oura: false,
            "Apple Health": false
          }
        };
      }
      
      // If API returns raw data, try to extract information
      if (typeof apiData === 'string') {
        // Try to parse JSON string
        try {
          const parsed = JSON.parse(apiData);
          return parseFitbitData(parsed);
        } catch {
          // If it's not JSON, try to extract data using regex
          const stepsMatch = apiData.match(/steps[:\s]+(\d+)/i);
          const sleepMatch = apiData.match(/sleep[:\s]+(\d+(?:\.\d+)?)/i);
          const nameMatch = apiData.match(/name[:\s]+([^\n,]+)/i);
          
          return {
            user: {
              name: nameMatch ? nameMatch[1].trim() : "User",
              age: 30,
              gender: "unknown",
              weight: 70,
              height: 170,
              bmi: 24.2
            },
            activity: {
              steps: stepsMatch ? parseInt(stepsMatch[1]) : 8000,
              calories: 2000,
              activeMinutes: 30,
              sleepHours: sleepMatch ? parseFloat(sleepMatch[1]) : 7.5,
              heartRate: {
                resting: 65,
                average: 75
              }
            },
            goals: ["Improve Health", "Stay Active"],
            connectedApps: {
              Fitbit: true,
              Oura: false,
              "Apple Health": false
            }
          };
        }
      }
      
      // Fallback to dummy data if parsing fails
      console.log('Using fallback data structure - no recognizable format found');
      return dummyFitbitData;
      
    } catch (error) {
      console.error('Error parsing Fitbit data:', error);
      return dummyFitbitData;
    }
  };

  const resetProfile = () => {
    try {
      localStorage.removeItem('userProfile');
      setUserProfile(null);
      setShowProfile(false);
      setShowInsights(false);
      setInsightsData(null);
      Alert.alert('Success', 'Profile reset successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset profile.');
    }
  };

  const getClaudeInsights = async (profile) => {
    console.log('=== STARTING CLAUDE INSIGHTS GENERATION ===');
    console.log('User profile:', profile);
    
    try {
      // Create structured prompt for card-friendly insights
      const structuredPrompt = `Generate exactly 3 health insight cards for this user profile. 

USER DATA:
- Name: ${profile.user.name}
- Age: ${profile.user.age}
- BMI: ${profile.user.bmi}
- Daily Steps: ${profile.activity.steps}
- Sleep Hours: ${profile.activity.sleepHours}
- Heart Rate: ${profile.activity.heartRate.resting} bpm
- Goals: ${profile.goals.join(', ')}

REQUIRED FORMAT - Return ONLY valid JSON with exactly 3 cards:
{
  "cards": [
    {
      "title": "Card Title (max 30 chars)",
      "icon": "emoji icon",
      "category": "fitness|sleep|nutrition|general",
      "insight": "Main insight (max 100 chars)",
      "action": "Specific action to take (max 80 chars)",
      "color": "blue|green|orange|purple|red"
    },
    {
      "title": "Card Title (max 30 chars)", 
      "icon": "emoji icon",
      "category": "fitness|sleep|nutrition|general",
      "insight": "Main insight (max 100 chars)",
      "action": "Specific action to take (max 80 chars)",
      "color": "blue|green|orange|purple|red"
    },
    {
      "title": "Card Title (max 30 chars)",
      "icon": "emoji icon", 
      "category": "fitness|sleep|nutrition|general",
      "insight": "Main insight (max 100 chars)",
      "action": "Specific action to take (max 80 chars)",
      "color": "blue|green|orange|purple|red"
    }
  ]
}

Make insights personalized, actionable, and card-friendly. Focus on the user's specific data and goals.`;
      
      const sessionId = `session_${Date.now()}`;
      
      console.log('Making API call to Claude webhook...');
      console.log('Request payload:', {
        chatinput: structuredPrompt,
        sessionId: sessionId,
        fitbit_session: `User: ${profile.user.name}, Steps: ${profile.activity.steps}, Sleep: ${profile.activity.sleepHours}h, BMI: ${profile.user.bmi}`
      });
      
      // Make API call to your webhook
      const response = await fetch('https://healthstuffentreprenerufi.app.n8n.cloud/webhook/a7717fe9-5fe8-42bd-a0d1-6a52cf884c9f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatinput: structuredPrompt,
          sessionId: sessionId,
          fitbit_session: `User: ${profile.user.name}, Steps: ${profile.activity.steps}, Sleep: ${profile.activity.sleepHours}h, BMI: ${profile.user.bmi}`
        })
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API Response:', data);
      
      // Handle the actual API response format (array with output field)
      let responseText = '';
      if (Array.isArray(data) && data[0] && data[0].output) {
        responseText = data[0].output;
        console.log('Extracted output from array:', responseText);
      } else if (data.response) {
        responseText = data.response;
      } else if (data.message) {
        responseText = data.message;
      } else {
        responseText = JSON.stringify(data);
      }
      
      console.log('Response text to parse:', responseText);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(responseText);
        console.log('Parsed JSON:', parsed);
        if (parsed.cards && Array.isArray(parsed.cards)) {
          console.log('Parsed cards:', parsed.cards);
          return parsed;
        }
      } catch (e) {
        console.log('JSON parsing failed:', e.message);
        console.log('Response not in JSON format, using fallback');
      }
      
      console.log('=== USING FALLBACK CARDS ===');
      console.log('JSON parsing failed, using hardcoded fallback cards');
      
      // Fallback to structured cards if JSON parsing fails
      return {
        cards: [
          {
            title: "Step Up Your Game",
            icon: "👟",
            category: "fitness",
            insight: `You're at ${profile.activity.steps} steps today. Great progress toward your 10,000 goal!`,
            action: "Take a 15-minute walk to reach your daily target",
            color: "blue"
          },
          {
            title: "Sleep Optimization",
            icon: "😴",
            category: "sleep", 
            insight: `${profile.activity.sleepHours} hours of sleep. You're close to the recommended 7-9 hours.`,
            action: "Go to bed 30 minutes earlier tonight",
            color: "purple"
          },
          {
            title: "Heart Health",
            icon: "❤️",
            category: "general",
            insight: `Resting heart rate of ${profile.activity.heartRate.resting} bpm shows good cardiovascular fitness.`,
            action: "Keep up your current activity level",
            color: "green"
          }
        ]
      };
      
    } catch (error) {
      console.error('=== ERROR CALLING AI WEBHOOK ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Fallback to basic structured cards
      return {
        cards: [
          {
            title: "Daily Steps Goal",
            icon: "👟",
            category: "fitness",
            insight: `Current: ${profile.activity.steps} steps. Target: 10,000 steps daily.`,
            action: "Add a 20-minute walk to your routine",
            color: "blue"
          },
          {
            title: "Sleep Quality",
            icon: "😴",
            category: "sleep",
            insight: `${profile.activity.sleepHours} hours of sleep. Aim for 7-9 hours for optimal health.`,
            action: "Create a relaxing bedtime routine",
            color: "purple"
          },
          {
            title: "Health Summary",
            icon: "📊",
            category: "general",
            insight: `BMI: ${profile.user.bmi}. You're on track with your health goals!`,
            action: "Continue your current healthy habits",
            color: "green"
          }
        ]
      };
    }
  };

  const generateInsights = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const insights = await getClaudeInsights(userProfile);
      console.log(insights)
      setInsightsData(insights);
      setShowInsights(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate insights.');
    } finally {
      setLoading(false);
    }
  };

  const goBackToProfile = () => {
    setShowInsights(false);
    setInsightsData(null);
    setShowChat(false);
    setChatMessages([]);
    setCurrentCardContext(null);
    setActiveChatCard(null);
  };

  const goBackToCards = () => {
    setShowChat(false);
    setChatMessages([]);
    setCurrentCardContext(null);
    // Keep showInsights and insightsData so we return to the cards view
    // Keep activeChatCard to show which card was active
  };

  const generateProductRecommendations = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      console.log('=== STARTING PRODUCT RECOMMENDATIONS ===');
      
      // Step 1: Generate new time-lapsed health data
      const newHealthData = generateTimeLapsedData(userProfile);
      console.log('New time-lapsed data:', newHealthData);
      
      // Step 2: Update user profile with new data
      const updatedProfile = {
        ...userProfile,
        ...newHealthData,
        lastSync: new Date().toISOString()
      };
      
      // Step 3: Save updated profile
      await saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      
      // Step 4: Get product recommendations based on changes
      const recommendations = await getProductRecommendations(updatedProfile, userProfile);
      setProductRecommendations(recommendations);
      setTimeLapseData(newHealthData);
      setShowProductRecommendations(true);
      
      console.log('Product recommendations completed successfully');
      
    } catch (error) {
      console.error('Product recommendations failed:', error);
      Alert.alert('Error', 'Failed to get product recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startChatSession = (cardContext = null) => {
    setShowChat(true);
    setCurrentCardContext(cardContext);
    setActiveChatCard(cardContext); // Track which card is active
    
    let initialMessage;
    
    if (cardContext) {
      // Start chat with specific card context
      initialMessage = {
        id: Date.now(),
        type: 'assistant',
        text: `Hi ${userProfile.user.name}! 👋 I'm here to help you with "${cardContext.title}". ${cardContext.insight} ${cardContext.action} What specific questions do you have about this?`,
        timestamp: new Date().toISOString()
      };
    } else {
      // General chat session
      initialMessage = {
        id: Date.now(),
        type: 'assistant',
        text: `Hi ${userProfile.user.name}! 👋 I'm your AI health assistant. I can see you have ${userProfile.activity.steps} steps today, ${userProfile.activity.sleepHours} hours of sleep, and a BMI of ${userProfile.user.bmi}. How can I help you with your health goals today?`,
        timestamp: new Date().toISOString()
      };
    }
    
    setChatMessages([initialMessage]);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Create context from user profile, card context, and chat history
      let chatContext = `You are a helpful AI health assistant. User Profile: ${userProfile.user.name}, Age: ${userProfile.user.age}, BMI: ${userProfile.user.bmi}, Steps: ${userProfile.activity.steps}, Sleep: ${userProfile.activity.sleepHours}h, Goals: ${userProfile.goals.join(', ')}. Recent chat: ${chatMessages.slice(-3).map(m => `${m.type}: ${m.text}`).join(' | ')}. User's current question: ${userMessage.text}. Please provide a helpful, personalized response based on the user's health data.`;
      
      // Add card context if available
      if (currentCardContext) {
        chatContext = `FOCUS AREA: ${currentCardContext.title} - ${currentCardContext.insight} - ${currentCardContext.action}. ` + chatContext;
      }

      console.log('Sending chat context to API:', chatContext);

      const response = await fetch('https://healthstuffentreprenerufi.app.n8n.cloud/webhook/a7717fe9-5fe8-42bd-a0d1-6a52cf884c9f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatinput: chatContext,
          sessionId: `chat_${Date.now()}`,
          fitbit_session: `Chat session for ${userProfile.user.name}`
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Chat API Response:', data);
      
      // Try different response formats
      let aiResponse = "I'm here to help with your health questions!";
      
      // Handle array response with output field (actual API format)
      if (Array.isArray(data) && data[0] && data[0].output) {
        try {
          const outputData = JSON.parse(data[0].output);
          aiResponse = outputData.response || outputData.message || outputData.text || data[0].output;
        } catch (e) {
          console.log('Failed to parse output JSON, using raw output');
          aiResponse = data[0].output;
        }
      } else if (data.response) {
        aiResponse = data.response;
      } else if (data.message) {
        aiResponse = data.message;
      } else if (data.text) {
        aiResponse = data.text;
      } else if (data.content) {
        aiResponse = data.content;
      } else if (typeof data === 'string') {
        aiResponse = data;
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        aiResponse = data.choices[0].message.content;
      } else {
        // If none of the expected formats, try to extract from the full response
        console.log('Unexpected response format, trying to extract text...');
        aiResponse = JSON.stringify(data);
        // If it's too long, truncate it
        if (aiResponse.length > 500) {
          aiResponse = aiResponse.substring(0, 500) + "...";
        }
      }

      console.log('Final AI Response:', aiResponse);

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: aiResponse,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: "I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper function to get card colors - matching the new palette
  const getCardColor = (color) => {
    const colors = {
      blue: '#4fd1c7',    // Teal
      green: '#22c55e',   // Green
      orange: '#f59e0b',  // Orange
      purple: '#06b6d4',  // Cyan
      red: '#ef4444'      // Red
    };
    return colors[color] || colors.blue;
  };

  // Generate realistic time-lapsed health data
  const generateTimeLapsedData = (currentProfile) => {
    const changes = {
      activity: {
        steps: Math.max(0, currentProfile.activity.steps + Math.floor(Math.random() * 2000) - 1000), // ±1000 steps
        sleepHours: Math.max(4, Math.min(12, currentProfile.activity.sleepHours + (Math.random() - 0.5) * 2)), // ±1 hour
        heartRate: {
          resting: Math.max(50, Math.min(100, currentProfile.activity.heartRate.resting + Math.floor(Math.random() * 10) - 5)) // ±5 bpm
        }
      },
      user: {
        weight: Math.max(40, Math.min(150, currentProfile.user.weight + (Math.random() - 0.5) * 2)), // ±1 kg
        height: currentProfile.user.height, // Height usually doesn't change
        age: currentProfile.user.age + 1, // Age increases by 1 year
        bmi: 0 // Will be calculated
      }
    };
    
    // Recalculate BMI
    changes.user.bmi = (changes.user.weight / Math.pow(changes.user.height / 100, 2)).toFixed(1);
    
    return changes;
  };

  // Get product recommendations based on health changes
  const getProductRecommendations = async (newProfile, oldProfile) => {
    try {
      console.log('Getting product recommendations...');
      
      const changes = {
        stepsChange: newProfile.activity.steps - oldProfile.activity.steps,
        sleepChange: newProfile.activity.sleepHours - oldProfile.activity.sleepHours,
        weightChange: newProfile.user.weight - oldProfile.user.weight,
        heartRateChange: newProfile.activity.heartRate.resting - oldProfile.activity.heartRate.resting,
        bmiChange: parseFloat(newProfile.user.bmi) - parseFloat(oldProfile.user.bmi)
      };
      
      console.log('Health changes detected:', changes);
      
      const prompt = `Based on these health changes over time, recommend 3 specific products that would help improve the user's health:

HEALTH CHANGES:
- Steps: ${oldProfile.activity.steps} → ${newProfile.activity.steps} (${changes.stepsChange > 0 ? '+' : ''}${changes.stepsChange})
- Sleep: ${oldProfile.activity.sleepHours}h → ${newProfile.activity.sleepHours}h (${changes.sleepChange > 0 ? '+' : ''}${changes.sleepChange.toFixed(1)}h)
- Weight: ${oldProfile.user.weight}kg → ${newProfile.user.weight}kg (${changes.weightChange > 0 ? '+' : ''}${changes.weightChange.toFixed(1)}kg)
- Heart Rate: ${oldProfile.activity.heartRate.resting}bpm → ${newProfile.activity.heartRate.resting}bpm (${changes.heartRateChange > 0 ? '+' : ''}${changes.heartRateChange})
- BMI: ${oldProfile.user.bmi} → ${newProfile.user.bmi} (${changes.bmiChange > 0 ? '+' : ''}${changes.bmiChange.toFixed(1)})

USER PROFILE: ${newProfile.user.name}, Age: ${newProfile.user.age}, Goals: ${newProfile.goals.join(', ')}

REQUIRED FORMAT - Return ONLY valid JSON:
{
  "products": [
    {
      "name": "Product Name",
      "category": "fitness|sleep|nutrition|monitoring",
      "description": "Brief description (max 100 chars)",
      "benefit": "Specific health benefit (max 80 chars)",
      "price": "$XX-XXX",
      "icon": "emoji"
    },
    {
      "name": "Product Name",
      "category": "fitness|sleep|nutrition|monitoring", 
      "description": "Brief description (max 100 chars)",
      "benefit": "Specific health benefit (max 80 chars)",
      "price": "$XX-XXX",
      "icon": "emoji"
    },
    {
      "name": "Product Name",
      "category": "fitness|sleep|nutrition|monitoring",
      "description": "Brief description (max 100 chars)", 
      "benefit": "Specific health benefit (max 80 chars)",
      "price": "$XX-XXX",
      "icon": "emoji"
    }
  ]
}

Recommend products that address the specific health changes and user goals.`;

      const response = await fetch('https://healthstuffentreprenerufi.app.n8n.cloud/webhook/a7717fe9-5fe8-42bd-a0d1-6a52cf884c9f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatinput: prompt,
          sessionId: `products_${Date.now()}`,
          fitbit_session: `Product recommendations for ${newProfile.user.name}`
        })
      });

      if (!response.ok) {
        throw new Error(`Product API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Product API Response:', data);
      
      // Handle the same response format as insights
      let responseText = '';
      if (Array.isArray(data) && data[0] && data[0].output) {
        responseText = data[0].output;
      } else if (data.response) {
        responseText = data.response;
      } else if (data.message) {
        responseText = data.message;
      } else {
        responseText = JSON.stringify(data);
      }
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.products && Array.isArray(parsed.products)) {
          return parsed;
        }
      } catch (e) {
        console.log('Product response not in JSON format, using fallback');
      }
      
      // Fallback to basic product recommendations
      return {
        products: [
          {
            name: "Smart Fitness Tracker",
            category: "fitness",
            description: "Advanced activity monitoring with heart rate tracking",
            benefit: "Improve step count and fitness motivation",
            price: "$150-300",
            icon: "⌚"
          },
          {
            name: "Sleep Optimization Pillow",
            category: "sleep",
            description: "Ergonomic pillow designed for better sleep quality",
            benefit: "Enhance sleep duration and quality",
            price: "$80-150",
            icon: "🛏️"
          },
          {
            name: "Nutrition Planning App",
            category: "nutrition",
            description: "Personalized meal plans and calorie tracking",
            benefit: "Support weight management goals",
            price: "$10-20/month",
            icon: "📱"
          }
        ]
      };
      
    } catch (error) {
      console.error('Product recommendations failed:', error);
      return null;
    }
  };

  // Show chat screen
  if (showChat) {
    return (
      <View style={{ flex: 1, marginTop: 50, backgroundColor: '#0f1419' }}>
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderContent}>
            <Text style={styles.chatHeaderTitle}>
              💬 AI Health Assistant
              {currentCardContext && (
                <Text style={styles.chatHeaderSubtitle}>
                  {'\n'}Focus: {currentCardContext.title}
                </Text>
              )}
            </Text>
          </View>
          <View style={styles.chatHeaderButtons}>
            {currentCardContext && (
              <TouchableOpacity onPress={goBackToCards} style={styles.backToCardsButton}>
                <Text style={styles.backToCardsButtonText}>← Cards</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={goBackToProfile} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.chatContainer}
          ref={(ref) => {
            if (ref) {
              setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
            }
          }}
        >
          {chatMessages.map((message) => (
            <View key={message.id} style={[
              styles.messageContainer,
              message.type === 'user' ? styles.userMessage : styles.assistantMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.type === 'user' ? styles.userMessageText : styles.assistantMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
          
          {chatLoading && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>AI is typing</Text>
                <Text style={styles.typingDots}>...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask me about your health..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !chatInput.trim() && styles.sendButtonDisabled]} 
            onPress={sendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show product recommendations screen
  if (showProductRecommendations && productRecommendations && timeLapseData) {
    return (
      <ScrollView style={{ padding: 20, marginTop: 50, backgroundColor: '#0f1419', flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#4fd1c7' }}>
          🛍️ Personalized Product Recommendations
        </Text>
        
        {/* Health Changes Summary */}
        <View style={styles.changesContainer}>
          <Text style={styles.changesTitle}>Health Analysis:</Text>
          <View style={styles.changeItem}>
            <Text style={styles.changeLabel}>Steps:</Text>
            <Text style={styles.changeValue}>
              {userProfile.activity.steps} → {userProfile.activity.steps + timeLapseData.activity.steps - userProfile.activity.steps}
            </Text>
          </View>
          <View style={styles.changeItem}>
            <Text style={styles.changeLabel}>Sleep:</Text>
            <Text style={styles.changeValue}>
              {userProfile.activity.sleepHours}h → {timeLapseData.activity.sleepHours.toFixed(1)}h
            </Text>
          </View>
          <View style={styles.changeItem}>
            <Text style={styles.changeLabel}>Weight:</Text>
            <Text style={styles.changeValue}>
              {userProfile.user.weight}kg → {timeLapseData.user.weight.toFixed(1)}kg
            </Text>
          </View>
          <View style={styles.changeItem}>
            <Text style={styles.changeLabel}>Heart Rate:</Text>
            <Text style={styles.changeValue}>
              {userProfile.activity.heartRate.resting}bpm → {timeLapseData.activity.heartRate.resting}bpm
            </Text>
          </View>
        </View>

        {/* Product Recommendations */}
        <Text style={styles.recommendationsTitle}>Recommended Products:</Text>
        
        {productRecommendations.products && productRecommendations.products.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productIcon}>{product.icon}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
            
            <Text style={styles.productDescription}>{product.description}</Text>
            
            <View style={styles.benefitContainer}>
              <Text style={styles.benefitLabel}>💡 Benefit:</Text>
              <Text style={styles.benefitText}>{product.benefit}</Text>
            </View>
            
            <TouchableOpacity style={styles.buyButton}>
              <Text style={styles.buyButtonText}>🛒 Buy Now</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => {
            setShowProductRecommendations(false);
            setProductRecommendations(null);
            setTimeLapseData(null);
          }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Back to Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Show insights screen
  if (showInsights && insightsData) {
    return (
      <ScrollView style={{ padding: 20, marginTop: 50, backgroundColor: '#0f1419', flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#4fd1c7' }}>
          Your Health Insights 🎯
        </Text>
        
        {insightsData.cards && insightsData.cards.map((card, index) => (
          <View key={index} style={[styles.insightCard, { borderLeftColor: getCardColor(card.color) }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
              {activeChatCard && activeChatCard.title === card.title && (
                <View style={styles.activeChatIndicator}>
                  <Text style={styles.activeChatText}>💬 Active</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.cardInsight}>{card.insight}</Text>
            
            <View style={styles.actionContainer}>
              <Text style={styles.actionLabel}>💡 Action:</Text>
              <Text style={styles.actionText}>{card.action}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.cardChatButton, { backgroundColor: getCardColor(card.color) }]} 
              onPress={() => startChatSession(card)}
            >
              <Text style={styles.cardChatButtonText}>
                {activeChatCard && activeChatCard.title === card.title ? '💬 Continue Chat' : '💬 Chat about this'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.chatButton]} onPress={() => startChatSession()}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              💬 General Chat
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={goBackToProfile}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Back to Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Show existing profile
  if (showProfile && userProfile) {
    return (
      <ScrollView style={{ padding: 20, marginTop: 50, backgroundColor: '#0f1419', flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#4fd1c7' }}>
          Welcome Back! 👋
        </Text>
        
        <View style={styles.profileContainer}>
          <Text style={styles.profileName}>{userProfile.user.name}</Text>
          <Text style={styles.profileDetails}>
            Age: {userProfile.user.age} • Weight: {userProfile.user.weight}kg • Height: {userProfile.user.height}cm
          </Text>
          <Text style={styles.profileDetails}>
            BMI: {userProfile.user.bmi} • Daily Steps: {userProfile.activity.steps}
          </Text>
          <Text style={styles.profileDetails}>
            Sleep: {userProfile.activity.sleepHours}h • Heart Rate: {userProfile.activity.heartRate.resting} bpm
          </Text>
          
          <Text style={styles.goalsTitle}>Health Goals:</Text>
          {userProfile.goals.map((goal, index) => (
            <Text key={index} style={styles.goalItem}>• {goal}</Text>
          ))}
          
          <Text style={styles.syncInfo}>
            Last synced: {new Date(userProfile.lastSync).toLocaleDateString()}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={generateInsights}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                Generating Insights...
              </Text>
            </View>
          ) : (
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Get AI Health Insights
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.refreshButton, loading && styles.buttonDisabled]} 
          onPress={generateProductRecommendations}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            🛍️ Get Product Recommendations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetProfile}>
          <Text style={{ color: '#ff4444', textAlign: 'center', fontWeight: 'bold' }}>
            Reset Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Show import screen
  return (
    <ScrollView style={{ padding: 20, marginTop: 50, backgroundColor: '#0f1419', flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#4fd1c7' }}>
        Welcome to Wellness Buddy 🏥
      </Text>

      <View style={styles.importSection}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
          Quick Setup
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
          Connect your Fitbit to automatically create your health profile
        </Text>
        
        <TouchableOpacity 
          style={[styles.importButton, loading && styles.buttonDisabled]} 
          onPress={importFitbitData}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                Creating Your Profile...
              </Text>
            </View>
          ) : (
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              📱 Import from Fitbit
            </Text>
          )}
        </TouchableOpacity>
     
      </View>

      <View style={styles.infoSection}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          What We'll Import:
        </Text>
        <Text style={styles.infoItem}>• Personal info (name, age, gender)</Text>
        <Text style={styles.infoItem}>• Physical data (weight, height, BMI)</Text>
        <Text style={styles.infoItem}>• Activity metrics (steps, sleep, heart rate)</Text>
        <Text style={styles.infoItem}>• Health goals and preferences</Text>
      </View>
    </ScrollView>
  );
}

const styles = {
  importSection: {
    backgroundColor: '#1a2332',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4fd1c7',
  },
  importButton: {
    backgroundColor: '#4fd1c7',
    padding: 15,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
  },
  button: {
    backgroundColor: '#4fd1c7',
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
  },
  resetButton: {
    backgroundColor: '#1a2332',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  refreshButton: {
    backgroundColor: '#f59e0b',
    padding: 15,
    marginTop: 15,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: '#0f1419',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: '#1a2332',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4fd1c7',
  },
  infoItem: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 5,
  },
  profileContainer: {
    backgroundColor: '#1a2332',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4fd1c7',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#4fd1c7',
  },
  profileDetails: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 5,
    textAlign: 'center',
  },
  goalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    color: '#4fd1c7',
  },
  goalItem: {
    fontSize: 16,
    color: '#4fd1c7',
    marginBottom: 5,
    textAlign: 'center',
  },
  syncInfo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 15,
    textAlign: 'center',
  },
          insightCard: {
          backgroundColor: '#1a2332',
          padding: 20,
          borderRadius: 12,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderWidth: 1,
          borderColor: '#4fd1c7',
          shadowColor: '#4fd1c7',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        cardIcon: {
          fontSize: 24,
          marginRight: 12,
        },
        cardTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#4fd1c7',
          flex: 1,
        },
        cardInsight: {
          fontSize: 16,
          color: '#94a3b8',
          lineHeight: 22,
          marginBottom: 12,
        },
        actionContainer: {
          backgroundColor: '#0f1419',
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#4fd1c7',
        },
        actionLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: '#4fd1c7',
          marginBottom: 4,
        },
        actionText: {
          fontSize: 14,
          color: '#94a3b8',
          lineHeight: 20,
        },
        buttonContainer: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 20,
        },
        chatButton: {
          backgroundColor: '#8B5CF6',
          flex: 1,
        },
        chatHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          backgroundColor: '#1a2332',
          borderBottomWidth: 1,
          borderBottomColor: '#4fd1c7',
        },
        chatHeaderTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#4fd1c7',
        },
        chatHeaderContent: {
          flex: 1,
        },
        chatHeaderSubtitle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#94a3b8',
        },
        chatHeaderButtons: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        backToCardsButton: {
          backgroundColor: '#3B82F6',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
        },
        backToCardsButtonText: {
          color: 'white',
          fontSize: 14,
          fontWeight: '600',
        },
        closeButton: {
          padding: 8,
        },
        closeButtonText: {
          fontSize: 20,
          color: '#94a3b8',
        },
        chatContainer: {
          flex: 1,
          padding: 15,
        },
        messageContainer: {
          marginBottom: 15,
          maxWidth: '80%',
        },
        userMessage: {
          alignSelf: 'flex-end',
          backgroundColor: '#4fd1c7',
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        assistantMessage: {
          alignSelf: 'flex-start',
          backgroundColor: '#1a2332',
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: '#4fd1c7',
        },
        messageText: {
          fontSize: 16,
          lineHeight: 22,
        },
        userMessageText: {
          color: '#0f1419',
        },
        assistantMessageText: {
          color: '#94a3b8',
        },
        messageTime: {
          fontSize: 12,
          color: '#64748b',
          marginTop: 4,
          textAlign: 'right',
        },
        typingIndicator: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        typingText: {
          fontSize: 14,
          color: '#94a3b8',
          fontStyle: 'italic',
        },
        typingDots: {
          fontSize: 16,
          color: '#94a3b8',
          marginLeft: 4,
        },
        chatInputContainer: {
          flexDirection: 'row',
          padding: 15,
          backgroundColor: '#1a2332',
          borderTopWidth: 1,
          borderTopColor: '#4fd1c7',
          alignItems: 'flex-end',
        },
        chatInput: {
          flex: 1,
          backgroundColor: '#0f1419',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginRight: 10,
          maxHeight: 100,
          borderWidth: 1,
          borderColor: '#4fd1c7',
          fontSize: 16,
          color: '#94a3b8',
        },
        sendButton: {
          backgroundColor: '#4fd1c7',
          borderRadius: 20,
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        },
        sendButtonDisabled: {
          backgroundColor: '#64748b',
        },
        sendButtonText: {
          fontSize: 16,
        },
        cardChatButton: {
          marginTop: 12,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          alignItems: 'center',
        },
        cardChatButtonText: {
          color: 'white',
          fontSize: 14,
          fontWeight: '600',
        },
        activeChatIndicator: {
          backgroundColor: '#10B981',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          marginLeft: 'auto',
        },
        activeChatText: {
          color: 'white',
          fontSize: 12,
          fontWeight: '600',
        },
        changesContainer: {
          backgroundColor: '#1a2332',
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#4fd1c7',
        },
        changesTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#4fd1c7',
          marginBottom: 15,
          textAlign: 'center',
        },
        changeItem: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        },
        changeLabel: {
          fontSize: 16,
          color: '#94a3b8',
          fontWeight: '600',
        },
        changeValue: {
          fontSize: 16,
          color: '#4fd1c7',
          fontWeight: 'bold',
        },
        recommendationsTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#4fd1c7',
          marginBottom: 15,
          textAlign: 'center',
        },
        productCard: {
          backgroundColor: '#1a2332',
          padding: 20,
          borderRadius: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#f59e0b',
        },
        productHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        productIcon: {
          fontSize: 24,
          marginRight: 12,
        },
        productName: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#f59e0b',
          flex: 1,
        },
        productPrice: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#22c55e',
        },
        productDescription: {
          fontSize: 14,
          color: '#94a3b8',
          lineHeight: 20,
          marginBottom: 12,
        },
        benefitContainer: {
          backgroundColor: '#0f1419',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#f59e0b',
        },
        benefitLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: '#f59e0b',
          marginBottom: 4,
        },
        benefitText: {
          fontSize: 14,
          color: '#94a3b8',
          lineHeight: 18,
        },
        buyButton: {
          backgroundColor: '#f59e0b',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 8,
          alignItems: 'center',
        },
        buyButtonText: {
          color: '#0f1419',
          fontSize: 16,
          fontWeight: 'bold',
        },
};
