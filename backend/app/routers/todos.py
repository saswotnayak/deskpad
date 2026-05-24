"""Todoist integration endpoints."""

import json
import urllib.request
import urllib.error
import structlog
from fastapi import APIRouter, HTTPException, Depends, status
from app.config import settings
from app.db.connection import get_db
from app.models.schemas import AccountInfo
from app.routers.auth import get_current_account, verify_profile_owner

logger = structlog.get_logger()

router = APIRouter(prefix="/api/todos", tags=["todos"])


def make_todoist_request(url: str, token: str, method: str = "GET") -> tuple[int, bytes]:
    """Helper to perform HTTP requests to Todoist API using standard library urllib."""
    req = urllib.request.Request(
        url,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as e:
        logger.error("todoist_api_http_error", status=e.code, url=url, reason=e.reason)
        return e.code, e.read()
    except urllib.error.URLError as e:
        logger.error("todoist_api_network_error", url=url, reason=str(e.reason))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to Todoist API: {str(e.reason)}"
        )
    except Exception as e:
        logger.error("todoist_api_unexpected_error", url=url, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error calling Todoist API: {str(e)}"
        )


async def get_user_todoist_token(user_id: int) -> str | None:
    """Helper to look up a user's specific Todoist token, falling back to global settings."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT value FROM user_settings WHERE user_id = ? AND key = 'todoist_api_token'",
        (user_id,)
    )
    row = await cursor.fetchone()
    if row and row[0] and row[0].strip() != "":
        return row[0].strip()
    
    # Only fall back to global settings for primary/owner profile (user_id == 1)
    if user_id == 1:
        return settings.todoist_api_token
    return None


@router.get("")
async def get_todos(user_id: int = 1, current_account: AccountInfo = Depends(get_current_account)):
    """Fetch current active tasks from Todoist, mapped to their project categories."""
    db = await get_db()
    await verify_profile_owner(db, user_id, current_account.id)
    token = await get_user_todoist_token(user_id)

    # Return empty list if Token is not configured
    if not token or token.strip() == "":
        logger.warning("todoist_token_missing", user_id=user_id)
        return {
            "todos": []
        }

    # 1. Fetch Projects for Mapping IDs to Names
    projects_map = {}
    p_status, p_body = make_todoist_request("https://api.todoist.com/rest/v2/projects", token)
    if p_status == 200:
        try:
            projects_data = json.loads(p_body.decode("utf-8"))
            projects_map = {proj["id"]: proj["name"] for proj in projects_data}
        except Exception as e:
            logger.error("todoist_projects_parse_failed", error=str(e))

    # 2. Fetch Active Tasks
    t_status, t_body = make_todoist_request("https://api.todoist.com/rest/v2/tasks", token)
    if t_status != 200:
        # If token is invalid (401), raise an informative exception
        if t_status == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Todoist API token"
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Todoist API returned error status {t_status}"
        )

    try:
        tasks_data = json.loads(t_body.decode("utf-8"))
    except Exception as e:
        logger.error("todoist_tasks_parse_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to parse tasks response from Todoist"
        )

    # 3. Format and Mapped Tasks
    formatted_todos = []
    for task in tasks_data:
        # Extract Category/Project Name
        project_id = task.get("project_id")
        category = projects_map.get(project_id, "Inbox")

        # Due Date String
        due_info = task.get("due")
        due_date = due_info.get("date") if due_info else None

        formatted_todos.append({
            "id": task["id"],
            "title": task["content"],
            "completed": False,
            "category": category,
            "dueDate": due_date
        })

    return {"todos": formatted_todos}


@router.post("/{task_id}/complete")
async def complete_todoist_task(task_id: str, user_id: int = 1, current_account: AccountInfo = Depends(get_current_account)):
    """Close/Complete a task in Todoist."""
    db = await get_db()
    await verify_profile_owner(db, user_id, current_account.id)
    token = await get_user_todoist_token(user_id)
    if not token or token.strip() == "":
        # For mock/setup tasks, just return success
        if task_id.startswith("setup-"):
            return {"success": True}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todoist integration is not configured"
        )

    url = f"https://api.todoist.com/rest/v2/tasks/{task_id}/close"
    status_code, body = make_todoist_request(url, token, method="POST")

    # Todoist returns 204 No Content on successful task completion/closing
    if status_code in (200, 204):
        return {"success": True}

    if status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in Todoist"
        )

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Todoist returned status {status_code} while completing task"
    )
