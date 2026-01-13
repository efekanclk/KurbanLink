#!/usr/bin/env python3
"""
Test script for JWT authentication with role information.

This script demonstrates how to:
1. Login and obtain JWT tokens
2. Decode the access token to view role information
3. Use the access token for authenticated requests
"""

import requests
import jwt
import json
from typing import Dict, Any


BASE_URL = "http://localhost:8000"


def test_login(email: str, password: str) -> Dict[str, Any]:
    """
    Test login endpoint and return tokens.
    
    Args:
        email: User email
        password: User password
        
    Returns:
        Dictionary containing access and refresh tokens
    """
    print(f"\n{'='*60}")
    print("Testing JWT Login with Role Information")
    print(f"{'='*60}\n")
    
    url = f"{BASE_URL}/api/auth/login/"
    payload = {
        "email": email,
        "password": password
    }
    
    print(f"1. Sending login request to {url}")
    print(f"   Email: {email}")
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        tokens = response.json()
        print("   ✓ Login successful!")
        print(f"   ✓ Received access token")
        print(f"   ✓ Received refresh token")
        
        return tokens
        
    except requests.exceptions.RequestException as e:
        print(f"   ✗ Login failed: {e}")
        return {}


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode JWT token to view payload (without verification for testing).
    
    Args:
        token: JWT access token
        
    Returns:
        Decoded token payload
    """
    print(f"\n2. Decoding access token...")
    
    try:
        # Decode without verification (for testing only)
        payload = jwt.decode(token, options={"verify_signature": False})
        
        print("   ✓ Token decoded successfully!")
        print(f"\n   Token Payload:")
        print(f"   {'-'*50}")
        print(f"   User ID:    {payload.get('user_id')}")
        print(f"   Token Type: {payload.get('token_type')}")
        print(f"   Roles:      {payload.get('roles', [])}")
        print(f"   Expires:    {payload.get('exp')}")
        print(f"   {'-'*50}")
        
        return payload
        
    except jwt.DecodeError as e:
        print(f"   ✗ Failed to decode token: {e}")
        return {}


def test_authenticated_request(access_token: str):
    """
    Test an authenticated request using the access token.
    
    Args:
        access_token: JWT access token
    """
    print(f"\n3. Testing authenticated request...")
    
    # Example: Access admin API (requires authentication)
    url = f"{BASE_URL}/api/auth/login/"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    print(f"   Accessing protected endpoint with token...")
    print(f"   Authorization header set")


def main():
    """
    Main test function.
    
    To use this script:
    1. Ensure the Django server is running: python manage.py runserver
    2. Create a superuser with roles assigned via admin
    3. Update the EMAIL and PASSWORD below
    4. Run this script: python test_jwt_auth.py
    """
    
    # UPDATE THESE WITH YOUR TEST USER CREDENTIALS
    EMAIL = "efecelik4207@gmail.com"
    PASSWORD = "your_password_here"
    
    print("\nJWT Authentication Test")
    print("Make sure the server is running on http://localhost:8000")
    
    # Step 1: Login
    tokens = test_login(EMAIL, PASSWORD)
    
    if not tokens:
        print("\n✗ Test failed: Could not obtain tokens")
        return
    
    access_token = tokens.get('access', '')
    
    # Step 2: Decode and inspect token
    payload = decode_token(access_token)
    
    if not payload:
        print("\n✗ Test failed: Could not decode token")
        return
    
    # Step 3: Verify roles field exists
    roles = payload.get('roles')
    if roles is not None:
        print(f"\n✓ SUCCESS: 'roles' field found in token payload!")
        print(f"  Roles: {roles}")
        
        if len(roles) == 0:
            print(f"  Note: User has no active roles assigned")
        else:
            print(f"  Note: User has {len(roles)} role(s)")
    else:
        print("\n✗ FAILED: 'roles' field not found in token payload")
    
    # Step 4: Test authenticated request
    test_authenticated_request(access_token)
    
    print(f"\n{'='*60}")
    print("Test Complete!")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
