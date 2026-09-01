"""
Restricts which records a signed in user can see based on their role
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

Works generically over anything with region, province, and municipality
attributes, which covers both Farm records directly and DamageDetection
records via a small accessor, rather than duplicating the same role
matching logic for each.
"""

from typing import Callable, TypeVar

from app.core.models import DamageDetection, Farm, User

UNSCOPED_ROLES = {"national_administrator", "gis_analyst", "viewer", "field_validator"}

T = TypeVar("T")


def _filter_generic(items: list[T], user: User | None, geography: Callable[[T], tuple[str, str, str]]) -> list[T]:
    if user is None or user.role in UNSCOPED_ROLES:
        return items

    if user.role == "regional_officer" and user.region:
        return [item for item in items if geography(item)[0] == user.region]

    if user.role == "provincial_officer" and user.province:
        return [item for item in items if geography(item)[1] == user.province]

    if user.role == "municipal_agriculture_officer" and user.municipality:
        return [item for item in items if geography(item)[2] == user.municipality]

    # Role expects a scope but the account has none assigned. Fail closed
    # rather than silently showing everything.
    return []


def filter_by_scope(detections: list[DamageDetection], user: User | None) -> list[DamageDetection]:
    return _filter_generic(detections, user, lambda d: (d.farm.region, d.farm.province, d.farm.municipality))


def filter_farms_by_scope(farms: list[Farm], user: User | None) -> list[Farm]:
    return _filter_generic(farms, user, lambda f: (f.region, f.province, f.municipality))
