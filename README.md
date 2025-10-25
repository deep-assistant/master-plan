# master-plan

The repository to host:
* [issues](https://github.com/deep-assistant/master-plan/issues) that related to entire organization;
* [community discussions](https://github.com/deep-assistant/master-plan/discussions).

## Architecture Documentation

Detailed architecture documentation for each project:

- **[api-gateway](https://github.com/deep-assistant/api-gateway/blob/main/ARCHITECTURE.md)** - OpenAI-compatible API gateway with multi-provider failover
- **[telegram-bot](https://github.com/deep-assistant/telegram-bot/blob/main/ARCHITECTURE.md)** - Dual-language Telegram bot (Python/JavaScript)
- **[GPTutor](https://github.com/deep-assistant/GPTutor/blob/main/ARCHITECTURE.md)** - Multi-platform educational AI (VK/Telegram mini apps)
- **[web-capture](https://github.com/deep-assistant/web-capture/blob/main/ARCHITECTURE.md)** - Web page capture microservice (HTML/Markdown/PNG)

# End Goal / Mission

* Personal AI assistant that is available at any your device and can be hosted on your hardware or on in the cloud with easy migrations and synchronization between them.

# [ROADMAP](https://github.com/deep-assistant/master-plan/issues/4)
### 🚀 **STAGE 1: Quick Improvements**

- [ ] **1. Error Message Clarity**
    - **Task:** Make standard error messages more user-friendly to improve feedback during failures.
    - **Link:** [#46](https://github.com/deep-assistant/telegram-bot/issues/46)
    - **Priority:** High | **Complexity:** Low

- [ ] **2. Model Descriptions**
    - **Task:** Add detailed descriptions for each model so users understand their capabilities and differences.
    - **Link:** [#43](https://github.com/deep-assistant/telegram-bot/issues/43)
    - **Priority:** High | **Complexity:** Low

- [ ] **3. Brand Names**
    - **Task:** Ensure accurate use of brand names.
    - **Link:** [#44](https://github.com/deep-assistant/telegram-bot/issues/44)
    - **Priority:** Medium | **Complexity:** Low

- [ ] **4. GUID in Errors**
    - **Task:** Show user GUID in error messages.
    - **Link:** [#69](https://github.com/deep-assistant/telegram-bot/issues/69)
    - **Priority:** Medium | **Complexity:** Low

- [ ] **5. Execution Time Estimation**
    - **Task:** Implement automatic request time calculation.
    - **Link:** [#58](https://github.com/deep-assistant/telegram-bot/issues/58)
    - **Priority:** Medium | **Complexity:** Low

---

### 🎯 **STAGE 2: Critical Functions**

- [ ] **6. Rate Limit**
    - **Task:** Implement request rate limiting.
    - **Link:** [#17](https://github.com/deep-assistant/telegram-bot/issues/17)
    - **Priority:** Critical | **Complexity:** Medium

- [ ] **7. CI/CD Setup**
    - **Task:** Automate build, testing, and deployment.
    - **Link:** [#13](https://github.com/deep-assistant/telegram-bot/issues/13)
    - **Priority:** Critical | **Complexity:** High

- [ ] **8. Webhook Support**
    - **Task:** Switch to using Telegram webhooks.
    - **Link:** [#61](https://github.com/deep-assistant/telegram-bot/issues/61)
    - **Priority:** High | **Complexity:** Medium

- [ ] **9. Unique Error Messages**
    - **Task:** Handle each error with a unique message.
    - **Link:** [#45](https://github.com/deep-assistant/telegram-bot/issues/45)
    - **Priority:** High | **Complexity:** Medium

---

### 🔧 **STAGE 3: User Experience Improvements**

- [ ] **10. "Continue" Button**
    - **Task:** Add a button for convenient dialog or generation resumption.
    - **Link:** [#87](https://github.com/deep-assistant/telegram-bot/issues/87)
    - **Priority:** High | **Complexity:** Medium

- [ ] **11. Custom System Messages**
    - **Task:** Allow users to set their own system prompts.
    - **Link:** [#14](https://github.com/deep-assistant/telegram-bot/issues/14)
    - **Priority:** High | **Complexity:** Medium

- [ ] **12. Context Management**
    - **Task:** Save and switch dialog contexts.
    - **Link:** [#78](https://github.com/deep-assistant/telegram-bot/issues/78)
    - **Priority:** High | **Complexity:** High

- [ ] **13. Context Switching (General/Personal)**
    - **Task:** Allow context switching capability.
    - **Link:** [#81](https://github.com/deep-assistant/telegram-bot/issues/81)
    - **Priority:** High | **Complexity:** Medium

- [ ] **14. Context Cleanup**
    - **Task:** Ask user about context cleanup during inactivity.
    - **Link:** [#41](https://github.com/deep-assistant/telegram-bot/issues/41)
    - **Priority:** Medium | **Complexity:** Medium

- [ ] **15. Input Timeout**
    - **Task:** Implement timeout and prompt deletion during inactivity.
    - **Link:** [#75](https://github.com/deep-assistant/telegram-bot/issues/75)
    - **Priority:** Medium | **Complexity:** Medium

---

### 🌐 **STAGE 4: Functionality Expansion**

- [ ] **16. Web Search Support**
    - **Task:** Add web search to provide current information.
    - **Link:** [#52](https://github.com/deep-assistant/telegram-bot/issues/52)
    - **Priority:** High | **Complexity:** High

- [ ] **17. Filename from URL**
    - **Task:** Automatically extract filename from generation URL.
    - **Link:** [#60](https://github.com/deep-assistant/telegram-bot/issues/60)
    - **Priority:** Medium | **Complexity:** Medium

- [ ] **18. PNG Support for Background Removal**
    - **Task:** Add PNG support.
    - **Link:** [#40](https://github.com/deep-assistant/telegram-bot/issues/40)
    - **Priority:** Medium | **Complexity:** Low

- [ ] **19. Multi-Message Mode**
    - **Task:** Process multiple messages as one request.
    - **Link:** [#16](https://github.com/deep-assistant/telegram-bot/issues/16)
    - **Priority:** Medium | **Complexity:** Medium

- [ ] **20. Multiple Audio Processing**
    - **Task:** Improve simultaneous audio message processing.
    - **Link:** [#50](https://github.com/deep-assistant/telegram-bot/issues/50)
    - **Priority:** Medium | **Complexity:** Medium

---

### 🤖 **STAGE 5: New Models and Modes**

- [ ] **21. Grok Integration**
    - **Task:** Integrate the new "grok" model.
    - **Link:** [#84](https://github.com/deep-assistant/telegram-bot/issues/84)
    - **Priority:** High | **Complexity:** Medium

- [ ] **22. GPT-5 Integration**
    - **Task:** Integrate GPT-5 model.
    - **Link:** [#83](https://github.com/deep-assistant/telegram-bot/issues/83)
    - **Priority:** High | **Complexity:** Medium

- [ ] **23. "Express Responses" Mode**
    - **Task:** Add mode for fast request processing.
    - **Link:** [#89](https://github.com/deep-assistant/telegram-bot/issues/89)
    - **Priority:** Medium | **Complexity:** Medium

- [ ] **24. "Lawyer" Mode**
    - **Task:** Add system message for legal consultations.
    - **Link:** [#51](https://github.com/deep-assistant/telegram-bot/issues/51)
    - **Priority:** Medium | **Complexity:** Low

- [ ] **25. Suno Return**
    - **Task:** Restore integration with Suno music model.
    - **Link:** [#80](https://github.com/deep-assistant/telegram-bot/issues/80)
    - **Priority:** Medium | **Complexity:** Medium

---

### 🎬 **STAGE 6: Multimedia and Generation**

- [ ] **26. Video Generation**
    - **Task:** Implement video generation support.
    - **Link:** [#79](https://github.com/deep-assistant/telegram-bot/issues/79)
    - **Priority:** Medium | **Complexity:** High

---

### 🌍 **STAGE 7: Internationalization and Social Features**

- [ ] **27. Bot Translation**
    - **Task:** Translate bot to English and other languages.
    - **Link:** [#38](https://github.com/deep-assistant/telegram-bot/issues/38), [#20](https://github.com/deep-assistant/telegram-bot/issues/20)
    - **Priority:** High | **Complexity:** High

- [ ] **28. Referral Notifications**
    - **Task:** Set up immediate notification when bot is activated by another user.
    - **Link:** [#66](https://github.com/deep-assistant/telegram-bot/issues/66)
    - **Priority:** Medium | **Complexity:** Medium

---

### 📊 **STAGE 8: Analytics and Monitoring**

- [ ] **29. Statistics**
    - **Task:** Develop statistics collection and display system.
    - **Link:** [#90](https://github.com/deep-assistant/telegram-bot/issues/90)
    - **Priority:** Medium | **Complexity:** High

- [ ] **30. Smart API Priority**
    - **Task:** Implement smart priority system for API requests.
    - **Link:** [#85](https://github.com/deep-assistant/telegram-bot/issues/85)
    - **Priority:** Medium | **Complexity:** High

---

### ⚡ **STAGE 9: Advanced Features**

- [ ] **31. Reminder System**
    - **Task:** Develop reminder system within the bot.
    - **Link:** [#88](https://github.com/deep-assistant/telegram-bot/issues/88)
    - **Priority:** Medium | **Complexity:** High

- [ ] **32. All Messages Reading Mode**
    - **Task:** Analyze every message in group chat.
    - **Link:** [#82](https://github.com/deep-assistant/telegram-bot/issues/82)
    - **Priority:** Low | **Complexity:** High

- [ ] **33. Repository in Context**
    - **Task:** Add ability to pass repository to context.
    - **Link:** [#24](https://github.com/deep-assistant/telegram-bot/issues/24)
    - **Priority:** Medium | **Complexity:** High

- [ ] **34. Bug Bot**
    - **Task:** Develop "Bug Bot" for sending error reports.
    - **Link:** [#86](https://github.com/deep-assistant/telegram-bot/issues/86)
    - **Priority:** Medium | **Complexity:** Medium

---

### 💰 **STAGE 10: Monetization**

- [ ] **35. User Payment Model**
    - **Task:** Implement customizable payment model.
    - **Link:** [#18](https://github.com/deep-assistant/telegram-bot/issues/18)
    - **Priority:** Medium | **Complexity:** High

- [ ] **36. "Energy Points" Transfer**
    - **Task:** Allow users to transfer internal currency.
    - **Link:** [#22](https://github.com/deep-assistant/telegram-bot/issues/22)
    - **Priority:** Low | **Complexity:** High

---

### 📄 **STAGE 11: Documentation and Agreements**

- [ ] **37. Agreement on GitHub Pages**
    - **Task:** Move user agreement to GitHub Pages.
    - **Link:** [#12](https://github.com/deep-assistant/telegram-bot/issues/12)
    - **Priority:** Low | **Complexity:** Low

---

### 🏗️ **STAGE 12: Infrastructure and API (Master Plan)**

- [ ] **38. Web-capture Microservice**
    - **Task:** Make web-capture microservice work as expected and integrate it with Telegram bot
    - **Link:** [#10](https://github.com/deep-assistant/master-plan/issues/10)
    - **Priority:** Medium | **Complexity:** High

- [ ] **39. OpenAI Responses API Standard Support**
    - **Task:** Support OpenAI Responses API standard
    - **Link:** [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
    - **Priority:** High | **Complexity:** Medium

- [ ] **40. OpenAPI Specification**
    - **Task:** Provide OpenAPI YAML and JSON specification for all our APIs
    - **Link:** [OpenAPI](https://www.openapis.org)
    - **Priority:** Medium | **Complexity:** Medium

- [ ] **41. Cursor Support via API Gateway**
    - **Task:** Support Cursor through our API Gateway for OpenAI models
    - **Link:** [#8](https://github.com/deep-assistant/master-plan/issues/8)
    - **Priority:** High | **Complexity:** High

---

### 📱 **STAGE 13: Multi-platform**

- [ ] **42. VK Bot**
    - **Task:** Create VK bot (based on https://vk.com/gptutor) in addition to VK mini app
    - **Link:** [#1](https://github.com/deep-assistant/master-plan/issues/1)
    - **Priority:** Medium | **Complexity:** High

- [ ] **43. Web Application**
    - **Task:** Create web application (accessible from browser)
    - **Link:** [#2](https://github.com/deep-assistant/master-plan/issues/2)
    - **Priority:** High | **Complexity:** Very High

- [ ] **44. VS Code and GitHub Copilot Integration**
    - **Task:** Integrate open-source VS Code and open-source GitHub Copilot in browser as developer mode in web app
    - **Link:** [#9](https://github.com/deep-assistant/master-plan/issues/9)
    - **Priority:** Medium | **Complexity:** Very High

- [ ] **45. Desktop Application (Electron)**
    - **Task:** Create standalone desktop application (macOS, Linux, Windows)
    - **Link:** [#3](https://github.com/deep-assistant/master-plan/issues/3)
    - **Priority:** Medium | **Complexity:** Very High

- [ ] **46. iOS/iPadOS Application**
    - **Task:** Create standalone iOS/iPadOS application in App Store
    - **Link:** [#5](https://github.com/deep-assistant/master-plan/issues/5)
    - **Priority:** Medium | **Complexity:** Very High

- [ ] **47. Android Application**
    - **Task:** Create standalone Android application in Google Play
    - **Link:** [#6](https://github.com/deep-assistant/master-plan/issues/6)
    - **Priority:** Medium | **Complexity:** Very High
