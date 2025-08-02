Wellness Buddy
Wellness Buddy is a personalized health coach that translates complex personal health data—such as Fitbit, Oura, and bloodwork—into clear, actionable guidance. Whether it's optimizing sleep, reducing stress, or selecting the right supplements and workouts, Wellness Buddy helps users make informed, daily health decisions grounded in real data.

Problem Statement
Many individuals collect a wealth of health information from wearables and lab tests but lack the expertise or guidance to turn it into meaningful action. Wellness Buddy solves this problem by offering daily, personalized recommendations tailored to the user’s unique health profile and goals.

Key Features
1. Guided Onboarding
Users sign up and provide personal data such as age, weight, and fitness goals.

Health data is synced via APIs (e.g., Fitbit, Oura) using n8n.

Anthropic Claude generates a personalized baseline plan based on this input.

2. Daily Triggered Recommendations
Intelligent triggers assess your real-time health state (e.g., stress level, sleep quality).

Claude responds with specific suggestions (e.g., meditation after poor sleep or hydration after high stress).

Each recommendation includes contextual reasoning and links to dive deeper into the rationale.

3. Product Suggestions Engine
Smart product recommendations based on user goals and health conditions.

Products are tied to specific needs such as sleep, focus, or recovery.

Minimum commercial product (MCP) includes links to trusted supplements or fitness gear.

Experience Flow
Happy Path: From sign-up to daily suggestions and behavior tracking, the user experiences a seamless, data-driven wellness journey.

Failure Recovery: If data sources are unavailable or goals are incomplete, fallback prompts and logic ensure continuity in guidance.

Evaluation Metrics: Built-in evaluation logic measures adherence, outcome effectiveness, and user engagement to refine future suggestions.

Architecture & Tools
Frontend: React Native mobile application for iOS and Android.

Data Sync & Automation: n8n for workflow orchestration and API integration.

AI Engine: Anthropic Claude for reasoning, prompt generation, and recommendation logic.

Core Capabilities: Prompt scaffolding, agent memory, dynamic decision trees, and outcome tracking.

Repository
GitHub: https://github.com/DunngenMaster/wellness-buddy

