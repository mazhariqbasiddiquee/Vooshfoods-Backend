
const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

 const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });





async function setup() {
   

    let response=await pc.createIndexForModel({
        name:"news-index",
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
            model: 'llama-text-embed-v2',
            fieldMap: { text: 'chunk_text' },
        },
        waitUntilReady: true,
    });

    console.log('Index is ready!',response);
}

setup();


// To get the unique host for an index, 
// see https://docs.pinecone.io/guides/manage-data/target-an-index
// const namespace = pc.index("INDEX_NAME", "INDEX_HOST").namespace("example-namespace");

// // Upsert records into a namespace
// // `chunk_text` fields are converted to dense vectors
// // `category` is stored as metadata
// await namespace.upsertRecords([
//         {
//             "_id": "rec1",
//             "chunk_text": "Apples are a great source of dietary fiber, which supports digestion and helps maintain a healthy gut.",
//             "category": "digestive system", 
//         },
//         {
//             "_id": "rec2",
//             "chunk_text": "Apples originated in Central Asia and have been cultivated for thousands of years, with over 7,500 varieties available today.",
//             "category": "cultivation",
//         },
//         {
//             "_id": "rec3",
//             "chunk_text": "Rich in vitamin C and other antioxidants, apples contribute to immune health and may reduce the risk of chronic diseases.",
//             "category": "immune system",
//         },
//         {
//             "_id": "rec4",
//             "chunk_text": "The high fiber content in apples can also help regulate blood sugar levels, making them a favorable snack for people with diabetes.",
//             "category": "endocrine system",
//         }
// ]);