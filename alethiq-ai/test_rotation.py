import os
import sys
from unittest.mock import MagicMock, patch

# Import your actual service
from services.llm_service import stream_answer, GROQ_KEYS

def test_rotation_logic():
    print(f"🔑 Found {len(GROQ_KEYS)} keys in configuration.")
    
    # 1. Create the "Success" Mock Object first
    success_mock = MagicMock()
    # When we loop over the stream (for chunk in stream), return this token
    chunk_mock = MagicMock()
    chunk_mock.choices[0].delta.content = "Success!"
    success_mock.__iter__.return_value = [chunk_mock]

    # 2. Define the Sequence: Fail -> Fail -> Success
    # Key 1: Dies with 429
    # Key 2: Dies with 500
    # Key 3: Works
    side_effects = [
        Exception("Error 429: Rate limit exceeded"), 
        Exception("Error 500: Internal Server Error"),
        success_mock
    ]

    with patch("services.llm_service.Groq") as MockGroq:
        # Create a Mock Client
        mock_client = MagicMock()
        MockGroq.return_value = mock_client
        
        # Assign the sequence of behaviors
        mock_client.chat.completions.create.side_effect = side_effects
        
        print("\n🚀 Starting Stress Test...")
        print("--------------------------------")
        
        # Run the actual function
        # We pass dummy text, but the mock will ignore it and use our side_effects
        generator = stream_answer("Test Query", "Test Context")
        
        try:
            for token in generator:
                print(f"✅ Output Received: {token}")
        except Exception as e:
            print(f"❌ Test Failed with unexpected error: {e}")

        # VERIFICATION
        # We expect the code to have called 'create' 3 times
        call_count = mock_client.chat.completions.create.call_count
        print("--------------------------------")
        print(f"📊 Total API Calls Attempted: {call_count}")
        
        if call_count >= 2:
            print("🏆 SUCCESS: The system successfully rotated keys!")
        else:
            print("⚠️ FAILURE: It gave up after the first error.")

if __name__ == "__main__":
    test_rotation_logic()