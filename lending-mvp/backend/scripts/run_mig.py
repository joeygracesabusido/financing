import os
os.environ['DATABASE_URL'] = 'postgresql://lending_user:lending_secret@postgres:5432/lending_db'
from alembic.config import Config
from alembic import command
cfg = Config('/home/ubuntu/Github/financing/lending-mvp/backend/alembic.ini')
cfg.set_main_option('sqlalchemy.url', os.environ['DATABASE_URL'])
try:
    command.upgrade(cfg, 'head')
    print('SUCCESS')
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
