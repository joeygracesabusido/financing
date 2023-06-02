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
oauth_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="token")
from views.views import getuser

# def validateLogin(request:Request):

#     try :
#         token = request.cookies.get('access_token')
#         if token is None:
#             raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail= "Not Authorized",
           
#             )
#         else:
#             scheme, _, param = token.partition(" ")
#             payload = jwt.decode(param, JWT_SECRET, algorithms=ALGORITHM)
        
#             username = payload.get("sub")
#             user =  getuser(username=username)
            

#             if user == [] :
#                  raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail= "Not Authorized",
                
#                 )
#             else:
                
#                 return username

#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail= "Not Authorized please Login",
#             # headers={"WWW-Authenticate": "Basic"},
#         )


@form_htlm.get("/", response_class=HTMLResponse)
async def api_login(request: Request):
    return templates.TemplateResponse("login/login.html", {"request": request})

@form_htlm.get("/logs/")
async def display_logs(request: Request, token: str = Depends(oauth_scheme)):
    # Read the log file
    with open("app.log", "r") as file:
        logs = file.readlines()
    return templates.TemplateResponse("logs/logs.html", {"request": request,"logs":logs})

@form_htlm.get("/dashboard/", response_class=HTMLResponse)
async def api_login(request: Request):
    return templates.TemplateResponse("login/dashboard.html", {"request": request})

@form_htlm.get("/deposit/", response_class=HTMLResponse)
async def api_login(request: Request):
    return templates.TemplateResponse("deposit/depositFrame.html", {"request": request})

@form_htlm.get("/user/", response_class=HTMLResponse)
async def api_login(request: Request):
    return templates.TemplateResponse("deposit/depositFrame.html", {"request": request})
