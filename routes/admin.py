import json
from lib2to3.pgen2 import token
from pyexpat import model
from re import I
from urllib import response
from urllib.request import Request
from fastapi import APIRouter, Body, HTTPException, Depends,status,Response
from typing import Union, List
from datetime import datetime


from typing import Optional





from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
import sqlalchemy.dialects.mysql

# from config.database import Base


from sqlalchemy.orm import Session


import sqlalchemy
# from config.database import metadata,database

from authentication.utils import OAuth2PasswordBearerWithCookie


from pydantic import BaseModel
from datetime import datetime, date
from datetime import timedelta


from jose import jwt

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
JWT_SECRET = 'myjwtsecret'
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30



admin = APIRouter()




#==================================================User Data ==========================================

from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="token")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + expires_delta

    to_encode.update({"exp": expire})

    
    return to_encode

from views.views import getuser

def authenticate_user(username, password):
    # user = mydb.login.find({"username":username})
    user = getuser(username=username)
    
    print(user)
    username = user.username
    hashed_password = user.hashed_password

    if user:
        password_check = pwd_context.verify(password,hashed_password)
        return password_check

    else :
        False

@admin.post('/token')
def login(response:Response,form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password


    user = authenticate_user(username,password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username},
        expires_delta=access_token_expires,
    )

    data = {"sub": username}
    jwt_token = jwt.encode(data,SECRET_KEY,algorithm=ALGORITHM)
    response.set_cookie(key="access_token", value=f'Bearer {jwt_token}',httponly=True)
    
    return {"access_token": jwt_token, "token_type": "bearer"}


#======================================Starting to Post/Get/Delete/Update Function==========================
from basemodel.basemodels import User

from views.views import (insertuser,insertRole,getRoles,getuser,getUsers)

@admin.post('/insert-role/')
def insertRoles(roles: str, approvalAmount: float,username:str = Depends(oauth_scheme)):
    """This function is for inserting Roles"""
    insertRole(roles=roles,approvalAmount=approvalAmount)
    return {"messege": 'Roles has been created'}

@admin.get("/api-get-roles/")
async def getRoles_api(username:str = Depends(oauth_scheme)):
    """This function is to get Roles data Details"""
    results = getRoles()

    rolesData = [
        
            {
                "id": x.id,
                "roles": x.roles,
                "approvalAmount": x.approvalAmount,
                "date_updated": x.date_updated,
                "date_credited": x.date_credited,
                
            }
            for x in results
        ]
    
    
    return rolesData


@admin.post('/sign-up')
def sign_up(items: User):
    """This function is for inserting User"""
    # dataInsert = dict()
    # dataInsert = {
    #     "username": items.username,
    #     "hashed_password": get_password_hash(items.hashed_password),
    #     "email_add": items.email_add,
    #     "is_active": items.is_active,
    #     "role_id": items.role_id
    #     }
    insertuser(username=items.username,hashed_password=get_password_hash(items.hashed_password),
               email_add=items.email_add,is_active=items.is_active,role_id=items.role_id)
    
    return {"message":"User has been save"} 


@admin.get("/api-get-users/")
async def getRoles_api(username:str = Depends(oauth_scheme)):
    """This function is to get Roles data Details"""
    roleData = getRoles()  # Retrieve all roles
    # role_dict = {role.id: role.approvalAmount for role in roleData} #retrieving the approval amount
    role_dict = {role.id: role.roles for role in roleData} #retrieving the roles in Roles table

    results = getUsers()
    

    userData = [
        
            {
                "id": x.id,
                "username": x.username,
                "hashed_password": x.hashed_password,
                "email_add": x.email_add,
                "is_active": x.is_active,
                "role_id": x.role_id,
                "role_name": role_dict.get(x.role_id),  # Get the role name from the dictionary
                "is_active": x.is_active,
                "date_updated": x.date_updated,
                "date_credited": x.date_credited,

                
            }
            for x in results
        ]
    
    
    return userData

