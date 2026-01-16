import hashlib
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models

class LLMCacheService:
    def _generate_key(self, prompt: str, model_config: str) -> str:
        content = f"{prompt}:{model_config}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get_cached_response(self, db: Session, prompt: str, model_config: str):
        """Get cached response and update hit statistics"""
        key = self._generate_key(prompt, model_config)
        entry = db.query(models.LLMCache).filter(models.LLMCache.cache_key == key).first()
        
        if entry:
            if entry.expires_at > datetime.utcnow():
                # Update hit count
                entry.hit_count = (entry.hit_count or 0) + 1
                entry.last_hit_at = datetime.utcnow()
                db.commit()
                return entry.response_json
            else:
                # Expired - delete
                db.delete(entry)
                db.commit()
        return None

    def cache_response(self, db: Session, prompt: str, model_config: str, response: dict, ttl_minutes: int = 60 * 24 * 7):
        """Cache response with 7-day default TTL"""
        key = self._generate_key(prompt, model_config)
        
        existing = db.query(models.LLMCache).filter(models.LLMCache.cache_key == key).first()
        if existing:
            existing.response_json = response
            existing.expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)
        else:
            entry = models.LLMCache(
                cache_key=key,
                response_json=response,
                model_config_id=model_config,
                hit_count=0,
                expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes)
            )
            db.add(entry)
        db.commit()

    def get_cache_stats(self, db: Session) -> dict:
        """Get cache statistics for benchmarking"""
        total_entries = db.query(models.LLMCache).count()
        total_hits = db.query(func.sum(models.LLMCache.hit_count)).scalar() or 0
        
        # Active (non-expired) entries
        active_entries = db.query(models.LLMCache).filter(
            models.LLMCache.expires_at > datetime.utcnow()
        ).count()
        
        # Most popular cached items
        popular = db.query(models.LLMCache).filter(
            models.LLMCache.expires_at > datetime.utcnow()
        ).order_by(models.LLMCache.hit_count.desc()).limit(5).all()
        
        return {
            "total_entries": total_entries,
            "active_entries": active_entries,
            "expired_entries": total_entries - active_entries,
            "total_hits": int(total_hits),
            "cache_hit_rate": round(total_hits / max(1, total_entries), 2),
            "top_cached_keys": [
                {"key": p.cache_key[:16] + "...", "hits": p.hit_count or 0}
                for p in popular
            ]
        }

    def cleanup_expired(self, db: Session) -> int:
        """Remove expired cache entries"""
        deleted = db.query(models.LLMCache).filter(
            models.LLMCache.expires_at <= datetime.utcnow()
        ).delete()
        db.commit()
        return deleted

llm_cache = LLMCacheService()
