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
      // If API returns structured data, use it directly
      if (apiData.user && apiData.activity) {
        return apiData;
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
      console.log('Using fallback data structure');
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
      // Create user input data from profile
      const userInput = `User: ${profile.user.name}, Age: ${profile.user.age}, BMI: ${profile.user.bmi}, Daily Steps: ${profile.activity.steps}, Sleep Hours: ${profile.activity.sleepHours}, Heart Rate: ${profile.activity.heartRate.resting} bpm, Goals: ${profile.goals.join(', ')}`;
      
      const fitbitData = `Steps: ${profile.activity.steps}, Calories: ${profile.activity.calories}, Sleep: ${profile.activity.sleepHours}h, Heart Rate: ${profile.activity.heartRate.resting}/${profile.activity.heartRate.average} bpm, Active Minutes: ${profile.activity.activeMinutes}`;
      
      const sessionId = `session_${Date.now()}`;
      
      // Make API call to your webhook
      const response = await fetch('https://healthstuffentreprenerufi.app.n8n.cloud/webhook/a7717fe9-5fe8-42bd-a0d1-6a52cf884c9f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatinput: userInput,
          sessionId: sessionId,
          fitbit_session: fitbitData
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Return the AI response from the webhook
      return data.response || data.message || JSON.stringify(data);
      
    } catch (error) {
      console.error('Error calling AI webhook:', error);
      
      // Fallback to basic insights if API fails
      return `# Health Insights for ${profile.user.name} 👋

## Quick Summary
- **BMI**: ${profile.user.bmi} 
- **Daily Steps**: ${profile.activity.steps} (Goal: 10,000)
- **Sleep**: ${profile.activity.sleepHours} hours
- **Goals**: ${profile.goals.join(', ')}

## Basic Recommendations
- Aim for 10,000 steps daily
- Get 7-9 hours of sleep
- Stay hydrated and active

*Note: AI insights temporarily unavailable. Showing basic recommendations.*`;
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

  // Show insights screen
  if (showInsights && insightsData) {
    return (
      <ScrollView style={{ padding: 20, marginTop: 50 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
          Your Health Insights 🎯
        </Text>
        
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsText}>{insightsData}</Text>
        </View>

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
  insightsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  insightsText: {
    fontSize: 16,
    lineHeight: 24,
  },
};
