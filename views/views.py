from typing import Optional,List
from sqlmodel import Field, Session, SQLModel, create_engine,select,func,funcfilter,within_group
import urllib.parse


from sqlalchemy.orm.exc import NoResultFound

from config.models import User,Role

connection_string = "mysql+pymysql://{user}:{password}@{host}:{port}/{database}".format(
    user="joeysabusido",
    password=urllib.parse.quote("Genesis@11"),
    host="192.46.225.247",
     port=3306,
    database="financing"
)

engine = create_engine(connection_string, echo=True)

def getuser(username):
    """This function is querying user """
    with Session(engine) as session:
        try:
            statement = select(User).filter(User.username == username)
                        
            results = session.exec(statement) 

            data = results.one()
            
            return data
        except NoResultFound:
            return None
    
def getUsers():
    """This function is querying user """
    with Session(engine) as session:
        statement = select(User).order_by(User.id)
                    
        results = session.exec(statement)

        data = results.all()
        
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


def insertRole(roles,approvalAmount):
    """This function is for """
    insertData = Role(roles=roles,approvalAmount=approvalAmount)
    

    session = Session(engine)

    session.add(insertData)
    
    session.commit()

    session.close()

def getRoles():
    """This function is querying user """
    with Session(engine) as session:
        statement = select(Role).order_by(Role.roles)
                    
        results = session.exec(statement) 

        data = results.all()
        
        return data

#===================================================USER ACCESS FUNCTION =======================================
from config.models import UserRoleAccessTagging

def insertaccess_tags(user_id,read_loan,
                        write_loan,read_deposit,write_deposit,read_withdrawal,
                        write_withdrawal,read_accounting,write_accounting,
                        read_accesstagging,write_accesstagging,read_accounts,
                        write_accounts,read_userLog,write_userLog):
    """This function is for insert user access tags"""

    try:
        session = Session(engine)
        session.begin()
        insertData = UserRoleAccessTagging(user_id=user_id,read_loan=read_loan,write_loan=write_loan,
                                            read_deposit=read_deposit,write_deposit=write_deposit,
                                            read_withdrawal=read_withdrawal,write_withdrawal=write_withdrawal,
                                            read_accounting=read_accounting,write_accounting=write_accounting,
                                            read_accesstagging=read_accesstagging,write_accesstagging=write_accesstagging,
                                            read_accounts=read_accounts,write_accounts=write_accounts,
                                            read_userLog=read_userLog,write_userLog=write_userLog)
        

        session = Session(engine)

        session.add(insertData)
        
        session.commit()

        

    except Exception as e:
        # Something went wrong, rollback the transaction
        session.rollback()
        raise Exception("Failed to update access tags: {}".format(str(e)))

    finally:
        # Close the session
        session.close()

def get_access_tags():
    """This function is for querying access tags"""
    with Session(engine) as session:
        statement = select(UserRoleAccessTagging)
                    
        results = session.exec(statement) 

        data = results.all()
        
        return data

def updateAccessTags(user_id, read_loan, write_loan, read_deposit, write_deposit, read_withdrawal,
                     write_withdrawal, read_accounting, write_accounting, read_accesstagging,
                     write_accesstagging, read_accounts, write_accounts, read_userLog, write_userLog,
                     date_updated, id):
    """This function is for updating access Tags"""

    try:
        with Session(engine) as session:
            session.begin()
            statement = select(UserRoleAccessTagging).where(UserRoleAccessTagging.id == id)
            results = session.exec(statement)
            result = results.one()

            result.user_id = user_id
            result.read_loan = read_loan
            result.write_loan = write_loan
            result.read_deposit = read_deposit
            result.write_deposit = write_deposit
            result.read_withdrawal = read_withdrawal
            result.write_withdrawal = write_withdrawal
            result.read_accounting = read_accounting
            result.write_accounting = write_accounting
            result.read_accesstagging = read_accesstagging
            result.write_accesstagging = write_accesstagging
            result.read_accounts = read_accounts
            result.write_accounts = write_accounts
            result.read_userLog = read_userLog
            result.write_userLog = write_userLog
            result.date_updated = date_updated

            # Commit the changes
            session.commit()

    except Exception as e:
        # Something went wrong, rollback the transaction
        session.rollback()
        raise Exception("Failed to update access tags: {}".format(str(e)))

    finally:
        # Close the session
        session.close()

#======================================================Branch===================================================
from config.models import Branch

def insertBranch(branch_name,branch_code,address):
    """This function is for inserting Branch"""

    try:
        session = Session(engine)
        session.begin()
        insertData = Branch(branch_name=branch_name,branch_code=branch_code,address=address)
        

        session = Session(engine)

        session.add(insertData)
        
        session.commit()

        

    except Exception as e:
        # Something went wrong, rollback the transaction
        session.rollback()
        raise Exception("Failed to update access tags: {}".format(str(e)))

    finally:
        # Close the session
        session.close()

def getBranch():
    """This function is for querying access tags"""
    with Session(engine) as session:
        statement = select(Branch)
                    
        results = session.exec(statement) 

        data = results.all()
        
        return data

