"""API REST de Identidad y Acceso: login y gestión de usuarios."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.contexts.identity_access.application.authenticate import Authenticate, RefreshAccess
from app.contexts.identity_access.application.manage_users import ManageUsers
from app.contexts.identity_access.domain.models import Action, Role, User
from app.contexts.identity_access.interfaces.deps import (
    get_authenticate,
    get_current_user,
    get_manage_users,
    get_refresh_access,
    get_user_repo,
    require,
)
from app.shared.errors import DomainError

router = APIRouter(tags=["identity-access"])


class LoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class CreateUserIn(BaseModel):
    email: str
    password: str
    rol: Role


class ChangeRoleIn(BaseModel):
    rol: Role


class UserOut(BaseModel):
    id: str
    email: str
    rol: str
    activo: bool

    @staticmethod
    def of(u: User) -> "UserOut":
        return UserOut(id=u.id, email=u.email, rol=u.rol.value, activo=u.activo)


@router.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, uc: Authenticate = Depends(get_authenticate)) -> TokenOut:
    try:
        pair = uc.execute(body.email, body.password)
    except DomainError:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return TokenOut(access_token=pair.access, refresh_token=pair.refresh)


@router.post("/auth/refresh", response_model=TokenOut)
def refresh(body: RefreshIn, uc: RefreshAccess = Depends(get_refresh_access)) -> TokenOut:
    try:
        access = uc.execute(body.refresh_token)
    except DomainError:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    return TokenOut(access_token=access)


@router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.of(user)


@router.post("/users", status_code=201, response_model=UserOut)
def create_user(
    body: CreateUserIn,
    actor: User = Depends(require(Action.MANAGE_USERS)),
    uc: ManageUsers = Depends(get_manage_users),
) -> UserOut:
    try:
        user = uc.create_user(actor, email=body.email, password=body.password, rol=body.rol)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return UserOut.of(user)


@router.get("/users", response_model=list[UserOut])
def list_users(
    _: User = Depends(require(Action.MANAGE_USERS)),
    repo=Depends(get_user_repo),
) -> list[UserOut]:
    return [UserOut.of(u) for u in repo.list_all()]


@router.patch("/users/{user_id}/role", response_model=UserOut)
def change_role(
    user_id: str,
    body: ChangeRoleIn,
    actor: User = Depends(require(Action.MANAGE_USERS)),
    uc: ManageUsers = Depends(get_manage_users),
    repo=Depends(get_user_repo),
) -> UserOut:
    try:
        uc.change_role(actor, user_id=user_id, new_role=body.rol)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return UserOut.of(repo.get(user_id))


@router.post("/users/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: str,
    actor: User = Depends(require(Action.MANAGE_USERS)),
    uc: ManageUsers = Depends(get_manage_users),
    repo=Depends(get_user_repo),
) -> UserOut:
    try:
        uc.deactivate(actor, user_id=user_id)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return UserOut.of(repo.get(user_id))
