

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

from basemodel.basemodels import User
from views.views import getRoles


@form_htlm.get("/current-user/")
async def get_current_user(request:Request):

    try :
        token = request.cookies.get('access_token')
        # print(token)
        if token is None:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail= "Not Authorized",
            # headers={"WWW-Authenticate": "Basic"},
            )
        else:
            scheme, _, param = token.partition(" ")
            payload = jwt.decode(param, SECRET_KEY, algorithms=ALGORITHM)
        
            username = payload.get("sub")    
            
            expiration_time = datetime.fromtimestamp(payload.get("exp"))
            # print(expiration_time)
            # print(datetime.utcnow())

            
            if datetime.utcnow() > expiration_time:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired. Please login again.",
                )

            # response_data = {"username": username}
            return username

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail= "Session has expired",
            # headers={"WWW-Authenticate": "Basic"},
        )

    # token = request.cookies.get('access_token')
    # scheme, _, param = token.partition(" ")
    # payload = jwt.decode(param, SECRET_KEY, algorithms=ALGORITHM)

    # username = payload.get("sub")
    # response_data = {"username": username}
    # # return JSONResponse(content=response_data)
    # return response_data


@form_htlm.get("/", response_class=HTMLResponse)
async def api_login(request: Request):
    return templates.TemplateResponse("login/login.html", {"request": request})

@form_htlm.get("/logs/")
async def display_logs(request: Request,current_user: str = Depends(get_current_user)):
   
    
    # current_user: Annotated[User, Depends(get_current_user)]
    x = getuser(username=current_user)
    roleData = getRoles()  # Retrieve all roles
    # role_dict = {role.id: role.approvalAmount for role in roleData} #retrieving the approval amount
    role_dict = {role.id: role.roles for role in roleData} #retrieving the roles in Roles table

    userData = [
        
            {
                "id": x.id,
                "username": x.username,
                "role_name": role_dict.get(x.role_id),  # Get the role name from the dictionary
            }
           
        ]
    
    
    if userData[0]['role_name'] != 'Admin':

         raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail= "Your Credential is Not Authorized",
                
                )

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
