from typing import Optional
from pydantic import condecimal
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group

from datetime import datetime, date


import urllib.parse





connection_string = "mysql+pymysql://{user}:{password}@{host}:{port}/{database}".format(
    user="joeysabusido",
    password=urllib.parse.quote("Genesis@11"),
    host="192.46.225.247",
     port=3306,
    database="test_lending"
)



engine = create_engine(connection_string, echo=True)


roles = [{
    "admin": 1,
    "manager": 2,
    "supervisor": 3,
    "user": 4
}]

# Role List and Function
    # admin = includes IT department and Developer
    #         can access basic Function CRUD 
    # manager = can do basic function (CRUD) but cannot access to database



class user(SQLModel, table=True):
    """This is to create user Table"""
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    password: str = Field(default=None)
    email_add: str = Field(default=None)
    role: str = Field(default=None)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)