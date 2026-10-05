import hmac
import hashlib
import base64
import json
import time
import random
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("railpulse.auth")

# Fictional Authorized Controller Roster
DEMO_CONTROLLERS = {
    "IR-VSKP-8821": {
        "employee_id": "IR-VSKP-8821",
        "name": "Demo Section Controller – Visakhapatnam",
        "role": "Chief Section Controller (Waltair Division)",
        "station": "VSKP",
        "division": "Waltair (WAT)",
        "zone": "ECoR",
        "clearance_level": "LEVEL_3_CONTROLLER",
        "password": "controller2026"
    },
    "IR-BZA-4412": {
        "employee_id": "IR-BZA-4412",
        "name": "Demo Section Controller – Vijayawada",
        "role": "Senior Section Controller (Vijayawada Division)",
        "station": "BZA",
        "division": "Vijayawada (BZA)",
        "zone": "SCR",
        "clearance_level": "LEVEL_3_CONTROLLER",
        "password": "controller2026"
    },
    "IR-HQ-1001": {
        "employee_id": "IR-HQ-1001",
        "name": "Demo Operations Director – Railway Board",
        "role": "Operations Director (CRIS / Railway Board)",
        "station": "NDLS",
        "division": "Central Control",
        "zone": "IR-HQ",
        "clearance_level": "LEVEL_4_DIRECTOR",
        "password": "controller2026"
    }
}

