from twilio.rest import Client
import os
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")

def send_sms(to_phone_number, message):
    print(f"Đang gửi SMS đến: {to_phone_number} với nội dung: {message}")
    account_sid = ''
    auth_token = ''
    client = Client(account_sid, auth_token)

    try:
        sms = client.messages.create(
            body=message,
            from_='',  # Số điện thoại Twilio
            to=to_phone_number
        )
        print("SMS sent successfully:", sms.sid)
    except Exception as e:
        print("Failed to send SMS:", str(e))