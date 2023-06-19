from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware




from routes.admin import admin
from routes.forms import form_htlm
from routes.graph import  graphql_app


app = FastAPI()




app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

app.include_router(admin)
app.include_router(form_htlm)
app.include_router(graphql_app, prefix="/graphql")
# app.include_router(graph)

# app.include_router(graphql_app, prefix="/graphql")