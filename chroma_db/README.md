# ChromaDB Data Directory

This directory should contain your pre-existing ChromaDB vector database.

## Required Structure

Your ChromaDB data should be placed in this directory. The typical structure includes:
- Collection metadata
- Vector embeddings
- Document data

## Setup Instructions

1. If you have an existing ChromaDB database, copy the contents to this directory
2. Ensure the collection name matches the one configured in your application
3. The database will be accessed in read-only mode when deployed to Vercel

## Important Notes

- This directory is excluded from git (see .gitignore)
- You need to manually place your ChromaDB data here before running the application
- For local development, ensure this directory contains valid ChromaDB data
- For Vercel deployment, the chroma_db folder needs to be included in your deployment (remove from .gitignore or use a different approach)

## Vercel Deployment Consideration

Since Vercel uses serverless functions, you have two options:
1. **Include the database in deployment**: Remove `chroma_db/` from .gitignore and commit the database (if size permits)
2. **Use external ChromaDB server**: Host ChromaDB separately and connect via HTTP client

For this implementation, we assume option 1 (including the database in the project).
