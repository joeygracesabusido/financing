#!/bin/bash

# Loan Details Page Verification Script
# This script helps verify if the loan details page is working correctly

echo "=================================="
echo "Loan Details Page Verification"
echo "=================================="
echo ""

# Check if Docker is running
echo "1. Checking if Docker services are running..."
cd /home/jerome-sabusido/Desktop/financing/lending-mvp

docker-compose ps 2>/dev/null | tail -5
if [ $? -eq 0 ]; then
    echo "✅ Docker services appear to be running"
else
    echo "❌ Docker services not found. Starting them..."
    docker-compose up -d
    echo "⏳ Waiting for services to start..."
    sleep 10
fi

echo ""
echo "2. Checking MongoDB for loan data..."

# Check if any loans exist
LOAN_COUNT=$(docker-compose exec -T mongodb mongosh --eval "use financing_db; db.loans.countDocuments()" --quiet 2>/dev/null | tail -1)

if [ -z "$LOAN_COUNT" ] || [ "$LOAN_COUNT" -eq 0 ]; then
    echo "⚠️  No loans found in database"
    echo "   Trying to find sample loan..."
    SAMPLE_LOAN=$(docker-compose exec -T mongodb mongosh --eval "use financing_db; JSON.stringify(db.loans.findOne())" --quiet 2>/dev/null)
    if [ ! -z "$SAMPLE_LOAN" ]; then
        echo "✅ Found a loan: $SAMPLE_LOAN" | head -c 100
        echo "..."
    else
        echo "❌ Could not find any loans"
    fi
else
    echo "✅ Found $LOAN_COUNT loans in database"
    
    # Get first loan ID
    LOAN_ID=$(docker-compose exec -T mongodb mongosh --eval "use financing_db; print(db.loans.findOne()._id)" --quiet 2>/dev/null)
    echo "   Sample Loan ID: $LOAN_ID"
fi

echo ""
echo "3. Checking transaction counts..."

TX_COUNT=$(docker-compose exec -T mongodb mongosh --eval "use financing_db; db.loan_transactions.countDocuments()" --quiet 2>/dev/null | tail -1)

if [ -z "$TX_COUNT" ] || [ "$TX_COUNT" -eq 0 ]; then
    echo "⚠️  No transactions found in database"
else
    echo "✅ Found $TX_COUNT transactions in database"
fi

echo ""
echo "4. Testing GraphQL endpoint..."

# Try to connect to the backend
BACKEND_RESPONSE=$(curl -s -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"query":"query { __typename }"}' | head -c 100)

if [[ $BACKEND_RESPONSE == *"__typename"* ]] || [[ $BACKEND_RESPONSE == *"error"* ]]; then
    echo "✅ Backend GraphQL endpoint is responding"
else
    echo "⚠️  Backend GraphQL endpoint may not be responding correctly"
    echo "   Response: $BACKEND_RESPONSE"
fi

echo ""
echo "5. Checking Frontend..."

FRONTEND_RESPONSE=$(curl -s http://localhost:8080/loan_details.html | grep -c "Loan Details" || echo "0")

if [ "$FRONTEND_RESPONSE" -gt 0 ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend may not be accessible"
fi

echo ""
echo "=================================="
echo "Next Steps:"
echo "=================================="
echo ""
echo "1. Open loan details page:"
if [ ! -z "$LOAN_ID" ]; then
    echo "   http://localhost:8080/loan_details.html?id=$LOAN_ID"
else
    echo "   http://localhost:8080/loan_details.html?id=124578"
    echo "   (Replace 124578 with a valid loan ID)"
fi
echo ""
echo "2. Press F12 to open console"
echo ""
echo "3. Look for these success messages:"
echo "   ✅ Token exists"
echo "   ✅ All loan details updated successfully"
echo "   ✅ Transaction count: X"
echo "   ✅ Table population complete"
echo ""
echo "4. Verify these fields are displayed (not '-'):"
echo "   - Borrower Name"
echo "   - Loan Product"
echo "   - Status"
echo "   - Interest Rate"
echo "   - Term (Months)"
echo "   - Transaction History table"
echo ""
echo "For detailed guide, see: LOAN_DETAILS_PAGE_FIX.md"
echo ""
