import pytest

from app.contexts.identity_access.domain.models import Action, PermissionPolicy, Role

# Matriz esperada (rol -> acciones permitidas). Separación estricta de deberes.
_EXPECTED = {
    Role.SUPERADMIN: {Action.MANAGE_USERS},
    Role.CREADOR: {Action.CREATE_BRAND, Action.GENERATE_CONTENT},
    Role.APROBADOR_A: {Action.APPROVE_CONTENT},
    Role.APROBADOR_B: {Action.AUDIT_IMAGE},
}

_ALL_CASES = [
    (rol, action, action in permitidas)
    for rol, permitidas in _EXPECTED.items()
    for action in Action
]


@pytest.mark.parametrize("rol,action,permitido", _ALL_CASES)
def test_permission_policy_matrix(rol, action, permitido):
    assert PermissionPolicy.is_allowed(rol, action) is permitido
