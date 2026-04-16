# chatbot/retrieval.py - RAG System
from sentence_transformers import SentenceTransformer
import numpy as np
from properties.models import Property
import faiss
from typing import List, Dict
import pickle
import os

class PropertyRetrievalSystem:
    """Advanced RAG system for property search"""
    
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = None
        self.properties = []
        self.index_path = 'chatbot/faiss_index.bin'
        self.metadata_path = 'chatbot/properties_metadata.pkl'
        self._load_or_build_index()
    
    def _load_or_build_index(self):
        """Load existing index or build new one"""
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.metadata_path, 'rb') as f:
                self.properties = pickle.load(f)
        else:
            self._build_index()
    
    def _build_index(self):
        """Build FAISS index from all properties"""
        all_properties = Property.objects.filter(is_available=True)
        
        for prop in all_properties:
            # Create rich text representation
            text = f"{prop.title} {prop.description} {prop.city} {prop.district} {prop.property_type} {prop.bedrooms} bedrooms {prop.bathrooms} bathrooms"
            embedding = self.model.encode(text)
            
            self.properties.append({
                'id': prop.id,
                'title': prop.title,
                'embedding': embedding,
                'metadata': {
                    'price': float(prop.price),
                    'city': prop.city,
                    'district': prop.district,
                    'bedrooms': prop.bedrooms,
                }
            })
        
        # Build FAISS index
        embeddings = np.array([p['embedding'] for p in self.properties]).astype('float32')
        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(embeddings)
        
        # Save index
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'wb') as f:
            pickle.dump(self.properties, f)
    
    def search(self, query: str, k: int = 5) -> List[Dict]:
        """Search for similar properties"""
        query_embedding = self.model.encode(query).astype('float32').reshape(1, -1)
        distances, indices = self.index.search(query_embedding, k)
        
        results = []
        for idx in indices[0]:
            if idx < len(self.properties):
                prop_id = self.properties[idx]['id']
                property_obj = Property.objects.get(id=prop_id)
                results.append(property_obj)
        
        return results