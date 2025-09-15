# Vooshfoods-Backend

A Node.js backend service for Vooshfoods that provides AI-powered search and conversation capabilities using vector embeddings and session management.

## 🏗️ Architecture Overview

### Data Flow
1. **Data Ingestion** → **Embedding Generation** → **Vector Storage** → **Semantic Search** → **AI Response**
2. **Session Management** → **Conversation History** → **Context-Aware Responses**

## 📊 Data Storage & Management

### Vector Database (Pinecone)
- **Purpose**: Stores document embeddings for semantic search
- **Index**: Manages high-dimensional vectors for similarity matching
- **Documents**: News articles, product information, and knowledge base content
- **Metadata**: Associated with each vector for context retrieval

### Session Storage (Redis)
- **Purpose**: Maintains user conversation history and session state
- **TTL**: 1-hour session expiration with fixed TTL preservation
- **Structure**: Session ID mapped to conversation history and metadata
- **Persistence**: Cross-request conversation context

## 🔍 Embedding & Search Process

### 1. Document Embedding
```
Text Documents → Embedding Model → Vector Representations → Pinecone Storage
```

### 2. Query Processing
```
User Query → Context + History → Embedding → Vector Search → Relevant Documents
```

### 3. Similarity Matching
- **Algorithm**: Cosine similarity in high-dimensional space
- **Retrieval**: Top-K most relevant document chunks
- **Context**: Combined with conversation history for better results

## 🤖 AI Response Generation

### Gemini AI Integration
- **Model**: Google's Gemini AI for natural language processing
- **Input**: User query + retrieved document context + conversation history
- **Output**: Contextually relevant responses
- **Error Handling**: Rate limiting, service overload, and fallback responses

## 🔐 Session Management

### Custom Redis Store
```javascript
class FixedTTLRedisStore extends RedisStore {
  // Preserves original session TTL on updates
  // Prevents session extension on each request
  // Maintains exactly 1-hour session lifetime
}
```

### Session Features
- **Fixed TTL**: Sessions expire exactly 1 hour after creation
- **Complete History Storage**: Maintains entire conversation history in Redis
- **Context Window**: Uses last 10 exchanges for AI processing
- **Cross-Origin Support**: Configured for Vercel frontend integration
- **Redis Persistence**: Survives server restarts

### Cookie Configuration
```javascript
cookie: {
  maxAge: 1000 * 60 * 60,  // 1 hour
  secure: true,            // HTTPS only
  httpOnly: false,         // JavaScript accessible
  sameSite: 'none'         // Cross-origin support
}
```

## 🛠️ API Endpoints

### Search & Query
- `POST /search/query` - Main conversation endpoint with session management
- `GET /search/find-alldata` - Paginated document retrieval
- `GET /search/all-documents` - Complete document listing

### Session Management
- `GET /search/test-session` - Session debugging endpoint
- `POST /search/clear-session` - Session cleanup

## 🔧 Environment Configuration

### Required Environment Variables
```env
PINECONE_API_KEY=your_pinecone_api_key
GEMINI_API_KEY=your_gemini_api_key
Allowed_Hosts=https://vooshfoods-frontend-six.vercel.app
SESSION_SECRET=your_strong_session_secret
```

### CORS Configuration
- **Origins**: Vercel frontend + localhost development
- **Credentials**: Enabled for session cookie support
- **Methods**: GET, POST for API operations

## 🚀 Deployment

### Production Environment
- **Backend**: Deployed on Render (https://vooshfoods-backend-qh78.onrender.com)
- **Frontend**: Deployed on Vercel
- **Database**: Redis Cloud for session storage
- **Vector DB**: Pinecone cloud service

### Cross-Origin Setup
```javascript
app.use(cors({
  origin: [process.env.Allowed_Hosts, 'http://localhost:5173'],
  credentials: true
}));
```

## 📈 Performance Features

### Conversation Context
- **Full History Storage**: Complete conversation history maintained in Redis session
- **Context Window**: Only last 10 exchanges used for AI context to prevent token overflow
- **Context Formatting**: Structured user/bot conversation format
- **Memory Efficiency**: Sliding window approach for long conversations

### Error Handling
- **Gemini API**: Rate limiting, service overload detection
- **Session**: TTL monitoring and automatic cleanup
- **Search**: Fallback responses for no results

## 🔄 Request Flow

When a user sends a query to the Vooshfoods backend, the following process occurs:

1. **Session Validation**: The system first checks if the user has an existing session. If not, it creates a new session with a unique ID and stores it in Redis with a 1-hour expiration time.

2. **History Retrieval**: The system retrieves the user's complete conversation history from the Redis session store. This includes all previous questions and responses from the current session.

3. **Context Preparation**: From the full conversation history, the system selects only the last 10 exchanges (user questions and bot responses) to create a context window. This prevents the AI model from being overwhelmed with too much information while maintaining recent conversation flow.

4. **Query Enhancement**: The current user query is combined with the recent conversation context to create a comprehensive search context that understands the conversation flow.

5. **Vector Search**: The enhanced query is converted into embeddings and searched against the Pinecone vector database to find the most relevant document chunks using cosine similarity matching.

6. **AI Processing**: The relevant documents, along with the user's query and conversation context, are sent to Google's Gemini AI model to generate a contextually appropriate response.

7. **Response Generation**: Gemini AI processes all the information and generates a natural language response that considers both the retrieved documents and the conversation history.

8. **History Update**: The new user question and AI response are added to the complete conversation history in the Redis session, ensuring continuity for future interactions.

9. **Response Delivery**: The AI-generated response is sent back to the user along with session metadata like timestamps and expiration information.

## 🛡️ Security Features

- **HTTPS Enforcement**: Secure cookie transmission
- **Session Isolation**: Redis-based session separation
- **API Key Protection**: Environment variable storage
- **CORS Protection**: Restricted origin access
- **Input Validation**: Query sanitization and error handling

## 📦 Dependencies

### Core
- `express` - Web framework
- `express-session` - Session management
- `connect-redis` - Redis session store
- `cors` - Cross-origin resource sharing

### AI & Vector Search
- Pinecone client for vector operations
- Google Gemini AI for response generation

### Database
- Redis for session storage
- Custom TTL management for session persistence

## 🚦 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your API keys and configuration
   ```

3. **Start Development Server**
   ```bash
   npm run server
   ```



This backend provides a robust foundation for AI-powered conversational search with persistent session management and semantic document retrieval.