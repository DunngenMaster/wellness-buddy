## Challenge Overview

Modern health data is scattered across wearables (Fitbit, Oura), blood tests, and various wellness tools. Most users, even with access to rich data streams, **do not know how to translate their metrics into daily improved action**. The gap: guidance that is truly personal, actionable, and adapts as you live your life.

**This app solves that gap by:**

- Aggregating real-time data from multiple health sources.
- Allowing users to set goals and track their biometrics holistically.
- Delivering AI-powered, context-aware recommendations for daily improvements.
- Providing smart product and supplement suggestions based on evolving needs.
- Enabling feedback and learning loops for continuous individualization.

## Architecture and Agent Logic

## High-Level Flow

1. **Onboarding & Data Link**
    - Users sign up, create profiles (age, weight, height, goals).
    - Connect external data: Fitbit [future - Oura, bloodwork uploads, etc] and store in Flash.
    - [future] All sources sync via n8n workflows to unified backend.
2. **Data Pipeline & Storage**
    - We are fitting the Fitbit data through Python Script and sending it to the webhook of n8n.
    - **n8n** fetches/watches data from each service (e.g., Fitbit API, Oura API, OCR for bloodwork).
    - Fitbit data is updated when Fitbit app is opened
    - [future] Data is normalized and stored in a secure database.
    - [future] A periodic poller tracks latest info (sleep, activity, stress metrics, etc.).
3. **AI Recommendation Engine**
    - Triggers occur on defined events (poor sleep, high stress, nutritional deficiency, etc.).
    - User state, data, and goals are dynamically summarized as prompts for Claude (Anthropic AI).
    - Claude analyzes context and responds with *plain-language suggestions* and *justifications*.
    - We are using olamma model with RAG pipeline to process 1800 research papers based on nutrition and longevity and giving user suggestions based on this.
4. **Mobile App (React Native)**
    - Consumes unified data and recommendations via secure API.
    - Presents a card-based feed of AI-driven actionable advice (with icons, metrics, clear CTA).
    - Explanation modals (“Why am I seeing this?”) provide transparency.
    - UI supports light/dark mode, is color-coded per context (e.g., blue for sleep, red for stress).
    - Feedback UX allows thumbs up/down, “show me more like this”, and product rating to inform future recs.
5. **[future] Product Recommendation**
    - Backend tags products to health issues and trends (e.g., Vitamin D supplements if deficiency detected).
    - Marketplace links for seamless education and potential purchase.
6. **[future] User Feedback Loop**
    - All user responses are logged.
    - The AI adapts to preferences and outcomes, becoming more precise and personal over time.

## Agent/Logic Summary

- **Sync Agent:** Uses n8n to continuously unify and update all health data streams.
- **Trigger Logic:** Watches for thresholds or trend changes (e.g., “Less than 6 hours of sleep” or “SpO₂ dips below 94%”).
- **AI Prompt Generator:** Assembles most recent data, goals, and user history into context-rich prompts for Claude.
- **Recommendation Agent:** Requests tailored actions, explanations, and—when relevant—curated product suggestions via Claude’s LLM.
- **Feedback & Learning Agent:** Tracks user responses and adapts future triggers for even higher relevance.

## Why This Matters

This project **empowers people to act on health data—automatically and holistically**—via a seamless, AI-driven assistant, closing the loop between information and life-changing action.

*Thank you for reviewing our hackathon project! We welcome your feedback and hope to help more users live their healthiest lives, every day.*
