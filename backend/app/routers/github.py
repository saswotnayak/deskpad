"""Router for retrieving GitHub contributions."""

import urllib.request
import urllib.error
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/github", tags=["github"])

class ContributionDay(BaseModel):
    """Schema representing contributions on a single day."""
    date: str
    level: int
    count: int

class ContributionsResponse(BaseModel):
    """Response containing contribution grid and statistics."""
    username: str
    total: int
    max_count: int
    longest_streak: int
    current_streak: int
    days: list[ContributionDay]

# In-memory cache to store parsed stats and avoid rate limiting
# Schema: { username: { "timestamp": datetime, "data": ContributionsResponse } }
_cache: dict[str, dict] = {}
CACHE_DURATION = timedelta(hours=1)

def parse_contributions(username: str, html: str) -> ContributionsResponse:
    """Parse raw HTML contributions page into a structured schema."""
    # Matches individual calendar day cells
    pattern = re.compile(
        r'<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"[^>]*data-level="(\d)"[^>]*>'
    )
    matches = pattern.findall(html)
    
    days = []
    for date_str, element_id, level_str in matches:
        # Match tooltip for this element ID to get the exact contribution count
        tooltip_pattern = re.compile(
            rf'<tool-tip[^>]*for="{element_id}"[^>]*>(.*?)</tool-tip>',
            re.DOTALL
        )
        tooltip_match = tooltip_pattern.search(html)
        
        count = 0
        if tooltip_match:
            tooltip_text = tooltip_match.group(1).strip()
            # Extracts the count number, e.g. "3 contributions on May 25th"
            count_match = re.search(r'^(\d+)\s+contribution', tooltip_text)
            if count_match:
                count = int(count_match.group(1))
            elif "No contribution" in tooltip_text or "no contribution" in tooltip_text.lower():
                count = 0
        else:
            # Fallback estimation based on level
            count = int(level_str) * 2
            
        days.append(ContributionDay(date=date_str, level=int(level_str), count=count))
        
    days.sort(key=lambda x: x.date)
    
    # Calculate statistics
    total = sum(d.count for d in days)
    max_count = max((d.count for d in days), default=0)
    
    # Streak calculations
    longest_streak = 0
    current_streak = 0
    temp_streak = 0
    
    for d in days:
        if d.count > 0:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0
            
    # Current streak (working backwards from the last day in dataset)
    for d in reversed(days):
        if d.count > 0:
            current_streak += 1
        else:
            # If the last day has 0 but yesterday was positive, we allow a 1-day grace period
            # for timezone alignment (e.g. if we query early in the morning and haven't pushed yet)
            if d == days[-1] and len(days) > 1 and days[-2].count > 0:
                continue
            break
            
    return ContributionsResponse(
        username=username,
        total=total,
        max_count=max_count,
        longest_streak=longest_streak,
        current_streak=current_streak,
        days=days
    )

@router.get("/contributions/{username}", response_model=ContributionsResponse)
def get_contributions(username: str):
    """Retrieve scraped contributions from GitHub with an in-memory cache layer."""
    username = username.strip().lower()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty"
        )
        
    now = datetime.now()
    if username in _cache:
        cache_entry = _cache[username]
        if now - cache_entry["timestamp"] < CACHE_DURATION:
            return cache_entry["data"]
            
    url = f"https://github.com/users/{username}/contributions"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GitHub user '{username}' not found"
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch contributions from GitHub: {e.reason}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error accessing GitHub: {str(e)}"
        )
        
    try:
        data = parse_contributions(username, html)
        _cache[username] = {"timestamp": now, "data": data}
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse contributions page: {str(e)}"
        )
