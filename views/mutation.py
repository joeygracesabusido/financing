import strawberry
from typing import Optional,List

from datetime import datetime, date


from config.models import User,Role

from views.views import (getRoles,getuser,insertRole,get_access_tags,
                        updateAccessTags,insertBranch,getBranch,
                        insertAccountType,getAccountType,insertAccount,
                        getAccount,updateAccount,getPersonalInfo,insertPersonalInfo)



from routes.strawberryBasemodel import (RoleType,User,Useraccesstags,
                                            Branch,BranchAutoComplete,AccountType,
                                            UserInput,AccountList,PersonalInfoAutoComplete)


#=================================================Mutation space=======================================================
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def insertRole_grphql(self, info,roles: str,approvalAmount: float,
                                ) -> str:
        """This function is to insert or roles to database"""

        result = insertRole(roles=roles,approvalAmount=approvalAmount)
        return str('Data has been Save')

    @strawberry.mutation
    async def updateAccess(self, info,   # this is for update function
                                        user_id: int,
                                        read_loan: bool,
                                        write_loan: bool,
                                        read_deposit: bool,
                                        write_deposit: bool,
                                        read_withdrawal: bool,
                                        write_withdrawal: bool,
                                        read_accounting: bool,
                                        write_accounting: bool,
                                        read_accesstagging: bool, 
                                        write_accesstagging: bool,
                                        read_accounts: bool, 
                                        write_accounts: bool,
                                        read_userLog: bool, 
                                        write_userLog: bool,
                                        id:int
                                ) -> str:
        """This function is to insert or roles to database"""
        current_datetime = datetime.now()
        date_updated = current_datetime.isoformat()

        try:
            result = updateAccessTags(id=id, user_id=user_id,
                                            read_loan=read_loan,
                                            write_loan=write_loan,
                                            read_deposit=read_deposit,
                                            write_deposit=write_deposit,
                                            read_withdrawal=read_withdrawal,
                                            write_withdrawal=write_withdrawal,
                                            read_accounting=read_accounting,
                                            write_accounting=write_accounting,
                                            read_accesstagging=read_accesstagging,
                                            write_accesstagging=write_accesstagging,
                                            read_accounts=read_accounts,
                                            write_accounts=write_accounts,
                                            read_userLog=read_userLog,
                                            write_userLog=write_userLog,
                                            date_updated=date_updated)

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been updated')


    @strawberry.mutation # this is for inserting Branch
    async def insertBranchGraphql(self, info, branch_name: str, branch_code: str, address:str) -> str:
        """This function is for inserting Branch"""
        try:
            if len(branch_code) != 3 or not branch_code.isdigit():
                raise Exception("Branch code should be a 3-digit number")
            result = insertBranch(branch_code=branch_code,address=address,branch_name=branch_name)
        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')

    @strawberry.mutation # this is for inserting Account Type
    async def insertAccountTypeGraphql(self, info, accountTypeCode: str, type_of_account: str, type_of_deposit:str) -> str:
        """This function is for inserting Account"""
        try:
            if len(accountTypeCode) != 2 or not accountTypeCode.isdigit():
                raise Exception("AccountTypeCode code should be a 2-digit number")
            result = insertAccountType(accountTypeCode=accountTypeCode,
                                        type_of_account=type_of_account,
                                        type_of_deposit=type_of_deposit)
        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')

    # #==================================Login==================================
    # @strawberry.mutation
    # async def login(self, username: str, password: str) -> LoginResult:
    #     user = getuser(username=username)
        
    #     if user:
    #         username = user.username
    #         hashed_password = user.hashed_password
           

    #         password_check = pwd_context.verify(password, hashed_password)
    #         if password_check:
    #             return LoginSuccess(user=User(username=username))
    #             # return username

    #     return LoginError(message="Invalid username or password") 

