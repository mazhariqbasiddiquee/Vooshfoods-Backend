
const { pc } = require('./pincode');

async function queryPinecone(queryText) {
  const namespace = pc.index("news-index");
  const response = await namespace.searchRecords({
    query: {
      topK: 5,
      inputs: { text: queryText },
    },
    fields: ['chunk_text'],
  });
  const hits = response?.result?.hits || [];
  return hits.map(hit => hit.fields.chunk_text);
}

// Get all available documents fast
async function getAllDocuments() {
  const namespace = pc.index("news-index");
  
  try {
    // Use query with correct vector dimension
    const response = await namespace.query({
      vector: new Array(1024).fill(0), // Correct dimension for your index
      topK: 10000, // Max limit
      includeValues: false,
      includeMetadata: true
    });
    
    return response.matches?.map(match => ({
      id: match.id,
      metadata: match.metadata
    })) || [];
  } catch (error) {
    console.error('Error fetching all documents:', error);
    // Fallback: try to fetch by sequential IDs
    return await fallbackFetchAll();
  }
}

// Fallback method to get documents by sequential IDs
async function fallbackFetchAll() {
  const namespace = pc.index("news-index");
  const allRecords = [];
  let currentId = 1;
  let consecutiveNotFound = 0;
  
  while (consecutiveNotFound < 10) { // Stop after 10 consecutive not found
    try {
      const response = await namespace.fetch([String(currentId)]);
      const record = response.records[String(currentId)];
      
      if (record) {
        allRecords.push({
          id: record.id,
          metadata: record.metadata
        });
        consecutiveNotFound = 0;
      } else {
        consecutiveNotFound++;
      }
    } catch (error) {
      consecutiveNotFound++;
    }
    currentId++;
  }
  
  return allRecords;
}

// Fast pagination with known IDs
async function fetchDocumentsPaginated(page = 1, limit = 20) {
  const allDocs = await getAllDocuments();
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const pageData = allDocs.slice(startIndex, endIndex);
  
  return {
    data: pageData,
    page,
    limit,
    total: allDocs.length,
    hasMore: endIndex < allDocs.length
  };
}

// Parallel batch processing for better performance
async function fetchDocumentsBatch(ids) {
  const namespace = pc.index("news-index");
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }
  
  const promises = batches.map(async (batch) => {
    try {
      const response = await namespace.fetch(batch);
      return Object.values(response.records || {})
        .filter(record => record !== null)
        .map(record => ({
          id: record.id,
          metadata: record.metadata
        }));
    } catch (error) {
      console.error('Batch fetch error:', error);
      return [];
    }
  });
  
  const results = await Promise.all(promises);
  return results.flat();
}

module.exports = { queryPinecone, getAllDocuments, fetchDocumentsPaginated, fetchDocumentsBatch };