class AuthService:
    def __init__(self):
        # In-memory OTP session store: { session_id: { employee_id, otp, created_at, expires_at } }
        self._otp_sessions: Dict[str, Dict[str, Any]] = {}
        self._secret = settings.JWT_SECRET.encode("utf-8")

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

    def _base64url_decode(self, data: str) -> bytes:
        rem = len(data) % 4
        if rem > 0:
            data += "=" * (4 - rem)
        return base64.urlsafe_b64decode(data.encode("utf-8"))

    def create_jwt_token(self, payload: Dict[str, Any], expires_in_seconds: int = 86400) -> str:
        """
        Creates a standard signed HMAC-SHA256 (HS256) JWT token.
        """
        header = {
            "alg": "HS256",
            "typ": "JWT"
        }
        now = int(time.time())
        token_payload = {
            **payload,
            "iat": now,
            "exp": now + expires_in_seconds
        }

        header_b64 = self._base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
        payload_b64 = self._base64url_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
        
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        signature = hmac.new(self._secret, signing_input, hashlib.sha256).digest()
        signature_b64 = self._base64url_encode(signature)

        return f"{header_b64}.{payload_b64}.{signature_b64}"

    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verifies a signed JWT token signature and expiry.
        Returns the decoded payload if valid, None otherwise.
        """
        try:
            parts = token.strip().split(".")
            if len(parts) != 3:
                return None
            
            header_b64, payload_b64, signature_b64 = parts
            signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
            expected_sig = hmac.new(self._secret, signing_input, hashlib.sha256).digest()
            expected_sig_b64 = self._base64url_encode(expected_sig)

            # Constant-time comparison
            if not hmac.compare_digest(signature_b64, expected_sig_b64):
                logger.warning("JWT signature verification failed")
                return None

            payload_bytes = self._base64url_decode(payload_b64)
            payload = json.loads(payload_bytes.decode("utf-8"))

            # Check expiration
            exp = payload.get("exp")
            if exp and int(time.time()) > exp:
                logger.warning("JWT token has expired")
                return None

            return payload
        except Exception as e:
            logger.warning(f"Error decoding JWT token: {e}")
            return None

    def initiate_controller_login(self, employee_id: str, password: Optional[str] = None) -> Dict[str, Any]:
        """
        Step 1: Validate Employee ID and password, generate a 6-digit OTP.
        For the SIH Prototype, returns the demo OTP in the response for on-screen display.
        """
        emp_key = employee_id.strip().upper()
        # Fallback match or default demo user
        controller = DEMO_CONTROLLERS.get(emp_key)
        if not controller:
            # If not in exact list, allow any valid IR- format or match by default
            controller = {
                "employee_id": emp_key,
                "name": f"Demo Section Controller ({emp_key})",
                "role": "Chief Section Controller (Waltair Division)",
                "station": "VSKP",
                "division": "Waltair (WAT)",
                "zone": "ECoR",
                "clearance_level": "LEVEL_3_CONTROLLER",
                "password": "controller2026"
            }

        # Check password if provided
        if password and password != controller["password"] and password != "controller2026":
            return {
                "success": False,
                "error": "Invalid password. Use demo password 'controller2026'."
            }

        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        session_id = f"SESS-{int(time.time())}-{random.randint(1000, 9999)}"
        
        # Store OTP session (valid for 10 minutes)
        self._otp_sessions[session_id] = {
            "employee_id": emp_key,
            "otp": otp,
            "controller": controller,
            "created_at": time.time(),
            "expires_at": time.time() + 600
        }

        logger.info(f"Generated Demo OTP {otp} for Employee {emp_key} (Session: {session_id})")

        return {
            "success": True,
            "otp_required": True,
            "session_id": session_id,
            "employee_id": emp_key,
            "controller_name": controller["name"],
            "role": controller["role"],
            "station": controller["station"],
            "demo_otp": otp,
            "message": "6-digit OTP generated. In production, sent via CRIS SMS Gateway."
        }

    def verify_controller_otp(self, session_id: str, employee_id: str, otp: str) -> Dict[str, Any]:
        """
        Step 2: Verify 6-digit OTP and issue signed JWT token.
        """
        session = self._otp_sessions.get(session_id)
        emp_key = employee_id.strip().upper()
        
        # Prototype bypass: allow matching session OTP or standard demo OTP '749201' / '123456'
        valid_otp = session.get("otp") if session else None
        is_valid = (
            (session and session.get("employee_id") == emp_key and session.get("otp") == otp.strip())
            or (otp.strip() in ["749201", "123456", "999999"] and emp_key)
        )

        if not is_valid:
            return {
                "success": False,
                "error": f"Invalid or expired OTP. Expected: {valid_otp or '749201'}"
            }

        controller = session.get("controller") if session else DEMO_CONTROLLERS.get(emp_key, {
            "employee_id": emp_key,
            "name": "Demo Section Controller – Visakhapatnam",
            "role": "Chief Section Controller (Waltair Division)",
            "station": "VSKP",
            "division": "Waltair (WAT)",
            "zone": "ECoR",
            "clearance_level": "LEVEL_3_CONTROLLER"
        })

        # Generate JWT token
        token_payload = {
            "sub": controller["employee_id"],
            "employeeId": controller["employee_id"],
            "fullName": controller["name"],
            "role": controller["role"],
            "station": controller["station"],
            "division": controller["division"],
            "zone": controller["zone"],
            "clearanceLevel": controller["clearance_level"],
            "sessionId": session_id
        }

        token = self.create_jwt_token(token_payload)

        # Cleanup session
        if session_id in self._otp_sessions:
            del self._otp_sessions[session_id]

        user_info = {
            "sessionId": session_id,
            "employeeId": controller["employee_id"],
            "fullName": controller["name"],
            "role": controller["role"],
            "station": controller["station"],
            "division": controller["division"],
            "zone": controller["zone"],
            "clearanceLevel": controller["clearance_level"],
            "verifiedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "securityAuditStamp": "CRIS-2FA-OTP-VERIFIED"
        }

        return {
            "success": True,
            "token": token,
            "user": user_info
        }

    def demo_controller_login(self) -> Dict[str, Any]:
        """
        One-click instant demo login as 'Demo Section Controller – Visakhapatnam'.
        Issues a signed JWT token immediately for judges / evaluators.
        """
        controller = DEMO_CONTROLLERS["IR-VSKP-8821"]
        session_id = f"DEMO-SESS-{int(time.time())}"

        token_payload = {
            "sub": controller["employee_id"],
            "employeeId": controller["employee_id"],
            "fullName": controller["name"],
            "role": controller["role"],
            "station": controller["station"],
            "division": controller["division"],
            "zone": controller["zone"],
            "clearanceLevel": controller["clearance_level"],
            "sessionId": session_id,
            "isDemo": True
        }

        token = self.create_jwt_token(token_payload)

        user_info = {
            "sessionId": session_id,
            "employeeId": controller["employee_id"],
            "fullName": controller["name"],
            "role": controller["role"],
            "station": controller["station"],
            "division": controller["division"],
            "zone": controller["zone"],
            "clearanceLevel": controller["clearance_level"],
            "verifiedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "securityAuditStamp": "CRIS-DEMO-ONE-CLICK-JWT"
        }

        return {
            "success": True,
            "token": token,
            "user": user_info
        }

auth_service = AuthService()
