const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { client } = require('../util/redis.js');


class FixedTTLRedisStore extends RedisStore {
  async set(sid, sess, callback) {
    try {
      const key = this.prefix + sid;
      
      const currentTTL = await client.ttl(key);
      
      // Set session with TTL
      await client.setEx(key, this.ttl, JSON.stringify(sess));
      
      // Only preserve TTL if session existed and had valid TTL
      if (currentTTL > 0) {
        await client.expire(key, currentTTL);
      }
      
      // Get the session data after setting
      const retrievedSession = await client.get(key);
      const sessionData = retrievedSession ? JSON.parse(retrievedSession) : null;
     
      
      if (callback) callback(null);
      return sessionData;
    } catch (err) {
      if (callback) callback(err);
      throw err;
    }
  }
}


const sessionMiddleware = session({
  store: new FixedTTLRedisStore({ client: client, ttl: 60 * 60 }),
  secret: process.env.SESSION_SECRET || 'mySecretKey',
  name: 'sessionid',
  resave: false,
  saveUninitialized: true,
  rolling: false, 
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: true, 
    httpOnly: true, 
    sameSite: 'none',
   
   
  }
});


const sessionTtlMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.sessionID;
    console.log(sessionId,"sessionId in ttl middleware");

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID not found' });
    }

    
    const sessionExists = await client.exists(`sess:${sessionId}`);
    console.log(sessionExists,"sessionExists");
    
    const ttl = await client.ttl(`sess:${sessionId}`);
    console.log(`Session ID: ${sessionId}, TTL: ${ttl} seconds`);
    
  
    req.sessionTTL = ttl;

    next();
  } catch (error) {
    console.error('Error in sessionTtl middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { sessionMiddleware, sessionTtlMiddleware};
