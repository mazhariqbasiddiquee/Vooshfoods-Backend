
const {GoogleGenAI} = require("@google/genai");
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
console.log("Gemini API Key:", process.env.GEMINI_API_KEY);


 async function askGemini(question, contextChunks) {
  const contextText = contextChunks.join('\n\n');

   const prompt = `
You are a highly focused news assistant. Using ONLY the information from the articles below, answer the question precisely and briefly. Follow these rules strictly:
1. Answer ONLY if the article contains information directly relevant to the question.
2. Do NOT add any extra details, speculation, or background unless explicitly mentioned in the articles.
3. If there is no relevant information, reply with exactly: "I am sorry, I don't have enough information to answer that question."
4. Provide your answer in one concise paragraph, without introductions, greetings, or conclusions.

Context:
${contextText}

Question: ${question}

Answer:
`;
 
    const geminiResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 100
      },
    }
  });
     return geminiResponse

}

module.exports={askGemini};