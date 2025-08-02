import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const goalsList = [
  'Improve Sleep',
  'Boost Energy',
  'Fat Loss',
  'Build Muscle',
  'Longevity',
];

const integrationsList = ['Fitbit', 'Oura', 'Apple Health', 'Bloodwork Upload'];

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    goals: [],
    integrations: {},
  });
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  const toggleGoal = (goal) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const toggleIntegration = (integration) => {
    setFormData((prev) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [integration]: !prev.integrations[integration],
      },
    }));
  };

  const calculateBMI = (weight, height) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getClaudeInsights = async (userData) => {
    const bmi = calculateBMI(parseFloat(userData.weight), parseFloat(userData.height));
    
    const prompt = `You are a personalized health coach. Based on the following user profile, provide actionable health insights and recommendations:

User Profile:
- Name: ${userData.name}
- Age: ${userData.age} years old
- Gender: ${userData.gender}
- Weight: ${userData.weight} kg
- Height: ${userData.height} cm
- BMI: ${bmi}
- Health Goals: ${userData.goals.join(', ')}
- Connected Health Apps: ${Object.keys(userData.integrations).filter(key => userData.integrations[key]).join(', ') || 'None'}

Please provide:
1. A personalized greeting
2. BMI analysis and what it means
3. Specific recommendations for their health goals
4. Suggested lifestyle changes
5. Next steps to get started

Keep the response friendly, encouraging, and actionable. Format it nicely with clear sections.`;

    try {
      // For demo purposes, we'll simulate Claude's response
      // In a real app, you'd call the actual Claude API here
      const mockResponse = `# Welcome to Your Health Journey, ${userData.name}! 👋

## Your Health Profile Summary
- **BMI**: ${bmi} (${bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese'})
- **Age Group**: ${userData.age < 30 ? 'Young Adult' : userData.age < 50 ? 'Adult' : 'Senior'}

## Personalized Recommendations

### 🎯 For Your Goals: ${userData.goals.join(', ')}

**Improve Sleep:**
- Establish a consistent sleep schedule (7-9 hours)
- Create a relaxing bedtime routine
- Avoid screens 1 hour before bed
- Keep your bedroom cool and dark

**Boost Energy:**
- Start with 30 minutes of daily exercise
- Eat protein-rich breakfasts
- Stay hydrated (8 glasses of water daily)
- Take short walks during the day

**Fat Loss:**
- Create a 300-500 calorie daily deficit
- Focus on whole foods and lean proteins
- Include strength training 2-3x per week
- Track your progress consistently

### 📱 Health App Integration
${Object.keys(userData.integrations).filter(key => userData.integrations[key]).length > 0 
  ? `Great! You're connected to: ${Object.keys(userData.integrations).filter(key => userData.integrations[key]).join(', ')}. Use these to track your progress.`
  : 'Consider connecting health apps to better track your progress and get more personalized insights.'}

## 🚀 Next Steps
1. Set up your daily routine
2. Start tracking your meals and exercise
3. Schedule a follow-up in 2 weeks
4. Join our community for support

You're on the right track! Small changes lead to big results. 🌟`;

      return mockResponse;
    } catch (error) {
      console.error('Error getting insights:', error);
      throw new Error('Failed to get health insights');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.age || !formData.weight || !formData.height) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const healthInsights = await getClaudeInsights(formData);
      setInsights(healthInsights);
      setShowInsights(true);
      console.log('User submitted:', formData);
    } catch (error) {
      Alert.alert('Error', 'Failed to get health insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      weight: '',
      height: '',
      gender: 'male',
      goals: [],
      integrations: {},
    });
    setInsights(null);
    setShowInsights(false);
  };

  if (showInsights && insights) {
    return (
      <ScrollView style={{ padding: 20, marginTop: 50 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
          Your Health Insights 🎯
        </Text>
        
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsText}>{insights}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={resetForm}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Start Over
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Create Your Health Profile</Text>

      <Text>Name</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Enter your name"
      />

      <Text>Age</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={formData.age}
        onChangeText={(text) => setFormData({ ...formData, age: text })}
        placeholder="Enter your age"
      />

      <Text>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={formData.weight}
        onChangeText={(text) => setFormData({ ...formData, weight: text })}
        placeholder="Enter your weight in kg"
      />

      <Text>Height (cm)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={formData.height}
        onChangeText={(text) => setFormData({ ...formData, height: text })}
        placeholder="Enter your height in cm"
      />

      <Text>Gender</Text>
      <Picker
        selectedValue={formData.gender}
        onValueChange={(itemValue) => setFormData({ ...formData, gender: itemValue })}
        style={{ marginBottom: 20 }}
      >
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Other" value="other" />
      </Picker>

      <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Health Goals</Text>
      {goalsList.map((goal) => (
        <TouchableOpacity key={goal} onPress={() => toggleGoal(goal)}>
          <Text style={{ 
            paddingVertical: 8, 
            color: formData.goals.includes(goal) ? '#007AFF' : 'black',
            fontWeight: formData.goals.includes(goal) ? 'bold' : 'normal'
          }}>
            {formData.goals.includes(goal) ? '✓ ' : '○ '}{goal}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={{ fontWeight: 'bold', marginTop: 20 }}>Connect Health Data</Text>
      {integrationsList.map((integration) => (
        <View key={integration} style={styles.switchRow}>
          <Text>{integration}</Text>
          <Switch
            value={formData.integrations[integration] || false}
            onValueChange={() => toggleIntegration(integration)}
          />
        </View>
      ))}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Getting Your Insights...
            </Text>
          </View>
        ) : (
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Get AI Health Insights
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    marginTop: 30,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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
