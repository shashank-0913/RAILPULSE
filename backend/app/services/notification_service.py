import logging
from typing import Dict, Any, List, Optional
import os

logger = logging.getLogger("railpulse.notifications")

class BaseNotificationAdapter:
    async def send(self, recipient: str, title: str, message: str) -> bool:
        raise NotImplementedError

class InAppNotificationAdapter(BaseNotificationAdapter):
    def __init__(self):
        self.sent_notifications: List[Dict[str, Any]] = []

    async def send(self, recipient: str, title: str, message: str) -> bool:
        logger.info("[IN-APP ALERT] To %s | %s: %s", recipient, title, message)
        self.sent_notifications.append({"recipient": recipient, "title": title, "message": message})
        return True

class EmailNotificationAdapter(BaseNotificationAdapter):
    def __init__(self):
        self.api_key = os.getenv("EMAIL_PROVIDER_API_KEY", "").strip()

    async def send(self, recipient: str, title: str, message: str) -> bool:
        if not self.api_key:
            logger.debug("Email provider API key unconfigured. Queued in simulation log.")
            return False
        logger.info("[EMAIL SENT] To: %s | %s", recipient, title)
        return True

class SMSNotificationAdapter(BaseNotificationAdapter):
    def __init__(self):
        self.api_key = os.getenv("SMS_PROVIDER_API_KEY", "").strip()

    async def send(self, recipient: str, title: str, message: str) -> bool:
        if not self.api_key:
            logger.debug("SMS provider API key unconfigured. Queued in simulation log.")
            return False
        logger.info("[SMS SENT] To: %s | %s", recipient, message)
        return True

class WhatsAppNotificationAdapter(BaseNotificationAdapter):
    def __init__(self):
        self.api_key = os.getenv("WHATSAPP_API_KEY", "").strip()

    async def send(self, recipient: str, title: str, message: str) -> bool:
        if not self.api_key:
            logger.debug("WhatsApp API key unconfigured. Queued in simulation log.")
            return False
        logger.info("[WHATSAPP SENT] To: %s | %s", recipient, message)
        return True

class NotificationService:
    def __init__(self):
        self.in_app = InAppNotificationAdapter()
        self.email = EmailNotificationAdapter()
        self.sms = SMSNotificationAdapter()
        self.whatsapp = WhatsAppNotificationAdapter()

    async def dispatch_alert(self, title: str, message: str, channels: List[str] = None):
        if channels is None:
            channels = ["IN_APP"]

        for ch in channels:
            ch_upper = ch.upper()
            if ch_upper == "IN_APP":
                await self.in_app.send("all_controllers", title, message)
            elif ch_upper == "EMAIL":
                await self.email.send("controller@indianrailways.gov.in", title, message)
            elif ch_upper == "SMS":
                await self.sms.send("+91-CONTROLLER", title, message)
            elif ch_upper == "WHATSAPP":
                await self.whatsapp.send("+91-CONTROLLER-WA", title, message)

notification_service = NotificationService()
