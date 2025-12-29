from fastapi.testclient import TestClient
import uuid

from src.app import app

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = f"test.user.{uuid.uuid4().hex[:8]}@example.com"

    # Ensure email not present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    assert email not in participants

    # Signup should succeed
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Duplicate signup returns 400
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 400

    # Participant should now be present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Unregister should succeed
    resp = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert resp.status_code == 200

    # Unregister again should return 404
    resp = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert resp.status_code == 404

    # Ensure removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