#========================================This is for Account Type Transactions =========================================
from config.models import Accounttype
def insertAccountType(type_of_account,accountTypeCode,type_of_deposit):
    """This function is for inserting account type"""

    try:
        session = Session(engine)
        session.begin()

        insertData = Accounttype(type_of_account=type_of_account,accountTypeCode=accountTypeCode,
                                    type_of_deposit=type_of_deposit)
        

        session = Session(engine)

        session.add(insertData)
        
        session.commit()

        

    except Exception as e:
        # Something went wrong, rollback the transaction
        session.rollback()
        raise Exception("Failed to update access tags: {}".format(str(e)))

    finally:
        # Close the session
        session.close()
def getAccountType():
    """This function is for querying access tags"""
    with Session(engine) as session:
        statement = select(Accounttype)
                    
        results = session.exec(statement) 

        data = results.all()
        
        return data


#===================================================This is for Personal Info========================================
from config.models import PersonalInfo
def insertPersonalInfo( first_name,
                        middle_name,
                        last_name,
                        suffix,
                        date_of_birth,
                        age,
                        permanent_address,
                        length_stay,
                        civil_status,
                        contact_num,
                        email_add,
                        place_of_birth,
                        nationality,
                        religion,
                        tin,
                        sss_gsis_no,
                        philsys_no,
                        sex,
                        name_of_spouse_co_borrower,
                        date_of_birth_spouse,
                        age_spouse,
                        source_of_income,
                        date_of_business_registration,
                        dti_sec_registration_no,
                        brgy_mayor_permit_no,
                        principal_business_address,
                        nature_of_business,
                        number_of_branch,
                        business_address_ownership
                        ):
    """This function is for inserting Personal Info"""

    try:
        session = Session(engine)
        session.begin()

        insertData = PersonalInfo(first_name=first_name,
                        middle_name=middle_name,
                        last_name=last_name,
                        suffix=suffix,
                        date_of_birth=date_of_birth,
                        age=age,
                        permanent_address=permanent_address,
                        length_stay=length_stay,
                        civil_status=civil_status,
                        contact_num=contact_num,
                        email_add=contact_num,
                        place_of_birth=email_add,
                        nationality=place_of_birth,
                        religion=nationality,
                        tin=tin,
                        sss_gsis_no=sss_gsis_no,
                        philsys_no=philsys_no,
                        sex=sex,
                        name_of_spouse_co_borrower=name_of_spouse_co_borrower,
                        date_of_birth_spouse=date_of_birth_spouse,
                        age_spouse=age_spouse,
                        source_of_income=source_of_income,
                        date_of_business_registration=date_of_business_registration,
                        dti_sec_registration_no=dti_sec_registration_no,
                        brgy_mayor_permit_no=brgy_mayor_permit_no,
                        principal_business_address=principal_business_address,
                        nature_of_business=nature_of_business,
                        number_of_branch=number_of_branch,
                        business_address_ownership=business_address_ownership
                        )
        

        session = Session(engine)

        session.add(insertData)
        
        session.commit()

        

    except Exception as e:
        # Something went wrong, rollback the transaction
        session.rollback()
        raise Exception("Failed to update access tags: {}".format(str(e)))

    finally:
        # Close the session
        session.close()


def getPersonalInfo():
    """This is for qurying Personal Info"""

    with Session(engine) as session:
        statement = select(PersonalInfo)
                    
        results = session.exec(statement) 

        data = results.all()
        
        return data



#======================================This is for Accounts========================================
from config.models import Account
def insertAccount(personal_info_id,account_type_id,branch_id,account_number,account_name):
    """This function is for inserting account type"""

    try:
        session = Session(engine)
        session.begin()

        insertData = Account(personal_info_id=personal_info_id,
                             account_type_id=account_type_id,
                             branch_id=branch_id,
                             account_number=account_number,
                             account_name=account_name)
        

        session = Session(engine)

        session.add(insertData)
        
        session.commit()

        

    except Exception as e:
        # Something went wrong, rollback the transaction
        session.rollback()
        raise Exception("Failed to update access tags: {}".format(str(e)))

    finally:
        # Close the session
        session.close()

def getAccount():
    """This function is for querying access tags"""
    with Session(engine) as session:
        statement = select(Account)
                    
        results = session.exec(statement) 

        data = results.all()
        
        return data
    

def updateAccount(personal_info_id,account_type_id,branch_id,account_number,account_name,date_updated, id):
    """This function is for updating access Tags"""

    try:
        with Session(engine) as session:
            session.begin()
            statement = select(Account).where(Account.id == id)
            results = session.exec(statement)
            result = results.one()

            result.personal_info_id = personal_info_id
            result.account_type_id = account_type_id
            result.branch_id = branch_id
            result.account_number = account_number
            result.account_name = account_name
            result.date_updated = date_updated

            # Commit the changes
            session.commit()

    except Exception as e:
        # Something went wrong, rollback the transaction
        session.rollback()
        raise Exception("Failed to update access tags: {}".format(str(e)))

    finally:
        # Close the session
        session.close()
