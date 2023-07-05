import strawberry
from typing import Optional,List

from datetime import datetime


from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



from config.models import User,Role



from views.views import (getRoles,getuser,insertRole,get_access_tags,
                        updateAccessTags,insertBranch,getBranch,
                        insertAccountType,getAccountType,insertAccount,
                        getAccount,updateAccount,getPersonalInfo)



from routes.strawberryBasemodel import (RoleType,User,Useraccesstags,
                                            Branch,BranchAutoComplete,AccountType,
                                            UserInput,AccountList,PersonalInfoAutoComplete)


@strawberry.type
class Query:
    # @strawberry.field
    # async def getcurrentUser(current_user: Annotated[User, Depends(has_permission)]) -> User:
    #     return current_user

    
    @strawberry.field
    async def authenticated_user(self, info,username: str, password: str) -> User:
        user = getuser(username=username)
        if user:
            username = user.username
            hashed_password = user.hashed_password
            password_check = pwd_context.verify(password, hashed_password)
            if password_check:
                return User(username=username)
        return None

        

    #
    
    @strawberry.field
    async def roles(self) -> List[RoleType]:
        

        
    
        data = getRoles()
        
        # for role in data:
        #     id = role.id
        #     print(id)
        # Convert the data to RoleType objects
        role_types = [RoleType(id=role.id, 
                            roles=role.roles, approvalAmount=role.approvalAmount,
                            date_credited=role.date_credited
                            ) for role in data]
    
    
        return role_types
    
    @strawberry.field # this is for getting the approval amount for roles
    async def getrolesApprovalAmount(self,
                                    min_approval_amount: Optional[int] = None,
                                    max_approval_amount: Optional[int] = None
                                ) -> List[RoleType]:
        data = getRoles()

        if min_approval_amount is not None:
            # Filter the data based on the minimum approval amount
            data = [role for role in data if role.approvalAmount >= min_approval_amount]

        if max_approval_amount is not None:
            # Filter the data based on the maximum approval amount
            data = [role for role in data if role.approvalAmount <= max_approval_amount]

        role_types = [
            RoleType(
                id=role.id,
                roles=role.roles,
                approvalAmount=role.approvalAmount,
                date_credited=role.date_credited
            ) for role in data
        ]

        return role_types

    
 

    @strawberry.field
    async def getUserWithID(self,info,username: str) -> User:
        """This function is for Querying user tru username"""
        user = getuser(username=username)

        return user
    @strawberry.field
    async def userAccestags_graphql(self,info) -> List[Useraccesstags]:
        """This function is for Querying Useraccesstagas"""
        data = get_access_tags()

        accesstags = [Useraccesstags(id=x.id,
                        user_id=x.user_id,
                        read_loan=x.read_loan,
                        write_loan=x.read_loan,
                        read_deposit=x.read_deposit,
                        write_deposit=x.write_deposit,
                        read_withdrawal=x.read_withdrawal,
                        write_withdrawal=x.write_withdrawal,
                        read_accounting=x.read_accounting,
                        write_accounting=x.write_accounting,
                        read_accesstagging=x.read_accesstagging,
                        write_accesstagging=x.write_accesstagging,
                        read_accounts=x.read_accounts,
                        write_accounts=x.write_accounts,
                        read_userLog=x.read_userLog,
                        write_userLog=x.write_userLog)for x in data]
        return accesstags


    @strawberry.field # this is to query Branches
    async def getBranchGraphql(self, info) -> List[Branch]:
        """this is to query Branches"""
        data = getBranch()
        
       
        branch_types = [Branch(id=x.id, 
                               branch_name=x.branch_name,
                               branch_code=x.branch_code,
                               address=x.address
                               ) for x in data]
       
       
        return branch_types

    @strawberry.field # this is to query Branches
    async def getBranchGraphql_autocomplete(self, info) -> List[BranchAutoComplete]:
        """this is to query Branches"""
        data = getBranch()
        
       
        branch_types = [BranchAutoComplete( 
                               branch_name=x.branch_name,
                               
                               ) for x in data]
       
       
        return branch_types

    @strawberry.field # this is for querying in Branches with parameters of branch Name
    async def searchBranch(self, search_term: str) -> List[Branch]:

        """this is for querying in Branches with parameters of branch Name"""
        branches = getBranch()
    

        filtered_branches = list(filter(lambda branch: search_term.lower() in branch.branch_name.lower(), branches))

        return filtered_branches


    @strawberry.field # this is to query Branches
    async def getAccountTypeGraphql(self, info) -> List[AccountType]:
        """this is to query Branches"""
        data = getAccountType()
        
       
        accont_type = [AccountType(id=x.id,
                                    accountTypeCode=x.accountTypeCode,
                                    type_of_account=x.type_of_account,
                                    type_of_deposit=x.type_of_deposit
                               ) for x in data]
       
       
        return accont_type

    @strawberry.field # this is for querying in  with parameters of branch Name
    async def searchAccounttype(self, search_term: str) -> List[AccountType]:

        """this is for querying in Branches with parameters of branch Name for Autocomplete"""
        accountTypes = getAccountType()

        filtered_branches = list(filter(lambda accounttype: search_term.lower() in accounttype.type_of_deposit.lower(), accountTypes))

        return filtered_branches
    
    
    


    @strawberry.field # this is to query Accounts
    async def getAccount_grphql(self) -> List[AccountList]:
        """this is to query Branches"""
        data = getAccount()
        
       
        account_list = [AccountList(id=x.id,
                                    account_number=x.account_number,
                                    account_name=x.account_name,
                                    status=x.status
                               ) for x in data]
       
       
        return account_list

    # @strawberry.field
    # async def get_authenticated_user(self, info: Info) -> User | None:
    #     return info.context.user

    
    @strawberry.field # this is for autocomplete of Personal Info
    async def getPersonalInfoGraphql(self, search_term: str) -> List[PersonalInfoAutoComplete]:
        data = getPersonalInfo()
        print(data)
        # filtered_names = list(filter(lambda name: search_term.lower() in name.last_name.lower(), data))

        filtered_names = list(
        filter(
                lambda name: (
                        search_term.lower() in name.last_name.lower()
                        or search_term.lower() in name.first_name.lower()
                    ),
                    data,
                )
            )

        full_names = []
        for name in filtered_names:
            full_name = f"{name.id},{name.last_name}, {name.first_name} {name.middle_name}"
            full_names.append(PersonalInfoAutoComplete(first_name=full_name, middle_name="", last_name=""))

        return full_names

        # full_names = []
        # for name in filtered_names:
        #     full_name = f"{name.last_name}, {name.first_name} {name.middle_name}"
        #     full_names.append(PersonalInfoAutoComplete(first_name=name.first_name, middle_name=name.middle_name, last_name=name.last_name))
            
        # return full_names
        # print(filtered_names)
        # result = []
        # for name in filtered_names:
        #     full_name = name.last_name + ', ' + name.first_name + ' ' + name.middle_name
        #     result.append(PersonalInfoAutoComplete(last_name=name.last_name, first_name=name.first_name, middle_name=name.middle_name))

        # return result

        # result = []
        # for name in filtered_names:
        #     full_name = name.last_name + ', ' + name.first_name + ' ' + name.middle_name
        #     result.append(full_name)

        # return result

        # full_names = []
        # for name in filtered_names:
        #     # full_name = f"{name.lastName}, {name.firstName} {name.middleName}"
        #     full_name = f"{name.last_name}, {name.middle_name}"
        
        #     full_names.append(full_name)

        # return full_names


        # person = PersonalInfoAutoComplete(
        #         first_name='jerome',
        #         middle_name='Recalde',
        #         last_name='y',
        #     )

        # full_names = []
        # for name in filtered_names:
        #     full_name = f"{name.last_name}, {name.first_name} {name.middle_name}"
        #     full_names.append(PersonalInfoAutoComplete(first_name=name.first_name, middle_name=name.middle_name, last_name=name.last_name))

        # return full_name

       

    
       
