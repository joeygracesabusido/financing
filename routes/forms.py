import json
from lib2to3.pgen2 import token
from pyexpat import model
from re import I
from urllib import response
from urllib.request import Request
from typing import Union, List
from datetime import datetime
from typing import Optional
from fastapi.responses import HTMLResponse


from fastapi import APIRouter, Body, HTTPException, Depends, Request, Response, status
from fastapi.templating import Jinja2Templates

from authentication.utils import OAuth2PasswordBearerWithCookie



from pydantic import BaseModel
from datetime import datetime, date
from datetime import timedelta


from jose import jwt

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
JWT_SECRET = 'myjwtsecret'
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30




form_htlm = APIRouter(include_in_schema=False)
templates = Jinja2Templates(directory="templates")



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

@form_htlm.post('/login/')
async def login(response:Response, request:Request, response_model=None):

    form =  await request.form()
    username = form.get('username')
    password = form.get('password')
    


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
    return response

@form_htlm.get("/login/", response_class=HTMLResponse)
async def api_login(request: Request):
    return templates.TemplateResponse("login/login.html", {"request": request})
