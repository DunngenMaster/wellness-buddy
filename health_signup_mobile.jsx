import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';

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
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      const responseText = data.response || data.message || JSON.stringify(data);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.cards && Array.isArray(parsed.cards)) {
          return parsed;
        }
      } catch (e) {
        console.log('Response not in JSON format, using fallback');
      }
      
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
      console.error('Error calling AI webhook:', error);
      
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
  };

  // Helper function to get card colors
  const getCardColor = (color) => {
    const colors = {
      blue: '#3B82F6',
      green: '#10B981',
      orange: '#F59E0B',
      purple: '#8B5CF6',
      red: '#EF4444'
    };
    return colors[color] || colors.blue;
  };

  // Show insights screen
  if (showInsights && insightsData) {
    return (
      <ScrollView style={{ padding: 20, marginTop: 50 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
          Your Health Insights 🎯
        </Text>
        
        {insightsData.cards && insightsData.cards.map((card, index) => (
          <View key={index} style={[styles.insightCard, { borderLeftColor: getCardColor(card.color) }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
            
            <Text style={styles.cardInsight}>{card.insight}</Text>
            
            <View style={styles.actionContainer}>
              <Text style={styles.actionLabel}>💡 Action:</Text>
              <Text style={styles.actionText}>{card.action}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={goBackToProfile}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Back to Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Show existing profile
  if (showProfile && userProfile) {
    return (
      <ScrollView style={{ padding: 20, marginTop: 50 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
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
    <ScrollView style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
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
        
        <Text style={{ fontSize: 12, color: '#666', marginTop: 10, textAlign: 'center' }}>
          Demo: Uses sample Fitbit data to create profile
        </Text>
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
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  importButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
  },
  resetButton: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  profileContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  profileDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  goalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  goalItem: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  syncInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
          insightCard: {
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          marginBottom: 16,
          borderLeftWidth: 4,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
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
          color: '#1F2937',
          flex: 1,
        },
        cardInsight: {
          fontSize: 16,
          color: '#4B5563',
          lineHeight: 22,
          marginBottom: 12,
        },
        actionContainer: {
          backgroundColor: '#F3F4F6',
          padding: 12,
          borderRadius: 8,
        },
        actionLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: '#374151',
          marginBottom: 4,
        },
        actionText: {
          fontSize: 14,
          color: '#6B7280',
          lineHeight: 20,
        },
};
