from typing import Optional,List
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group
import urllib.parse

from config.models import User

connection_string = "mysql+pymysql://{user}:{password}@{host}:{port}/{database}".format(
    user="joeysabusido",
    password=urllib.parse.quote("Genesis@11"),
    host="192.46.225.247",
     port=3306,
    database="test_db"
)

engine = create_engine(connection_string, echo=True)

def getuser(username):
    """This function is querying user """
    with Session(engine) as session:
        statement = select(User).filter(User.username == username)
                    
        results = session.exec(statement) 

        data = results.one()
        
        return data
    
def insertuser(username,hashed_password,email_add,
               is_active,role_id):
    """This function is for inserting user"""
    insertData = User(username=username,hashed_password=hashed_password,
                      email_add=email_add,is_active=is_active,role_id=role_id)
    

    session = Session(engine)

    session.add(insertData)
    
    session.commit()

    session.close()