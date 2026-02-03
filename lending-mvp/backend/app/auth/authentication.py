from fastapi.responses import HTMLResponse
from typing import Union, List, Optional
from datetime import datetime, date , timedelta

from fastapi import APIRouter, Body, HTTPException, Depends, Request, Response, status
from jose import jwt

from  ..database.mongodb import create_mongo_client
mydb = create_mongo_client()

import logging

logging.basicConfig(level=logging.INFO)

JWT_SECRET = 'myjwtsecret'
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def get_current_user(request:Request):
    logging.info("Attempting to get current user")
    try :
        token = request.cookies.get('access_token')
        logging.info(f"Token: {token}")
        if token is None:
            logging.error("No access token found in cookies")
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail= "Not Authorized",
            # headers={"WWW-Authenticate": "Basic"},
            )
        else:
            scheme, _, param = token.partition(" ")
            payload = jwt.decode(param, JWT_SECRET, algorithms=ALGORITHM)
            logging.info(f"Payload: {payload}")
        
            username = payload.get("sub")    
            
            expiration_time = datetime.fromtimestamp(payload.get("exp"))

            if expiration_time < datetime.now():
                  logging.error("Token has expired")
                  raise HTTPException(
                status_code=401,
                detail="Session Expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

            else:

                user = mydb.users.find_one({"username": username})
                logging.info(f"User: {user}")

                if user is None:
                    logging.error("User not found in database")
                    raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail= "Not Authorized",
                
                    )
                else:
                    logging.info(f"User {username} authenticated successfully")
                    return username

    except Exception as e:
        logging.error(f"An error occurred in get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail= "Internal Server Error",
            # headers={"WWW-Authenticate": "Basic"},
        )

   

            
       
