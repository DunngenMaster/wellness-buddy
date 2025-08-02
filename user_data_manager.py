import json
import os
from datetime import datetime
from typing import Dict, List, Optional

class UserDataManager:
    def __init__(self, data_file: str = "user_profiles.json"):
        self.data_file = data_file
        self.users = self._load_users()
    
    def _load_users(self) -> Dict:
        """Load existing user data from JSON file"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    return json.load(f)
            else:
                # Create initial structure
                initial_data = {
                    "users": {},
                    "metadata": {
                        "created": datetime.now().isoformat(),
                        "total_users": 0,
                        "last_updated": datetime.now().isoformat()
                    }
                }
                self._save_users(initial_data)
                return initial_data
        except Exception as e:
            print(f"Error loading user data: {e}")
            return {"users": {}, "metadata": {"created": datetime.now().isoformat(), "total_users": 0}}
    
    def _save_users(self, data: Dict):
        """Save user data to JSON file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving user data: {e}")
    
    def save_user_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Save or update a user profile"""
        try:
            # Add metadata
            profile_data['last_updated'] = datetime.now().isoformat()
            profile_data['user_id'] = user_id
            
            # Save to users dict
            self.users['users'][user_id] = profile_data
            
            # Update metadata
            self.users['metadata']['total_users'] = len(self.users['users'])
            self.users['metadata']['last_updated'] = datetime.now().isoformat()
            
            # Save to file
            self._save_users(self.users)
            
            print(f"✅ User profile saved: {user_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving user profile: {e}")
            return False
    
    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get a user profile by ID"""
        try:
            return self.users['users'].get(user_id)
        except Exception as e:
            print(f"❌ Error getting user profile: {e}")
            return None
    
    def get_all_users(self) -> List[Dict]:
        """Get all user profiles"""
        try:
            return list(self.users['users'].values())
        except Exception as e:
            print(f"❌ Error getting all users: {e}")
            return []
    
    def delete_user_profile(self, user_id: str) -> bool:
        """Delete a user profile"""
        try:
            if user_id in self.users['users']:
                del self.users['users'][user_id]
                self.users['metadata']['total_users'] = len(self.users['users'])
                self.users['metadata']['last_updated'] = datetime.now().isoformat()
                self._save_users(self.users)
                print(f"✅ User profile deleted: {user_id}")
                return True
            else:
                print(f"⚠️ User not found: {user_id}")
                return False
        except Exception as e:
            print(f"❌ Error deleting user profile: {e}")
            return False
    


# Global instance
user_manager = UserDataManager() 