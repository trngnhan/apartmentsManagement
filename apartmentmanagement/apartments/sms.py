Account_SID = "AC9c0c7c35b5c55b0ef6a4f40b49f9ee97"
Auth_Token = "58e3b1f70799d77236755f561060a080"
"+18777804236"
"16169208375"
from twilio.rest import Client

def send_sms(to_phone_number, message):
    print(f"Đang gửi SMS đến: {to_phone_number} với nội dung: {message}")
    account_sid = ''
    auth_token = ''
    client = Client(account_sid, auth_token)

    try:
        sms = client.messages.create(
            body=message,
            from_='+16169208375',  # Số điện thoại Twilio
            to=to_phone_number
        )
        print("SMS sent successfully:", sms.sid)
    except Exception as e:
        print("Failed to send SMS:", str(e))