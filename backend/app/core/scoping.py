"""
Restricts which detections a signed in user can see based on their role
and assigned geography, matching the role descriptions in the project
specification (national administrator sees everything, a regional officer
sees only their region, and so on).

This filters an already loaded list in Python rather than pushing the
condition into the SQL query. That is fine at the current demo scale
(a handful of farms) but should move into the query itself with proper
joins and indexes once the dataset is large enough for it to matter.

An anonymous request, no token at all, is treated as an unscoped national
overview. That keeps the dashboard usable for casual browsing while still
narrowing the view once someone actually signs in with a scoped role.
"""

from app.core.models import DamageDetection, User

UNSCOPED_ROLES = {"national_administrator", "gis_analyst", "viewer", "field_validator"}


def filter_by_scope(detections: list[DamageDetection], user: User | None) -> list[DamageDetection]:
    if user is None or user.role in UNSCOPED_ROLES:
        return detections

    if user.role == "regional_officer" and user.region:
        return [d for d in detections if d.farm.region == user.region]

    if user.role == "provincial_officer" and user.province:
        return [d for d in detections if d.farm.province == user.province]

    if user.role == "municipal_agriculture_officer" and user.municipality:
        return [d for d in detections if d.farm.municipality == user.municipality]

    # Role expects a scope but the account has none assigned. Fail closed
    # rather than silently showing everything.
    return []
