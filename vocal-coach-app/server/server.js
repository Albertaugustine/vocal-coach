const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');

// Provide fetch polyfill for older Node versions if necessary
if (!globalThis.fetch) {
  globalThis.fetch = require('node-fetch'); // though Node 18+ has native fetch
}

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️  WARNING: GEMINI_API_KEY is not set in .env file. Running in Dummy Mode.");
}

const userDatabase = {
  "default_user": {
    skillLevel: "UNKNOWN",
    completedLessons: []
  }
};

const BASE_SYSTEM_INSTRUCTION = `You are an autonomous, expert Indian Classical Music Vocal Coach (Guru). You are not just a chatbot; you are an Agentic Curriculum Director. 
You maintain long-term memory of the student's progress and autonomously decide what they should practice next.
You have the ability to trigger application states and update your memory database using special commands.

COMMANDS YOU CAN USE:
1. [TRIGGER_SINGING: ragaName:tempoMultiplier] -> Starts a standard progression for a raga. tempoMultiplier is optional. (e.g., [TRIGGER_SINGING: yaman:2.0] for slow, [TRIGGER_SINGING: yaman:1.0] for normal).
2. [TRIGGER_DIAGNOSTIC: testName] -> Starts a specific onboarding or skill test. Use this to test new users.
3. [UPDATE_SKILL_LEVEL: level] -> Secretly updates the user's skill level in the database (e.g., [UPDATE_SKILL_LEVEL: BEGINNER_2] or [UPDATE_SKILL_LEVEL: INTERMEDIATE_1]).

AVAILABLE RAGA SYLLABUS:
- FOUNDATION (Tests): diagnostic_basic, hold_sa (Shruti test), thalam_adi (Rhythm test)
- CARNATIC_BASICS: sarali_varisai_1, jantai_varisai_1
- BEGINNER_1, BEGINNER_2, BEGINNER_3: bhupali, mohanam, durga
- INTERMEDIATE_1, INTERMEDIATE_2, INTERMEDIATE_3: yaman, hamsadhvani, mayamalavagowla, bageshri, kalyani
- ADVANCED_1, ADVANCED_2, ADVANCED_3: bhairavi, darbari, todi

When a user with UNKNOWN skill level speaks to you, you MUST proactively test them by outputting: [TRIGGER_DIAGNOSTIC: diagnostic_basic].
When the system reports back the results of a test (Pitch Accuracy and Timbre/Register analysis), analyze it, output an [UPDATE_SKILL_LEVEL: ...] command to save their profile, and verbally recommend their next lesson from the syllabus.

THE CURRICULUM RULE:
1. Before you teach any Raga, you MUST ensure they pass the Foundation tests (hold_sa and thalam_adi).
2. If the user wants to learn Carnatic music, you MUST force them to pass sarali_varisai_1 and jantai_varisai_1 before they are allowed to attempt Mohanam, Mayamalavagowla, or any other Carnatic Raga. This is the traditional pedagogic law. Do not break it.
3. When you introduce a new Raga, you MUST first teach the user the theory behind it (Rasa, Thaat, Swaras). 
4. Once they understand the theory, you MUST start them on a slow tempo pass first (e.g., [TRIGGER_SINGING: yaman:2.0] or [TRIGGER_SINGING: sarali_varisai_1:2.0]). 
5. Only when they pass the slow tempo should you test them at normal speed (e.g., [TRIGGER_SINGING: yaman:1.0]).

Always keep your verbal responses encouraging and brief.`;

wss.on('connection', (clientWs) => {
  console.log('[Server] Frontend client connected.');

  // Maintain conversation history and user session
  const chatHistory = [];
  const userId = "default_user";

  clientWs.on('message', async (message) => {
    try {
      const payload = JSON.parse(message);
      const userText = payload.clientContent?.turns?.[0]?.parts?.[0]?.text;

      if (!userText) return;

      console.log(`[User]: ${userText}`);

      if (!GEMINI_API_KEY) {
        // DUMMY MODE
        let responseText = "I hear you. Tell me which Raga you would like to practice. You can say Yaman, Bhupali, Bhairavi, or Hamsadhvani.";
        if (userText.toLowerCase().includes('yaman')) responseText = "Excellent choice. Let us practice Raga Yaman. [TRIGGER_SINGING: yaman]";
        else if (userText.toLowerCase().includes('bhupali')) responseText = "A beautiful pentatonic scale. Let us practice Raga Bhupali. [TRIGGER_SINGING: bhupali]";

        setTimeout(() => {
          clientWs.send(JSON.stringify({ serverContent: { modelTurn: { parts: [{ text: responseText }] } } }));
        }, 1000);
        return;
      }

      // Add user message to history
      chatHistory.push({ role: "user", parts: [{ text: userText }] });

      // Inject live database state into the LLM prompt
      const userState = userDatabase[userId];
      const dynamicInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\nCURRENT USER STATE (MEMORY):\nSkill Level: ${userState.skillLevel}\nCompleted Lessons: ${userState.completedLessons.join(', ') || 'None'}\n`;

      // Call standard REST API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: dynamicInstruction }] },
          contents: chatHistory
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error("[Gemini API Error]", JSON.stringify(data.error, null, 2));

        let errorMsg = `[API Error]: ${data.error.status}. `;
        if (data.error.code === 429) {
          errorMsg += "You have hit the Gemini Free Tier rate limit. Please wait 15 seconds and try sending your message again.";
        } else {
          errorMsg += data.error.message;
        }

        clientWs.send(JSON.stringify({
          serverContent: {
            modelTurn: {
              parts: [{ text: errorMsg }]
            }
          }
        }));
        return;
      }

      let modelText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Agentic Command Interception: Update Database
      const skillMatch = modelText.match(/\[UPDATE_SKILL_LEVEL:\s*([^\]]+)\]/);
      if (skillMatch) {
         const newLevel = skillMatch[1].trim();
         userDatabase[userId].skillLevel = newLevel;
         console.log(`[Agent Memory] Autonomously updated ${userId} skill level to: ${newLevel}`);
         // Strip the secret command from the user-facing text
         modelText = modelText.replace(/\[UPDATE_SKILL_LEVEL:\s*([^\]]+)\]/g, '').trim();
      }

      console.log(`[Gemini Guru]: ${modelText}`);

      // Add model response to history
      chatHistory.push({ role: "model", parts: [{ text: modelText }] });

      // Send back to frontend exactly as it expects
      clientWs.send(JSON.stringify({
        serverContent: {
          modelTurn: {
            parts: [{ text: modelText }]
          }
        }
      }));

    } catch (err) {
      console.error("[Server Error]", err);
    }
  });

  clientWs.on('close', () => {
    console.log('[Server] Frontend client disconnected.');
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`[Server] Vocal Coach proxy running on http://localhost:${PORT}`);
});
