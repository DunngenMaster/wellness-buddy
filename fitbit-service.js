// Fitbit API Integration Service
// This file demonstrates how to integrate with Fitbit API for real data import

class FitbitService {
  constructor() {
    this.clientId = process.env.FITBIT_CLIENT_ID;
    this.clientSecret = process.env.FITBIT_CLIENT_SECRET;
    this.redirectUri = process.env.FITBIT_REDIRECT_URI;
    this.baseUrl = 'https://api.fitbit.com/1';
  }

  // Step 1: Get authorization URL for user to connect their Fitbit account
  getAuthorizationUrl() {
    const scope = 'profile activity heartrate sleep weight';
    return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scope}&expires_in=604800`;
  }

  // Step 2: Exchange authorization code for access token
  async getAccessToken(authorizationCode) {
    try {
      const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: this.redirectUri
        })
      });

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Step 3: Get user profile data
  async getUserProfile(accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/user/-/profile.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      return {
        name: `${data.user.firstName} ${data.user.lastName}`,
        age: this.calculateAge(data.user.dateOfBirth),
        gender: data.user.gender,
        weight: data.user.weight,
        height: data.user.height
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Step 4: Get activity data
  async getActivityData(accessToken, date = 'today') {
    try {
      const response = await fetch(`${this.baseUrl}/user/-/activities/date/${date}.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      return {
        steps: data.summary.steps,
        calories: data.summary.caloriesOut,
        activeMinutes: data.summary.veryActiveMinutes + data.summary.fairlyActiveMinutes,
        distance: data.summary.distances[0]?.distance || 0
      };
    } catch (error) {
      console.error('Error getting activity data:', error);
      throw error;
    }
  }

  // Step 5: Get sleep data
  async getSleepData(accessToken, date = 'today') {
    try {
      const response = await fetch(`${this.baseUrl}/user/-/sleep/date/${date}.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      return {
        sleepHours: data.summary.totalMinutesAsleep / 60,
        sleepEfficiency: data.summary.efficiency,
        sleepStages: data.summary.stages
      };
    } catch (error) {
      console.error('Error getting sleep data:', error);
      throw error;
    }
  }

  // Step 6: Get heart rate data
  async getHeartRateData(accessToken, date = 'today') {
    try {
      const response = await fetch(`${this.baseUrl}/user/-/activities/heart/date/${date}/1d.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      return {
        restingHeartRate: data['activities-heart'][0]?.value?.restingHeartRate,
        heartRateZones: data['activities-heart'][0]?.value?.heartRateZones
      };
    } catch (error) {
      console.error('Error getting heart rate data:', error);
      throw error;
    }
  }

  // Main function to get all user data
  async getAllUserData(accessToken) {
    try {
      const [profile, activity, sleep, heartRate] = await Promise.all([
        this.getUserProfile(accessToken),
        this.getActivityData(accessToken),
        this.getSleepData(accessToken),
        this.getHeartRateData(accessToken)
      ]);

      return {
        user: {
          ...profile,
          bmi: this.calculateBMI(profile.weight, profile.height)
        },
        activity,
        sleep,
        heartRate,
        goals: this.suggestGoals(activity, sleep, heartRate),
        connectedApps: {
          Fitbit: true,
          Oura: false,
          Apple Health: false
        }
      };
    } catch (error) {
      console.error('Error getting all user data:', error);
      throw error;
    }
  }

  // Helper functions
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  }

  suggestGoals(activity, sleep, heartRate) {
    const goals = [];
    
    // Suggest goals based on data
    if (sleep.sleepHours < 7) {
      goals.push('Improve Sleep');
    }
    
    if (activity.steps < 10000) {
      goals.push('Boost Energy');
    }
    
    if (activity.calories > 2500) {
      goals.push('Fat Loss');
    }
    
    if (heartRate.restingHeartRate > 70) {
      goals.push('Improve Sleep');
      goals.push('Boost Energy');
    }
    
    // Default goals if none suggested
    if (goals.length === 0) {
      goals.push('Maintain Health', 'Longevity');
    }
    
    return goals;
  }
}

// Example usage in your React Native app:
/*
import FitbitService from './fitbit-service';

const fitbitService = new FitbitService();

// In your component:
const handleFitbitConnect = async () => {
  try {
    // 1. Redirect user to Fitbit authorization
    const authUrl = fitbitService.getAuthorizationUrl();
    // Open this URL in a web view or browser
    
    // 2. After user authorizes, you'll get an authorization code
    const accessToken = await fitbitService.getAccessToken(authorizationCode);
    
    // 3. Get all user data
    const userData = await fitbitService.getAllUserData(accessToken);
    
    // 4. Pre-populate your form
    setFormData({
      name: userData.user.name,
      age: userData.user.age.toString(),
      weight: userData.user.weight.toString(),
      height: userData.user.height.toString(),
      gender: userData.user.gender,
      goals: userData.goals,
      integrations: userData.connectedApps
    });
    
  } catch (error) {
    console.error('Error connecting to Fitbit:', error);
  }
};
*/

export default FitbitService; 