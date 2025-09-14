const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { client } = require('../util/redis.js');


class FixedTTLRedisStore extends RedisStore {
  async set(sid, sess, callback) {
    try {
      const key = this.prefix + sid;
      
    
      const currentTTL = await client.ttl(key);
      
     
      await client.setEx(key, this.ttl, JSON.stringify(sess));
      
      
      if (currentTTL > 0) {
        await client.expire(key, currentTTL);
      }
      
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  }
}


const sessionMiddleware = session({
  store: new FixedTTLRedisStore({ client: client, ttl: 60 * 60 }),
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false,
  rolling: false, 
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false, 
    httpOnly: true, 
    sameSite: 'lax' 
  }
});


const sessionTtlMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.sessionID;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID not found' });
    }

    
    const sessionExists = await client.exists(`sess:${sessionId}`);
    
    if (!sessionExists) {
      console.log(`🆕 NEW SESSION CREATED: ${sessionId}`);
      console.log(`⏰ Session created at: ${new Date().toISOString()}`);
    
      req.session.history = [];
      req.session.createdAt = Date.now();
    } else {
      console.log(`♻️  Existing session: ${sessionId}`);
    }

    const ttl = await client.ttl(`sess:${sessionId}`);
    console.log(`Session ID: ${sessionId}, TTL: ${ttl} seconds`);
    
    if (ttl === 3600) {
      console.log(`🔄 TTL reset to 3600s (session was modified/saved)`);
    }

    req.sessionTTL = ttl;

    next();
  } catch (error) {
    console.error('Error in sessionTtl middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { sessionMiddleware, sessionTtlMiddleware };