#=====================================insert Personal Info====================================
    
    @strawberry.mutation
    async def insertPersonalInfo_gql(first_name:str,
                        middle_name: str,
                        last_name:str,
                        suffix:str,
                        date_of_birth:date,
                        age:int,
                        permanent_address:str,
                        length_stay:int,
                        civil_status:str,
                        contact_num:str,
                        email_add:str,
                        place_of_birth:str,
                        nationality:str,
                        religion:str,
                        tin:str,
                        sss_gsis_no:str,
                        philsys_no:str,
                        sex:str,
                        name_of_spouse_co_borrower:str,
                        date_of_birth_spouse:date,
                        age_spouse:str,
                        source_of_income:str,
                        date_of_business_registration:str,
                        dti_sec_registration_no:str,
                        brgy_mayor_permit_no:str,
                        principal_business_address:str,
                        nature_of_business:str,
                        number_of_branch:int,
                        business_address_ownership:str,
                        ) -> str:
        """This function is for inserting Personal info for Accounts"""

        current_datetime = datetime.now()
        date_updated = current_datetime.isoformat()

        try:
            result = insertPersonalInfo(first_name=first_name,
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

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')
    

    #=====================================insert Accounts====================================
    
    @strawberry.mutation
    async def insertAccount_gql(personal_info_id: int,account_type_id: int,
                                branch_id: int,account_name: str,accountTypeCode: str
                        ) -> str:
        """This function is for inserting Personal info for Accounts"""

        branch = getBranch()
        
        
        account_type =  getAccountType()
        account = getAccount()

        # Find the branch with the given ID
        # selected_branch = next((b for b in branch if b[0]["id"] == branch_id), None)
        selected_branch = next((b for b in branch if b.id == branch_id), None)
        # print(selected_branch.id)
        # Find the account type with the given ID
        selected_account_type = next((a for a in account_type if a.accountTypeCode == accountTypeCode), None)
        # print(selected_account_type.accountTypeCode)

        if selected_branch and selected_account_type:
            # Generate account number with an incrementing last digit
            branchcode = selected_branch.branch_code
            accountTypeCode = selected_account_type.accountTypeCode
            accountTypeCode_id = selected_account_type.id

            existing_accounts = [acc for acc in account if acc.branch_id == branch_id and acc.account_type_id == account_type_id]
            # print(existing_accounts)
            if existing_accounts:
                last_account_number = max(existing_accounts, key=lambda x: int(x.account_number))
                last_digit = int(last_account_number.account_number[-7:])
                incremented_last_digit = last_digit + 1
                account_number = f"{branchcode:03}{accountTypeCode:02}{incremented_last_digit:07}"
            else:
                account_number = f"{branchcode:03}{accountTypeCode:02}0000001"

                        # Ensure account number is always 12 digits
            account_number = account_number.zfill(12)

            # print(account_number)
        
        # if selected_branch and selected_account_type:
        #     # Generate account number with an incrementing last digit
        #     account_number = f"{selected_branch.branch_code}{selected_account_type.accountTypeCode}0000001"
        #     if account:
        #         last_account = account[-1]
        #         last_account_number = last_account.account_number
        #         last_digit = int(last_account_number[-1])
        #         incremented_last_digit = last_digit + 1
        #         account_number = f"{selected_branch.branch_code}{selected_account_type.accountTypeCode}000000{incremented_last_digit:03}"

        # current_datetime = datetime.now()
        # date_updated = current_datetime.isoformat()

        # print(personal_info_id,account_number)

        try:
            result = insertAccount( personal_info_id=personal_info_id,
                             account_type_id=account_type_id,
                             branch_id=branch_id,
                             account_number=account_number,
                             account_name=account_name
                        )

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been Save')

#=================================This is for Updating Account ===================================
    @strawberry.mutation
    async def updateAccount_graphql(self, info,   # this is for update function
                                        personal_info_id: int,
                                        account_type_id: int,
                                        branch_id: int,
                                        # account_number: str,
                                        account_name: str, 
                                        accountTypeCode: str, 
                                        id:int
                                ) -> str:
        """This function is to insert or roles to database"""
        current_datetime = datetime.now()
        date_updated = current_datetime.isoformat()

        branch = getBranch()
        
        
        account_type =  getAccountType()
        account = getAccount()

        # Find the branch with the given ID
        # selected_branch = next((b for b in branch if b[0]["id"] == branch_id), None)
        selected_branch = next((b for b in branch if b.id == branch_id), None)
        
        # Find the account type with the given ID
        selected_account_type = next((a for a in account_type if a.accountTypeCode == accountTypeCode), None)
        # print(selected_account_type.accountTypeCode)
        if selected_branch and selected_account_type:
            # Generate account number with an incrementing last digit
            branchcode = selected_branch.branch_code
            accountTypeCode = selected_account_type.accountTypeCode
            accountTypeCode_id = selected_account_type.id

            existing_accounts = [acc for acc in account if acc.branch_id == branch_id and acc.account_type_id == account_type_id]
            # print(existing_accounts)
            if existing_accounts:
                last_account_number = max(existing_accounts, key=lambda x: int(x.account_number))
                last_digit = int(last_account_number.account_number[-7:])
                incremented_last_digit = last_digit + 1
                account_number = f"{branchcode:03}{accountTypeCode:02}{incremented_last_digit:07}"
            else:
                account_number = f"{branchcode:03}{accountTypeCode:02}0000001"

                        # Ensure account number is always 12 digits
            
        
            account_number = account_number.zfill(12)

            print(account_number)

        try:
            result = updateAccount(id=id, 
                                        personal_info_id=personal_info_id,
                                        account_type_id=account_type_id,
                                        branch_id=branch_id,
                                        account_number=account_number,
                                        account_name=account_name,  
                                            date_updated=date_updated)

        except Exception as e:
            return str('Error: {}'.format(str(e)))
        return str('Data has been updated')

     