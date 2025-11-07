import sqlite3
import json
import os
import struct

# Connect to ChromaDB SQLite database
db_path = os.path.join(os.path.dirname(__file__), '..', 'chroma_db', 'chroma.sqlite3')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all embeddings from embeddings_queue
cursor.execute('''
    SELECT 
        id,
        vector,
        metadata
    FROM embeddings_queue
    ORDER BY seq_id
''')

rows = cursor.fetchall()

# Convert to JSON format
data = []
for row in rows:
    embedding_id, vector_blob, metadata_json = row
    
    # Convert blob to list of floats
    if vector_blob:
        embedding = list(struct.unpack(f'{len(vector_blob)//4}f', vector_blob))
    else:
        continue
    
    # Parse metadata JSON
    metadata = json.loads(metadata_json) if metadata_json else {}
    
    # Extract document from metadata (ChromaDB stores it there)
    document = metadata.get('document', metadata.get('text', ''))
    
    data.append({
        'id': embedding_id,
        'document': document,
        'embedding': embedding,
        'metadata': metadata
    })

conn.close()

# Save to JSON file
output_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'data', 'embeddings.json')
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Exported {len(data)} documents to {output_path}')
print(f'Total size: {os.path.getsize(output_path) / 1024:.2f} KB')
