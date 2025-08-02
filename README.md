# Health Signup App with AI Insights 🏥

A React Native mobile application that collects user health information and provides personalized AI-powered health insights using Claude AI.

## Features

- 📱 **Mobile-First Design**: Built with React Native and Expo
- 🤖 **AI Health Insights**: Personalized recommendations using Claude AI
- 📊 **Health Profile Creation**: Comprehensive health data collection
- 🎯 **Goal-Based Recommendations**: Tailored advice for specific health goals
- 📱 **Health App Integration**: Support for Fitbit, Oura, Apple Health, and more
- ⚡ **Real-time BMI Calculation**: Automatic BMI analysis and categorization

## Tech Stack

- **Frontend**: React Native
- **Framework**: Expo SDK 53
- **AI Integration**: Claude AI (simulated for demo)
- **UI Components**: React Native Picker, Switch, ActivityIndicator
- **Styling**: React Native StyleSheet

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (optional) or Android Emulator (optional)
- Expo Go app on your phone

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd health-signup-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Install Expo Go on your phone
   - Scan the QR code displayed in the terminal
   - Or press `i` for iOS Simulator or `a` for Android Emulator

## Project Structure

```
health-signup-app/
├── App.js                 # Main app entry point
├── health_signup_mobile.jsx  # Main health signup component
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

## Features in Detail

### Health Profile Collection
- Personal information (name, age, gender)
- Physical measurements (weight, height)
- Health goals selection
- Health app integrations

### AI-Powered Insights
- Personalized greeting using user's name
- BMI calculation and analysis
- Goal-specific recommendations
- Lifestyle change suggestions
- Next steps for health journey

### User Experience
- Form validation
- Loading states
- Visual feedback for selections
- Responsive design
- Error handling

## API Integration

The app currently uses a mock Claude AI response for demonstration purposes. To integrate with the actual Claude API:

1. Replace the `getClaudeInsights` function in `health_signup_mobile.jsx`
2. Add your Claude API key to environment variables
3. Implement proper error handling for API calls

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run web` - Start in web browser

### Branch Structure

- `main` - Production-ready code
- `frontend` - Frontend development branch
- `feature/*` - Feature-specific branches

## Contributing

1. Create a feature branch from `frontend`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Real Claude AI API integration
- [ ] Backend server for data persistence
- [ ] User authentication
- [ ] Progress tracking
- [ ] Push notifications
- [ ] Social features
- [ ] Advanced analytics dashboard 