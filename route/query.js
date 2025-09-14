const express = require('express');
const searchRouter = express.Router();
const { askGemini } = require('../util/geminiai.js')
const { queryPinecone, getAllDocuments, fetchDocumentsPaginated } = require('../util/query.js'); 
const { sessionMiddleware, sessionTtlMiddleware } = require('../middleware/user.js');



searchRouter.get("/find-alldata",async(req,res)=>{
    try {
         
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const allData = await fetchDocumentsPaginated(page, limit);
         
        res.status(200).json(allData);     


    }         
 catch (err) {     

        res.status(500).json({ message: "Internal Server Error" })
        console.error("Error fetching all data:", err);
    }

});

searchRouter.get("/all-documents", async(req, res) => {
    try {
        const allData = await getAllDocuments();
        res.status(200).json({ data: allData, total: allData.length });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
        console.error("Error fetching all documents:", err);
    }
});

searchRouter.post('/query',sessionMiddleware,sessionTtlMiddleware, async (req, res) => {
    try {
        const questions = req.body.query;
        
   
     
        if (!req.session.history) {
            req.session.history = [];

        } else {
            console.log('Existing session history length:', req.session.history.length);
        }
        
   
     
        const fullHistory = req.session.history;
        
 
        const recentHistory = fullHistory.slice(-10);
        
        const formattedContext = recentHistory.map(item => {
            return `User: ${item.user}\nBot: ${item.bot}`;
        }).join('\n\n');

        const searchContext = formattedContext
            ? `${formattedContext}\n\nUser: ${questions}`
            : `User: ${questions}`;

            console.log("Search Context:", searchContext);
            
      
        const chunks = await queryPinecone(searchContext);
       
        
        if (!chunks.length) {
      
            return res.status(404).json({
                message: "No relevant news found.", type: 'bot',
                timestamp: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (req.sessionTTL * 1000)).toISOString()
            });
        }
        
        try {
            const answer = await askGemini(questions, chunks);
            const botResponse = answer?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer generated";
            
            // Save conversation to session (maintain full history)
            req.session.history.push({
                user: questions,
                bot: botResponse
            });
            
          ;
            return res.status(200).json({
                message: botResponse,
                timestamp: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (req.sessionTTL * 1000)).toISOString()
            });
        } catch (geminiError) {
            console.error('Gemini API Error:', geminiError);
            
            // Handle specific Gemini errors
            if (geminiError.status === 503) {
                return res.status(503).json({
                    message: "AI service is currently overloaded. Please try again in a few moments.",
                    error: "SERVICE_OVERLOADED",
                    timestamp: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + (req.sessionTTL * 1000)).toISOString()
                });
            } else if (geminiError.status === 429) {
                return res.status(429).json({
                    message: "Too many requests. Please wait before trying again.",
                    error: "RATE_LIMITED",
                    timestamp: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + (req.sessionTTL * 1000)).toISOString()
                });
            } else {
                return res.status(500).json({
                    message: "AI service temporarily unavailable. Please try again later.",
                    error: "AI_SERVICE_ERROR",
                    timestamp: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + (req.sessionTTL * 1000)).toISOString()
                });
            }
        }

    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
        console.error("Error processing request:", err);
    }
});


searchRouter.post('/clear-session', sessionMiddleware, sessionTtlMiddleware, (req, res) => {
    console.log('Clearing session for ID:', req.sessionID);
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.clearCookie('connect.sid');
        res.send('Logged out and session cleared.');
    });
});



module.exports = searchRouter;